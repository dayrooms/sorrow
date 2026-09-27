const { ChannelType } = require('discord.js');
const db = require('../database/db');
const { isBotOwner } = require('../utils/permissions');

/** Honeypot + imagelock + autothread + sticky message handling. */
module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    if (!message.guild || message.author.id === client.user.id) return;
    const gid = message.guild.id;

    // ── Honeypot ─────────────────────────────────────────────
    try {
      const honey = db.getSettings(gid, 'honey', { channel: null, action: 'ban' });
      if (honey.channel && message.channel.id === honey.channel && !message.author.bot === false) {
        // anyone (incl. bots) posting in the trap gets punished, except staff/owner
        if (!message.member?.permissions.has('Administrator') && !isBotOwner(message.author.id) && message.author.id !== message.guild.ownerId) {
          const m = message.member;
          if (m) {
            if (honey.action === 'ban') await m.ban({ reason: 'Honeypot' }).catch(() => {});
            else if (honey.action === 'kick') await m.kick('Honeypot').catch(() => {});
            else if (honey.action === 'timeout') await m.timeout(24 * 3600 * 1000, 'Honeypot').catch(() => {});
          }
          await message.delete().catch(() => {});
          return;
        }
      }
    } catch {}

    if (message.author.bot) return;

    // ── Imagelock (gallery channels) ─────────────────────────
    try {
      const il = db.getSettings(gid, 'imagelock', { channels: [] });
      if (il.channels.includes(message.channel.id)) {
        const hasImage = message.attachments.some((a) => /\.(png|jpe?g|gif|webp)$/i.test(a.name)) || /https?:\/\/\S+\.(png|jpe?g|gif|webp)/i.test(message.content);
        if (!hasImage && !message.member?.permissions.has('ManageMessages')) {
          await message.delete().catch(() => {});
          return;
        }
      }
    } catch {}

    // ── Autothread ───────────────────────────────────────────
    try {
      const at = db.getSettings(gid, 'autothread', { channels: [] });
      if (at.channels.includes(message.channel.id) && message.channel.type === ChannelType.GuildText) {
        await message.startThread({ name: `${message.author.username}'s thread`, autoArchiveDuration: 1440 }).catch(() => {});
      }
    } catch {}

    // ── Sticky message ───────────────────────────────────────
    try {
      const sticky = db.getSettings(gid, 'sticky', { channels: {} });
      const conf = sticky.channels[message.channel.id];
      if (conf) {
        if (conf.lastId) {
          const old = await message.channel.messages.fetch(conf.lastId).catch(() => null);
          if (old) await old.delete().catch(() => {});
        }
        const sent = await message.channel.send({ content: `📌 ${conf.text}` }).catch(() => null);
        if (sent) {
          conf.lastId = sent.id;
          sticky.channels[message.channel.id] = conf;
          db.saveSettings(gid, 'sticky', sticky);
        }
      }
    } catch {}
  },
};
