const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'jail',
	description: 'isolate a member to a single jail channel, or set up jail with ;jail setup',
	aliases: [],
	usage: ';jail setup\n;jail @user\n;jail remove @user',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}

		if (args[0] === 'setup') {
			let existingId = await db.get(`jailrole_${message.guild.id}`);
			if (existingId && message.guild.roles.cache.get(existingId)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Jail is already set up`).setColor(error)] });
			}
			const msg = await message.reply({ embeds: [new EmbedBuilder().setDescription(`⏳ Setting up jail...`).setColor(color)] });

			const role = await message.guild.roles.create({ name: 'Jailed', color: '#2b2d31', reason: 'Jail system setup' });
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
				try {
					await channel.permissionOverwrites.edit(role, { ViewChannel: false });
				} catch {}
			}

			await db.set(`jailrole_${message.guild.id}`, role.id);
			await db.set(`jailchannel_${message.guild.id}`, jailChannel.id);
			return msg.edit({ embeds: [new EmbedBuilder().setDescription(`${checked} Jail set up — role: ${role}, channel: ${jailChannel}`).setColor(color)] });
		}

		let roleId = await db.get(`jailrole_${message.guild.id}`);
		let role = roleId && message.guild.roles.cache.get(roleId);
		if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Jail isn't set up. Run \`;jail setup\` first`).setColor(error)] });

		if (args[0] === 'remove') {
			let member = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
			if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
			let previousRoles = await db.get(`jailprevroles_${message.guild.id}_${member.id}`) || [];
			await member.roles.remove(role).catch(() => {});
			for (const rid of previousRoles) {
				await member.roles.add(rid).catch(() => {});
			}
			await db.delete(`jailprevroles_${message.guild.id}_${member.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Released ${member} from jail`).setColor(color)] });
		}

		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
		if (member.roles.cache.has(role.id)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user is already jailed`).setColor(error)] });

		const keepableRoles = member.roles.cache.filter(r => r.id !== message.guild.id && r.editable).map(r => r.id);
		await db.set(`jailprevroles_${message.guild.id}_${member.id}`, keepableRoles);
		await member.roles.set([role.id]).catch(() => {});

		let reason = args.slice(1).join(' ') || 'No reason provided';
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Jailed ${member}\n**Reason:** ${reason}`).setColor(color)] });
	},
};
