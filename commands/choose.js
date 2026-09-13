const { EmbedBuilder } = require('discord.js');
const { color, error } = require("../config.json");

module.exports = {
	name: 'choose',
	description: 'give me options separated by commas and I will pick one',
	aliases: [],
	usage: ';choose pizza, tacos, sushi',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const options = args.join(' ').split(',').map(o => o.trim()).filter(Boolean);
		if (options.length < 2) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Give me at least 2 options separated by commas`).setColor(error)] });
		}
		const picked = options[Math.floor(Math.random() * options.length)];
		message.reply({ embeds: [new EmbedBuilder().setDescription(`🎲 I choose: **${picked}**`).setColor(color)] });
	},
};
