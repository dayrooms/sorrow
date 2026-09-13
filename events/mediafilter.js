module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      if (message.member.permissions.has("Administrator")) return;
      const db = client.db;
      let channels = await db.get(`mediafilter_${message.guild.id}`) || [];
      if (!channels.includes(message.channel.id)) return;
      if (message.attachments.size > 0) {
        await message.delete().catch(() => {});
      }
    } catch {}
  },
};
