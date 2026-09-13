const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'boosters',
	description: 'view all members currently boosting the server',
	aliases: [],
	usage: ';boosters',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		await message.guild.members.fetch();
		const boosters = message.guild.members.cache.filter(m => m.premiumSince).sort((a, b) => a.premiumSinceTimestamp - b.premiumSinceTimestamp);
		if (!boosters.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No one is boosting the server yet`).setColor(color)] });

		const list = boosters.map(m => `${m} — boosting since <t:${Math.floor(m.premiumSinceTimestamp / 1000)}:R>`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Boosters (${boosters.size})`).setDescription(list).setColor(color)] });
	},
};
