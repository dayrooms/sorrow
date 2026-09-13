const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'raid',
	description: 'manually lock down the entire server immediately',
	aliases: [],
	usage: ';raid lock\n;raid unlock',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		const lock = args[0] !== 'unlock';
		const msg = await message.reply({ embeds: [new EmbedBuilder().setDescription(`⏳ ${lock ? 'Locking' : 'Unlocking'} the entire server...`).setColor(color)] });

		let count = 0;
		for (const channel of message.guild.channels.cache.values()) {
			if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) continue;
			try {
				await channel.permissionOverwrites.edit(message.guild.id, { SendMessages: lock ? false : null });
				count++;
			} catch {}
		}

		msg.edit({ embeds: [new EmbedBuilder().setDescription(`${checked} ${lock ? 'Locked' : 'Unlocked'} ${count} channels`).setColor(color)] });
	},
};
