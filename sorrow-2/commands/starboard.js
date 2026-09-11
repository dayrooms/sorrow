const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'starboard',
	description: 'set up a starboard channel that highlights popular messages',
	aliases: ["sb"],
	usage: ';starboard channel #channel\n;starboard threshold 5\n;starboard off',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async (message, args, client) => {
		const db = client.db;

		let missperms = new EmbedBuilder()
			.setDescription(`${xmark} You're missing \`Manage Guild\` permission`)
			.setColor(error);
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [missperms] });

		if (!args[0]) {
			let channelId = await db.get(`starboard_channel_${message.guild.id}`);
			let threshold = await db.get(`starboard_threshold_${message.guild.id}`) || 3;
			let embed = new EmbedBuilder()
				.setDescription(`⭐ **Starboard**\n> Channel: ${channelId ? `<#${channelId}>` : 'Not set'}\n> Threshold: ${threshold} stars\n\nUsage:\n\`;starboard channel #channel\`\n\`;starboard threshold <number>\`\n\`;starboard off\``)
				.setColor(color);
			return message.reply({ embeds: [embed] });
		}

		if (args[0] === 'channel') {
			let channel = message.mentions.channels.first();
			if (!channel) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid channel`).setColor(error)] });
			await db.set(`starboard_channel_${message.guild.id}`, channel.id);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Starboard channel set to ${channel}`).setColor(color)] });
		}

		if (args[0] === 'threshold') {
			let num = parseInt(args[1]);
			if (isNaN(num) || num < 1) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid number`).setColor(error)] });
			await db.set(`starboard_threshold_${message.guild.id}`, num);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Starboard threshold set to ${num} stars`).setColor(color)] });
		}

		if (args[0] === 'off') {
			await db.delete(`starboard_channel_${message.guild.id}`);
			await db.delete(`starboard_threshold_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Starboard disabled`).setColor(color)] });
		}
	},
};
