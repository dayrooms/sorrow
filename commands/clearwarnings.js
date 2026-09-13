const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'clearwarnings',
	description: "clear a member's warnings",
	aliases: ["clearwarns", "delwarns"],
	usage: ';clearwarnings @user [index]',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}

		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });

		let index = parseInt(args[1]);
		let warnings = await db.get(`warnings_${message.guild.id}_${member.id}`) || [];

		if (!isNaN(index)) {
			if (index < 1 || index > warnings.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Invalid warning number`).setColor(error)] });
			warnings.splice(index - 1, 1);
			await db.set(`warnings_${message.guild.id}_${member.id}`, warnings);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed warning #${index} from ${member}`).setColor(color)] });
		}

		await db.delete(`warnings_${message.guild.id}_${member.id}`);
		return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Cleared all warnings for ${member}`).setColor(color)] });
	},
};
