const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'thread',
	description: 'manage threads and forum posts',
	aliases: [],
	usage: ';thread lock [reason]\n;thread unlock [reason]\n;thread rename <name>\n;thread add @user\n;thread remove @user',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.channel.isThread || !message.channel.isThread()) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} This command only works inside a thread`).setColor(error)] });
		}
		if (!message.member.permissions.has(PermissionFlagsBits.ManageThreads)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Manage Threads\` permission`).setColor(error)] });
		}

		if (args[0] === 'lock') {
			await message.channel.setLocked(true, args.slice(1).join(' ') || undefined).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Thread locked`).setColor(color)] });
		}
		if (args[0] === 'unlock') {
			await message.channel.setLocked(false, args.slice(1).join(' ') || undefined).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Thread unlocked`).setColor(color)] });
		}
		if (args[0] === 'rename') {
			const name = args.slice(1).join(' ');
			if (!name) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a new name`).setColor(error)] });
			await message.channel.setName(name).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Renamed thread`).setColor(color)] });
		}
		if (args[0] === 'add') {
			const member = message.mentions.members.first();
			if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a member`).setColor(error)] });
			await message.channel.members.add(member.id).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Added ${member} to the thread`).setColor(color)] });
		}
		if (args[0] === 'remove') {
			const member = message.mentions.members.first();
			if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a member`).setColor(error)] });
			await message.channel.members.remove(member.id).catch(() => {});
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Removed ${member} from the thread`).setColor(color)] });
		}

		message.reply({ embeds: [new EmbedBuilder().setDescription(`Use \`;thread lock/unlock/rename/add/remove\``).setColor(color)] });
	},
};
