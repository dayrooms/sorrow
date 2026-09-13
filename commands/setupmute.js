const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'setupmute',
	description: 'creates and configures a Muted role across all channels',
	aliases: [],
	usage: ';setupmute',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Roles\` permission`).setColor(error)] });
		}

		let existingId = await db.get(`muterole_${message.guild.id}`);
		if (existingId && message.guild.roles.cache.get(existingId)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} A mute role is already set up: <@&${existingId}>`).setColor(error)] });
		}

		const msg = await message.reply({ embeds: [new EmbedBuilder().setDescription(`⏳ Setting up mute role across all channels...`).setColor(color)] });

		const role = await message.guild.roles.create({ name: 'Muted', color: '#818386', reason: 'Mute system setup' });

		for (const channel of message.guild.channels.cache.values()) {
			try {
				if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
					await channel.permissionOverwrites.edit(role, { SendMessages: false, AddReactions: false });
				} else if (channel.type === ChannelType.GuildVoice) {
					await channel.permissionOverwrites.edit(role, { Speak: false, Connect: false });
				}
			} catch {}
		}

		await db.set(`muterole_${message.guild.id}`, role.id);
		msg.edit({ embeds: [new EmbedBuilder().setDescription(`${checked} Mute role created and configured: ${role}`).setColor(color)] });
	},
};
