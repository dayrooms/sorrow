const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'forcenickname',
	description: "force a member's nickname — it gets reset if they try to change it",
	aliases: ["forcenick"],
	usage: ';forcenickname @user <nickname>\n;forcenickname remove @user',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}
		const member = message.mentions.members.first();
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid member`).setColor(error)] });

		if (args[0] === 'remove') {
			await db.delete(`forcenick_${message.guild.id}_${member.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed forced nickname from ${member}`).setColor(color)] });
		}

		const nickname = args.slice(1).join(' ');
		if (!nickname) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a nickname`).setColor(error)] });

		await db.set(`forcenick_${message.guild.id}_${member.id}`, nickname);
		await member.setNickname(nickname).catch(() => {});
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Forced ${member}'s nickname to **${nickname}**`).setColor(color)] });
	},
};
