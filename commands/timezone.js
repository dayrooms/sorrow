const { EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'timezone',
	description: "view or set your timezone",
	aliases: ["tz"],
	usage: ';timezone [@user]\n;timezone set <IANA timezone, e.g. America/New_York>',
	category: "utility",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		if (args[0] === 'set') {
			const tz = args[1];
			if (!tz || !moment.tz.zone(tz)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid IANA timezone, e.g. \`America/New_York\`, \`Europe/London\`, \`Asia/Tokyo\``).setColor(error)] });
			}
			await db.set(`timezone_${message.author.id}`, tz);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Your timezone is set to **${tz}**`).setColor(color)] });
		}

		const target = message.mentions.users.first() || message.author;
		const tz = await db.get(`timezone_${target.id}`);
		if (!tz) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${target === message.author ? "You haven't" : `${target.tag} hasn't`} set a timezone. Use \`;timezone set <timezone>\``).setColor(error)] });

		const time = moment().tz(tz).format('h:mm A, dddd');
		message.reply({ embeds: [new EmbedBuilder().setDescription(`🕒 It's currently **${time}** for ${target} (${tz})`).setColor(color)] });
	},
};
