const { EmbedBuilder } = require('discord.js');
const { color } = require("../config.json");

module.exports = {
	name: 'recentleaves',
	description: 'view members who left in the last 24 hours',
	aliases: [],
	usage: ';recentleaves',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const leaves = await db.get(`recentleaves_${message.guild.id}`) || [];
		const cutoff = Date.now() - 86400000;
		const recent = leaves.filter(l => l.timestamp > cutoff);
		if (!recent.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No members left in the last 24 hours`).setColor(color)] });

		const list = recent.map(l => `${l.tag} — <t:${Math.floor(l.timestamp / 1000)}:R>`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Recent Leaves (${recent.length})`).setDescription(list).setColor(color)] });
	},
};
