const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'autothread',
	description: 'automatically create a thread on every new message in a channel',
	aliases: [],
	usage: ';autothread add #channel [thread name]\n;autothread remove #channel\n;autothread list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}

		if (args[0] === 'list') {
			let channels = await db.get(`autothread_${message.guild.id}`) || [];
			if (!channels.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No autothread channels set up`).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(channels.map(c => `<#${c.channelId}>`).join('\n')).setColor(color)] });
		}

		if (args[0] === 'remove') {
			const channel = message.mentions.channels.first();
			let channels = await db.get(`autothread_${message.guild.id}`) || [];
			channels = channels.filter(c => c.channelId !== (channel && channel.id));
			await db.set(`autothread_${message.guild.id}`, channels);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Disabled autothread there`).setColor(color)] });
		}

		if (args[0] === 'add') {
			const channel = message.mentions.channels.first() || message.channel;
			const name = args.slice(2).join(' ') || null;
			let channels = await db.get(`autothread_${message.guild.id}`) || [];
			channels.push({ channelId: channel.id, name });
			await db.set(`autothread_${message.guild.id}`, channels);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} New messages in ${channel} will now start a thread`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;autothread add/remove/list\``).setColor(color)] });
	},
};
