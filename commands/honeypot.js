const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'honeypot',
	description: 'creates a decoy channel that auto-bans anyone who sends a message in it',
	aliases: ["hp"],
	usage: ';honeypot setup\n;honeypot off',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		if (args[0] === 'off') {
			let chanId = await db.get(`honeypot_${message.guild.id}`);
			if (chanId) {
				let chan = message.guild.channels.cache.get(chanId);
				if (chan) chan.delete().catch(() => {});
			}
			await db.delete(`honeypot_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Honeypot removed`).setColor(color)] });
		}

		let existingId = await db.get(`honeypot_${message.guild.id}`);
		if (existingId && message.guild.channels.cache.get(existingId)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} A honeypot already exists`).setColor(error)] });
		}

		const channel = await message.guild.channels.create({
			name: 'verify-here',
			type: ChannelType.GuildText,
			topic: 'Do not send messages here.',
		});
		await db.set(`honeypot_${message.guild.id}`, channel.id);
		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Honeypot created: ${channel}\nAnyone who sends a message there will be automatically banned.`).setColor(color)] });
	},
};
