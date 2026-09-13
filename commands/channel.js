const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'channel',
	description: 'create, remove, or edit server channels',
	aliases: [],
	usage: ';channel create <text|voice> <name>\n;channel remove #channel\n;channel edit #channel <new name>',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}

		if (args[0] === 'create') {
			const type = args[1];
			const name = args.slice(2).join(' ');
			if (!['text', 'voice'].includes(type) || !name) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;channel create <text|voice> <name>\``).setColor(error)] });
			}
			const channel = await message.guild.channels.create({
				name,
				type: type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
			});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Created ${channel}`).setColor(color)] });
		}

		if (args[0] === 'remove') {
			const channel = message.mentions.channels.first();
			if (!channel) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a channel`).setColor(error)] });
			await channel.delete().catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Deleted #${channel.name}`).setColor(color)] });
		}

		if (args[0] === 'edit') {
			const channel = message.mentions.channels.first();
			const newName = args.slice(2).join(' ');
			if (!channel || !newName) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;channel edit #channel <new name>\``).setColor(error)] });
			await channel.setName(newName).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Renamed to #${newName}`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;channel create/remove/edit\``).setColor(color)] });
	},
};
