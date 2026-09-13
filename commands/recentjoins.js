const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'recentjoins',
	description: 'view members who joined in the last 24 hours',
	aliases: [],
	usage: ';recentjoins',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		await message.guild.members.fetch();
		const cutoff = Date.now() - 86400000;
		const recent = message.guild.members.cache.filter(m => m.joinedTimestamp > cutoff).sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);
		if (!recent.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No members joined in the last 24 hours`).setColor(color)] });

		const list = recent.map(m => `${m} — <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Recent Joins (${recent.size})`).setDescription(list).setColor(color)] });
	},
};
