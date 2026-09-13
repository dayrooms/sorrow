const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'hardban',
	description: 'ban a user and flag it so it requires ;unhardban to reverse',
	aliases: ["hb"],
	usage: ';hardban @user reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}
		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		let targetId = member ? member.id : args[0];
		if (!targetId || !/^\d{15,20}$/.test(targetId)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a user or provide a valid ID`).setColor(error)] });
		}
		let reason = args.slice(1).join(' ') || 'No reason provided';

		try {
			await message.guild.members.ban(targetId, { reason: `[HARDBAN] ${reason}` });
			await db.set(`hardbanned_${message.guild.id}_${targetId}`, true);
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Hardbanned <@${targetId}>\n**Reason:** ${reason}\nThis requires \`;unhardban\` to reverse.`).setColor(color)] });
		} catch (e) {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Failed: ${e.message}`).setColor(error)] });
		}
	},
};
