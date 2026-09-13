const { EmbedBuilder } = require('discord.js');
const { color, error } = require("../config.json");

module.exports = {
	name: 'ship',
	description: 'check the love compatibility between you and another user',
	aliases: [],
	usage: ';ship @user',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const target = message.mentions.users.first();
		if (!target) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Mention a user to ship with`).setColor(error)] });

		// Deterministic "random" based on the pair of IDs, so it's the same result each time
		const combined = [message.author.id, target.id].sort().join('');
		let hash = 0;
		for (let i = 0; i < combined.length; i++) hash = (hash * 31 + combined.charCodeAt(i)) % 1000;
		const percent = hash % 101;

		const bar = '█'.repeat(Math.round(percent / 10)) + '░'.repeat(10 - Math.round(percent / 10));
		message.reply({ embeds: [new EmbedBuilder().setDescription(`💘 ${message.author} × ${target}\n${bar} **${percent}%**`).setColor(color)] });
	},
};
