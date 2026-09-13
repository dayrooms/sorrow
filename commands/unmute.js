const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { hasModPermission } = require("../utils/permissionCheck");
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'unmute',
	description: 'remove the Muted role from a member',
	aliases: [],
	usage: ';unmute @user',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!(await hasModPermission(message.member, message.guild, db, PermissionFlagsBits.ModerateMembers))) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}

		let roleId = await db.get(`muterole_${message.guild.id}`);
		let role = roleId && message.guild.roles.cache.get(roleId);
		if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No mute role set up`).setColor(error)] });

		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
		if (!member.roles.cache.has(role.id)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user isn't muted`).setColor(error)] });

		await member.roles.remove(role).catch(() => {});
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Unmuted ${member}`).setColor(color)] });
	},
};
