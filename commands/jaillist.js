const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'jaillist',
	description: 'view all currently jailed members',
	aliases: [],
	usage: ';jaillist',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}
		const roleId = await db.get(`jailrole_${message.guild.id}`);
		if (!roleId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`Jail isn't set up`).setColor(color)] });

		await message.guild.members.fetch();
		const jailed = message.guild.members.cache.filter(m => m.roles.cache.has(roleId));
		if (!jailed.size) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No members are currently jailed`).setColor(color)] });

		const list = jailed.map(m => `${m}`).join('\n').slice(0, 4000);
		message.reply({ embeds: [new EmbedBuilder().setTitle(`Jailed Members (${jailed.size})`).setDescription(list).setColor(color)] });
	},
};
