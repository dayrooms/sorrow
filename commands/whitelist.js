const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'whitelist',
	description: 'manage the list of users trusted to bypass antinuke punishments',
	aliases: ["wl"],
	usage: ';whitelist add @user\n;wl add @user\n;whitelist remove @user\n;wl remove @user\n;whitelist list\n;whitelist help',
	category: "security",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		const authorized = [message.guild.ownerId, require("../config.json").owner];
		if (!authorized.includes(message.author.id)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Only the server owner can manage the whitelist`).setColor(error)] });
		}

		const sub = args[0] ? args[0].toLowerCase() : null;

		if (!sub || sub === 'help') {
			return message.reply({ embeds: [new EmbedBuilder()
				.setTitle('🛡️ Whitelist')
				.setDescription('Whitelisted users bypass antinuke, antibot, antispam and other security punishments.\n\n`;whitelist add @user` / `;wl add @user`\n`;whitelist remove @user` / `;wl remove @user`\n`;whitelist list`')
				.setColor(color)] });
		}

		if (sub === 'list') {
			let trustedusers = await db.get(`trustedusers_${message.guild.id}`) || [];
			if (!trustedusers.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No users are whitelisted`).setColor(color)] });
			const list = trustedusers.map(t => `<@${t.user}>`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('Whitelisted Users').setDescription(list).setColor(color)] });
		}

		if (sub === 'add') {
			let user = message.mentions.users.first() || message.guild.members.cache.get(args[1]);
			if (!user) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a user to whitelist`).setColor(error)] });
			let trustedusers = await db.get(`trustedusers_${message.guild.id}`) || [];
			if (trustedusers.find(t => t.user == user.id)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user is already whitelisted`).setColor(error)] });
			}
			trustedusers.push({ user: user.id });
			await db.set(`trustedusers_${message.guild.id}`, trustedusers);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Whitelisted ${user}`).setColor(color)] });
		}

		if (sub === 'remove') {
			let user = message.mentions.users.first() || message.guild.members.cache.get(args[1]);
			let targetId = user ? user.id : args[1];
			if (!targetId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a user to remove`).setColor(error)] });
			let trustedusers = await db.get(`trustedusers_${message.guild.id}`) || [];
			let filtered = trustedusers.filter(t => t.user != targetId);
			if (filtered.length === trustedusers.length) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user isn't whitelisted`).setColor(error)] });
			}
			await db.set(`trustedusers_${message.guild.id}`, filtered);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed <@${targetId}> from the whitelist`).setColor(color)] });
		}

		return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Unknown subcommand. Use \`;whitelist help\``).setColor(error)] });
	},
};
