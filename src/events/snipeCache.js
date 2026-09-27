/** Cache deleted/edited/reaction-removed messages for snipe commands. */
module.exports = [
  {
    name: 'messageDelete',
    execute(client, msg) {
      if (!msg.guild || msg.author?.bot || !msg.content) return;
      const arr = client.snipes.get(msg.channel.id) || [];
      arr.unshift({ content: msg.content, author: msg.author.tag, authorId: msg.author.id, avatar: msg.author.displayAvatarURL(), at: Date.now(), attachment: msg.attachments.first()?.url });
      client.snipes.set(msg.channel.id, arr.slice(0, 15));
    },
  },
  {
    name: 'messageUpdate',
    execute(client, oldM, newM) {
      if (!newM.guild || newM.author?.bot || oldM.content === newM.content) return;
      const arr = client.editSnipes.get(newM.channel.id) || [];
      arr.unshift({ before: oldM.content, after: newM.content, author: newM.author.tag, avatar: newM.author.displayAvatarURL(), at: Date.now() });
      client.editSnipes.set(newM.channel.id, arr.slice(0, 15));
    },
  },
  {
    name: 'messageReactionRemove',
    execute(client, reaction, user) {
      if (!reaction.message.guild || user.bot) return;
      const arr = client.reactionSnipes.get(reaction.message.channel.id) || [];
      arr.unshift({ emoji: reaction.emoji.toString(), user: user.tag, at: Date.now() });
      client.reactionSnipes.set(reaction.message.channel.id, arr.slice(0, 15));
    },
  },
];
