const { EmbedBuilder } = require('discord.js');
const { color, error, checked } = require("../config.json");

module.exports = {
	name: 'divorce',
	description: 'divorce your current partner',
	aliases: [],
	usage: ';divorce',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const partnerId = await db.get(`married_${message.author.id}`);
		if (!partnerId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You're not married`).setColor(error)] });

		await db.delete(`married_${message.author.id}`);
		await db.delete(`married_${partnerId}`);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} You are now divorced from <@${partnerId}> 💔`).setColor(color)] });
	},
};
