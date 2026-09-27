const { PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel, resolveRole, resolveMember, parseDuration, formatDuration } = require('../../utils/resolve');
const db = require('../../database/db');

const LOCKABLE = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum];

const lock = new Command({
  name: 'lock',
  category: 'moderation',
  description: 'Lock a channel so members cannot send messages.',
  permLevel: LEVELS.MOD,
  usage: '[channel]',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args, sub }) {
    // lock reactions / lock images subcommands
    if (sub === 'reactions') {
      const ch = resolveChannel(message.guild, args[1]) || message.channel;
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { AddReactions: false }).catch(() => {});
      return message.reply({ embeds: [success(message.author, `Locked reactions in ${ch}.`)] });
    }
    if (sub === 'images') {
      const ch = resolveChannel(message.guild, args[1]) || message.channel;
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { AttachFiles: false, EmbedLinks: false }).catch(() => {});
      return message.reply({ embeds: [success(message.author, `Locked images/media in ${ch}.`)] });
    }
    const ch = resolveChannel(message.guild, args[0]) || message.channel;
    await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason: `Locked by ${message.author.tag}` }).catch(() => {});
    return message.reply({ embeds: [success(message.author, `🔒 Locked ${ch}.`)] });
  },
});

const unlock = new Command({
  name: 'unlock',
  category: 'moderation',
  description: 'Unlock a channel.',
  permLevel: LEVELS.MOD,
  usage: '[channel]',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args, sub }) {
    if (sub === 'reactions') {
      const ch = resolveChannel(message.guild, args[1]) || message.channel;
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { AddReactions: null }).catch(() => {});
      return message.reply({ embeds: [success(message.author, `Unlocked reactions in ${ch}.`)] });
    }
    if (sub === 'images') {
      const ch = resolveChannel(message.guild, args[1]) || message.channel;
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { AttachFiles: null, EmbedLinks: null }).catch(() => {});
      return message.reply({ embeds: [success(message.author, `Unlocked images/media in ${ch}.`)] });
    }
    const ch = resolveChannel(message.guild, args[0]) || message.channel;
    await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }, { reason: `Unlocked by ${message.author.tag}` }).catch(() => {});
    return message.reply({ embeds: [success(message.author, `🔓 Unlocked ${ch}.`)] });
  },
});

const lockall = new Command({
  name: 'lockall',
  category: 'moderation',
  description: 'Lock every channel.',
  permLevel: LEVELS.ADMIN,
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message }) {
    const ignore = db.getSettings(message.guild.id, 'lockignore', { channels: [] }).channels || [];
    const m = await message.reply({ embeds: [base().setDescription('🔒 Locking all channels...')] });
    let n = 0;
    for (const ch of message.guild.channels.cache.values()) {
      if (!LOCKABLE.includes(ch.type) || ignore.includes(ch.id)) continue;
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }).then(() => n++).catch(() => {});
    }
    return m.edit({ embeds: [success(message.author, `Locked **${n}** channels.`)] });
  },
});

const unlockall = new Command({
  name: 'unlockall',
  category: 'moderation',
  description: 'Unlock every channel.',
  permLevel: LEVELS.ADMIN,
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message }) {
    const m = await message.reply({ embeds: [base().setDescription('🔓 Unlocking all channels...')] });
    let n = 0;
    for (const ch of message.guild.channels.cache.values()) {
      if (!LOCKABLE.includes(ch.type)) continue;
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }).then(() => n++).catch(() => {});
    }
    return m.edit({ embeds: [success(message.author, `Unlocked **${n}** channels.`)] });
  },
});

const hide = new Command({
  name: 'hide',
  category: 'moderation',
  description: 'Hide a channel from @everyone or a target.',
  permLevel: LEVELS.MOD,
  usage: '[channel] [role/member]',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args }) {
    const ch = resolveChannel(message.guild, args[0]) || message.channel;
    const target = resolveRole(message.guild, args[1]) || (await resolveMember(message.guild, args[1])) || message.guild.roles.everyone;
    await ch.permissionOverwrites.edit(target, { ViewChannel: false }).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Hid ${ch} from ${target.name ? `@${target.name}` : target}.`)] });
  },
});

const reveal = new Command({
  name: 'reveal',
  aliases: ['unhide'],
  category: 'moderation',
  description: 'Reveal a hidden channel.',
  permLevel: LEVELS.MOD,
  usage: '[channel] [role/member]',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args }) {
    const ch = resolveChannel(message.guild, args[0]) || message.channel;
    const target = resolveRole(message.guild, args[1]) || (await resolveMember(message.guild, args[1])) || message.guild.roles.everyone;
    await ch.permissionOverwrites.edit(target, { ViewChannel: null }).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Revealed ${ch}.`)] });
  },
});

const slowmode = new Command({
  name: 'slowmode',
  aliases: ['slow', 'sm'],
  category: 'moderation',
  description: 'Set channel slowmode.',
  permLevel: LEVELS.MOD,
  usage: '<duration|off> [channel]',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args, prefix }) {
    const arg = (args[0] || '').toLowerCase();
    const ch = resolveChannel(message.guild, args[1]) || message.channel;
    if (arg === 'off' || arg === '0') {
      await ch.setRateLimitPerUser(0).catch(() => {});
      return message.reply({ embeds: [success(message.author, `Slowmode disabled in ${ch}.`)] });
    }
    const dur = parseDuration(arg);
    if (!dur) return message.reply({ embeds: [error(`Usage: \`${prefix}slowmode <duration|off> [channel]\``)] });
    const secs = Math.min(Math.floor(dur / 1000), 21600);
    await ch.setRateLimitPerUser(secs).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Set slowmode to **${formatDuration(secs * 1000)}** in ${ch}.`)] });
  },
});

const nuke = new Command({
  name: 'nuke',
  category: 'moderation',
  description: 'Clone the channel (wipes all messages).',
  permLevel: LEVELS.ANTINUKE_ADMIN,
  usage: '[channel]',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args }) {
    const ch = resolveChannel(message.guild, args[0]) || message.channel;
    const position = ch.rawPosition;
    const clone = await ch.clone().catch(() => null);
    if (!clone) return message.reply({ embeds: [error('Failed to clone the channel.')] });
    await ch.delete(`Nuked by ${message.author.tag}`).catch(() => {});
    await clone.setPosition(position).catch(() => {});
    return clone.send({ embeds: [base().setDescription(`💥 Channel nuked by <@${message.author.id}>.`)] }).catch(() => {});
  },
});

module.exports = [lock, unlock, lockall, unlockall, hide, reveal, slowmode, nuke];
