const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'oldest',
	description: 'view the oldest Discord account in the server',
	aliases: [],
	usage: ';oldest',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		await message.guild.members.fetch();
		const sorted = Array.from(message.guild.members.cache.values())
			.filter(m => !m.user.bot)
			.sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp)
			.slice(0, 10);

		const list = sorted.map((m, i) => `**${i + 1}.** ${m} — created <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>`).join('\n');
		message.reply({ embeds: [new EmbedBuilder().setTitle('Oldest Accounts in Server').setDescription(list).setColor(color)] });
	},
};
