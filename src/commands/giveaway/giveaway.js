const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel, parseDuration, formatDuration } = require('../../utils/resolve');
const db = require('../../database/db');

const giveaway = new Command({
  name: 'giveaway',
  aliases: ['gw', 'gaw'],
  category: 'engagement',
  description: 'Manage server giveaways.',
  permLevel: LEVELS.MOD,
  usage: 'start <duration> <winners> <prize> | end/reroll/list/cancel <messageId>',
  help: {
    title: 'Giveaways',
    intro: 'Run button-entry giveaways. Members click to enter; Sorrow picks winners when the timer ends. Survives restarts.',
    subcommands: [
      { usage: 'start <duration> <winners> <prize>', desc: 'Start a giveaway. e.g. `giveaway start 1h 2 Nitro`.' },
      { usage: 'end <messageId>', desc: 'End a giveaway early and draw winners now.' },
      { usage: 'reroll <messageId>', desc: 'Pick a new winner from the entries.' },
      { usage: 'cancel <messageId>', desc: 'Cancel a giveaway with no winners.' },
    ],
  },
  async run({ client, message, args, prefix, sub }) {
    switch (sub) {
      case 'start': {
        const duration = parseDuration(args[1]);
        const winners = parseInt(args[2], 10) || 1;
        const prize = args.slice(3).join(' ');
        if (!duration || !prize) return message.reply({ embeds: [error(`Usage: \`${prefix}giveaway start <duration> <winners> <prize>\``)] });
        const endsAt = Date.now() + duration;
        const embed = base(0xfbe70a)
          .setTitle('🎉 Giveaway 🎉')
          .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n\nClick the button to enter!`)
          .setFooter({ text: `Hosted by ${message.author.tag}` });
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('gw_enter').setEmoji('🎉').setLabel('Enter').setStyle(ButtonStyle.Primary));
        const gwMsg = await message.channel.send({ embeds: [embed], components: [row] });
        db.saveSettings(message.guild.id, `giveaway:${gwMsg.id}`, { channel: message.channel.id, prize, winners, host: message.author.id, entries: [], endsAt, ended: false });
        db.addTimer(message.guild.id, 'giveaway', gwMsg.id, {}, endsAt);
        await message.delete().catch(() => {});
        return;
      }
      case 'end': {
        const id = args[1];
        if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}giveaway end <messageId>\``)] });
        await endGiveaway(client, message.guild, id, {});
        return message.reply({ embeds: [success(message.author, 'Giveaway ended.')] });
      }
      case 'reroll': {
        const id = args[1];
        const data = db.getSettings(message.guild.id, `giveaway:${id}`, null);
        if (!data || !data.entries?.length) return message.reply({ embeds: [error('No entries to reroll.')] });
        const winner = data.entries[Math.floor(Math.random() * data.entries.length)];
        return message.channel.send(`🎉 New winner: <@${winner}>! Congrats on **${data.prize}**.`);
      }
      case 'list': {
        // Scan settings for giveaway:* — better in a real DB; here we note usage.
        return message.channel.send({ embeds: [base().setDescription('Active giveaways are tracked by message ID. Use the message ID with `end`/`reroll`/`cancel`.')] });
      }
      case 'cancel': {
        const id = args[1];
        db.clearSettings(message.guild.id, `giveaway:${id}`);
        return message.reply({ embeds: [success(message.author, 'Giveaway cancelled.')] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Giveaways').setDescription(`\`${prefix}giveaway start <duration> <winners> <prize>\`\n\`${prefix}giveaway end/reroll/cancel <messageId>\``)] });
    }
  },
});

/** Called by the scheduler when a giveaway timer fires (and by `end`). */
async function endGiveaway(client, guild, messageId, _data) {
  const data = db.getSettings(guild.id, `giveaway:${messageId}`, null);
  if (!data || data.ended) return;
  data.ended = true;
  db.saveSettings(guild.id, `giveaway:${messageId}`, data);

  const channel = guild.channels.cache.get(data.channel);
  if (!channel?.isTextBased()) return;
  const msg = await channel.messages.fetch(messageId).catch(() => null);

  const entries = data.entries || [];
  const winners = [];
  const pool = [...entries];
  for (let i = 0; i < data.winners && pool.length; i++) {
    winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }

  const resultEmbed = base(0xfbe70a)
    .setTitle('🎉 Giveaway Ended 🎉')
    .setDescription(`**Prize:** ${data.prize}\n**Winners:** ${winners.length ? winners.map((w) => `<@${w}>`).join(', ') : 'No valid entries'}`);
  if (msg) await msg.edit({ embeds: [resultEmbed], components: [] }).catch(() => {});
  await channel.send(winners.length ? `🎉 Congratulations ${winners.map((w) => `<@${w}>`).join(', ')}! You won **${data.prize}**!` : `No one entered the giveaway for **${data.prize}**.`).catch(() => {});
}

module.exports = giveaway;
module.exports.endGiveaway = endGiveaway;
