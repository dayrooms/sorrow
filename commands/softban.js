const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { hasModPermission } = require("../utils/permissionCheck");
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'softban',
	description: "ban then immediately unban a member to purge their recent messages",
	aliases: ["sb"],
	usage: ';softban @user reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!(await hasModPermission(message.member, message.guild, db, PermissionFlagsBits.BanMembers))) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Ban Members\` permission`).setColor(error)] });
		}
		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
		if (!member.bannable) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} I can't ban that user`).setColor(error)] });

		let reason = args.slice(1).join(' ') || 'No reason provided';

		try {
			await message.guild.members.ban(member.id, { deleteMessageSeconds: 7 * 24 * 60 * 60, reason: `[SOFTBAN] ${reason}` });
			await message.guild.members.unban(member.id);
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Softbanned ${member.user.tag} (messages purged, user can rejoin)\n**Reason:** ${reason}`).setColor(color)] });
		} catch (e) {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Failed: ${e.message}`).setColor(error)] });
		}
	},
};
