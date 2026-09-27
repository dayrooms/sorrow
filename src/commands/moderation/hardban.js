const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveUser, extractFlags } = require('../../utils/resolve');
const db = require('../../database/db');
const { paginate, chunk } = require('../../utils/paginate');

/** Hardban list is stored in settings 'hardban' as { ids: [] }. Rejoin re-ban
 *  is enforced by the guildMemberAdd listener in events/hardbanGuard.js */

const hardban = new Command({
  name: 'hardban',
  category: 'moderation',
  description: 'Permanently ban a user and auto re-ban them if they rejoin.',
  permLevel: LEVELS.ANTINUKE_ADMIN, // requires antinuke admin per docs
  usage: '<user> [reason]',
  botPerms: [PermissionFlagsBits.BanMembers],
  async run({ client, message, args, prefix }) {
    const { args: rest, flags } = extractFlags(args);
    const user = (await resolveUser(client, rest[0])) || message.mentions.users.first() || (/^\d{17,20}$/.test(rest[0] || '') ? { id: rest[0], tag: rest[0] } : null);
    if (!user) return message.reply({ embeds: [error(`Usage: \`${prefix}hardban <user> [reason]\``)] });
    const reason = rest.slice(1).join(' ') || 'Hardbanned';
    const hb = db.getSettings(message.guild.id, 'hardban', { ids: [] });
    if (!hb.ids.includes(user.id)) hb.ids.push(user.id);
    db.saveSettings(message.guild.id, 'hardban', hb);
    await message.guild.bans.create(user.id, { reason: `HARDBAN: ${reason} — by ${message.author.tag}` }).catch(() => {});
    db.addCase(message.guild.id, user.id, message.author.id, 'hardban', reason);
    return message.reply({ embeds: [success(message.author, `Hardbanned **${user.tag || user.id}** — they will be auto-banned if they rejoin.`)] });
  },
});

const unhardban = new Command({
  name: 'unhardban',
  category: 'moderation',
  description: 'Remove a hardban and unban the user.',
  permLevel: LEVELS.MOD,
  usage: '<user> [reason]',
  botPerms: [PermissionFlagsBits.BanMembers],
  async run({ client, message, args, prefix }) {
    const user = (await resolveUser(client, args[0])) || message.mentions.users.first() || (/^\d{17,20}$/.test(args[0] || '') ? { id: args[0], tag: args[0] } : null);
    if (!user) return message.reply({ embeds: [error(`Usage: \`${prefix}unhardban <user>\``)] });
    const hb = db.getSettings(message.guild.id, 'hardban', { ids: [] });
    hb.ids = hb.ids.filter((id) => id !== user.id);
    db.saveSettings(message.guild.id, 'hardban', hb);
    await message.guild.bans.remove(user.id, `Unhardban by ${message.author.tag}`).catch(() => {});
    return message.reply({ embeds: [success(message.author, `Removed hardban for **${user.tag || user.id}**.`)] });
  },
});

const hardbanlist = new Command({
  name: 'hardbanlist',
  category: 'moderation',
  description: 'View all hardbanned users.',
  permLevel: LEVELS.MOD,
  async run({ message }) {
    const hb = db.getSettings(message.guild.id, 'hardban', { ids: [] });
    if (!hb.ids.length) return message.reply({ embeds: [base().setDescription('No hardbanned users.')] });
    const pages = chunk(hb.ids, 15).map((c) => base().setTitle(`Hardbanned (${hb.ids.length})`).setDescription(c.map((id) => `<@${id}> (\`${id}\`)`).join('\n')));
    return paginate(message, pages, { userId: message.author.id });
  },
});

const hardbanclear = new Command({
  name: 'hardbanclear',
  category: 'moderation',
  description: 'Clear all hardban entries.',
  permLevel: LEVELS.ADMIN,
  async run({ message }) {
    db.saveSettings(message.guild.id, 'hardban', { ids: [] });
    return message.reply({ embeds: [success(message.author, 'Cleared all hardban entries.')] });
  },
});

module.exports = [hardban, unhardban, hardbanlist, hardbanclear];
