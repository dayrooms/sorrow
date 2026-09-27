const { AuditLogEvent, PermissionsBitField } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const { isBotOwner } = require('./permissions');

/**
 * ── ANTINUKE ENGINE ─────────────────────────────────────────
 *
 * How it works (and why it's hard to bypass):
 *
 *  - We listen to gateway events (channelDelete, roleCreate, guildBanAdd, …).
 *  - For each, we read the AUDIT LOG to find WHO did it. The audit log is the
 *    source of truth Discord itself keeps; a malicious admin can't forge it.
 *  - The actor is checked against the whitelist / antinuke-admins / owners.
 *    If exempt, we ignore. Otherwise we count the action in a sliding window.
 *  - When an actor crosses a module's threshold within the window, we punish
 *    them (strip dangerous roles, kick, or ban) and, where possible, we
 *    RESTORE what they destroyed (re-create channels/roles, reset vanity).
 *
 * Limits worth being honest about (no bot can beat these):
 *  - The bot must sit ABOVE the attacker in the role list to punish them.
 *  - The server OWNER cannot be punished by any bot.
 *  - This is reactive: it triggers on the first action(s), then stops the
 *    attacker fast and undoes damage. It cannot pre-empt the very first click.
 *
 * Modules are stored per-guild in settings 'antinuke':
 *   {
 *     enabled: bool,
 *     logChannel: id|null,
 *     dmLogs: bool,
 *     modules: { channelDelete: {on, punishment, threshold}, ... },
 *     permWatch: { grant: {administrator:{on,action}, ...} }
 *   }
 */

// Canonical module keys and their friendly names + which audit event maps to them.
const MODULES = {
  guildUpdate: { label: 'Guild Update', event: AuditLogEvent.GuildUpdate },
  channelCreate: { label: 'Channel Create', event: AuditLogEvent.ChannelCreate },
  channelDelete: { label: 'Channel Delete', event: AuditLogEvent.ChannelDelete },
  channelUpdate: { label: 'Channel Update', event: AuditLogEvent.ChannelUpdate },
  roleCreate: { label: 'Role Create', event: AuditLogEvent.RoleCreate },
  roleDelete: { label: 'Role Delete', event: AuditLogEvent.RoleDelete },
  roleUpdate: { label: 'Role Update', event: AuditLogEvent.RoleUpdate },
  roleMember: { label: 'Role Give/Remove', event: AuditLogEvent.MemberRoleUpdate },
  ban: { label: 'Ban', event: AuditLogEvent.MemberBanAdd },
  kick: { label: 'Kick', event: AuditLogEvent.MemberKick },
  prune: { label: 'Prune', event: AuditLogEvent.MemberPrune },
  botAdd: { label: 'Bot Add', event: AuditLogEvent.BotAdd },
  webhookCreate: { label: 'Webhook Create', event: AuditLogEvent.WebhookCreate },
  webhookDelete: { label: 'Webhook Delete', event: AuditLogEvent.WebhookDelete },
  webhookUpdate: { label: 'Webhook Update', event: AuditLogEvent.WebhookUpdate },
  emoji: { label: 'Emoji/Sticker', event: AuditLogEvent.EmojiDelete },
  vanity: { label: 'Vanity', event: AuditLogEvent.GuildUpdate },
};

const DEFAULT_MODULE = { on: false, punishment: 'ban', threshold: 3 };

// Dangerous permissions the "permission grant" watcher cares about.
const WATCHED_PERMS = {
  administrator: PermissionsBitField.Flags.Administrator,
  manageguild: PermissionsBitField.Flags.ManageGuild,
  managechannels: PermissionsBitField.Flags.ManageChannels,
  manageroles: PermissionsBitField.Flags.ManageRoles,
  managewebhooks: PermissionsBitField.Flags.ManageWebhooks,
  manageexpressions: PermissionsBitField.Flags.ManageGuildExpressions,
  banmembers: PermissionsBitField.Flags.BanMembers,
  kickmembers: PermissionsBitField.Flags.KickMembers,
  moderatemembers: PermissionsBitField.Flags.ModerateMembers,
  mentioneveryone: PermissionsBitField.Flags.MentionEveryone,
};

function defaultConfig() {
  const modules = {};
  for (const key of Object.keys(MODULES)) modules[key] = { ...DEFAULT_MODULE };
  const permWatch = {};
  for (const p of Object.keys(WATCHED_PERMS)) permWatch[p] = { on: false, action: 'strip' };
  return {
    enabled: false,
    logChannel: null,
    dmLogs: false,
    modules,
    permWatch,
    denyBotAdd: false, // block ALL new bot joins entirely
  };
}

function getConfig(guildId) {
  return db.getSettings(guildId, 'antinuke', defaultConfig());
}
function saveConfig(guildId, cfg) {
  db.saveSettings(guildId, 'antinuke', cfg);
}

/** Is this actor exempt from antinuke? owners, the guild owner, the bot, and whitelisted ids. */
function isExempt(guild, actorId, client) {
  if (!actorId) return true;
  if (actorId === client.user.id) return true; // the bot itself
  if (actorId === guild.ownerId) return true; // server owner
  if (isBotOwner(actorId)) return true; // bot owner(s)
  if (db.isWhitelisted(guild.id, actorId, 'antinuke')) return true;
  if (db.isAntinukeAdmin(guild.id, actorId)) return true; // antinuke admins are trusted staff
  return false;
}

/**
 * Record an action in the sliding window for (guild, actor, module).
 * Returns true if the threshold has been crossed and punishment should fire.
 */
function bump(client, guildId, actorId, moduleKey, threshold, windowMs = config.antinukeDefaults.windowMs) {
  if (!client.antinukeBuckets.has(guildId)) client.antinukeBuckets.set(guildId, new Map());
  const guildBucket = client.antinukeBuckets.get(guildId);
  const bucketKey = `${actorId}:${moduleKey}`;
  const now = Date.now();
  let entry = guildBucket.get(bucketKey);
  if (!entry || now - entry.first > windowMs) {
    entry = { count: 0, first: now };
  }
  entry.count += 1;
  guildBucket.set(bucketKey, entry);
  return entry.count >= threshold;
}

/** Clear an actor's buckets after they've been punished. */
function clearBuckets(client, guildId, actorId) {
  const guildBucket = client.antinukeBuckets.get(guildId);
  if (!guildBucket) return;
  for (const key of [...guildBucket.keys()]) {
    if (key.startsWith(`${actorId}:`)) guildBucket.delete(key);
  }
}

/** Find who performed an action via the audit log. */
async function findActor(guild, auditType, targetId = null, maxAgeMs = 10000) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 6 });
    const now = Date.now();
    for (const entry of logs.entries.values()) {
      if (now - entry.createdTimestamp > maxAgeMs) continue;
      if (targetId && entry.target?.id && entry.target.id !== targetId) continue;
      return { executorId: entry.executorId, entry };
    }
  } catch {
    /* missing View Audit Log perm, etc. */
  }
  return { executorId: null, entry: null };
}

/**
 * Punish an actor according to a module's configured punishment.
 * Returns a short human string describing what happened.
 */
async function punish(client, guild, actorId, punishment, reason) {
  const member = await guild.members.fetch(actorId).catch(() => null);
  const me = guild.members.me;

  // Can we even act? (hierarchy / owner)
  if (!member) {
    // Might be a bot that was added then acted; still try a ban by id.
    if (punishment === 'ban') {
      await guild.bans.create(actorId, { reason }).catch(() => {});
      return 'banned (by id)';
    }
    return 'no action (actor not in guild)';
  }
  if (actorId === guild.ownerId) return 'skipped (server owner)';
  if (member.roles.highest.position >= me.roles.highest.position) {
    return 'FAILED — my role is below the attacker. Move Sorrow higher!';
  }

  switch (punishment) {
    case 'kick':
      await member.kick(reason).catch(() => {});
      return 'kicked';
    case 'strip': {
      const dangerous = member.roles.cache.filter((r) =>
        r.permissions.any([
          PermissionsBitField.Flags.Administrator,
          PermissionsBitField.Flags.ManageGuild,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ManageRoles,
          PermissionsBitField.Flags.BanMembers,
          PermissionsBitField.Flags.KickMembers,
          PermissionsBitField.Flags.ManageWebhooks,
          PermissionsBitField.Flags.ManageGuildExpressions,
        ]) && r.editable
      );
      await member.roles.remove(dangerous, reason).catch(() => {});
      return `stripped ${dangerous.size} dangerous role(s)`;
    }
    case 'ban':
    default:
      await member.ban({ reason, deleteMessageSeconds: 0 }).catch(() => {});
      return 'banned';
  }
}

/** Send a log embed + optional DM to owner. */
async function log(client, guild, cfg, { title, description, color }) {
  const { base } = require('./embed');
  const embed = base(color ?? config.colors.error)
    .setTitle(`🛡️ Antinuke — ${title}`)
    .setDescription(description)
    .setTimestamp();

  if (cfg.logChannel) {
    const ch = guild.channels.cache.get(cfg.logChannel);
    if (ch?.isTextBased()) ch.send({ embeds: [embed] }).catch(() => {});
  }
  if (cfg.dmLogs) {
    const owner = await guild.fetchOwner().catch(() => null);
    owner?.send({ embeds: [embed.setFooter({ text: guild.name })] }).catch(() => {});
  }
}

module.exports = {
  MODULES,
  WATCHED_PERMS,
  DEFAULT_MODULE,
  defaultConfig,
  getConfig,
  saveConfig,
  isExempt,
  bump,
  clearBuckets,
  findActor,
  punish,
  log,
};
