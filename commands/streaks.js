const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'streaks',
	description: 'daily activity streaks with a leaderboard',
	aliases: ["streak"],
	usage: ';streaks\n;streaks leaderboard\n;streaks toggle',
	category: "utility",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		if (args[0] === 'leaderboard') {
			const allStreaks = await db.get(`streaks_${message.guild.id}`) || {};
			const sorted = Object.entries(allStreaks).sort((a, b) => b[1].current - a[1].current).slice(0, 10);
			if (!sorted.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No streaks yet`).setColor(color)] });
			const list = sorted.map(([id, s], i) => `**${i + 1}.** <@${id}> — ${s.current} day streak`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('🔥 Streak Leaderboard').setDescription(list).setColor(color)] });
		}

		if (args[0] === 'toggle') {
			if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
			}
			const enabled = await db.get(`streaksenabled_${message.guild.id}`);
			await db.set(`streaksenabled_${message.guild.id}`, !enabled);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Streaks ${!enabled ? 'enabled' : 'disabled'}`).setColor(color)] });
		}

		const allStreaks = await db.get(`streaks_${message.guild.id}`) || {};
		const mine = allStreaks[message.author.id] || { current: 0, longest: 0 };
		message.reply({ embeds: [new EmbedBuilder().setDescription(`🔥 **Current streak:** ${mine.current} day(s)\n🏆 **Longest streak:** ${mine.longest} day(s)`).setColor(color)] });
	},
};
