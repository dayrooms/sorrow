const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'autoresponder',
	description: 'create automatic replies when a trigger word is said',
	aliases: ["ar", "responder"],
	usage: ';autoresponder add <trigger> | <response>\n;autoresponder remove <trigger>\n;autoresponder list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Channels\` permission`).setColor(error)] });
		}

		const sub = args[0];
		let responders = await db.get(`autoresponders_${message.guild.id}`) || [];

		if (sub === 'list') {
			if (!responders.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No autoresponders set up`).setColor(color)] });
			const list = responders.map((r, i) => `**${i + 1}.** \`${r.trigger}\` → ${r.response.slice(0, 50)}`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('Autoresponders').setDescription(list).setColor(color)] });
		}

		if (sub === 'remove') {
			const trigger = args.slice(1).join(' ').toLowerCase();
			const before = responders.length;
			responders = responders.filter(r => r.trigger !== trigger);
			if (responders.length === before) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No autoresponder with that trigger`).setColor(error)] });
			await db.set(`autoresponders_${message.guild.id}`, responders);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed autoresponder for \`${trigger}\``).setColor(color)] });
		}

		if (sub === 'reset') {
			await db.delete(`autoresponders_${message.guild.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed all autoresponders`).setColor(color)] });
		}

		if (sub === 'add') {
			const rest = args.slice(1).join(' ');
			const [trigger, response] = rest.split('|').map(s => s.trim());
			if (!trigger || !response) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;autoresponder add <trigger> | <response>\``).setColor(error)] });
			}
			responders.push({ trigger: trigger.toLowerCase(), response });
			await db.set(`autoresponders_${message.guild.id}`, responders);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Added autoresponder for \`${trigger}\``).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;autoresponder add/remove/list/reset\``).setColor(color)] });
	},
};
