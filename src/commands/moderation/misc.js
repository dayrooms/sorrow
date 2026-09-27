const { PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, resolveRole, resolveChannel, parseDuration, formatDuration } = require('../../utils/resolve');
const db = require('../../database/db');

const rename = new Command({
  name: 'rename',
  aliases: ['nick', 'setnick'],
  category: 'moderation',
  description: "Change a member's nickname.",
  permLevel: LEVELS.MOD,
  usage: '<member> <nickname>',
  botPerms: [PermissionFlagsBits.ManageNicknames],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}rename <member> <nickname>\``)] });
    const nick = args.slice(1).join(' ') || null;
    await member.setNickname(nick, `By ${message.author.tag}`).catch(() => message.reply({ embeds: [error('Failed — check my role position.')] }));
    return message.reply({ embeds: [success(message.author, nick ? `Renamed **${member.user.tag}** to **${nick}**.` : `Reset nickname for **${member.user.tag}**.`)] });
  },
});

const temprole = new Command({
  name: 'temprole',
  category: 'moderation',
  description: 'Temporarily give a role to a member.',
  permLevel: LEVELS.MOD,
  usage: '<member> <duration> <role>',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    const duration = parseDuration(args[1]);
    const role = resolveRole(message.guild, args.slice(2).join(' ')) || message.mentions.roles?.first();
    if (!member || !duration || !role) return message.reply({ embeds: [error(`Usage: \`${prefix}temprole <member> <duration> <role>\``)] });
    if (role.position >= message.guild.members.me.roles.highest.position) return message.reply({ embeds: [error('That role is above mine.')] });
    await member.roles.add(role, `Temprole by ${message.author.tag}`).catch(() => {});
    db.addTimer(message.guild.id, 'temprole', member.id, { roleId: role.id }, Date.now() + duration);
    return message.reply({ embeds: [success(message.author, `Gave **${role.name}** to **${member.user.tag}** for **${formatDuration(duration)}**.`)] });
  },
});

const drag = new Command({
  name: 'drag',
  category: 'moderation',
  description: 'Move a member to a voice channel.',
  permLevel: LEVELS.MOD,
  usage: '<member> [channel]',
  botPerms: [PermissionFlagsBits.MoveMembers],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member?.voice?.channel) return message.reply({ embeds: [error('That member is not in a voice channel.')] });
    const target = resolveChannel(message.guild, args.slice(1).join(' '), [ChannelType.GuildVoice, ChannelType.GuildStageVoice]) || message.member.voice?.channel;
    if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}drag <member> <voice channel>\``)] });
    await member.voice.setChannel(target).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Moved **${member.user.tag}** to **${target.name}**.`)] });
  },
});

const dragall = new Command({
  name: 'dragall',
  category: 'moderation',
  description: 'Move everyone from your VC to another.',
  permLevel: LEVELS.ADMIN,
  usage: '<channel>',
  botPerms: [PermissionFlagsBits.MoveMembers],
  async run({ message, args, prefix }) {
    const from = message.member.voice?.channel;
    if (!from) return message.reply({ embeds: [error('You are not in a voice channel.')] });
    const target = resolveChannel(message.guild, args.join(' '), [ChannelType.GuildVoice, ChannelType.GuildStageVoice]);
    if (!target) return message.reply({ embeds: [error(`Usage: \`${prefix}dragall <voice channel>\``)] });
    let n = 0;
    for (const m of from.members.values()) {
      await m.voice.setChannel(target).then(() => n++).catch(() => {});
    }
    return message.reply({ embeds: [success(message.author, `Moved **${n}** member(s) to **${target.name}**.`)] });
  },
});

const immune = new Command({
  name: 'immune',
  category: 'moderation',
  description: 'Make a user or role immune to moderation.',
  permLevel: LEVELS.ADMIN,
  usage: 'add/remove/list <user/role>',
  async run({ message, args, prefix }) {
    const sub = (args[0] || 'list').toLowerCase();
    const data = db.getSettings(message.guild.id, 'immune', { users: [], roles: [] });
    if (sub === 'add' || sub === 'remove') {
      const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
      const member = role ? null : (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
      const id = role?.id || member?.id;
      const bucket = role ? 'roles' : 'users';
      if (!id) return message.reply({ embeds: [error(`Usage: \`${prefix}immune ${sub} <user/role>\``)] });
      if (sub === 'add') { if (!data[bucket].includes(id)) data[bucket].push(id); }
      else data[bucket] = data[bucket].filter((x) => x !== id);
      db.saveSettings(message.guild.id, 'immune', data);
      return message.reply({ embeds: [success(message.author, `${sub === 'add' ? 'Added' : 'Removed'} ${role ? `role **${role.name}**` : `<@${id}>`} ${sub === 'add' ? 'to' : 'from'} the immune list.`)] });
    }
    if (sub === 'reset') {
      db.saveSettings(message.guild.id, 'immune', { users: [], roles: [] });
      return message.reply({ embeds: [success(message.author, 'Cleared the immune list.')] });
    }
    const e = base().setTitle('Immune list').setDescription(
      [
        `**Users:** ${data.users.length ? data.users.map((id) => `<@${id}>`).join(', ') : 'none'}`,
        `**Roles:** ${data.roles.length ? data.roles.map((id) => `<@&${id}>`).join(', ') : 'none'}`,
      ].join('\n')
    );
    return message.channel.send({ embeds: [e] });
  },
});

const audit = new Command({
  name: 'audit',
  category: 'moderation',
  description: 'View recent audit log entries.',
  permLevel: LEVELS.ADMIN,
  botPerms: [PermissionFlagsBits.ViewAuditLog],
  async run({ message }) {
    const logs = await message.guild.fetchAuditLogs({ limit: 10 }).catch(() => null);
    if (!logs) return message.reply({ embeds: [error('Could not fetch audit logs.')] });
    const lines = [...logs.entries.values()].map((e) => `\`${e.action}\` by <@${e.executorId}> <t:${Math.floor(e.createdTimestamp / 1000)}:R>`);
    return message.channel.send({ embeds: [base().setTitle('Recent audit log').setDescription(lines.join('\n') || 'Empty.')] });
  },
});

module.exports = [rename, temprole, drag, dragall, immune, audit];
