const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { hasModPermission } = require("../utils/permissionCheck");
const { logCase } = require("../utils/caseLogger");
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'warn',
	description: 'warn a member',
	aliases: ["w"],
	usage: ';warn @user reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!(await hasModPermission(message.member, message.guild, db, PermissionFlagsBits.ModerateMembers))) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}

		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
		if (member.id === message.author.id) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You can't warn yourself`).setColor(error)] });

		let reason = args.slice(1).join(' ') || 'No reason provided';

		let warnings = await db.get(`warnings_${message.guild.id}_${member.id}`) || [];
		warnings.push({ moderator: message.author.id, reason, timestamp: Date.now() });
		await db.set(`warnings_${message.guild.id}_${member.id}`, warnings);
		const caseId = await logCase(db, message.guild.id, 'Warn', member.id, message.author.id, reason);

		const embed = new EmbedBuilder()
			.setDescription(`${checked} Warned ${member} (${warnings.length} total warning${warnings.length === 1 ? '' : 's'})\n**Reason:** ${reason}`)
			.setColor(color);
		message.reply({ embeds: [embed] });

		member.send({ embeds: [new EmbedBuilder().setDescription(`You were warned in **${message.guild.name}**\n**Reason:** ${reason}`).setColor(error)] }).catch(() => {});
	},
};
