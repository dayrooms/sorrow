const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'joingate',
	description: 'automatically kicks accounts younger than a set age when they join',
	aliases: ["joingating", "jg"],
	usage: ';joingate <days>\n;joingate off',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		if (args[0] === 'off') {
			await db.delete(`joingate_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Joingate disabled`).setColor(color)] });
		}

		let days = parseInt(args[0]);
		if (isNaN(days) || days < 1) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a number of days (minimum 1)`).setColor(error)] });

		await db.set(`joingate_${message.guild.id}`, days);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Accounts younger than **${days} day${days === 1 ? '' : 's'}** will be automatically kicked on join`).setColor(color)] });
	},
};
