const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'unhardban',
	description: 'reverse a hardban',
	aliases: ["uhb"],
	usage: ';unhardban <userID>',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}
		const userId = args[0];
		if (!userId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a user ID`).setColor(error)] });

		let isHardbanned = await db.get(`hardbanned_${message.guild.id}_${userId}`);
		if (!isHardbanned) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user isn't hardbanned`).setColor(error)] });

		try {
			await message.guild.members.unban(userId);
			await db.delete(`hardbanned_${message.guild.id}_${userId}`);
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Unhardbanned \`${userId}\``).setColor(color)] });
		} catch (e) {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Failed: ${e.message}`).setColor(error)] });
		}
	},
};
