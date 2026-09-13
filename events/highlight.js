const { EmbedBuilder } = require("discord.js");
const { color } = require("../config.json");

const recentlyNotified = new Set();

module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      const db = client.db;
      const content = message.content.toLowerCase();

      const members = message.guild.members.cache;
      for (const [id, member] of members) {
        if (member.user.bot) continue;
        if (id === message.author.id) continue;

        const key = `${message.guild.id}_${id}`;
        const keywords = await db.get(`highlights_${key}`) || [];
        if (!keywords.length) continue;

        const match = keywords.find(k => content.includes(k));
        if (!match) continue;

        const ignored = await db.get(`highlightignore_${key}`) || [];
        if (ignored.includes(message.author.id)) continue;

        const notifyKey = `${key}_${match}`;
        if (recentlyNotified.has(notifyKey)) continue;
        recentlyNotified.add(notifyKey);
        setTimeout(() => recentlyNotified.delete(notifyKey), 120000);

        member.send({ embeds: [new EmbedBuilder()
          .setDescription(`🔔 Your keyword \`${match}\` was mentioned in **${message.guild.name}** #${message.channel.name}\n\n${message.author.tag}: ${message.content.slice(0, 200)}\n[Jump to message](${message.url})`)
          .setColor(color)] }).catch(() => {});
      }
    } catch {}
  },
};
