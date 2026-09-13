const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { color, error, checked } = require("../config.json");

module.exports = {
	name: 'marry',
	description: 'propose marriage to another user',
	aliases: [],
	usage: ';marry @user',
	category: "games",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		const db = client.db;
		const target = message.mentions.users.first();
		if (!target) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ Mention a user to propose to`).setColor(error)] });
		if (target.id === message.author.id) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You can't marry yourself`).setColor(error)] });
		if (target.bot) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You can't marry a bot`).setColor(error)] });

		const existing = await db.get(`married_${message.author.id}`);
		if (existing) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ You're already married to <@${existing}>`).setColor(error)] });
		const targetExisting = await db.get(`married_${target.id}`);
		if (targetExisting) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ That user is already married`).setColor(error)] });

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('marry_yes').setLabel('Accept').setEmoji('💍').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId('marry_no').setLabel('Decline').setStyle(ButtonStyle.Danger)
		);
		const msg = await message.reply({ content: `${target}`, embeds: [new EmbedBuilder().setDescription(`💍 ${message.author} proposed to you! Do you accept?`).setColor(color)], components: [row] });

		const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000, max: 1 });
		collector.on('collect', async i => {
			if (i.user.id !== target.id) return i.reply({ content: `❌ Only ${target.tag} can respond`, ephemeral: true });
			if (i.customId === 'marry_yes') {
				await db.set(`married_${message.author.id}`, target.id);
				await db.set(`married_${target.id}`, message.author.id);
				await i.update({ content: null, embeds: [new EmbedBuilder().setDescription(`${checked} ${message.author} and ${target} are now married! 💕`).setColor(color)], components: [] });
			} else {
				await i.update({ content: null, embeds: [new EmbedBuilder().setDescription(`💔 ${target} declined the proposal`).setColor(error)], components: [] });
			}
		});
		collector.on('end', collected => {
			if (collected.size === 0) msg.edit({ components: [] }).catch(() => {});
		});
	},
};
