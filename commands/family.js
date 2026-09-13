const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'family',
	description: 'view a family tree with marriage and adoptions',
	aliases: [],
	usage: ';family [@user]',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const target = message.mentions.users.first() || message.author;

		const partnerId = await db.get(`married_${target.id}`);
		const parentId = await db.get(`parentof_${target.id}`);
		const children = await db.get(`childrenof_${target.id}`) || [];

		const lines = [];
		lines.push(`**Partner:** ${partnerId ? `<@${partnerId}>` : 'None'}`);
		lines.push(`**Parent:** ${parentId ? `<@${parentId}>` : 'None'}`);
		lines.push(`**Children:** ${children.length ? children.map(id => `<@${id}>`).join(', ') : 'None'}`);

		message.reply({ embeds: [new EmbedBuilder().setTitle(`${target.username}'s Family Tree`).setDescription(lines.join('\n')).setColor(color)] });
	},
};
