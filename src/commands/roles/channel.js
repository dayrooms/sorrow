const { PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel } = require('../../utils/resolve');

const channel = new Command({
  name: 'channel',
  aliases: ['chan'],
  category: 'roles',
  description: 'Manage server channels (create/remove/edit/sync).',
  permLevel: LEVELS.MOD,
  usage: 'create/remove/edit/sync <...>',
  help: {
    title: 'Channel management',
    intro: 'Create, delete, edit and sync channels.',
    subcommands: [
      { usage: 'create <name>', desc: 'Create a text channel.' },
      { usage: 'remove [channel]', desc: 'Delete a channel (current one if none given).' },
      { usage: 'edit [channel] <new name>', desc: 'Rename a channel.' },
      { usage: 'sync', desc: 'Sync this channel\'s permissions to its category.' },
    ],
  },
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args, prefix, sub }) {
    switch (sub) {
      case 'create': {
        const name = args.slice(1).join(' ') || 'new-channel';
        const created = await message.guild.channels.create({ name, type: ChannelType.GuildText, reason: `By ${message.author.tag}` }).catch(() => null);
        if (!created) return message.reply({ embeds: [error('Failed to create channel.')] });
        return message.reply({ embeds: [success(message.author, `Created ${created}.`)] });
      }
      case 'remove':
      case 'delete': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        const name = ch.name;
        await ch.delete(`By ${message.author.tag}`).catch(() => {});
        if (ch.id !== message.channel.id) return message.reply({ embeds: [success(message.author, `Deleted **#${name}**.`)] });
        return;
      }
      case 'edit': {
        const ch = resolveChannel(message.guild, args[1]) || message.channel;
        const newName = args.slice(2).join(' ');
        if (newName) await ch.setName(newName).catch(() => {});
        return message.reply({ embeds: [success(message.author, `Edited ${ch}.`)] });
      }
      case 'sync': {
        const target = message.channel;
        if (!target.parent) return message.reply({ embeds: [error('This channel has no category to sync from.')] });
        await target.lockPermissions().catch(() => {});
        return message.reply({ embeds: [success(message.author, `Synced ${target} to its category.`)] });
      }
      default:
        return message.reply({ embeds: [error(`Usage: \`${prefix}channel create/remove/edit/sync\``)] });
    }
  },
});

const topic = new Command({
  name: 'topic',
  category: 'roles',
  description: 'Set or remove a channel topic.',
  permLevel: LEVELS.MOD,
  usage: '<text> | remove',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args, sub }) {
    if (sub === 'remove') {
      await message.channel.setTopic(null).catch(() => {});
      return message.reply({ embeds: [success(message.author, 'Removed the channel topic.')] });
    }
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [error('Provide topic text.')] });
    await message.channel.setTopic(text).catch(() => {});
    return message.reply({ embeds: [success(message.author, 'Updated the channel topic.')] });
  },
});

const naughty = new Command({
  name: 'naughty',
  category: 'roles',
  description: 'Temporarily mark a channel NSFW for 30 seconds.',
  permLevel: LEVELS.MOD,
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message }) {
    const ch = message.channel;
    const was = ch.nsfw;
    await ch.setNSFW(true).catch(() => {});
    await message.reply({ embeds: [base().setDescription('🔞 Channel is NSFW for 30 seconds...')] });
    setTimeout(() => ch.setNSFW(was).catch(() => {}), 30000);
  },
});

module.exports = [channel, topic, naughty];
