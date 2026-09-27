const { PermissionsBitField } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

/**
 * Central permission resolver.
 *
 * Every command declares a `permLevel` (see LEVELS). check() returns
 * { ok: true } or { ok: false, reason }.
 *
 * Bypass order (highest first):
 *   1. Bot owner (OWNER_IDS)  -> passes EVERYTHING, everywhere, no exceptions.
 *   2. Guild owner            -> passes everything except bot-owner-only.
 *   3. Real Discord permission for the level.
 *   4. Fake permissions (bot-managed) matching the level's perm.
 *   5. Antinuke/antiraid admin (db) for the admin-scoped checks.
 *
 * "Fake permissions" let a server grant someone e.g. ban access through the
 * bot without giving the real Discord permission. They ONLY apply to bot
 * commands — they can never affect native Discord actions, so they can't be
 * used to bypass antinuke (antinuke watches the audit log, not bot state).
 */

const LEVELS = {
  USER: 0, // anyone
  MOD: 1, // manage messages OR fakeperm
  ADMIN: 2, // administrator / manage guild OR fakeperm
  ANTINUKE_ADMIN: 3, // antinuke admin (db) or guild owner
  GUILD_OWNER: 4, // guild owner (or bot owner)
  BOT_OWNER: 5, // OWNER_IDS only
};

// Which Discord permission satisfies each named "fakeperm" keyword.
const FAKEPERM_MAP = {
  administrator: PermissionsBitField.Flags.Administrator,
  manageguild: PermissionsBitField.Flags.ManageGuild,
  manageserver: PermissionsBitField.Flags.ManageGuild,
  managechannels: PermissionsBitField.Flags.ManageChannels,
  manageroles: PermissionsBitField.Flags.ManageRoles,
  managemessages: PermissionsBitField.Flags.ManageMessages,
  kickmembers: PermissionsBitField.Flags.KickMembers,
  banmembers: PermissionsBitField.Flags.BanMembers,
  moderatemembers: PermissionsBitField.Flags.ModerateMembers,
  managenicknames: PermissionsBitField.Flags.ManageNicknames,
  managewebhooks: PermissionsBitField.Flags.ManageWebhooks,
  manageexpressions: PermissionsBitField.Flags.ManageGuildExpressions,
  mentioneveryone: PermissionsBitField.Flags.MentionEveryone,
  viewauditlog: PermissionsBitField.Flags.ViewAuditLog,
};

function isBotOwner(userId) {
  return config.ownerIds.includes(userId);
}

/** Gather the fakeperm keywords granted to a member (via their roles or directly). */
function getFakePerms(guildId, member) {
  const fp = db.getSettings(guildId, 'fakeperms', { users: {}, roles: {} });
  const set = new Set();
  const direct = fp.users[member.id] || [];
  for (const p of direct) set.add(p.toLowerCase());
  for (const [roleId, perms] of Object.entries(fp.roles || {})) {
    if (member.roles.cache.has(roleId)) for (const p of perms) set.add(p.toLowerCase());
  }
  return set;
}

/** Does the member satisfy a given Discord permission, via real perms OR fakeperms? */
function hasPerm(guildId, member, permFlag, fakepermKeys = []) {
  if (member.permissions.has(permFlag)) return true;
  const fakes = getFakePerms(guildId, member);
  if (fakes.has('administrator')) return true; // fake admin covers all
  for (const k of fakepermKeys) if (fakes.has(k)) return true;
  return false;
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {number} level  one of LEVELS.*
 * @returns {{ok: boolean, reason?: string}}
 */
function check(member, level, guildId) {
  const uid = member.id;

  // 1. Bot owner passes everything.
  if (isBotOwner(uid)) return { ok: true };

  // Bot-owner-only gate.
  if (level === LEVELS.BOT_OWNER) {
    return { ok: false, reason: 'This command is restricted to the bot owner.' };
  }

  const isGuildOwner = member.guild.ownerId === uid;

  // 2. Guild owner passes all non-bot-owner levels.
  if (isGuildOwner) return { ok: true };

  switch (level) {
    case LEVELS.USER:
      return { ok: true };

    case LEVELS.MOD:
      return hasPerm(guildId, member, PermissionsBitField.Flags.ManageMessages, [
        'managemessages',
        'administrator',
      ])
        ? { ok: true }
        : { ok: false, reason: 'You need **Manage Messages** to use this.' };

    case LEVELS.ADMIN:
      return hasPerm(guildId, member, PermissionsBitField.Flags.ManageGuild, [
        'manageguild',
        'manageserver',
        'administrator',
      ]) || member.permissions.has(PermissionsBitField.Flags.Administrator)
        ? { ok: true }
        : { ok: false, reason: 'You need **Administrator** or **Manage Server** to use this.' };

    case LEVELS.ANTINUKE_ADMIN:
      return db.isAntinukeAdmin(guildId, uid)
        ? { ok: true }
        : { ok: false, reason: 'Only **antinuke admins** or the **server owner** can use this.' };

    case LEVELS.GUILD_OWNER:
      return { ok: false, reason: 'Only the **server owner** can use this.' };

    default:
      return { ok: false, reason: 'Insufficient permissions.' };
  }
}

module.exports = {
  LEVELS,
  FAKEPERM_MAP,
  isBotOwner,
  getFakePerms,
  hasPerm,
  check,
};
