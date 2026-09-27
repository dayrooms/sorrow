const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, parseDuration, formatDuration } = require('../../utils/resolve');
const mod = require('../../utils/moderation');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

const jail = new Command({
  name: 'jail',
  category: 'moderation',
  description: 'Jail a member (removes their roles, adds the jail role).',
  permLevel: LEVELS.MOD,
  usage: '<member> [duration] [reason]',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}jail <member> [duration] [reason]\``)] });
    const pf = mod.preflight(message, member);
    if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    const duration = parseDuration(args[1]);
    const reason = args.slice(duration ? 2 : 1).join(' ') || 'No reason provided';
    const jailRole = await mod.ensureJailRole(message.guild);
    if (!jailRole) return message.reply({ embeds: [error('Could not create/find the jail role.')] });

    // Save current roles so unjail can restore them.
    const restorable = member.roles.cache.filter((r) => r.id !== message.guild.id && r.editable).map((r) => r.id);
    db.saveSettings(message.guild.id, `jail:${member.id}`, { roles: restorable });
    await member.roles.set([jailRole.id], `Jailed by ${message.author.tag}: ${reason}`).catch(() => {});
    if (duration) db.addTimer(message.guild.id, 'unjail', member.id, { roles: restorable }, Date.now() + duration);
    const caseNo = await mod.record(message.guild, { action: 'jail', target: member, moderator: message.member, reason, durationText: duration ? formatDuration(duration) : null });
    return message.reply({ embeds: [success(message.author, `Jailed **${member.user.tag}**${duration ? ` for **${formatDuration(duration)}**` : ''} — Case #${caseNo}.`)] });
  },
});

const unjail = new Command({
  name: 'unjail',
  category: 'moderation',
  description: 'Unjail a member and restore their roles.',
  permLevel: LEVELS.MOD,
  usage: '<member> [reason]',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}unjail <member>\``)] });
    const settings = db.getSettings(message.guild.id, 'settings', {});
    const stored = db.getSettings(message.guild.id, `jail:${member.id}`, { roles: [] });
    const toRestore = stored.roles.filter((r) => message.guild.roles.cache.has(r));
    await member.roles.set(toRestore, `Unjailed by ${message.author.tag}`).catch(() => {});
    if (settings.jailRole) await member.roles.remove(settings.jailRole, 'Unjailed').catch(() => {});
    db.clearSettings(message.guild.id, `jail:${member.id}`);
    return message.reply({ embeds: [success(message.author, `Unjailed **${member.user.tag}** and restored **${toRestore.length}** role(s).`)] });
  },
});

const strip = new Command({
  name: 'strip',
  category: 'moderation',
  description: 'Remove all roles with dangerous permissions from a member.',
  permLevel: LEVELS.ADMIN,
  usage: '<member> [reason]',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}strip <member>\``)] });
    const pf = mod.preflight(message, member);
    if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    const reason = args.slice(1).join(' ') || 'Stripped dangerous roles';
    const dangerous = member.roles.cache.filter(
      (r) =>
        r.editable &&
        r.permissions.any([
          PermissionFlagsBits.Administrator,
          PermissionFlagsBits.ManageGuild,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.BanMembers,
          PermissionFlagsBits.KickMembers,
          PermissionFlagsBits.ManageWebhooks,
          PermissionFlagsBits.ManageGuildExpressions,
          PermissionFlagsBits.ModerateMembers,
        ])
    );
    await member.roles.remove(dangerous, `${reason} — by ${message.author.tag}`).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Stripped **${dangerous.size}** dangerous role(s) from **${member.user.tag}**.`)] });
  },
});

const listMaker = (name, action, title) =>
  new Command({
    name,
    category: 'moderation',
    description: `View all currently ${title} members.`,
    permLevel: LEVELS.MOD,
    async run({ message }) {
      const settings = db.getSettings(message.guild.id, 'settings', {});
      await message.guild.members.fetch().catch(() => {});
      let members = [];
      if (action === 'timeout') {
        members = message.guild.members.cache.filter((m) => m.communicationDisabledUntilTimestamp > Date.now()).map((m) => `<@${m.id}> — until <t:${Math.floor(m.communicationDisabledUntilTimestamp / 1000)}:R>`);
      } else if (action === 'mute' && settings.muteRole) {
        members = message.guild.members.cache.filter((m) => m.roles.cache.has(settings.muteRole)).map((m) => `<@${m.id}>`);
      } else if (action === 'jail' && settings.jailRole) {
        members = message.guild.members.cache.filter((m) => m.roles.cache.has(settings.jailRole)).map((m) => `<@${m.id}>`);
      }
      if (!members.length) return message.reply({ embeds: [base().setDescription(`No ${title} members.`)] });
      const pages = chunk(members, 15).map((c) => base().setTitle(`${title[0].toUpperCase()}${title.slice(1)} members (${members.length})`).setDescription(c.join('\n')));
      return paginate(message, pages, { userId: message.author.id });
    },
  });

const timeoutlist = listMaker('timeoutlist', 'timeout', 'timed-out');
const mutelist = listMaker('mutelist', 'mute', 'muted');
const jaillist = listMaker('jaillist', 'jail', 'jailed');

module.exports = [jail, unjail, strip, timeoutlist, mutelist, jaillist];
