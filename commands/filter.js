const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'filter',
	description: 'block specific words or phrases from being said',
	aliases: [],
	usage: ';filter add <word>\n;filter remove <word>\n;filter list\n;filter reset',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		const sub = args[0];
		let words = await db.get(`filterwords_${message.guild.id}`) || [];

		if (sub === 'list') {
			if (!words.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No filtered words`).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(words.map(w => `\`${w}\``).join(', ')).setColor(color)] });
		}

		if (sub === 'reset') {
			await db.delete(`filterwords_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Cleared the word filter`).setColor(color)] });
		}

		if (sub === 'remove') {
			const word = args.slice(1).join(' ').toLowerCase();
			words = words.filter(w => w !== word);
			await db.set(`filterwords_${message.guild.id}`, words);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed \`${word}\` from the filter`).setColor(color)] });
		}

		if (sub === 'add') {
			const word = args.slice(1).join(' ').toLowerCase();
			if (!word) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a word or phrase`).setColor(error)] });
			if (!words.includes(word)) words.push(word);
			await db.set(`filterwords_${message.guild.id}`, words);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} \`${word}\` will now be filtered`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;filter add/remove/list/reset\``).setColor(color)] });
	},
};
