const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'setup',
	description: 'runs first-time setup: mute role, jail, and a logs channel',
	aliases: [],
	usage: ';setup',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		const msg = await message.reply({ embeds: [new EmbedBuilder().setDescription(`⏳ Running setup...`).setColor(color)] });
		let results = [];

		// Mute role
		let muteRoleId = await db.get(`muterole_${message.guild.id}`);
		if (!muteRoleId || !message.guild.roles.cache.get(muteRoleId)) {
			const role = await message.guild.roles.create({ name: 'Muted', color: '#818386', reason: 'Setup' });
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
			results.push(`✅ Created mute role: ${role}`);
		} else {
			results.push(`⏭️ Mute role already set up`);
		}

		// Jail
		let jailRoleId = await db.get(`jailrole_${message.guild.id}`);
		if (!jailRoleId || !message.guild.roles.cache.get(jailRoleId)) {
			const role = await message.guild.roles.create({ name: 'Jailed', color: '#2b2d31', reason: 'Setup' });
			const jailChannel = await message.guild.channels.create({
				name: 'jail',
				type: ChannelType.GuildText,
				permissionOverwrites: [
					{ id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
					{ id: role.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
				],
			});
			for (const channel of message.guild.channels.cache.values()) {
				if (channel.id === jailChannel.id) continue;
				try { await channel.permissionOverwrites.edit(role, { ViewChannel: false }); } catch {}
			}
			await db.set(`jailrole_${message.guild.id}`, role.id);
			await db.set(`jailchannel_${message.guild.id}`, jailChannel.id);
			results.push(`✅ Created jail: ${role} / ${jailChannel}`);
		} else {
			results.push(`⏭️ Jail already set up`);
		}

		// Logs channel
		let logsId = await db.get(`logs_${message.guild.id}`);
		if (!logsId || !message.guild.channels.cache.get(logsId)) {
			const logChannel = await message.guild.channels.create({
				name: 'mod-logs',
				type: ChannelType.GuildText,
				permissionOverwrites: [
					{ id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
				],
			});
			await db.set(`logs_${message.guild.id}`, logChannel.id);
			results.push(`✅ Created logs channel: ${logChannel}`);
		} else {
			results.push(`⏭️ Logs channel already set up`);
		}

		msg.edit({ embeds: [new EmbedBuilder().setDescription(`**Setup complete**\n\n${results.join('\n')}`).setColor(color)] });
	},
};
