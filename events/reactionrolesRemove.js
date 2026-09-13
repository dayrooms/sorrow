module.exports = {
  event: "messageReactionRemove",
  execute: async (reaction, user, client) => {
    try {
      if (user.bot) return;
      if (!reaction.message.guild) return;
      const db = client.db;
      const entries = await db.get(`reactionroles_${reaction.message.guild.id}`) || [];
      if (!entries.length) return;

      const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
      const match = entries.find(e => e.messageId === reaction.message.id && (e.emoji === emojiKey || e.emoji === reaction.emoji.name));
      if (!match) return;

      const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
      if (member) await member.roles.remove(match.roleId).catch(() => {});
    } catch {}
  },
};
