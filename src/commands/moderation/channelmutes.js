const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');
const mod = require('../../utils/moderation');

/**
 * Channel-scoped mutes implemented via per-member permission overwrites in the
 * current channel. Simple, reversible, no roles needed.
 */
function makeMute(name, aliases, perms, label, on) {
  return new Command({
    name,
    aliases,
    category: 'moderation',
    description: `${on ? 'Mute' : 'Unmute'} a member from ${label} in this channel.`,
    permLevel: LEVELS.MOD,
    usage: '<member> [reason]',
    botPerms: [PermissionFlagsBits.ManageChannels],
    async run({ message, args, prefix }) {
      const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
      if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}${name} <member>\``)] });
      const overwrite = {};
      for (const p of perms) overwrite[p] = on ? false : null;
      await message.channel.permissionOverwrites.edit(member, overwrite, { reason: `${label} ${on ? 'mute' : 'unmute'} by ${message.author.tag}` }).catch(() => {});
      return message.reply({ embeds: [success(message.author, `${on ? 'Muted' : 'Unmuted'} **${member.user.tag}** from ${label} here.`)] });
    },
  });
}

module.exports = [
  makeMute('imagemute', [], ['AttachFiles', 'EmbedLinks'], 'images', true),
  makeMute('imageunmute', [], ['AttachFiles', 'EmbedLinks'], 'images', false),
  makeMute('reactionmute', ['rmute'], ['AddReactions'], 'reactions', true),
  makeMute('unreactionmute', ['runmute'], ['AddReactions'], 'reactions', false),
  makeMute('streammute', [], ['Stream'], 'streaming', true),
  makeMute('streamunmute', [], ['Stream'], 'streaming', false),
  makeMute('revokefiles', [], ['AttachFiles', 'EmbedLinks'], 'files & embeds', true),
  makeMute('unrevokefiles', [], ['AttachFiles', 'EmbedLinks'], 'files & embeds', false),
];
