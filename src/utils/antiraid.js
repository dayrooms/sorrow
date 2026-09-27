const db = require('../database/db');
const config = require('../config');
const { isBotOwner } = require('./permissions');

/**
 * ── ANTIRAID ENGINE ─────────────────────────────────────────
 *
 * Antinuke watches trusted staff. Antiraid watches the front door: mass joins,
 * brand-new accounts, default-avatar accounts, and young accounts.
 *
 * Config stored per-guild in settings 'antiraid':
 * {
 *   enabled, logChannel, dmLogs,
 *   massjoin: { on, threshold, windowMs, action },   // action: kick|ban|lockdown
 *   newaccounts: { on, minAgeMs, action },
 *   noavatar:   { on, action },
 *   lockdown:   { active, roleId },                   // manual/auto lockdown state
 * }
 */

function defaultConfig() {
  return {
    enabled: false,
    logChannel: null,
    dmLogs: false,
    massjoin: {
      on: false,
      threshold: config.antiraidDefaults.joinThreshold,
      windowMs: config.antiraidDefaults.joinWindowMs,
      action: 'kick',
    },
    newaccounts: {
      on: false,
      minAgeMs: config.antiraidDefaults.minAccountAgeMs,
      action: 'kick',
    },
    noavatar: { on: false, action: 'kick' },
    lockdown: { active: false, roleId: null },
  };
}

function getConfig(guildId) {
  return db.getSettings(guildId, 'antiraid', defaultConfig());
}
function saveConfig(guildId, cfg) {
  db.saveSettings(guildId, 'antiraid', cfg);
}

function isExempt(guild, member, client) {
  const id = member.id;
  if (id === guild.ownerId) return true;
  if (isBotOwner(id)) return true;
  if (db.isWhitelisted(guild.id, id, 'antiraid')) return true;
  if (db.isAntinukeAdmin(guild.id, id)) return true;
  return false;
}

/** Apply a punishment to a joining member. */
async function actOn(member, action, reason) {
  switch (action) {
    case 'ban':
      return member.ban({ reason }).catch(() => {});
    case 'timeout':
      return member.timeout(60 * 60 * 1000, reason).catch(() => {});
    case 'kick':
    default:
      return member.kick(reason).catch(() => {});
  }
}

async function log(client, guild, cfg, { title, description, color }) {
  const { base } = require('./embed');
  const embed = base(color ?? config.colors.warn)
    .setTitle(`🚨 Antiraid — ${title}`)
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

/** Enable/disable server lockdown by denying @everyone SendMessages across text channels. */
async function setLockdown(guild, on, reason = 'Antiraid lockdown') {
  const everyone = guild.roles.everyone;
  const { ChannelType, PermissionsBitField } = require('discord.js');
  let changed = 0;
  for (const ch of guild.channels.cache.values()) {
    if (![ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(ch.type)) continue;
    await ch.permissionOverwrites
      .edit(everyone, { SendMessages: on ? false : null }, { reason })
      .then(() => changed++)
      .catch(() => {});
  }
  return changed;
}

module.exports = {
  defaultConfig,
  getConfig,
  saveConfig,
  isExempt,
  actOn,
  log,
  setLockdown,
};
