const { EmbedBuilder } = require('discord.js');
const { color, error, checked } = require("../config.json");

module.exports = {
	name: 'disown',
	description: 'remove an adopted child from your family',
	aliases: [],
	usage: ';disown @user',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const target = message.mentions.users.first();
		if (!target) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Mention a user to disown`).setColor(error)] });

		let children = await db.get(`childrenof_${message.author.id}`) || [];
		if (!children.includes(target.id)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ That user isn't your child`).setColor(error)] });

		children = children.filter(id => id !== target.id);
		await db.set(`childrenof_${message.author.id}`, children);
		await db.delete(`parentof_${target.id}`);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Disowned ${target}`).setColor(color)] });
	},
};
