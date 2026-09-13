const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'history',
	description: 'view moderation case history for the server or a specific user',
	aliases: ["modhistory"],
	usage: ';history [@user]',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}
		const target = message.mentions.users.first();
		let cases = await db.get(`cases_${message.guild.id}`) || [];
		if (target) cases = cases.filter(c => c.targetId === target.id);
		if (!cases.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No case history found`).setColor(color)] });

		const list = cases.slice(-15).reverse().map(c => `**#${c.id}** ${c.action} — <@${c.targetId}> by <@${c.moderatorId}>`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(target ? `History for ${target.tag}` : 'Server Moderation History').setDescription(list).setColor(color)] });
	},
};
