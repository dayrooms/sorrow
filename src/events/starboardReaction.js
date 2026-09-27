const db = require('../database/db');
const { base } = require('../utils/embed');

/** Starboard reaction handler. Posts messages that cross the star threshold. */
module.exports = {
  name: 'messageReactionAdd',
  async execute(client, reaction, user) {
    try {
      if (user.bot || !reaction.message.guild) return;
      if (reaction.partial) await reaction.fetch().catch(() => {});
      const msg = reaction.message;
      const data = db.getSettings(msg.guild.id, 'starboard', { boards: {} });

      for (const [name, board] of Object.entries(data.boards)) {
        const emojiMatch = reaction.emoji.name === board.emoji || reaction.emoji.toString() === board.emoji;
        if (!emojiMatch) continue;

        // self-star rule
        if (!board.selfstar && msg.author?.id === user.id) continue;

        if (reaction.count < board.threshold) continue;

        const already = db.raw.prepare('SELECT star_msg_id FROM starboard_posts WHERE guild_id = ? AND message_id = ?').get(msg.guild.id, msg.id);
        const boardChannel = msg.guild.channels.cache.get(board.channel);
        if (!boardChannel?.isTextBased()) continue;

        const embed = base(0xffac33)
          .setAuthor({ name: msg.author?.tag || 'Unknown', iconURL: msg.author?.displayAvatarURL() })
          .setDescription(msg.content || '*[no text]*')
          .addFields({ name: '​', value: `[Jump to message](${msg.url})` })
          .setFooter({ text: `${board.emoji} ${reaction.count} • #${msg.channel.name}` })
          .setTimestamp(msg.createdTimestamp);
        const img = msg.attachments.first();
        if (img && /\.(png|jpe?g|gif|webp)$/i.test(img.name)) embed.setImage(img.url);

        if (already) {
          const starMsg = await boardChannel.messages.fetch(already.star_msg_id).catch(() => null);
          if (starMsg) await starMsg.edit({ embeds: [embed] }).catch(() => {});
        } else {
          const content = board.ping && msg.author ? `<@${msg.author.id}>` : undefined;
          const sent = await boardChannel.send({ content, embeds: [embed] }).catch(() => null);
          if (sent) db.raw.prepare('INSERT OR REPLACE INTO starboard_posts (guild_id, message_id, star_msg_id) VALUES (?, ?, ?)').run(msg.guild.id, msg.id, sent.id);
        }
      }
    } catch {}
  },
};
