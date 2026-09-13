const { EmbedBuilder } = require("discord.js");
const { color, error, xmark } = require("../config.json");

const inviteRegex = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-zA-Z0-9-]+/i;

module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      if (message.member.permissions.has("Administrator")) return;
      const db = client.db;
      const enabled = await db.get(`antiinvite_${message.guild.id}`);
      if (!enabled) return;
      if (!inviteRegex.test(message.content)) return;

      await message.delete().catch(() => {});
      message.channel.send({ embeds: [new EmbedBuilder().setDescription(`${xmark} ${message.author}, invite links aren't allowed here`).setColor(error)] }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});
    } catch {}
  },
};
