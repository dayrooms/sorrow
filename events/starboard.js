const { EmbedBuilder } = require("discord.js");

module.exports = {
  event: "messageReactionAdd",
  execute: async (reaction, user, client) => {
    const db = client.db;
    try {
      if (user.bot) return;
      if (reaction.emoji.name !== '⭐') return;
      if (!reaction.message.guild) return;

      const channelId = await db.get(`starboard_channel_${reaction.message.guild.id}`);
      if (!channelId) return;

      const threshold = await db.get(`starboard_threshold_${reaction.message.guild.id}`) || 3;

      // Refetch to get an accurate reaction count
      const message = await reaction.message.fetch();
      const starReaction = message.reactions.cache.get('⭐');
      const count = starReaction ? starReaction.count : 0;
      if (count < threshold) return;

      if (message.author.bot) return;
      if (message.channel.id === channelId) return; // don't star messages in the starboard itself

      const starboardChannel = message.guild.channels.cache.get(channelId);
      if (!starboardChannel) return;

      const existingId = await db.get(`starboard_msg_${message.id}`);

      const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setDescription(message.content || '*(no text content)*')
        .addFields({ name: 'Source', value: `[Jump to message](${message.url})` })
        .setTimestamp(message.createdAt);

      const firstAttachment = message.attachments.first();
      if (firstAttachment && /\.(png|jpe?g|gif|webp)$/i.test(firstAttachment.url)) {
        embed.setImage(firstAttachment.url);
      }

      if (existingId) {
        // Update the existing starboard post's star count
        const existingMsg = await starboardChannel.messages.fetch(existingId).catch(() => null);
        if (existingMsg) {
          await existingMsg.edit({ content: `⭐ **${count}** | ${message.channel}`, embeds: [embed] }).catch(() => {});
          return;
        }
      }

      const posted = await starboardChannel.send({ content: `⭐ **${count}** | ${message.channel}`, embeds: [embed] }).catch(() => null);
      if (posted) {
        await db.set(`starboard_msg_${message.id}`, posted.id);
      }
    } catch {}
  },
};
