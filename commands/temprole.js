const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'temprole',
	description: 'temporarily give a role to a member',
	aliases: [],
	usage: ';temprole @user 1d @role',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Roles\` permission`).setColor(error)] });
		}
		const member = message.mentions.members.first();
		const role = message.mentions.roles.first();
		const duration = ms(args[1]);
		if (!member || !role || !duration) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;temprole @user 1d @role\``).setColor(error)] });
		}

		await member.roles.add(role).catch(() => {});
		const expiresAt = Date.now() + duration;
		let temproles = await db.get(`temproles`) || [];
		temproles.push({ guildId: message.guild.id, userId: member.id, roleId: role.id, expiresAt });
		await db.set(`temproles`, temproles);

		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Gave ${role} to ${member} for ${args[1]}\nExpires: <t:${Math.floor(expiresAt / 1000)}:R>`).setColor(color)] });
	},
};
