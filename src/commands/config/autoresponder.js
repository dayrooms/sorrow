const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const db = require('../../database/db');

const autoresponder = new Command({
  name: 'autoresponder',
  aliases: ['ar-responder', 'responder'],
  category: 'config',
  description: 'Auto-respond when a trigger phrase is detected.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/list/reset <trigger> <response>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'autoresponder', { rules: {} });
    switch (sub) {
      case 'add': {
        const rest = args.slice(1).join(' ');
        const [trigger, ...resp] = rest.split('|');
        if (!trigger || !resp.length) return message.reply({ embeds: [error(`Usage: \`${prefix}autoresponder add <trigger> | <response>\``)] });
        data.rules[trigger.trim().toLowerCase()] = resp.join('|').trim();
        db.saveSettings(message.guild.id, 'autoresponder', data);
        return message.reply({ embeds: [success(message.author, `Added autoresponder for \`${trigger.trim()}\`.`)] });
      }
      case 'remove': {
        const trigger = args.slice(1).join(' ').toLowerCase();
        delete data.rules[trigger];
        db.saveSettings(message.guild.id, 'autoresponder', data);
        return message.reply({ embeds: [success(message.author, `Removed autoresponder \`${trigger}\`.`)] });
      }
      case 'reset':
        db.saveSettings(message.guild.id, 'autoresponder', { rules: {} });
        return message.reply({ embeds: [success(message.author, 'Cleared autoresponders.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Autoresponders').setDescription(Object.entries(data.rules).map(([t, r]) => `\`${t}\` → ${r.slice(0, 50)}`).join('\n') || 'None.')] });
    }
  },
});

const autoreact = new Command({
  name: 'autoreact',
  category: 'config',
  description: 'Auto-react to messages from a user/role/channel or matching a trigger.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/list/clear <trigger> <emoji>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'autoreact', { rules: {} });
    switch (sub) {
      case 'add': {
        const trigger = args[1]?.toLowerCase();
        const emoji = args[2];
        if (!trigger || !emoji) return message.reply({ embeds: [error(`Usage: \`${prefix}autoreact add <trigger> <emoji>\``)] });
        data.rules[trigger] = data.rules[trigger] || [];
        if (!data.rules[trigger].includes(emoji)) data.rules[trigger].push(emoji);
        db.saveSettings(message.guild.id, 'autoreact', data);
        return message.reply({ embeds: [success(message.author, `Auto-react ${emoji} on \`${trigger}\`.`)] });
      }
      case 'remove': {
        const trigger = args[1]?.toLowerCase();
        delete data.rules[trigger];
        db.saveSettings(message.guild.id, 'autoreact', data);
        return message.reply({ embeds: [success(message.author, `Removed auto-react for \`${trigger}\`.`)] });
      }
      case 'clear':
      case 'reset':
        db.saveSettings(message.guild.id, 'autoreact', { rules: {} });
        return message.reply({ embeds: [success(message.author, 'Cleared auto-reactions.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Auto-reactions').setDescription(Object.entries(data.rules).map(([t, e]) => `\`${t}\` → ${e.join(' ')}`).join('\n') || 'None.')] });
    }
  },
});

const filter = new Command({
  name: 'filter',
  aliases: ['chatfilter'],
  category: 'config',
  description: 'Auto-moderate messages containing filtered words.',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list/reset/config/log <...>',
  help: {
    title: 'Word filter',
    intro: 'Auto-delete messages containing filtered words (staff are exempt). Optionally log every catch to a channel.',
    subcommands: [
      { usage: 'add <word...>', desc: 'Add one or more words to the filter.' },
      { usage: 'remove <word>', desc: 'Remove a word from the filter.' },
      { usage: 'list', desc: 'Show all filtered words.' },
      { usage: 'config', desc: 'Show the filter action and log channel.' },
      { usage: 'log <#channel>', desc: 'Set (or clear) the channel where catches are logged.' },
      { usage: 'reset', desc: 'Clear the entire filter.' },
    ],
  },
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'filter', { words: [], logChannel: null, action: 'delete' });
    switch (sub) {
      case 'add': {
        const words = args.slice(1).map((w) => w.toLowerCase());
        if (!words.length) return message.reply({ embeds: [error(`Usage: \`${prefix}filter add <word...>\``)] });
        data.words = [...new Set([...data.words, ...words])];
        db.saveSettings(message.guild.id, 'filter', data);
        return message.reply({ embeds: [success(message.author, `Added **${words.length}** word(s) to the filter.`)] });
      }
      case 'remove': {
        const word = args[1]?.toLowerCase();
        data.words = data.words.filter((w) => w !== word);
        db.saveSettings(message.guild.id, 'filter', data);
        return message.reply({ embeds: [success(message.author, `Removed \`${word}\`.`)] });
      }
      case 'reset':
        db.saveSettings(message.guild.id, 'filter', { words: [], logChannel: null, action: 'delete' });
        return message.reply({ embeds: [success(message.author, 'Cleared the filter.')] });
      case 'log': {
        const { resolveChannel } = require('../../utils/resolve');
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
        data.logChannel = ch?.id || null;
        db.saveSettings(message.guild.id, 'filter', data);
        return message.reply({ embeds: [success(message.author, ch ? `Filter log set to ${ch}.` : 'Filter log cleared.')] });
      }
      case 'config':
        return message.channel.send({ embeds: [base().setTitle('Filter config').setDescription(`**Action:** ${data.action}\n**Log:** ${data.logChannel ? `<#${data.logChannel}>` : 'none'}\n**Words:** ${data.words.length}`)] });
      default:
        return message.channel.send({ embeds: [base().setTitle(`Filtered words (${data.words.length})`).setDescription(data.words.map((w) => `\`${w}\``).join(', ') || 'None.')] });
    }
  },
});

module.exports = [autoresponder, autoreact, filter];
