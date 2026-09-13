const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'recentban',
	description: 'lists recently banned users',
	aliases: [],
	usage: ';recentban',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Ban Members\` permission`).setColor(error)] });
		}
		const bans = await message.guild.bans.fetch();
		if (!bans.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No bans found`).setColor(color)] });

		const list = Array.from(bans.values()).slice(0, 15).map(b => `\`${b.user.tag}\` — ${b.reason || 'No reason'}`).join('\n');
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Recent Bans (${bans.size} total)`).setDescription(list).setColor(color)] });
	},
};
