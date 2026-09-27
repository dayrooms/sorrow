const { ChannelType, PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel } = require('../../utils/resolve');
const db = require('../../database/db');

/**
 * Live counter channels. Each tracked channel has a name template with
 * placeholders: {members} {humans} {bots} {boosts} {online} {voice}
 * The scheduler refreshes them every ~10 min (channel renames are rate-limited).
 */
module.exports = new Command({
  name: 'counters',
  aliases: ['counter', 'stats-channel'],
  category: 'engagement',
  description: 'Live channel-name counters for server stats.',
  permLevel: LEVELS.ADMIN,
  usage: 'setup <template> | remove <channel> | list | reset',
  botPerms: [PermissionFlagsBits.ManageChannels],
  async run({ message, args, prefix, sub }) {
    const data = db.getSettings(message.guild.id, 'counters', { channels: {} });

    switch (sub) {
      case 'setup':
      case 'add': {
        const template = args.slice(1).join(' ') || 'Members: {members}';
        const ch = await message.guild.channels.create({
          name: applyTemplate(template, message.guild),
          type: ChannelType.GuildVoice,
          permissionOverwrites: [{ id: message.guild.id, deny: [PermissionFlagsBits.Connect] }],
          reason: 'Counter channel',
        }).catch(() => null);
        if (!ch) return message.reply({ embeds: [error('Failed to create the counter channel.')] });
        data.channels[ch.id] = { template };
        db.saveSettings(message.guild.id, 'counters', data);
        return message.reply({ embeds: [success(message.author, `Created counter ${ch} with template \`${template}\`.\nPlaceholders: {members} {humans} {bots} {boosts} {voice}`)] });
      }
      case 'remove': {
        const ch = resolveChannel(message.guild, args[1]);
        if (ch) { delete data.channels[ch.id]; await ch.delete().catch(() => {}); }
        db.saveSettings(message.guild.id, 'counters', data);
        return message.reply({ embeds: [success(message.author, 'Removed the counter.')] });
      }
      case 'reset': {
        for (const id of Object.keys(data.channels)) { const c = message.guild.channels.cache.get(id); await c?.delete().catch(() => {}); }
        db.saveSettings(message.guild.id, 'counters', { channels: {} });
        return message.reply({ embeds: [success(message.author, 'Removed all counters.')] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Counters').setDescription(Object.entries(data.channels).map(([id, c]) => `<#${id}>: \`${c.template}\``).join('\n') || `None. Create one with \`${prefix}counters setup <template>\``)] });
    }
  },
});

function applyTemplate(tpl, guild) {
  const members = guild.memberCount;
  const bots = guild.members.cache.filter((m) => m.user.bot).size;
  const humans = members - bots;
  const boosts = guild.premiumSubscriptionCount || 0;
  const voice = guild.members.cache.filter((m) => m.voice?.channelId).size;
  return tpl
    .replaceAll('{members}', members)
    .replaceAll('{humans}', humans)
    .replaceAll('{bots}', bots)
    .replaceAll('{boosts}', boosts)
    .replaceAll('{voice}', voice)
    .slice(0, 100);
}

module.exports.applyTemplate = applyTemplate;
