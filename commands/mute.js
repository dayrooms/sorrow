const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'mute',
	description: 'mute a member using the Muted role',
	aliases: [],
	usage: ';mute @user reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}

		let roleId = await db.get(`muterole_${message.guild.id}`);
		let role = roleId && message.guild.roles.cache.get(roleId);
		if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No mute role set up. Run \`;setupmute\` first`).setColor(error)] });

		let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });
		if (member.roles.cache.has(role.id)) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} That user is already muted`).setColor(error)] });

		let reason = args.slice(1).join(' ') || 'No reason provided';
		await member.roles.add(role, reason).catch(() => {});

		message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Muted ${member}\n**Reason:** ${reason}`).setColor(color)] });
	},
};
