module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      const db = client.db;
      const channels = await db.get(`autothread_${message.guild.id}`) || [];
      const match = channels.find(c => c.channelId === message.channel.id);
      if (!match) return;

      const threadName = match.name || message.content.slice(0, 80) || `Thread`;
      await message.startThread({ name: threadName, autoArchiveDuration: 1440 }).catch(() => {});
    } catch {}
  },
};
