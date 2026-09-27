const db = require('../database/db');
const { isBotOwner } = require('./permissions');

/**
 * Target-safety checks shared by moderation and antinuke.
 *
 * canActOn: can `moderator` moderate `target` in this guild?
 *   - Never the guild owner.
 *   - Never someone with an equal/higher top role than the moderator
 *     (unless moderator is guild/bot owner).
 *   - Never someone immune (db immune list) unless actor is bot owner.
 *
 * botCanActOn: can the BOT actually perform the action?
 *   - Target must be below the bot's highest role.
 *   - Target must not be the guild owner.
 */

function isImmune(guildId, member) {
  const immune = db.getSettings(guildId, 'immune', { users: [], roles: [] });
  if (immune.users?.includes(member.id)) return true;
  if (member.roles?.cache && immune.roles?.some((r) => member.roles.cache.has(r))) return true;
  return false;
}

function canActOn(moderator, target) {
  const guild = moderator.guild;

  // Bot owner overrides hierarchy entirely.
  if (isBotOwner(moderator.id)) return { ok: true };

  if (target.id === guild.ownerId) return { ok: false, reason: 'You cannot moderate the server owner.' };
  if (target.id === moderator.id) return { ok: false, reason: 'You cannot moderate yourself.' };

  if (isImmune(guild.id, target)) return { ok: false, reason: 'That member is immune to moderation.' };

  // Guild owner can act on anyone below owner.
  if (moderator.id === guild.ownerId) return { ok: true };

  if (target.roles.highest.position >= moderator.roles.highest.position) {
    return { ok: false, reason: 'You cannot moderate someone with an equal or higher role.' };
  }
  return { ok: true };
}

function botCanActOn(guild, target) {
  const me = guild.members.me;
  if (!me) return { ok: false, reason: 'I am missing my own member object.' };
  if (target.id === guild.ownerId) return { ok: false, reason: 'I cannot act on the server owner.' };
  if (target.roles && target.roles.highest.position >= me.roles.highest.position) {
    return { ok: false, reason: "My role isn't high enough to act on that member. Move my role higher." };
  }
  return { ok: true };
}

module.exports = { isImmune, canActOn, botCanActOn };
