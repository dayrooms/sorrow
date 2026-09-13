const { EmbedBuilder } = require('discord.js');
const { color, error } = require("../config.json");

const responses = [
	"Yes, definitely.", "It is certain.", "Without a doubt.", "You may rely on it.",
	"Most likely.", "Outlook good.", "Signs point to yes.",
	"Reply hazy, try again.", "Ask again later.", "Better not tell you now.", "Cannot predict now.",
	"Don't count on it.", "My reply is no.", "Outlook not so good.", "Very doubtful."
];

module.exports = {
	name: 'eightball',
	description: 'ask the magic 8ball a question',
	aliases: ["8ball"],
	usage: ';eightball <question>',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!args.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Ask a question first`).setColor(error)] });
		const answer = responses[Math.floor(Math.random() * responses.length)];
		message.reply({ embeds: [new EmbedBuilder().setDescription(`🎱 **Question:** ${args.join(' ')}\n**Answer:** ${answer}`).setColor(color)] });
	},
};
