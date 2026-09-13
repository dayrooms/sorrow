const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'invoke',
	description: 'manually trigger a moderation action on a member (kick, ban, mute, jail, warn)',
	aliases: [],
	usage: ';invoke <kick|ban|mute|jail|warn> @user reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Moderate Members\` permission`).setColor(error)] });
		}

		const action = args[0];
		const valid = ['kick', 'ban', 'mute', 'jail', 'warn'];
		if (!valid.includes(action)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Valid actions: ${valid.join(', ')}`).setColor(error)] });
		}

		let member = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid user`).setColor(error)] });

		let reason = args.slice(2).join(' ') || `Invoked by ${message.author.tag}`;

		try {
			if (action === 'kick') {
				if (!member.kickable) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} I can't kick that user`).setColor(error)] });
				await member.kick(reason);
			} else if (action === 'ban') {
				if (!member.bannable) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} I can't ban that user`).setColor(error)] });
				await member.ban({ reason });
			} else if (action === 'mute') {
				let roleId = await db.get(`muterole_${message.guild.id}`);
				let role = roleId && message.guild.roles.cache.get(roleId);
				if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} No mute role set up. Run \`;setupmute\` first`).setColor(error)] });
				await member.roles.add(role, reason);
			} else if (action === 'jail') {
				let roleId = await db.get(`jailrole_${message.guild.id}`);
				let role = roleId && message.guild.roles.cache.get(roleId);
				if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Jail isn't set up. Run \`;jail setup\` first`).setColor(error)] });
				const keepableRoles = member.roles.cache.filter(r => r.id !== message.guild.id && r.editable).map(r => r.id);
				await db.set(`jailprevroles_${message.guild.id}_${member.id}`, keepableRoles);
				await member.roles.set([role.id]);
			} else if (action === 'warn') {
				let warnings = await db.get(`warnings_${message.guild.id}_${member.id}`) || [];
				warnings.push({ moderator: message.author.id, reason, timestamp: Date.now() });
				await db.set(`warnings_${message.guild.id}_${member.id}`, warnings);
			}

			message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Invoked **${action}** on ${member}\n**Reason:** ${reason}`).setColor(color)] });
		} catch (e) {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Failed: ${e.message}`).setColor(error)] });
		}
	},
};
