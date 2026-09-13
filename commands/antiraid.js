const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'antiraid',
	description: 'auto-locks the server when too many members join too quickly',
	aliases: [],
	usage: ';antiraid on\n;antiraid off\n;antiraid threshold <count>',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		if (args[0] === 'on') {
			await db.set(`antiraid_${message.guild.id}`, true);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Antiraid is now enabled`).setColor(color)] });
		}
		if (args[0] === 'off') {
			await db.delete(`antiraid_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Antiraid is now disabled`).setColor(color)] });
		}
		if (args[0] === 'threshold') {
			let num = parseInt(args[1]);
			if (isNaN(num) || num < 2) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a number of joins (minimum 2)`).setColor(error)] });
			await db.set(`antiraid_threshold_${message.guild.id}`, num);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Antiraid threshold set to ${num} joins per 10 seconds`).setColor(color)] });
		}

		let enabled = await db.get(`antiraid_${message.guild.id}`);
		let threshold = await db.get(`antiraid_threshold_${message.guild.id}`) || 5;
		return message.reply({ embeds: [new EmbedBuilder().setDescription(`🛡️ **Antiraid**\n> Status: ${enabled ? 'Enabled' : 'Disabled'}\n> Threshold: ${threshold} joins per 10 seconds`).setColor(color)] });
	},
};
