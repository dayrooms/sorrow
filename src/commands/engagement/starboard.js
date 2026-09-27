const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel } = require('../../utils/resolve');
const db = require('../../database/db');

module.exports = new Command({
  name: 'starboard',
  aliases: ['star'],
  category: 'engagement',
  description: 'Highlight popular messages via star reactions.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/config/edit <...>',
  help: {
    title: 'Starboard',
    intro: 'When a message gets enough star reactions, Sorrow reposts it to a starboard channel. Supports multiple boards with different emoji/thresholds.',
    subcommands: [
      { usage: 'add <#channel> [emoji] [threshold] [name]', desc: 'Create a starboard. e.g. `starboard add #starboard ⭐ 3 default`.' },
      { usage: 'remove <name>', desc: 'Delete a starboard by name.' },
      { usage: 'edit <name> threshold <n>', desc: 'Change a board\'s threshold or emoji.' },
      { usage: 'ping <name>', desc: 'Toggle pinging the author when featured.' },
      { usage: 'selfstar <name>', desc: 'Toggle whether self-reactions count.' },
      { usage: 'config', desc: 'Show all configured starboards.' },
    ],
  },
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'starboard', { boards: {} });

    switch (sub) {
      case 'add': {
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
        const emoji = args[2] || '⭐';
        const threshold = parseInt(args[3], 10) || 3;
        const name = args[4] || 'default';
        if (!ch) return message.reply({ embeds: [error(`Usage: \`${prefix}starboard add <#channel> [emoji] [threshold] [name]\``)] });
        data.boards[name] = { channel: ch.id, emoji, threshold, selfstar: false, ping: false };
        db.saveSettings(message.guild.id, 'starboard', data);
        return message.reply({ embeds: [success(message.author, `Starboard **${name}** → ${ch} (${emoji} × ${threshold}).`)] });
      }
      case 'remove': {
        const name = args[1] || 'default';
        delete data.boards[name];
        db.saveSettings(message.guild.id, 'starboard', data);
        return message.reply({ embeds: [success(message.author, `Removed starboard **${name}**.`)] });
      }
      case 'edit': {
        const name = args[1] || 'default';
        const b = data.boards[name];
        if (!b) return message.reply({ embeds: [error('Board not found.')] });
        const key = (args[2] || '').toLowerCase();
        if (key === 'threshold') b.threshold = parseInt(args[3], 10) || b.threshold;
        else if (key === 'emoji') b.emoji = args[3] || b.emoji;
        else return message.reply({ embeds: [error(`Usage: \`${prefix}starboard edit <name> <threshold|emoji> <value>\``)] });
        db.saveSettings(message.guild.id, 'starboard', data);
        return message.reply({ embeds: [success(message.author, `Updated starboard **${name}**.`)] });
      }
      case 'ping':
      case 'selfstar': {
        const name = args[1] || 'default';
        const b = data.boards[name];
        if (!b) return message.reply({ embeds: [error('Board not found.')] });
        b[sub] = !b[sub];
        db.saveSettings(message.guild.id, 'starboard', data);
        return message.reply({ embeds: [success(message.author, `${sub} for **${name}** → ${b[sub] ? 'on' : 'off'}.`)] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Starboards').setDescription(Object.entries(data.boards).map(([n, b]) => `**${n}**: <#${b.channel}> ${b.emoji}×${b.threshold}`).join('\n') || 'None configured.')] });
    }
  },
});
