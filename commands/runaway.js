const { EmbedBuilder } = require('discord.js');
const { color, error, checked } = require("../config.json");

module.exports = {
	name: 'runaway',
	description: 'run away from your adoptive parent',
	aliases: [],
	usage: ';runaway',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const parentId = await db.get(`parentof_${message.author.id}`);
		if (!parentId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You don't have a parent`).setColor(error)] });

		let children = await db.get(`childrenof_${parentId}`) || [];
		children = children.filter(id => id !== message.author.id);
		await db.set(`childrenof_${parentId}`, children);
		await db.delete(`parentof_${message.author.id}`);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} You ran away from <@${parentId}>`).setColor(color)] });
	},
};
