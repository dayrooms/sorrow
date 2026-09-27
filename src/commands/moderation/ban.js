const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveMember, resolveUser, parseDuration, formatDuration, extractFlags } = require('../../utils/resolve');
const mod = require('../../utils/moderation');
const db = require('../../database/db');

const ban = new Command({
  name: 'ban',
  category: 'moderation',
  description: 'Ban a user from the server.',
  permLevel: LEVELS.MOD,
  usage: '<user> [reason] [$silent] [$days=N]',
  botPerms: [PermissionFlagsBits.BanMembers],
  async run({ client, message, args, prefix }) {
    const { args: rest, flags } = extractFlags(args);
    const sub = (rest[0] || '').toLowerCase();

    if (sub === 'recent') {
      const bans = await message.guild.bans.fetch().catch(() => null);
      if (!bans) return message.reply({ embeds: [error('I could not fetch the ban list.')] });
      const recent = [...bans.values()].slice(-10).reverse();
      const e = base().setTitle('Recent bans').setDescription(recent.length ? recent.map((b, i) => `\`${i + 1}\` ${b.user.tag} (\`${b.user.id}\`)`).join('\n') : 'No bans found.');
      return message.channel.send({ embeds: [e] });
    }

    const query = rest[0];
    if (!query) return message.reply({ embeds: [error(`Usage: \`${prefix}ban <user> [reason]\``)] });

    const member = await resolveMember(message.guild, query);
    const user = member?.user || (await resolveUser(client, query)) || message.mentions.users.first();
    if (!user) return message.reply({ embeds: [error('User not found.')] });

    if (member) {
      const pf = mod.preflight(message, member);
      if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    }

    let days = 0;
    for (const f of flags) {
      const m = f.match(/^days?=?(\d+)$/);
      if (m) days = Math.min(7, parseInt(m[1], 10));
    }
    const reason = rest.slice(1).join(' ') || 'No reason provided';
    const silent = flags.has('silent') || flags.has('s');

    const caseNo = member
      ? await mod.record(message.guild, { action: 'ban', target: member, moderator: message.member, reason, dm: !silent })
      : db.addCase(message.guild.id, user.id, message.author.id, 'ban', reason);

    await message.guild.bans.create(user.id, { reason: `${reason} — by ${message.author.tag}`, deleteMessageSeconds: days * 86400 }).catch((e2) => {
      return message.reply({ embeds: [error(`Failed to ban: ${e2.message}`)] });
    });

    return message.reply({ embeds: [success(message.author, `Banned **${user.tag}** — Case #${caseNo}. ${reason ? `(${reason})` : ''}`)] });
  },
});

const tempban = new Command({
  name: 'tempban',
  category: 'moderation',
  description: 'Temporarily ban a user.',
  permLevel: LEVELS.MOD,
  usage: '<user> <duration> [reason]',
  botPerms: [PermissionFlagsBits.BanMembers],
  async run({ client, message, args, prefix }) {
    const { args: rest, flags } = extractFlags(args);
    const query = rest[0];
    const duration = parseDuration(rest[1]);
    if (!query || !duration) return message.reply({ embeds: [error(`Usage: \`${prefix}tempban <user> <duration> [reason]\``)] });
    const member = await resolveMember(message.guild, query);
    const user = member?.user || (await resolveUser(client, query)) || message.mentions.users.first();
    if (!user) return message.reply({ embeds: [error('User not found.')] });
    if (member) {
      const pf = mod.preflight(message, member);
      if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    }
    const reason = rest.slice(2).join(' ') || 'No reason provided';
    const durText = formatDuration(duration);
    const caseNo = member
      ? await mod.record(message.guild, { action: 'tempban', target: member, moderator: message.member, reason, duration, durationText: durText })
      : db.addCase(message.guild.id, user.id, message.author.id, 'tempban', reason, duration);
    await message.guild.bans.create(user.id, { reason: `${reason} (temp ${durText}) — by ${message.author.tag}` }).catch(() => {});
    db.addTimer(message.guild.id, 'unban', user.id, {}, Date.now() + duration);
    return message.reply({ embeds: [success(message.author, `Temp-banned **${user.tag}** for **${durText}** — Case #${caseNo}.`)] });
  },
});

const unban = new Command({
  name: 'unban',
  category: 'moderation',
  description: 'Unban a user.',
  permLevel: LEVELS.MOD,
  usage: '<user id> [reason]',
  botPerms: [PermissionFlagsBits.BanMembers],
  async run({ client, message, args, prefix }) {
    const query = args[0];
    if (!query) return message.reply({ embeds: [error(`Usage: \`${prefix}unban <user id> [reason]\``)] });
    const user = (await resolveUser(client, query)) || (/^\d{17,20}$/.test(query) ? { id: query, tag: query } : null);
    if (!user) return message.reply({ embeds: [error('Provide a valid user ID.')] });
    const reason = args.slice(1).join(' ') || 'No reason provided';
    try {
      await message.guild.bans.remove(user.id, `${reason} — by ${message.author.tag}`);
    } catch {
      return message.reply({ embeds: [error('That user is not banned (or the ID is wrong).')] });
    }
    db.addCase(message.guild.id, user.id, message.author.id, 'unban', reason);
    return message.reply({ embeds: [success(message.author, `Unbanned **${user.tag || user.id}**.`)] });
  },
});

const kick = new Command({
  name: 'kick',
  category: 'moderation',
  description: 'Kick a member from the server.',
  permLevel: LEVELS.MOD,
  usage: '<member> [reason] [$silent]',
  botPerms: [PermissionFlagsBits.KickMembers],
  async run({ client, message, args, prefix }) {
    const { args: rest, flags } = extractFlags(args);
    const query = rest[0];
    if (!query) return message.reply({ embeds: [error(`Usage: \`${prefix}kick <member> [reason]\``)] });
    const member = (await resolveMember(message.guild, query)) || message.mentions.members?.first();
    if (!member) return message.reply({ embeds: [error('Member not found.')] });
    const pf = mod.preflight(message, member);
    if (!pf.ok) return message.reply({ embeds: [error(pf.reason)] });
    const reason = rest.slice(1).join(' ') || 'No reason provided';
    const silent = flags.has('silent') || flags.has('s');
    const caseNo = await mod.record(message.guild, { action: 'kick', target: member, moderator: message.member, reason, dm: !silent });
    await member.kick(`${reason} — by ${message.author.tag}`).catch((e) => message.reply({ embeds: [error(`Failed: ${e.message}`)] }));
    return message.reply({ embeds: [success(message.author, `Kicked **${member.user.tag}** — Case #${caseNo}.`)] });
  },
});

module.exports = [ban, tempban, unban, kick];
