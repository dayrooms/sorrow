const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'topic',
	description: 'set or remove a channel topic',
	aliases: [],
	usage: ';topic <text>\n;topic remove',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}
		if (args[0] === 'remove') {
			await message.channel.setTopic(null).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed the channel topic`).setColor(color)] });
		}
		const text = args.join(' ');
		if (!text) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide topic text`).setColor(error)] });
		await message.channel.setTopic(text).catch(() => {});
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Set the channel topic`).setColor(color)] });
	},
};
