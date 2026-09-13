const { EmbedBuilder } = require("discord.js");
const { color } = require("../config.json");

const DISBOARD_BOT_ID = "302050872383242240";
const REMIND_AFTER_MS = 2 * 60 * 60 * 1000;

module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (!message.guild) return;
      if (message.author.id !== DISBOARD_BOT_ID) return;
      if (!message.embeds.length) return;

      const embed = message.embeds[0];
      const desc = (embed.description || '').toLowerCase();
      if (!desc.includes('bump done')) return;

      const db = client.db;
      const channelId = await db.get(`bumpreminder_${message.guild.id}`);
      if (!channelId) return;

      // Try to figure out who bumped from the embed/interaction if possible
      const bumperId = message.interaction ? message.interaction.user.id : null;
      if (bumperId) {
        const counts = await db.get(`bumpcounts_${message.guild.id}`) || {};
        counts[bumperId] = (counts[bumperId] || 0) + 1;
        await db.set(`bumpcounts_${message.guild.id}`, counts);
      }

      setTimeout(async () => {
        const channel = message.guild.channels.cache.get(channelId);
        if (!channel) return;
        channel.send({ embeds: [new EmbedBuilder().setDescription(`⏰ It's time to bump again! Use \`/bump\``).setColor(color)] }).catch(() => {});
      }, REMIND_AFTER_MS);
    } catch {}
  },
};
