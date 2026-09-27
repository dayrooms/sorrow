const ms = require('ms');

/**
 * Argument-resolution helpers used across commands. All are forgiving:
 * they accept mentions, raw IDs, names, and (for members) name#discrim.
 */

const ID_RE = /^\d{17,20}$/;
const USER_MENTION_RE = /^<@!?(\d{17,20})>$/;
const ROLE_MENTION_RE = /^<@&(\d{17,20})>$/;
const CHANNEL_MENTION_RE = /^<#(\d{17,20})>$/;

function extractId(str, re) {
  if (!str) return null;
  if (ID_RE.test(str)) return str;
  const m = str.match(re);
  return m ? m[1] : null;
}

async function resolveMember(guild, query) {
  if (!query || !guild) return null;
  const id = extractId(query, USER_MENTION_RE);
  if (id) {
    return guild.members.cache.get(id) || (await guild.members.fetch(id).catch(() => null));
  }
  // by name / nickname
  const lower = query.toLowerCase().replace(/#\d{1,4}$/, '');
  const found =
    guild.members.cache.find(
      (m) =>
        m.user.username.toLowerCase() === lower ||
        m.displayName.toLowerCase() === lower ||
        m.user.tag.toLowerCase() === query.toLowerCase()
    ) ||
    guild.members.cache.find((m) => m.user.username.toLowerCase().includes(lower) || m.displayName.toLowerCase().includes(lower));
  return found || null;
}

async function resolveUser(client, query) {
  if (!query) return null;
  const id = extractId(query, USER_MENTION_RE);
  if (id) return client.users.cache.get(id) || (await client.users.fetch(id).catch(() => null));
  return null;
}

function resolveRole(guild, query) {
  if (!query || !guild) return null;
  const id = extractId(query, ROLE_MENTION_RE);
  if (id) return guild.roles.cache.get(id) || null;
  const lower = query.toLowerCase();
  return (
    guild.roles.cache.find((r) => r.name.toLowerCase() === lower) ||
    guild.roles.cache.find((r) => r.name.toLowerCase().includes(lower)) ||
    null
  );
}

function resolveChannel(guild, query, types = null) {
  if (!query || !guild) return null;
  const id = extractId(query, CHANNEL_MENTION_RE);
  let ch = null;
  if (id) ch = guild.channels.cache.get(id) || null;
  else {
    const lower = query.toLowerCase().replace(/^#/, '');
    ch =
      guild.channels.cache.find((c) => c.name.toLowerCase() === lower) ||
      guild.channels.cache.find((c) => c.name.toLowerCase().includes(lower)) ||
      null;
  }
  if (ch && types && !types.includes(ch.type)) return null;
  return ch;
}

/** Parse a human duration ("10m", "2h", "7d") into ms. Returns null if invalid. */
function parseDuration(str) {
  if (!str) return null;
  try {
    const v = ms(str);
    return typeof v === 'number' && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Human-readable duration from ms. */
function formatDuration(msVal) {
  if (msVal == null) return 'permanent';
  return ms(msVal, { long: true });
}

/** Pull "$flag" tokens out of args, returning {args, flags:Set}. */
function extractFlags(args) {
  const flags = new Set();
  const rest = [];
  for (const a of args) {
    if (a.startsWith('$')) flags.add(a.slice(1).toLowerCase());
    else rest.push(a);
  }
  return { args: rest, flags };
}

/** Parse a hex color like "#ff0000" or "ff0000" or a named-ish int. */
function parseColor(str) {
  if (!str) return null;
  const clean = str.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return parseInt(clean, 16);
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const [r, g, b] = clean.split('');
    return parseInt(r + r + g + g + b + b, 16);
  }
  return null;
}

module.exports = {
  ID_RE,
  extractId,
  resolveMember,
  resolveUser,
  resolveRole,
  resolveChannel,
  parseDuration,
  formatDuration,
  extractFlags,
  parseColor,
};
