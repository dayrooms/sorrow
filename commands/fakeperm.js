const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

const suspiciousNames = /admin|owner|founder|staff|moderator|management|official/i;

module.exports = {
	name: 'fakeperm',
	description: 'scans for roles with deceptive names that lack real matching permissions',
	aliases: ["fp", "fakepermissions"],
	usage: ';fakeperm',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		const suspects = message.guild.roles.cache.filter(role =>
			suspiciousNames.test(role.name) &&
			!role.permissions.has(PermissionFlagsBits.Administrator) &&
			!role.permissions.has(PermissionFlagsBits.ManageGuild) &&
			role.id !== message.guild.id
		);

		if (!suspects.size) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`✅ No suspicious roles found`).setColor(color)] });
		}

		const list = suspects.map(r => `${r} — \`${r.members.size}\` member(s) have this role`).join('\n');
		message.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Roles that look official but lack real permissions').setDescription(list).setColor(error)] });
	},
};
