const { EmbedBuilder } = require("discord.js");
const { color, error } = require("../config.json");

module.exports = {
  event: "guildMemberAdd",
  execute: async (member, client) => {
    try {
      const db = client.db;
      const days = await db.get(`joingate_${member.guild.id}`);
      if (!days) return;

      const accountAgeMs = Date.now() - member.user.createdTimestamp;
      const minAgeMs = days * 24 * 60 * 60 * 1000;

      if (accountAgeMs < minAgeMs) {
        await member.send({ embeds: [new EmbedBuilder().setDescription(`Your account is too new to join **${member.guild.name}**. Try again later.`).setColor(error)] }).catch(() => {});
        await member.kick("Joingate: account too new").catch(() => {});

        const logsId = await db.get(`logs_${member.guild.id}`);
        const logChannel = logsId && member.guild.channels.cache.get(logsId);
        if (logChannel) {
          logChannel.send({ embeds: [new EmbedBuilder().setDescription(`🚪 Joingate kicked ${member.user.tag} (account created <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`).setColor(color)] }).catch(() => {});
        }
      }
    } catch {}
  },
};
