const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'mutelist',
	description: 'view all currently muted members',
	aliases: [],
	usage: ';mutelist',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}
		const roleId = await db.get(`muterole_${message.guild.id}`);
		if (!roleId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No mute role is set up`).setColor(color)] });

		await message.guild.members.fetch();
		const muted = message.guild.members.cache.filter(m => m.roles.cache.has(roleId));
		if (!muted.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No members are currently muted`).setColor(color)] });

		const list = muted.map(m => `${m}`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Muted Members (${muted.size})`).setDescription(list).setColor(color)] });
	},
};
