const db = require('../database/db');
const { isBotOwner } = require('../utils/permissions');

/**
 * Passive message monitor: runs on every human message BEFORE/independent of
 * the command dispatcher. Powers filter, autoresponder, autoreact, leveling,
 * and uwulock/gaylock webhook rewrites.
 *
 * Kept in one listener to avoid fetching settings many times per message.
 */
module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (message.author.bot || !message.guild || !message.content) return;
    const gid = message.guild.id;
    const content = message.content.toLowerCase();

    // ── Word filter ──────────────────────────────────────────
    try {
      const filter = db.getSettings(gid, 'filter', { words: [], logChannel: null });
      if (filter.words.length && !message.member?.permissions.has('ManageMessages') && !isBotOwner(message.author.id)) {
        const hit = filter.words.find((w) => content.includes(w));
        if (hit) {
          await message.delete().catch(() => {});
          if (filter.logChannel) {
            const ch = message.guild.channels.cache.get(filter.logChannel);
            ch?.send({ content: `🚫 Filtered a message from <@${message.author.id}> (matched \`${hit}\`).` }).catch(() => {});
          }
          return; // don't run responders on a filtered msg
        }
      }
    } catch {}

    // ── Autoresponder ────────────────────────────────────────
    try {
      const ar = db.getSettings(gid, 'autoresponder', { rules: {} });
      for (const [trigger, resp] of Object.entries(ar.rules)) {
        if (content.includes(trigger)) {
          message.channel.send({ content: resp }).catch(() => {});
          break;
        }
      }
    } catch {}

    // ── Autoreact ────────────────────────────────────────────
    try {
      const re = db.getSettings(gid, 'autoreact', { rules: {} });
      for (const [trigger, emojis] of Object.entries(re.rules)) {
        if (content.includes(trigger)) {
          for (const e of emojis.slice(0, 3)) await message.react(e).catch(() => {});
          break;
        }
      }
    } catch {}

    // ── Leveling ─────────────────────────────────────────────
    try {
      const lvl = db.getSettings(gid, 'leveling', { enabled: false, perMessage: 15, cooldown: 60000 });
      if (lvl.enabled) {
        const row = db.getLevel(gid, message.author.id);
        const now = Date.now();
        if (now - (row.last_msg || 0) >= (lvl.cooldown || 60000)) {
          let xp = (row.xp || 0) + (lvl.perMessage || 15);
          let level = row.level || 0;
          const needed = 5 * level * level + 50 * level + 100;
          let leveledUp = false;
          if (xp >= needed) { level++; leveledUp = true; }
          db.saveLevel(gid, message.author.id, xp, level, now);
          if (leveledUp) {
            // Level-up announce + role rewards
            const rewards = lvl.rewards || {}; // {level: roleId}
            const rewardRole = rewards[String(level)];
            if (rewardRole && message.member) await message.member.roles.add(rewardRole).catch(() => {});
            if (lvl.announce !== false) {
              const ch = lvl.channel ? message.guild.channels.cache.get(lvl.channel) : message.channel;
              ch?.send(`🎉 <@${message.author.id}> reached level **${level}**!`).catch(() => {});
            }
          }
        }
      }
    } catch {}

    // ── uwulock / gaylock (webhook rewrite) ──────────────────
    try {
      const locks = db.getSettings(gid, 'textlocks', { uwu: [], gay: [] });
      if (locks.uwu?.includes(message.author.id) || locks.gay?.includes(message.author.id)) {
        const mode = locks.uwu?.includes(message.author.id) ? 'uwu' : 'gay';
        const transformed = mode === 'uwu' ? uwuify(message.content) : gayify(message.content);
        await mimicViaWebhook(message, transformed).catch(() => {});
      }
    } catch {}

    // ── Counting ─────────────────────────────────────────────
    try {
      const cfg = db.getSettings(gid, 'counting', { channel: null, current: 0, lastUser: null, enabled: false });
      if (cfg.enabled && message.channel.id === cfg.channel) {
        const num = parseInt(message.content.trim(), 10);
        const expected = (cfg.current || 0) + 1;
        if (Number.isNaN(num)) return;
        if (num !== expected || message.author.id === cfg.lastUser) {
          await message.react('❌').catch(() => {});
          cfg.current = 0;
          cfg.lastUser = null;
          db.saveSettings(gid, 'counting', cfg);
          message.channel.send(`❌ <@${message.author.id}> ruined it at **${num}**! Back to **1**.`).catch(() => {});
        } else {
          cfg.current = expected;
          cfg.lastUser = message.author.id;
          db.saveSettings(gid, 'counting', cfg);
          await message.react('✅').catch(() => {});
        }
      }
    } catch {}
  },
};

function uwuify(text) {
  return text
    .replace(/(?:r|l)/g, 'w')
    .replace(/(?:R|L)/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/!+/g, ' uwu!')
    + ' >w<';
}
function gayify(text) {
  const emojis = ['🌈', '💅', '✨', '💖'];
  return `${text} ${emojis[Math.floor(Math.random() * emojis.length)]}`;
}

/** Delete the user's message and repost it via webhook as them (used by locks). */
async function mimicViaWebhook(message, content) {
  const ch = message.channel;
  if (!ch.permissionsFor(message.guild.members.me)?.has('ManageWebhooks')) return;
  await message.delete().catch(() => {});
  const hooks = await ch.fetchWebhooks().catch(() => null);
  let hook = hooks?.find((h) => h.name === 'Sorrow Lock' && h.owner?.id === message.client.user.id);
  if (!hook) hook = await ch.createWebhook({ name: 'Sorrow Lock' }).catch(() => null);
  if (!hook) return;
  await hook.send({ content, username: message.member?.displayName || message.author.username, avatarURL: message.author.displayAvatarURL() }).catch(() => {});
}
