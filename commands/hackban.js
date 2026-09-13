const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { hasModPermission } = require("../utils/permissionCheck");
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'hackban',
	description: 'ban a user by ID even if they are not in the server',
	aliases: ["forceban"],
	usage: ';hackban <userID> reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!(await hasModPermission(message.member, message.guild, db, PermissionFlagsBits.BanMembers))) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Ban Members\` permission`).setColor(error)] });
		}
		const userId = args[0];
		if (!userId || !/^\d{15,20}$/.test(userId)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid user ID`).setColor(error)] });
		}
		let reason = args.slice(1).join(' ') || 'No reason provided';

		try {
			await message.guild.members.ban(userId, { reason });
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Hackbanned \`${userId}\`\n**Reason:** ${reason}`).setColor(color)] });
		} catch (e) {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Failed to ban that ID: ${e.message}`).setColor(error)] });
		}
	},
};
