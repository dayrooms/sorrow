const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { hasModPermission } = require("../utils/permissionCheck");
const ms = require('ms');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'tempban',
	description: 'ban a member for a set duration, automatically unbanned after',
	aliases: ["tb"],
	usage: ';tempban @user 1d reason',
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

		let duration = ms(args[1]);
		if (!duration || duration < 60000) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid duration (e.g. \`1d\`, \`12h\`, \`30m\`), minimum 1 minute`).setColor(error)] });
		}
		let reason = args.slice(2).join(' ') || 'No reason provided';
		let unbanAt = Date.now() + duration;

		try {
			await message.guild.members.ban(member.id, { reason: `[TEMPBAN] ${reason}` });
			let tempbans = await db.get(`tempbans`) || [];
			tempbans.push({ guildId: message.guild.id, userId: member.id, unbanAt });
			await db.set(`tempbans`, tempbans);

			message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Tempbanned ${member.user.tag} for ${args[1]}\n**Reason:** ${reason}\nAuto-unban: <t:${Math.floor(unbanAt / 1000)}:R>`).setColor(color)] });
		} catch (e) {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Failed: ${e.message}`).setColor(error)] });
		}
	},
};
