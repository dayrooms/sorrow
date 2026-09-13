module.exports = {
  event: "messageCreate",
  execute: async (message, client) => {
    try {
      if (message.author.bot || !message.guild) return;
      const db = client.db;
      const responders = await db.get(`autoresponders_${message.guild.id}`) || [];
      if (!responders.length) return;

      const content = message.content.toLowerCase();
      const match = responders.find(r => content.includes(r.trigger));
      if (!match) return;

      const response = match.response
        .replace(/{user}/g, message.author.toString())
        .replace(/{user\.name}/g, message.author.username)
        .replace(/{guild\.name}/g, message.guild.name);

      message.channel.send({ content: response }).catch(() => {});
    } catch {}
  },
};
