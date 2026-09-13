const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

const DANGEROUS_PERMS = [
	PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuild, PermissionFlagsBits.ManageRoles,
	PermissionFlagsBits.ManageChannels, PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers,
	PermissionFlagsBits.ManageWebhooks, PermissionFlagsBits.ManageGuildExpressions,
];

module.exports = {
	name: 'strip',
	description: 'remove all roles with dangerous permissions from a member',
	aliases: [],
	usage: ';strip @user [reason]',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}
		const member = message.mentions.members.first();
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid member`).setColor(error)] });
		const reason = args.slice(1).join(' ') || 'No reason provided';

		const dangerousRoles = member.roles.cache.filter(r =>
			r.id !== message.guild.id && r.editable && DANGEROUS_PERMS.some(p => r.permissions.has(p))
		);

		if (!dangerousRoles.size) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${member} doesn't have any roles with dangerous permissions`).setColor(color)] });
		}

		for (const role of dangerousRoles.values()) {
			await member.roles.remove(role, reason).catch(() => {});
		}
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Stripped ${dangerousRoles.size} dangerous role(s) from ${member}\n**Reason:** ${reason}`).setColor(color)] });
	},
};
