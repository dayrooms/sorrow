const db = require('../database/db');
const { base, success, error } = require('./embed');
const { canActOn, botCanActOn } = require('./hierarchy');
const config = require('../config');

/**
 * Shared moderation helpers: case creation, DM notices, mod-log posting, and
 * the standard pre-flight checks (hierarchy + immunity). Commands call runAction
 * to keep behavior uniform.
 */

/** Get or lazily create the mute role. */
async function ensureMuteRole(guild) {
  const settings = db.getSettings(guild.id, 'settings', {});
  if (settings.muteRole) {
    const r = guild.roles.cache.get(settings.muteRole);
    if (r) return r;
  }
  // Create one and deny SendMessages everywhere.
  const role = await guild.roles.create({ name: 'Muted', reason: 'Sorrow mute role', color: 0x555555 }).catch(() => null);
  if (!role) return null;
  const { ChannelType, PermissionsBitField } = require('discord.js');
  for (const ch of guild.channels.cache.values()) {
    if ([ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildVoice].includes(ch.type)) {
      await ch.permissionOverwrites
        .edit(role, { SendMessages: false, AddReactions: false, Speak: false, SendMessagesInThreads: false }, { reason: 'Sorrow mute role setup' })
        .catch(() => {});
    }
  }
  settings.muteRole = role.id;
  db.saveSettings(guild.id, 'settings', settings);
  return role;
}

async function ensureJailRole(guild) {
  const settings = db.getSettings(guild.id, 'settings', {});
  if (settings.jailRole) {
    const r = guild.roles.cache.get(settings.jailRole);
    if (r) return r;
  }
  const role = await guild.roles.create({ name: 'Jailed', reason: 'Sorrow jail role', color: 0x222222 }).catch(() => null);
  if (!role) return null;
  const { ChannelType } = require('discord.js');
  const jailChannelId = settings.jailChannel;
  for (const ch of guild.channels.cache.values()) {
    if ([ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildVoice].includes(ch.type)) {
      const allow = ch.id === jailChannelId ? { ViewChannel: true, SendMessages: true } : { ViewChannel: false };
      await ch.permissionOverwrites.edit(role, allow, { reason: 'Sorrow jail role setup' }).catch(() => {});
    }
  }
  settings.jailRole = role.id;
  db.saveSettings(guild.id, 'settings', settings);
  return role;
}

/** DM the target about a moderation action (best-effort, respects invoke overrides). */
async function dmNotice(guild, user, action, reason, moderatorTag, duration) {
  const invoke = db.getSettings(guild.id, 'invoke', {});
  const custom = invoke[action]?.dm;
  const embed = base(config.colors.error)
    .setTitle(`You were ${pastTense(action)} in ${guild.name}`)
    .setDescription(custom ? fillVars(custom, { user, guild, reason, moderatorTag, duration }) : `**Reason:** ${reason || 'No reason provided'}${duration ? `\n**Duration:** ${duration}` : ''}`)
    .setTimestamp();
  await user.send({ embeds: [embed] }).catch(() => {});
}

function pastTense(action) {
  const map = { ban: 'banned', kick: 'kicked', mute: 'muted', warn: 'warned', jail: 'jailed', timeout: 'timed out', tempban: 'temporarily banned', hardban: 'hard-banned' };
  return map[action] || `${action}ed`;
}

/** Minimal variable substitution for invoke/welcome/etc. messages. */
function fillVars(text, { user, guild, reason, moderatorTag, duration, channel, member }) {
  const u = user || member?.user;
  return String(text)
    .replaceAll('{user}', u ? `<@${u.id}>` : '')
    .replaceAll('{user.name}', u?.username || '')
    .replaceAll('{user.tag}', u?.tag || u?.username || '')
    .replaceAll('{user.id}', u?.id || '')
    .replaceAll('{user.mention}', u ? `<@${u.id}>` : '')
    .replaceAll('{guild}', guild?.name || '')
    .replaceAll('{guild.name}', guild?.name || '')
    .replaceAll('{guild.count}', guild ? String(guild.memberCount) : '')
    .replaceAll('{guild.membercount}', guild ? String(guild.memberCount) : '')
    .replaceAll('{reason}', reason || 'No reason provided')
    .replaceAll('{moderator}', moderatorTag || '')
    .replaceAll('{duration}', duration || 'permanent')
    .replaceAll('{channel}', channel ? `<#${channel.id}>` : '');
}

/** Post to the configured mod-log channel. */
async function modLog(guild, { action, target, moderator, reason, caseNo, duration, color }) {
  const settings = db.getSettings(guild.id, 'settings', {});
  const chId = settings.modLog;
  if (!chId) return;
  const ch = guild.channels.cache.get(chId);
  if (!ch?.isTextBased()) return;
  const e = base(color ?? config.colors.primary)
    .setAuthor({ name: `Case #${caseNo} · ${action}` })
    .setDescription(
      [
        `**Member:** ${target ? `<@${target.id}> (\`${target.id}\`)` : 'unknown'}`,
        `**Moderator:** <@${moderator.id}>`,
        duration ? `**Duration:** ${duration}` : null,
        `**Reason:** ${reason || 'No reason provided'}`,
      ]
        .filter(Boolean)
        .join('\n')
    )
    .setTimestamp();
  ch.send({ embeds: [e] }).catch(() => {});
}

/**
 * Full pre-flight for a moderation action against a member.
 * Returns { ok, reason }.
 */
function preflight(message, targetMember) {
  if (!targetMember) return { ok: false, reason: 'Member not found.' };
  const modCheck = canActOn(message.member, targetMember);
  if (!modCheck.ok) return modCheck;
  const botCheck = botCanActOn(message.guild, targetMember);
  if (!botCheck.ok) return botCheck;
  return { ok: true };
}

/** Record a case and fire DM + mod-log. Returns caseNo. */
async function record(guild, { action, target, moderator, reason, duration = null, durationText = null, color, dm = true }) {
  const caseNo = db.addCase(guild.id, target.id, moderator.id, action, reason || null, duration);
  if (dm && target.send) await dmNotice(guild, target.user || target, action, reason, moderator.user?.tag || moderator.tag, durationText);
  await modLog(guild, { action, target: target.user || target, moderator, reason, caseNo, duration: durationText, color });
  return caseNo;
}

module.exports = {
  ensureMuteRole,
  ensureJailRole,
  dmNotice,
  modLog,
  preflight,
  record,
  fillVars,
  pastTense,
};
