const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'boosterslost',
	description: 'view members who stopped boosting the server',
	aliases: [],
	usage: ';boosterslost',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const lost = await db.get(`boosterslost_${message.guild.id}`) || [];
		if (!lost.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No lost boosters recorded`).setColor(color)] });

		const list = lost.slice(-15).reverse().map(l => `${l.tag} — <t:${Math.floor(l.timestamp / 1000)}:R>`).join('\n');
		message.reply({ embeds: [new EmbedBuilder().setTitle('Lost Boosters').setDescription(list).setColor(color)] });
	},
};
