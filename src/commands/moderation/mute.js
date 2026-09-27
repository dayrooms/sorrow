const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, parseDuration, formatDuration } = require('../../utils/resolve');
const mod = require('../../utils/moderation');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000; // Discord max 28d

const timeout = new Command({
  name: 'timeout',
  aliases: ['to'],
  category: 'moderation',
  description: "Timeout a member using Discord's native timeout.",
  permLevel: LEVELS.MOD,
  usage: '<member> <duration> [reason]',
  botPerms: [PermissionFlagsBits.ModerateMembers],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    const duration = parseDuration(args[1]);
    if (!member || !duration) return message.reply({ embeds: [error(`Usage: \`${prefix}timeout <member> <duration> [reason]\``)] });
    if (duration > MAX_TIMEOUT) return message.reply({ embeds: [error('Max timeout is 28 days.')] });
    const pf = mod.preflight(message, member);
    if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    const reason = args.slice(2).join(' ') || 'No reason provided';
    await member.timeout(duration, `${reason} — by ${message.author.tag}`).catch((e) => message.reply({ embeds: [error(`Failed: ${e.message}`)] }));
    const caseNo = await mod.record(message.guild, { action: 'timeout', target: member, moderator: message.member, reason, duration, durationText: formatDuration(duration) });
    return message.reply({ embeds: [success(message.author, `Timed out **${member.user.tag}** for **${formatDuration(duration)}** — Case #${caseNo}.`)] });
  },
});

const untimeout = new Command({
  name: 'untimeout',
  aliases: ['unto', 'rto'],
  category: 'moderation',
  description: 'Remove a timeout.',
  permLevel: LEVELS.MOD,
  usage: '<member|all> [reason]',
  botPerms: [PermissionFlagsBits.ModerateMembers],
  async run({ message, args, prefix }) {
    if ((args[0] || '').toLowerCase() === 'all') {
      await message.guild.members.fetch().catch(() => {});
      const timedOut = message.guild.members.cache.filter((m) => m.communicationDisabledUntilTimestamp && m.communicationDisabledUntilTimestamp > Date.now());
      let n = 0;
      for (const m of timedOut.values()) {
        await m.timeout(null, `Mass untimeout by ${message.author.tag}`).catch(() => {});
        n++;
      }
      return message.reply({ embeds: [success(message.author, `Removed timeout from **${n}** member(s).`)] });
    }
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}untimeout <member|all>\``)] });
    await member.timeout(null, `Untimeout by ${message.author.tag}`).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Removed timeout from **${member.user.tag}**.`)] });
  },
});

const mute = new Command({
  name: 'mute',
  category: 'moderation',
  description: 'Mute a member with the mute role.',
  permLevel: LEVELS.MOD,
  usage: '<member> [duration] [reason]',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}mute <member> [duration] [reason]\``)] });
    const pf = mod.preflight(message, member);
    if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    const duration = parseDuration(args[1]);
    const reason = args.slice(duration ? 2 : 1).join(' ') || 'No reason provided';
    const role = await mod.ensureMuteRole(message.guild);
    if (!role) return message.reply({ embeds: [error('I could not create/find a mute role.')] });
    if (member.roles.cache.has(role.id)) return message.reply({ embeds: [error('That member is already muted.')] });
    await member.roles.add(role, `${reason} — by ${message.author.tag}`).catch(() => {});
    if (duration) db.addTimer(message.guild.id, 'unmute', member.id, {}, Date.now() + duration);
    const caseNo = await mod.record(message.guild, { action: 'mute', target: member, moderator: message.member, reason, duration: duration || null, durationText: duration ? formatDuration(duration) : null });
    return message.reply({ embeds: [success(message.author, `Muted **${member.user.tag}**${duration ? ` for **${formatDuration(duration)}**` : ''} — Case #${caseNo}.`)] });
  },
});

const unmute = new Command({
  name: 'unmute',
  category: 'moderation',
  description: 'Remove the mute role from a member.',
  permLevel: LEVELS.MOD,
  usage: '<member> [reason]',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}unmute <member>\``)] });
    const settings = db.getSettings(message.guild.id, 'settings', {});
    const roleId = settings.muteRole;
    if (!roleId || !member.roles.cache.has(roleId)) return message.reply({ embeds: [error('That member is not muted.')] });
    await member.roles.remove(roleId, `Unmute by ${message.author.tag}`).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Unmuted **${member.user.tag}**.`)] });
  },
});

const warn = new Command({
  name: 'warn',
  category: 'moderation',
  description: 'Warn a member.',
  permLevel: LEVELS.MOD,
  usage: '<member> [reason]',
  async run({ message, args, prefix }) {
    if ((args[0] || '').toLowerCase() === 'punish') {
      return message.reply({ embeds: [base().setDescription('Auto-punishment thresholds: configure with `warn punish <count> <action>` (coming in config phase).')] });
    }
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}warn <member> [reason]\``)] });
    const pf = mod.preflight(message, member);
    if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    const reason = args.slice(1).join(' ') || 'No reason provided';
    const caseNo = await mod.record(message.guild, { action: 'warn', target: member, moderator: message.member, reason });
    const count = db.getUserCases(message.guild.id, member.id).filter((c) => c.action === 'warn').length;

    // Auto-punish thresholds
    const punish = db.getSettings(message.guild.id, 'warnpunish', {}); // {count: action}
    const action = punish[String(count)];
    let extra = '';
    if (action) {
      if (action === 'kick') await member.kick(`Reached ${count} warns`).catch(() => {});
      else if (action === 'ban') await message.guild.bans.create(member.id, { reason: `Reached ${count} warns` }).catch(() => {});
      else if (action.startsWith('timeout:')) {
        const d = parseDuration(action.split(':')[1]);
        if (d) await member.timeout(d, `Reached ${count} warns`).catch(() => {});
      }
      extra = ` Auto-punish triggered: **${action}**.`;
    }
    return message.reply({ embeds: [success(message.author, `Warned **${member.user.tag}** (${count} total) — Case #${caseNo}.${extra}`)] });
  },
});

const warnings = new Command({
  name: 'warnings',
  aliases: ['warns'],
  category: 'moderation',
  description: 'View warnings for a member.',
  permLevel: LEVELS.MOD,
  usage: '<member>',
  async run({ message, args, prefix }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first() || message.member;
    const cases = db.getUserCases(message.guild.id, member.id).filter((c) => c.action === 'warn');
    if (!cases.length) return message.reply({ embeds: [base().setDescription(`**${member.user.tag}** has no warnings.`)] });
    const lines = cases.map((c) => `\`#${c.case_no}\` <t:${c.created_at}:R> — ${c.reason || 'No reason'} (by <@${c.mod_id}>)`);
    const pages = chunk(lines, 10).map((ch) => base().setTitle(`Warnings — ${member.user.tag}`).setDescription(ch.join('\n')));
    return paginate(message, pages, { userId: message.author.id });
  },
});

module.exports = [timeout, untimeout, mute, unmute, warn, warnings];
