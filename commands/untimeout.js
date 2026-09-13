const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'untimeout',
	description: 'remove a timeout from a member',
	aliases: ["uto"],
	usage: ';untimeout @user',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}
		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
		if (!member.isCommunicationDisabled()) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user isn't timed out`).setColor(error)] });

		await member.timeout(null).catch(() => {});
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed timeout from ${member}`).setColor(color)] });
	},
};
