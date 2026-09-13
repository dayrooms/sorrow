const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'boostroles',
	description: 'create and manage a custom color role for boosting the server',
	aliases: ["boostrole"],
	usage: ';boostroles create <color> <name>\n;boostroles color <hex>\n;boostroles rename <name>\n;boostroles remove',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.premiumSinceTimestamp) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} This is a booster-only feature`).setColor(error)] });
		}

		const sub = args[0];
		let roleId = await db.get(`boosterrole_${message.guild.id}_${message.author.id}`);
		let role = roleId && message.guild.roles.cache.get(roleId);

		if (sub === 'remove') {
			if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You don't have a booster role`).setColor(error)] });
			await role.delete().catch(() => {});
			await db.delete(`boosterrole_${message.guild.id}_${message.author.id}`);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed your booster role`).setColor(color)] });
		}

		if (sub === 'color') {
			const hex = args[1];
			if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Create a booster role first with \`;boostroles create <color> <name>\``).setColor(error)] });
			if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid hex color, e.g. \`#ff0000\``).setColor(error)] });
			await role.setColor(hex.startsWith('#') ? hex : `#${hex}`).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Updated your booster role color`).setColor(color)] });
		}

		if (sub === 'rename') {
			if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Create a booster role first`).setColor(error)] });
			const name = args.slice(1).join(' ');
			if (!name) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a new name`).setColor(error)] });
			await role.setName(name).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Renamed your booster role to **${name}**`).setColor(color)] });
		}

		if (sub === 'create') {
			if (role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You already have a booster role — use \`;boostroles color/rename\` to edit it`).setColor(error)] });
			const hex = args[1];
			const name = args.slice(2).join(' ') || `${message.author.username}'s role`;
			if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;boostroles create <hex color> <name>\``).setColor(error)] });

			const newRole = await message.guild.roles.create({ name, color: hex.startsWith('#') ? hex : `#${hex}` });
			await message.member.roles.add(newRole).catch(() => {});
			await db.set(`boosterrole_${message.guild.id}_${message.author.id}`, newRole.id);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Created your booster role: ${newRole}`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;boostroles create/color/rename/remove\``).setColor(color)] });
	},
};
