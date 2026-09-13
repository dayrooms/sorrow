const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'unlockall',
	description: 'unlock every text channel in the server',
	aliases: [],
	usage: ';unlockall [reason]',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}
		const reason = args.join(' ') || 'No reason provided';
		const msg = await message.reply({ embeds: [new EmbedBuilder().setDescription(`⏳ Unlocking all channels...`).setColor(color)] });

		let count = 0;
		for (const channel of message.guild.channels.cache.values()) {
			if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) continue;
			try {
				await channel.permissionOverwrites.edit(message.guild.id, { SendMessages: null }, { reason });
				count++;
			} catch {}
		}
		msg.edit({ embeds: [new EmbedBuilder().setDescription(`${checked} Unlocked ${count} channels`).setColor(color)] });
	},
};
