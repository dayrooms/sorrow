const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'bumpreminder',
	description: 'get reminded to /bump this server on Disboard every 2 hours',
	aliases: ["bumpr"],
	usage: ';bumpreminder <#channel>\n;bumpreminder off\n;bumpreminder leaderboard',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		if (args[0] === 'leaderboard') {
			const bumps = await db.get(`bumpcounts_${message.guild.id}`) || {};
			const sorted = Object.entries(bumps).sort((a, b) => b[1] - a[1]).slice(0, 10);
			if (!sorted.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No bumps recorded yet`).setColor(color)] });
			const list = sorted.map(([id, count], i) => `**${i + 1}.** <@${id}> — ${count} bump(s)`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('Bump Leaderboard').setDescription(list).setColor(color)] });
		}

		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}

		if (args[0] === 'off') {
			await db.delete(`bumpreminder_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Bump reminders disabled`).setColor(color)] });
		}

		const channel = message.mentions.channels.first() || message.channel;
		await db.set(`bumpreminder_${message.guild.id}`, channel.id);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} I'll remind ${channel} to bump every 2 hours after a \`/bump\``).setColor(color)] });
	},
};
