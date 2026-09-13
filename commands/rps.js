const { EmbedBuilder } = require('discord.js');
const { color, error } = require("../config.json");

module.exports = {
	name: 'rps',
	description: 'play rock-paper-scissors against the bot',
	aliases: [],
	usage: ';rps <rock|paper|scissors>',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const choices = ['rock', 'paper', 'scissors'];
		const userChoice = args[0] ? args[0].toLowerCase() : null;
		if (!choices.includes(userChoice)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Choose one: \`rock\`, \`paper\`, or \`scissors\``).setColor(error)] });
		}

		const botChoice = choices[Math.floor(Math.random() * 3)];
		let result;
		if (userChoice === botChoice) result = "It's a tie!";
		else if (
			(userChoice === 'rock' && botChoice === 'scissors') ||
			(userChoice === 'paper' && botChoice === 'rock') ||
			(userChoice === 'scissors' && botChoice === 'paper')
		) result = "You win! 🎉";
		else result = "I win! 🤖";

		message.reply({ embeds: [new EmbedBuilder().setDescription(`You chose **${userChoice}**, I chose **${botChoice}**\n${result}`).setColor(color)] });
	},
};
