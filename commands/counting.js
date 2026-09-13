const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'counting',
	description: 'set up a dedicated counting channel',
	aliases: [],
	usage: ';counting setup #channel\n;counting reset\n;counting stats [@user]',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		if (args[0] === 'stats') {
			const target = message.mentions.users.first() || message.author;
			const count = await db.get(`countingstats_${message.guild.id}_${target.id}`) || 0;
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${target} has counted **${count}** time(s)`).setColor(color)] });
		}

		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		if (args[0] === 'reset') {
			await db.set(`countingcurrent_${message.guild.id}`, 0);
			await db.delete(`countinglastuser_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Count reset to 0`).setColor(color)] });
		}

		const channel = message.mentions.channels.first() || message.channel;
		await db.set(`countingchannel_${message.guild.id}`, channel.id);
		await db.set(`countingcurrent_${message.guild.id}`, 0);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Counting channel set to ${channel}. Start at 1!`).setColor(color)] });
	},
};
