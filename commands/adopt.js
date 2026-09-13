const { EmbedBuilder } = require('discord.js');
const { color, error, checked } = require("../config.json");

module.exports = {
	name: 'adopt',
	description: 'adopt another user into your family (max 5 children)',
	aliases: [],
	usage: ';adopt @user',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const target = message.mentions.users.first();
		if (!target) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Mention a user to adopt`).setColor(error)] });
		if (target.id === message.author.id) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You can't adopt yourself`).setColor(error)] });

		const existingParent = await db.get(`parentof_${target.id}`);
		if (existingParent) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ That user already has a parent`).setColor(error)] });

		let children = await db.get(`childrenof_${message.author.id}`) || [];
		if (children.length >= 5) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You already have 5 children (max)`).setColor(error)] });

		children.push(target.id);
		await db.set(`childrenof_${message.author.id}`, children);
		await db.set(`parentof_${target.id}`, message.author.id);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} ${message.author} adopted ${target}!`).setColor(color)] });
	},
};
