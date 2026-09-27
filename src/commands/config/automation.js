const { PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel, parseDuration, formatDuration } = require('../../utils/resolve');
const db = require('../../database/db');

const autothread = new Command({
  name: 'autothread',
  category: 'config',
  description: 'Automatically create threads on new messages in a channel.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/list/clear <channel>',
  botPerms: [PermissionFlagsBits.CreatePublicThreads],
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'autothread', { channels: [] });
    switch (sub) {
      case 'add': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        if (!data.channels.includes(ch.id)) data.channels.push(ch.id);
        db.saveSettings(message.guild.id, 'autothread', data);
        return message.reply({ embeds: [success(message.author, `Auto-threading enabled in ${ch}.`)] });
      }
      case 'remove': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        data.channels = data.channels.filter((c) => c !== ch.id);
        db.saveSettings(message.guild.id, 'autothread', data);
        return message.reply({ embeds: [success(message.author, `Auto-threading disabled in ${ch}.`)] });
      }
      case 'clear':
        db.saveSettings(message.guild.id, 'autothread', { channels: [] });
        return message.reply({ embeds: [success(message.author, 'Cleared autothread channels.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Autothread channels').setDescription(data.channels.map((c) => `<#${c}>`).join('\n') || 'None.')] });
    }
  },
});

const autopurge = new Command({
  name: 'autopurge',
  category: 'config',
  description: 'Schedule automatic message purges for channels.',
  permLevel: LEVELS.MOD,
  usage: 'add/remove/list <channel> <interval>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'autopurge', { channels: {} });
    switch (sub) {
      case 'add': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        const interval = parseDuration(args[2]) || 3600000;
        data.channels[ch.id] = { interval, last: Date.now() };
        db.saveSettings(message.guild.id, 'autopurge', data);
        return message.reply({ embeds: [success(message.author, `Autopurge set for ${ch} every **${formatDuration(interval)}**.`)] });
      }
      case 'remove': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        delete data.channels[ch.id];
        db.saveSettings(message.guild.id, 'autopurge', data);
        return message.reply({ embeds: [success(message.author, `Removed autopurge for ${ch}.`)] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Autopurge').setDescription(Object.entries(data.channels).map(([c, v]) => `<#${c}> every ${formatDuration(v.interval)}`).join('\n') || 'None.')] });
    }
  },
});

const autoping = new Command({
  name: 'autoping',
  category: 'config',
  description: 'Ping users in a channel when they join.',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list <channel>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'autoping', { channels: [] });
    switch (sub) {
      case 'add': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        if (!data.channels.includes(ch.id)) data.channels.push(ch.id);
        db.saveSettings(message.guild.id, 'autoping', data);
        return message.reply({ embeds: [success(message.author, `Autoping enabled in ${ch}.`)] });
      }
      case 'remove': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        data.channels = data.channels.filter((c) => c !== ch.id);
        db.saveSettings(message.guild.id, 'autoping', data);
        return message.reply({ embeds: [success(message.author, `Autoping disabled in ${ch}.`)] });
      }
      case 'reset':
        db.saveSettings(message.guild.id, 'autoping', { channels: [] });
        return message.reply({ embeds: [success(message.author, 'Cleared autoping.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Autoping channels').setDescription(data.channels.map((c) => `<#${c}>`).join('\n') || 'None.')] });
    }
  },
});

const imagelock = new Command({
  name: 'imagelock',
  aliases: ['gallery'],
  category: 'config',
  description: 'Make channels image-only (gallery channels).',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list <channel>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'imagelock', { channels: [] });
    switch (sub) {
      case 'add': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        if (!data.channels.includes(ch.id)) data.channels.push(ch.id);
        db.saveSettings(message.guild.id, 'imagelock', data);
        return message.reply({ embeds: [success(message.author, `${ch} is now image-only.`)] });
      }
      case 'remove': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        data.channels = data.channels.filter((c) => c !== ch.id);
        db.saveSettings(message.guild.id, 'imagelock', data);
        return message.reply({ embeds: [success(message.author, `${ch} is no longer image-only.`)] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Gallery channels').setDescription(data.channels.map((c) => `<#${c}>`).join('\n') || 'None.')] });
    }
  },
});

const stickymessage = new Command({
  name: 'stickymessage',
  aliases: ['sticky'],
  category: 'config',
  description: 'Keep a message stuck to the bottom of a channel.',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'sticky', { channels: {} });
    switch (sub) {
      case 'add': {
        const text = args.slice(1).join(' ');
        if (!text) return message.reply({ embeds: [error(`Usage: \`${prefix}stickymessage add <text>\``)] });
        data.channels[message.channel.id] = { text, lastId: null };
        db.saveSettings(message.guild.id, 'sticky', data);
        return message.reply({ embeds: [success(message.author, 'Sticky message set for this channel.')] });
      }
      case 'remove':
        delete data.channels[message.channel.id];
        db.saveSettings(message.guild.id, 'sticky', data);
        return message.reply({ embeds: [success(message.author, 'Removed sticky message here.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Sticky messages').setDescription(Object.keys(data.channels).map((c) => `<#${c}>`).join('\n') || 'None.')] });
    }
  },
});

const invoke = new Command({
  name: 'invoke',
  category: 'config',
  description: 'Customize punishment messages (DM/channel) for mod actions.',
  permLevel: LEVELS.ADMIN,
  usage: 'add <command> <dm|message> <text> | list | remove <command>',
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'invoke', {});
    if (sub === 'add') {
      const cmd = args[1]?.toLowerCase();
      const type = (args[2] || 'dm').toLowerCase();
      const text = args.slice(3).join(' ');
      if (!cmd || !text) return message.reply({ embeds: [error(`Usage: \`${prefix}invoke add <command> <dm|message> <text>\``)] });
      data[cmd] = data[cmd] || {};
      data[cmd][type === 'message' ? 'message' : 'dm'] = text;
      db.saveSettings(message.guild.id, 'invoke', data);
      return message.reply({ embeds: [success(message.author, `Set ${type} invoke message for \`${cmd}\`. Variables: {user} {reason} {moderator} {duration} {guild}`)] });
    }
    if (sub === 'remove') { delete data[args[1]?.toLowerCase()]; db.saveSettings(message.guild.id, 'invoke', data); return message.reply({ embeds: [success(message.author, 'Removed.')] }); }
    if (sub === 'list') return message.channel.send({ embeds: [base().setTitle('Invoke messages').setDescription(Object.keys(data).map((c) => `\`${c}\``).join(', ') || 'None.')] });
    return message.channel.send({ embeds: [base().setTitle('Invoke').setDescription(`Supported commands: ban, kick, mute, warn, jail, timeout\nVariables: {user} {reason} {moderator} {duration} {guild}\n\`${prefix}invoke add <command> <dm|message> <text>\``)] });
  },
});

module.exports = [autothread, autopurge, autoping, imagelock, stickymessage, invoke];
