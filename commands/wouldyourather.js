const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

const questions = [
	["have the ability to fly", "have the ability to turn invisible"],
	["be able to speak every language", "be able to talk to animals"],
	["live without music", "live without movies"],
	["always be 10 minutes late", "always be 20 minutes early"],
	["have unlimited money", "have unlimited time"],
	["be famous", "be rich but unknown"],
	["never use social media again", "never watch another movie or show"],
	["be able to read minds", "be able to see the future"],
	["lose all your memories", "never make a new one again"],
	["have a rewind button on life", "have a pause button on life"],
];

module.exports = {
	name: 'wouldyourather',
	description: 'play a would-you-rather game',
	aliases: ["wyr"],
	usage: ';wouldyourather',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const [a, b] = questions[Math.floor(Math.random() * questions.length)];
		message.reply({ embeds: [new EmbedBuilder().setDescription(`🤔 Would you rather...\n\n**A)** ${a}\n**B)** ${b}`).setColor(color)] });
	},
};
