const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'alias',
	description: 'create custom shortcuts for any command',
	aliases: ["aliases"],
	usage: ';alias add <shortcut> <command>\n;alias remove <shortcut>\n;alias list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const sub = args[0];

		if (sub === 'list') {
			let aliases = await db.get(`customaliases_${message.guild.id}`) || {};
			const entries = Object.entries(aliases);
			if (!entries.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No custom aliases set up`).setColor(color)] });
			const list = entries.map(([short, cmd]) => `\`${short}\` → \`${cmd}\``).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('Custom Aliases').setDescription(list).setColor(color)] });
		}

		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		if (sub === 'remove') {
			const shortcut = args[1];
			let aliases = await db.get(`customaliases_${message.guild.id}`) || {};
			if (!aliases[shortcut]) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No alias called \`${shortcut}\``).setColor(error)] });
			delete aliases[shortcut];
			await db.set(`customaliases_${message.guild.id}`, aliases);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed alias \`${shortcut}\``).setColor(color)] });
		}

		if (sub === 'add') {
			const shortcut = args[1];
			const targetCommand = args[2];
			if (!shortcut || !targetCommand) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;alias add <shortcut> <command>\``).setColor(error)] });
			}
			if (client.commands.get(shortcut)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} \`${shortcut}\` is already a real command name`).setColor(error)] });
			}
			if (!client.commands.get(targetCommand)) {
				return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} \`${targetCommand}\` isn't a real command`).setColor(error)] });
			}
			let aliases = await db.get(`customaliases_${message.guild.id}`) || {};
			aliases[shortcut.toLowerCase()] = targetCommand.toLowerCase();
			await db.set(`customaliases_${message.guild.id}`, aliases);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} \`${shortcut}\` now runs \`${targetCommand}\``).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;alias add/remove/list\``).setColor(color)] });
	},
};
