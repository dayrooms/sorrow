const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'immune',
	description: 'make a user or role immune to moderation actions',
	aliases: [],
	usage: ';immune add @user\n;immune remove @user\n;immune list',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		const sub = args[0];
		if (sub === 'list') {
			let immune = await db.get(`immune_${message.guild.id}`) || [];
			if (!immune.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No immune users or roles`).setColor(color)] });
			const list = immune.map(id => message.guild.roles.cache.has(id) ? `<@&${id}>` : `<@${id}>`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('Immune List').setDescription(list).setColor(color)] });
		}

		const target = message.mentions.roles.first() || message.mentions.users.first() || message.guild.members.cache.get(args[1]);
		const targetId = target ? target.id : args[1];
		if (!targetId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a user or role`).setColor(error)] });

		let immune = await db.get(`immune_${message.guild.id}`) || [];
		if (sub === 'remove') {
			immune = immune.filter(id => id !== targetId);
			await db.set(`immune_${message.guild.id}`, immune);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed <@${targetId}> from the immune list`).setColor(color)] });
		}

		if (!immune.includes(targetId)) immune.push(targetId);
		await db.set(`immune_${message.guild.id}`, immune);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} <@${targetId}> is now immune to moderation actions`).setColor(color)] });
	},
};
