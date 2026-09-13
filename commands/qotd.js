const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'qotd',
	description: 'set up a Question of the Day channel',
	aliases: [],
	usage: ';qotd channel #channel\n;qotd add <question>\n;qotd post\n;qotd off',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		if (args[0] === 'add') {
			const question = args.slice(1).join(' ');
			if (!question) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a question`).setColor(error)] });
			let questions = await db.get(`qotdqueue_${message.guild.id}`) || [];
			questions.push(question);
			await db.set(`qotdqueue_${message.guild.id}`, questions);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Added to the question queue (${questions.length} queued)`).setColor(color)] });
		}

		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		if (args[0] === 'off') {
			await db.delete(`qotdchannel_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} QOTD disabled`).setColor(color)] });
		}

		if (args[0] === 'channel') {
			const channel = message.mentions.channels.first() || message.channel;
			await db.set(`qotdchannel_${message.guild.id}`, channel.id);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} QOTD channel set to ${channel}. A new question posts daily.`).setColor(color)] });
		}

		if (args[0] === 'post') {
			let questions = await db.get(`qotdqueue_${message.guild.id}`) || [];
			if (!questions.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No questions queued. Add one with \`;qotd add <question>\``).setColor(error)] });
			const channelId = await db.get(`qotdchannel_${message.guild.id}`);
			const channel = channelId && message.guild.channels.cache.get(channelId);
			if (!channel) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Set a QOTD channel first with \`;qotd channel #channel\``).setColor(error)] });

			const question = questions.shift();
			await db.set(`qotdqueue_${message.guild.id}`, questions);
			await channel.send({ embeds: [new EmbedBuilder().setTitle('❓ Question of the Day').setDescription(question).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Posted to ${channel}`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;qotd channel/add/post/off\``).setColor(color)] });
	},
};
