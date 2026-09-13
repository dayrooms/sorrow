const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'youngest',
	description: 'view the youngest Discord account in the server',
	aliases: [],
	usage: ';youngest',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		await message.guild.members.fetch();
		const sorted = Array.from(message.guild.members.cache.values())
			.filter(m => !m.user.bot)
			.sort((a, b) => b.user.createdTimestamp - a.user.createdTimestamp)
			.slice(0, 10);

		const list = sorted.map((m, i) => `**${i + 1}.** ${m} — created <t:${Math.floor(m.user.createdTimestamp / 1000)}:R>`).join('\n');
		message.reply({ embeds: [new EmbedBuilder().setTitle('Youngest Accounts in Server').setDescription(list).setColor(color)] });
	},
};
