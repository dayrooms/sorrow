const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'bind',
	description: 'restrict a command to only be usable by a specific role',
	aliases: [],
	usage: ';bind <command> @role\n;bind remove <command>\n;bind list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Administrator\` permission`).setColor(error)] });
		}

		if (args[0] === 'list') {
			let binds = await db.get(`commandbinds_${message.guild.id}`) || {};
			let entries = Object.entries(binds);
			if (!entries.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No commands are bound to roles`).setColor(color)] });
			let list = entries.map(([cmd, roleId]) => `\`${cmd}\` → <@&${roleId}>`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setDescription(list).setColor(color)] });
		}

		if (args[0] === 'remove') {
			let cmdName = args[1];
			if (!cmdName) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a command name`).setColor(error)] });
			let binds = await db.get(`commandbinds_${message.guild.id}`) || {};
			delete binds[cmdName];
			await db.set(`commandbinds_${message.guild.id}`, binds);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Unbound \`${cmdName}\``).setColor(color)] });
		}

		let cmdName = args[0];
		let role = message.mentions.roles.first();
		if (!cmdName || !client.commands.get(cmdName)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid command name`).setColor(error)] });
		if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a role`).setColor(error)] });

		let binds = await db.get(`commandbinds_${message.guild.id}`) || {};
		binds[cmdName] = role.id;
		await db.set(`commandbinds_${message.guild.id}`, binds);

		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} \`${cmdName}\` is now restricted to ${role}`).setColor(color)] });
	},
};
