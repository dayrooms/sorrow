const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'audit',
	description: 'view the 10 most recent audit log entries',
	aliases: [],
	usage: ';audit',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`View Audit Log\` permission`).setColor(error)] });
		}
		const logs = await message.guild.fetchAuditLogs({ limit: 10 });
		if (!logs.entries.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No audit log entries found`).setColor(color)] });

		const list = Array.from(logs.entries.values()).map(e =>
			`**${e.action}** by ${e.executor ? e.executor.tag : 'Unknown'}${e.target ? ` on \`${e.target.tag || e.target.name || e.target.id}\`` : ''}`
		).join('\n').slice(0, 4000);

		message.reply({ embeds: [new EmbedBuilder().setTitle('Recent Audit Log').setDescription(list).setColor(color)] });
	},
};
