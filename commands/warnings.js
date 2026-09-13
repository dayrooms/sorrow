const { EmbedBuilder } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'warnings',
	description: "view a member's warnings",
	aliases: ["warns"],
	usage: ';warnings @user',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

		let warnings = await db.get(`warnings_${message.guild.id}_${member.id}`) || [];
		if (!warnings.length) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${member} has no warnings`).setColor(color)] });
		}

		const list = warnings.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderator}> <t:${Math.floor(w.timestamp / 1000)}:R>`).join('\n').slice(0, 4000);

		const embed = new EmbedBuilder()
			.setAuthor({ name: `${member.user.tag}'s warnings`, iconURL: member.user.displayAvatarURL() })
			.setDescription(list)
			.setFooter({ text: `${warnings.length} total warning${warnings.length === 1 ? '' : 's'}` })
			.setColor(color);
		message.reply({ embeds: [embed] });
	},
};
