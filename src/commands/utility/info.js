const { version: djsVersion } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base, error } = require('../../utils/embed');
const { resolveMember, resolveUser, resolveRole } = require('../../utils/resolve');
const { paginate, chunk } = require('../../utils/paginate');

const avatar = new Command({
  name: 'avatar', aliases: ['av', 'pfp'], category: 'utility', description: 'Get a user avatar.', permLevel: LEVELS.USER, usage: '[user]',
  async run({ client, message, args }) {
    const user = (await resolveMember(message.guild, args[0]))?.user || (await resolveUser(client, args[0])) || message.mentions.users.first() || message.author;
    return message.channel.send({ embeds: [base().setTitle(`${user.tag}'s avatar`).setImage(user.displayAvatarURL({ size: 1024 }))] });
  },
});

const banner = new Command({
  name: 'banner', category: 'utility', description: "Get a user's banner.", permLevel: LEVELS.USER, usage: '[user]',
  async run({ client, message, args }) {
    const user = (await resolveUser(client, args[0])) || message.mentions.users.first() || message.author;
    const full = await user.fetch().catch(() => user);
    const url = full.bannerURL?.({ size: 1024 });
    if (!url) return message.reply({ embeds: [error('That user has no banner.')] });
    return message.channel.send({ embeds: [base().setTitle(`${user.tag}'s banner`).setImage(url)] });
  },
});

const servericon = new Command({
  name: 'servericon', aliases: ['icon', 'guildicon'], category: 'utility', description: "Get the server icon.", permLevel: LEVELS.USER,
  async run({ message }) {
    const url = message.guild.iconURL({ size: 1024 });
    if (!url) return message.reply({ embeds: [error('This server has no icon.')] });
    return message.channel.send({ embeds: [base().setTitle(`${message.guild.name} icon`).setImage(url)] });
  },
});

const userinfo = new Command({
  name: 'userinfo', aliases: ['ui', 'whois'], category: 'utility', description: 'Info about a user.', permLevel: LEVELS.USER, usage: '[user]',
  async run({ client, message, args }) {
    const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first() || message.member;
    const u = member.user;
    const roles = member.roles.cache.filter((r) => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
    const e = base(member.displayHexColor === '#000000' ? undefined : member.displayColor)
      .setAuthor({ name: u.tag, iconURL: u.displayAvatarURL() })
      .setThumbnail(u.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: u.id, inline: true },
        { name: 'Nickname', value: member.nickname || 'none', inline: true },
        { name: 'Bot', value: u.bot ? 'yes' : 'no', inline: true },
        { name: 'Created', value: `<t:${Math.floor(u.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Joined', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'unknown', inline: true },
        { name: 'Boosting', value: member.premiumSince ? `since <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'no', inline: true },
        { name: `Roles (${roles.size})`, value: roles.size ? roles.map((r) => `<@&${r.id}>`).slice(0, 20).join(' ') : 'none' }
      );
    return message.channel.send({ embeds: [e] });
  },
});

const serverinfo = new Command({
  name: 'serverinfo', aliases: ['si', 'guildinfo'], category: 'utility', description: 'Info about the server.', permLevel: LEVELS.USER,
  async run({ message }) {
    const g = message.guild;
    const owner = await g.fetchOwner().catch(() => null);
    const bots = g.members.cache.filter((m) => m.user.bot).size;
    const e = base()
      .setTitle(g.name)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: g.id, inline: true },
        { name: 'Owner', value: owner ? owner.user.tag : 'unknown', inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Members', value: `${g.memberCount} (${bots} bots)`, inline: true },
        { name: 'Roles', value: String(g.roles.cache.size), inline: true },
        { name: 'Channels', value: String(g.channels.cache.size), inline: true },
        { name: 'Boosts', value: `${g.premiumSubscriptionCount || 0} (tier ${g.premiumTier})`, inline: true },
        { name: 'Emojis', value: String(g.emojis.cache.size), inline: true },
        { name: 'Vanity', value: g.vanityURLCode || 'none', inline: true }
      );
    return message.channel.send({ embeds: [e] });
  },
});

const roleinfo = new Command({
  name: 'roleinfo', aliases: ['ri'], category: 'utility', description: 'Info about a role.', permLevel: LEVELS.USER, usage: '<role>',
  async run({ message, args }) {
    const role = resolveRole(message.guild, args.join(' ')) || message.mentions.roles?.first();
    if (!role) return message.reply({ embeds: [error('Role not found.')] });
    const e = base(role.color || undefined).setTitle(role.name).addFields(
      { name: 'ID', value: role.id, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'Members', value: String(role.members.size), inline: true },
      { name: 'Hoisted', value: role.hoist ? 'yes' : 'no', inline: true },
      { name: 'Mentionable', value: role.mentionable ? 'yes' : 'no', inline: true },
      { name: 'Position', value: String(role.position), inline: true },
      { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
    );
    return message.channel.send({ embeds: [e] });
  },
});

const membercount = new Command({
  name: 'membercount', aliases: ['mc'], category: 'utility', description: 'Server member count.', permLevel: LEVELS.USER,
  async run({ message }) {
    const bots = message.guild.members.cache.filter((m) => m.user.bot).size;
    return message.channel.send({ embeds: [base().setDescription(`👥 **${message.guild.memberCount}** members (${message.guild.memberCount - bots} humans, ${bots} bots)`)] });
  },
});

const uptime = new Command({
  name: 'uptime', category: 'utility', description: "Bot uptime.", permLevel: LEVELS.USER,
  async run({ client, message }) {
    const s = Math.floor(client.uptime / 1000);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return message.channel.send({ embeds: [base().setDescription(`⏱️ Uptime: **${d}d ${h}h ${m}m**`)] });
  },
});

const botinfo = new Command({
  name: 'botinfo', aliases: ['bi', 'about', 'stats'], category: 'utility', description: 'About Sorrow.', permLevel: LEVELS.USER,
  async run({ client, message }) {
    const e = base().setTitle('Sorrow').setThumbnail(client.user.displayAvatarURL()).addFields(
      { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
      { name: 'Users', value: String(client.users.cache.size), inline: true },
      { name: 'Commands', value: String(client.commands.size), inline: true },
      { name: 'discord.js', value: `v${djsVersion}`, inline: true },
      { name: 'Node', value: process.version, inline: true },
      { name: 'Ping', value: `${Math.round(client.ws.ping)}ms`, inline: true }
    );
    return message.channel.send({ embeds: [e] });
  },
});

const invite = new Command({
  name: 'invite', aliases: ['inv'], category: 'utility', description: 'Invite Sorrow to your server.', permLevel: LEVELS.USER,
  async run({ client, message }) {
    const url = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    return message.channel.send({ embeds: [base().setDescription(`[Invite Sorrow](${url}) (Administrator recommended for antinuke).`)] });
  },
});

const roles = new Command({
  name: 'roles', category: 'utility', description: 'List server roles.', permLevel: LEVELS.USER,
  async run({ message }) {
    const list = message.guild.roles.cache.filter((r) => r.id !== message.guild.id).sort((a, b) => b.position - a.position).map((r) => `<@&${r.id}> — ${r.members.size}`);
    if (!list.length) return message.reply({ embeds: [base().setDescription('No roles.')] });
    return paginate(message, chunk(list, 15).map((c) => base().setTitle(`Roles (${list.length})`).setDescription(c.join('\n'))), { userId: message.author.id });
  },
});

module.exports = [avatar, banner, servericon, userinfo, serverinfo, roleinfo, membercount, uptime, botinfo, invite, roles];
