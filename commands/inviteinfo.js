const { EmbedBuilder } = require('discord.js');
const { color, error, xmark } = require("../config.json");

module.exports = {
	name: 'inviteinfo',
	description: 'view information about a Discord server invite',
	aliases: [],
	usage: ';inviteinfo <invite code or link>',
	category: "information",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const code = args[0] ? args[0].split('/').pop() : null;
		if (!code) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide an invite code or link`).setColor(error)] });

		try {
			const invite = await client.fetchInvite(code);
			const embed = new EmbedBuilder()
				.setTitle(invite.guild ? invite.guild.name : 'Unknown Server')
				.addFields(
					{ name: 'Members', value: `${invite.memberCount || 'Unknown'}`, inline: true },
					{ name: 'Online', value: `${invite.presenceCount || 'Unknown'}`, inline: true },
					{ name: 'Channel', value: invite.channel ? invite.channel.name : 'Unknown', inline: true },
					{ name: 'Inviter', value: invite.inviter ? invite.inviter.tag : 'Unknown', inline: true }
				)
				.setColor(color);
			if (invite.guild && invite.guild.iconURL()) embed.setThumbnail(invite.guild.iconURL());
			message.reply({ embeds: [embed] });
		} catch {
			message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Couldn't find that invite`).setColor(error)] });
		}
	},
};
