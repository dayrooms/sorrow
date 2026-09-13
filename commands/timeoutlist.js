const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'timeoutlist',
	description: 'view all currently timed-out members',
	aliases: [],
	usage: ';timeoutlist',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}
		await message.guild.members.fetch();
		const timedOut = message.guild.members.cache.filter(m => m.isCommunicationDisabled());
		if (!timedOut.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No members are currently timed out`).setColor(color)] });

		const list = timedOut.map(m => `${m} — until <t:${Math.floor(m.communicationDisabledUntilTimestamp / 1000)}:R>`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Timed Out Members (${timedOut.size})`).setDescription(list).setColor(color)] });
	},
};
