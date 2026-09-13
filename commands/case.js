const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'case',
	description: 'view a specific moderation case by its ID',
	aliases: [],
	usage: ';case <case id>',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}
		const caseId = parseInt(args[0]);
		if (isNaN(caseId)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid case ID`).setColor(error)] });

		const cases = await db.get(`cases_${message.guild.id}`) || [];
		const found = cases.find(c => c.id === caseId);
		if (!found) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No case with ID ${caseId}`).setColor(error)] });

		message.reply({ embeds: [new EmbedBuilder()
			.setTitle(`Case #${found.id}`)
			.addFields(
				{ name: 'Action', value: found.action, inline: true },
				{ name: 'Target', value: `<@${found.targetId}>`, inline: true },
				{ name: 'Moderator', value: `<@${found.moderatorId}>`, inline: true },
				{ name: 'Reason', value: found.reason || 'No reason provided' },
				{ name: 'Date', value: `<t:${Math.floor(found.timestamp / 1000)}:F>` }
			)
			.setColor(color)] });
	},
};
