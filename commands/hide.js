const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'hide',
	description: 'hide a channel from a role or member',
	aliases: [],
	usage: ';hide [#channel] @role/@member',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}
		const channel = message.mentions.channels.first() || message.channel;
		const target = message.mentions.roles.first() || message.mentions.members.first();
		const targetId = target ? target.id : message.guild.id;

		await channel.permissionOverwrites.edit(targetId, { ViewChannel: false }).catch(() => {});
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Hid ${channel} from ${target ? target : 'everyone'}`).setColor(color)] });
	},
};
