const { EmbedBuilder } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'highlight',
	description: 'get DM\'d when someone says a keyword you\'re watching for',
	aliases: [],
	usage: ';highlight add <keyword>\n;highlight remove <keyword>\n;highlight list\n;highlight ignore @user\n;highlight unignore @user',
	category: "utility",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const sub = args[0];

		if (sub === 'list') {
			let keywords = await db.get(`highlights_${message.guild.id}_${message.author.id}`) || [];
			if (!keywords.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`You have no highlight keywords`).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(keywords.map(k => `\`${k}\``).join(', ')).setColor(color)] });
		}

		if (sub === 'add') {
			const keyword = args.slice(1).join(' ').toLowerCase();
			if (!keyword) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a keyword`).setColor(error)] });
			let keywords = await db.get(`highlights_${message.guild.id}_${message.author.id}`) || [];
			if (keywords.includes(keyword)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Already watching for that`).setColor(error)] });
			keywords.push(keyword);
			await db.set(`highlights_${message.guild.id}_${message.author.id}`, keywords);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Now watching for \`${keyword}\``).setColor(color)] });
		}

		if (sub === 'remove') {
			const keyword = args.slice(1).join(' ').toLowerCase();
			let keywords = await db.get(`highlights_${message.guild.id}_${message.author.id}`) || [];
			keywords = keywords.filter(k => k !== keyword);
			await db.set(`highlights_${message.guild.id}_${message.author.id}`, keywords);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed \`${keyword}\``).setColor(color)] });
		}

		if (sub === 'reset') {
			await db.delete(`highlights_${message.guild.id}_${message.author.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Cleared all your highlights`).setColor(color)] });
		}

		if (sub === 'ignore') {
			const target = message.mentions.users.first();
			if (!target) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a user`).setColor(error)] });
			let ignored = await db.get(`highlightignore_${message.guild.id}_${message.author.id}`) || [];
			if (!ignored.includes(target.id)) ignored.push(target.id);
			await db.set(`highlightignore_${message.guild.id}_${message.author.id}`, ignored);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Ignoring highlights from ${target}`).setColor(color)] });
		}

		if (sub === 'unignore') {
			const target = message.mentions.users.first();
			let ignored = await db.get(`highlightignore_${message.guild.id}_${message.author.id}`) || [];
			ignored = ignored.filter(id => id !== (target ? target.id : args[1]));
			await db.set(`highlightignore_${message.guild.id}_${message.author.id}`, ignored);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed from your ignore list`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;highlight add/remove/list/ignore/unignore\``).setColor(color)] });
	},
};
