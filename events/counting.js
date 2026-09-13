const { EmbedBuilder } = require("discord.js");
const { error } = require("../config.json");

module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      const db = client.db;
      const channelId = await db.get(`countingchannel_${message.guild.id}`);
      if (!channelId || message.channel.id !== channelId) return;

      const num = parseInt(message.content.trim());
      if (isNaN(num)) return message.delete().catch(() => {});

      const current = await db.get(`countingcurrent_${message.guild.id}`) || 0;
      const lastUser = await db.get(`countinglastuser_${message.guild.id}`);

      if (lastUser === message.author.id) {
        await message.delete().catch(() => {});
        return message.channel.send({ embeds: [new EmbedBuilder().setDescription(`❌ ${message.author}, you can't count twice in a row! The count reset to 0.`).setColor(error)] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      }

      if (num !== current + 1) {
        await message.delete().catch(() => {});
        await db.set(`countingcurrent_${message.guild.id}`, 0);
        await db.delete(`countinglastuser_${message.guild.id}`);
        return message.channel.send({ embeds: [new EmbedBuilder().setDescription(`❌ ${message.author} broke the count at **${current}**! Expected ${current + 1}. Starting over from 0.`).setColor(error)] }).then(m => setTimeout(() => m.delete().catch(() => {}), 8000));
      }

      await db.set(`countingcurrent_${message.guild.id}`, num);
      await db.set(`countinglastuser_${message.guild.id}`, message.author.id);
      const stats = await db.get(`countingstats_${message.guild.id}_${message.author.id}`) || 0;
      await db.set(`countingstats_${message.guild.id}_${message.author.id}`, stats + 1);
      message.react('✅').catch(() => {});
    } catch {}
  },
};
