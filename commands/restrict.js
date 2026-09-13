const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'restrict',
	description: 'restrict a command to specific roles',
	aliases: [],
	usage: ';restrict add <command> @role\n;restrict remove <command>\n;restrict list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Guild\` permission`).setColor(error)] });
		}

		if (args[0] === 'list') {
			let binds = await db.get(`commandbinds_${message.guild.id}`) || {};
			let entries = Object.entries(binds);
			if (!entries.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No commands are restricted`).setColor(color)] });
			return message.reply({ embeds: [new EmbedBuilder().setDescription(entries.map(([cmd, roleId]) => `\`${cmd}\` → <@&${roleId}>`).join('\n')).setColor(color)] });
		}

		if (args[0] === 'remove') {
			const cmdName = args[1];
			let binds = await db.get(`commandbinds_${message.guild.id}`) || {};
			delete binds[cmdName];
			await db.set(`commandbinds_${message.guild.id}`, binds);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed restriction on \`${cmdName}\``).setColor(color)] });
		}

		if (args[0] === 'add') {
			const cmdName = args[1];
			const role = message.mentions.roles.first();
			if (!cmdName || !client.commands.get(cmdName)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid command name`).setColor(error)] });
			if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a role`).setColor(error)] });
			let binds = await db.get(`commandbinds_${message.guild.id}`) || {};
			binds[cmdName] = role.id;
			await db.set(`commandbinds_${message.guild.id}`, binds);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} \`${cmdName}\` is now restricted to ${role}`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;restrict add/remove/list\` (this is the same restriction system as \`;bind\`)`).setColor(color)] });
	},
};
