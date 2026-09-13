const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'mediafilter',
	description: 'deletes messages containing images/attachments in a channel',
	aliases: ["mfilter"],
	usage: ';mediafilter on\n;mediafilter off',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		if (args[0] === 'off') {
			let channels = await db.get(`mediafilter_${message.guild.id}`) || [];
			channels = channels.filter(id => id !== message.channel.id);
			await db.set(`mediafilter_${message.guild.id}`, channels);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Media filter disabled in ${message.channel}`).setColor(color)] });
		}

		let channels = await db.get(`mediafilter_${message.guild.id}`) || [];
		if (!channels.includes(message.channel.id)) channels.push(message.channel.id);
		await db.set(`mediafilter_${message.guild.id}`, channels);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Media filter enabled in ${message.channel} — attachments will be deleted`).setColor(color)] });
	},
};
