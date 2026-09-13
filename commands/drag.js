const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'drag',
	description: 'move a member to a different voice channel',
	aliases: [],
	usage: ';drag @user #voicechannel',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Move Members\` permission`).setColor(error)] });
		}
		const member = message.mentions.members.first();
		const channel = message.mentions.channels.first();
		if (!member || !member.voice.channel) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a member who's in a voice channel`).setColor(error)] });
		if (!channel) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a voice channel`).setColor(error)] });

		await member.voice.setChannel(channel).catch(() => {});
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Moved ${member} to ${channel}`).setColor(color)] });
	},
};
