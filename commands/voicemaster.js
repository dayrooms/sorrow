const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'voicemaster',
	description: 'set up a join-to-create voice channel system',
	aliases: ["vm", "vcmaster"],
	usage: ';voicemaster setup\n;voicemaster off',
	category: "config",
	guildOnly: false,
	args: false,
	permissions: {
		bot: [],
		user: [],
	},
	execute: async (message, args, client) => {
		const db = client.db;

		let missperms = new EmbedBuilder()
			.setDescription(`${xmark} You're missing \`Manage Guild\` permission`)
			.setColor(error);
		if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [missperms] });

		if (args[0] === 'off') {
			let joinChannelId = await db.get(`vm_joinchannel_${message.guild.id}`);
			await db.delete(`vm_joinchannel_${message.guild.id}`);
			await db.delete(`vm_category_${message.guild.id}`);
			if (joinChannelId) {
				let ch = message.guild.channels.cache.get(joinChannelId);
				if (ch) ch.delete().catch(() => {});
			}
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} VoiceMaster disabled and cleaned up`).setColor(color)] });
		}

		// Default: setup
		const category = await message.guild.channels.create({
			name: 'Voice Channels',
			type: ChannelType.GuildCategory,
		});

		const joinChannel = await message.guild.channels.create({
			name: '➕ Join to Create',
			type: ChannelType.GuildVoice,
			parent: category.id,
		});

		await db.set(`vm_joinchannel_${message.guild.id}`, joinChannel.id);
		await db.set(`vm_category_${message.guild.id}`, category.id);

		return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} VoiceMaster set up! Join **${joinChannel.name}** to create your own voice channel.`).setColor(color)] });
	},
};
