const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'reactionroles',
	description: 'let members react to a message to get a role',
	aliases: ["rr"],
	usage: ';reactionroles add <message link/id> <emoji> @role\n;reactionroles remove <message link/id> <emoji>\n;reactionroles list',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;

		if (args[0] === 'list') {
			let entries = await db.get(`reactionroles_${message.guild.id}`) || [];
			if (!entries.length) return message.reply({ embeds: [new EmbedBuilder().setDescription(`No reaction roles set up`).setColor(color)] });
			const list = entries.map(e => `${e.emoji} → <@&${e.roleId}> on [message](https://discord.com/channels/${message.guild.id}/${e.channelId}/${e.messageId})`).join('\n');
			return message.reply({ embeds: [new EmbedBuilder().setTitle('Reaction Roles').setDescription(list.slice(0, 4000)).setColor(color)] });
		}

		if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Roles\` permission`).setColor(error)] });
		}

		const rawIdOrLink = args[1];
		const messageId = rawIdOrLink && rawIdOrLink.split('/').pop();
		if (!messageId) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a message link or ID`).setColor(error)] });

		let targetMessage = null;
		for (const channel of message.guild.channels.cache.values()) {
			if (!channel.isTextBased || !channel.isTextBased()) continue;
			targetMessage = await channel.messages.fetch(messageId).catch(() => null);
			if (targetMessage) break;
		}
		if (!targetMessage) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Couldn't find that message`).setColor(error)] });

		if (args[0] === 'remove') {
			const emoji = args[2];
			let entries = await db.get(`reactionroles_${message.guild.id}`) || [];
			entries = entries.filter(e => !(e.messageId === messageId && e.emoji === emoji));
			await db.set(`reactionroles_${message.guild.id}`, entries);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed that reaction role`).setColor(color)] });
		}

		if (args[0] === 'add') {
			const emoji = args[2];
			const role = message.mentions.roles.first();
			if (!emoji || !role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Usage: \`;reactionroles add <message link/id> <emoji> @role\``).setColor(error)] });

			await targetMessage.react(emoji).catch(() => {});
			let entries = await db.get(`reactionroles_${message.guild.id}`) || [];
			entries.push({ messageId, channelId: targetMessage.channel.id, emoji, roleId: role.id });
			await db.set(`reactionroles_${message.guild.id}`, entries);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Reacting with ${emoji} on that message now gives ${role}`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;reactionroles add/remove/list\``).setColor(color)] });
	},
};
