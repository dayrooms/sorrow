const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'variables',
	description: 'view placeholders you can use in welcome/goodbye/boost messages',
	aliases: ["placeholders", "vars"],
	usage: ';variables',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const list = [
			'`{user}` — mentions the user',
			'`{user.name}` — the user\'s username',
			'`{user.tag}` — the user\'s full tag',
			'`{user.id}` — the user\'s ID',
			'`{guild.name}` — the server name',
			'`{guild.id}` — the server ID',
			'`{boostcount}` — total server boosts',
			'`{levelcount}` — server boost level',
			'`{membercount}` — total member count',
		].join('\n');
		message.reply({ embeds: [new EmbedBuilder().setTitle('Available Variables').setDescription(list).setColor(color)] });
	},
};
