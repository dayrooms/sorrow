const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'ignore',
	description: 'stop members, roles, or channels from using commands',
	aliases: [],
	usage: ';ignore add @user/@role/#channel\n;ignore remove @user/@role/#channel\n;ignore list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		if (args[0] === 'list') {
			let ignored = await db.get(`ignored_${message.guild.id}`) || [];
			if (!ignored.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`Nothing is ignored`).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(ignored.map(id => `<@${id}> / <@&${id}> / <#${id}>`).join('\n').slice(0, 4000)).setColor(color)] });
		}

		const target = message.mentions.channels.first() || message.mentions.roles.first() || message.mentions.users.first();
		const targetId = target ? target.id : args[1];
		if (!targetId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a user, role, or channel`).setColor(error)] });

		let ignored = await db.get(`ignored_${message.guild.id}`) || [];
		if (args[0] === 'remove') {
			ignored = ignored.filter(id => id !== targetId);
			await db.set(`ignored_${message.guild.id}`, ignored);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} No longer ignored`).setColor(color)] });
		}

		if (!ignored.includes(targetId)) ignored.push(targetId);
		await db.set(`ignored_${message.guild.id}`, ignored);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Commands will now be ignored there/for them`).setColor(color)] });
	},
};
