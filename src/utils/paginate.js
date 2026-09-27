const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const config = require('../config');

/**
 * Button paginator. Pass an array of EmbedBuilders (pages) and it manages
 * prev/next/close buttons for 3 minutes, restricted to the invoking user.
 */
async function paginate(message, pages, { userId, timeout = 180_000 } = {}) {
  userId = userId || message.author?.id;
  if (!pages.length) return;
  if (pages.length === 1) {
    return message.channel.send({ embeds: [pages[0]] });
  }

  let index = 0;
  const row = (i) =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('first').setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setDisabled(i === 0),
      new ButtonBuilder().setCustomId('prev').setEmoji('⬅️').setStyle(ButtonStyle.Primary).setDisabled(i === 0),
      new ButtonBuilder().setCustomId('next').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(i === pages.length - 1),
      new ButtonBuilder().setCustomId('last').setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(i === pages.length - 1),
      new ButtonBuilder().setCustomId('close').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );

  const msg = await message.channel.send({
    embeds: [pages[0].setFooter({ text: `Page 1/${pages.length}` })],
    components: [row(0)],
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeout,
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== userId) {
      return i.reply({ content: 'These buttons are not for you.', ephemeral: true }).catch(() => {});
    }
    if (i.customId === 'close') {
      collector.stop('closed');
      return i.message.delete().catch(() => {});
    }
    if (i.customId === 'first') index = 0;
    if (i.customId === 'prev') index = Math.max(0, index - 1);
    if (i.customId === 'next') index = Math.min(pages.length - 1, index + 1);
    if (i.customId === 'last') index = pages.length - 1;

    await i
      .update({
        embeds: [pages[index].setFooter({ text: `Page ${index + 1}/${pages.length}` })],
        components: [row(index)],
      })
      .catch(() => {});
  });

  collector.on('end', (_, reason) => {
    if (reason !== 'closed') msg.edit({ components: [] }).catch(() => {});
  });

  return msg;
}

/** Chunk an array into pages of N. */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

module.exports = { paginate, chunk };
