const { EmbedBuilder } = require('discord.js');
const { color, xmark, error } = require("../config.json");

module.exports = {
	name: 'permissions',
	description: 'check permissions for yourself, a member, or a role',
	aliases: ["perms"],
	usage: ';permissions [@user/@role]',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const role = message.mentions.roles.first();
		const member = message.mentions.members.first() || (!role ? (message.guild.members.cache.get(args[0]) || message.member) : null);

		const target = role || member;
		if (!target) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user or role`).setColor(error)] });

		const perms = target.permissions.toArray();
		if (!perms.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${target} has no notable permissions`).setColor(color)] });

		const list = perms.map(p => `\`${p}\``).join(', ');
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Permissions for ${role ? target.name : target.user.tag}`).setDescription(list.slice(0, 4000)).setColor(color)] });
	},
};
