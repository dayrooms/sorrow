const { EmbedBuilder } = require("discord.js");
const { color, error } = require("../config.json");

module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      const db = client.db;
      const honeypotId = await db.get(`honeypot_${message.guild.id}`);
      if (!honeypotId || message.channel.id !== honeypotId) return;

      await message.delete().catch(() => {});
      await message.member.ban({ reason: "Triggered honeypot channel" }).catch(() => {});

      const logsId = await db.get(`logs_${message.guild.id}`);
      const logChannel = logsId && message.guild.channels.cache.get(logsId);
      if (logChannel) {
        logChannel.send({ embeds: [new EmbedBuilder().setDescription(`🍯 Banned ${message.author.tag} for triggering the honeypot`).setColor(error)] }).catch(() => {});
      }
    } catch {}
  },
};
