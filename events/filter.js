module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      if (message.member.permissions.has("Administrator")) return;
      const db = client.db;
      const words = await db.get(`filterwords_${message.guild.id}`) || [];
      if (!words.length) return;

      const content = message.content.toLowerCase();
      const matched = words.find(w => content.includes(w));
      if (!matched) return;

      await message.delete().catch(() => {});
    } catch {}
  },
};
