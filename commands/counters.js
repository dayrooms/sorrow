const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'counters',
	description: 'create voice channels whose names live-update with server stats',
	aliases: ["counter"],
	usage: ';counters add <members|humans|bots|boosts> [name]\n;counters remove #channel\n;counters list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		const sub = args[0];
		if (sub === 'list') {
			let counters = await db.get(`counters_${message.guild.id}`) || [];
			if (!counters.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No counters set up`).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(counters.map(c => `<#${c.channelId}> — ${c.type}`).join('\n')).setColor(color)] });
		}

		if (sub === 'remove') {
			const channel = message.mentions.channels.first();
			let counters = await db.get(`counters_${message.guild.id}`) || [];
			counters = counters.filter(c => c.channelId !== (channel && channel.id));
			await db.set(`counters_${message.guild.id}`, counters);
			if (channel) channel.delete().catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed that counter`).setColor(color)] });
		}

		if (sub === 'add') {
			const type = args[1];
			const valid = ['members', 'humans', 'bots', 'boosts'];
			if (!valid.includes(type)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Type must be one of: ${valid.join(', ')}`).setColor(error)] });
			}

			const label = args.slice(2).join(' ') || type.charAt(0).toUpperCase() + type.slice(1);
			let count = 0;
			if (type === 'members') count = message.guild.memberCount;
			else if (type === 'humans') count = message.guild.members.cache.filter(m => !m.user.bot).size;
			else if (type === 'bots') count = message.guild.members.cache.filter(m => m.user.bot).size;
			else if (type === 'boosts') count = message.guild.premiumSubscriptionCount || 0;

			const channel = await message.guild.channels.create({
				name: `${label}: ${count}`,
				type: ChannelType.GuildVoice,
				permissionOverwrites: [{ id: message.guild.id, deny: [PermissionFlagsBits.Connect] }],
			});

			let counters = await db.get(`counters_${message.guild.id}`) || [];
			counters.push({ channelId: channel.id, type, label });
			await db.set(`counters_${message.guild.id}`, counters);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Created counter ${channel}`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;counters add/remove/list\``).setColor(color)] });
	},
};
