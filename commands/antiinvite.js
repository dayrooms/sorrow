const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'antiinvite',
	description: 'deletes Discord invite links sent by non-trusted users',
	aliases: [],
	usage: ';antiinvite on\n;antiinvite off',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		if (args[0] === 'off') {
			await db.delete(`antiinvite_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Antiinvite disabled`).setColor(color)] });
		}
		await db.set(`antiinvite_${message.guild.id}`, true);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Antiinvite enabled — Discord invite links will be deleted`).setColor(color)] });
	},
};
