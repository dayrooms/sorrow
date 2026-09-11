const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'ticketpanel',
	description: 'send a panel that lets members open support tickets',
	aliases: ["tickets"],
	usage: ';ticketpanel\n;ticketpanel role @Staff\n;ticketpanel category #category',
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

		if (args[0] === 'role') {
			let role = message.mentions.roles.first();
			if (!role) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid role`).setColor(error)] });
			await db.set(`ticket_staffrole_${message.guild.id}`, role.id);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Ticket staff role set to ${role}`).setColor(color)] });
		}

		if (args[0] === 'category') {
			let categoryId = args[1] || (message.mentions.channels.first() && message.mentions.channels.first().id);
			let category = message.guild.channels.cache.get(categoryId);
			if (!category || category.type !== 4) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Provide a valid category ID`).setColor(error)] });
			await db.set(`ticket_category_${message.guild.id}`, category.id);
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${checked} Tickets will be created under ${category.name}`).setColor(color)] });
		}

		const embed = new EmbedBuilder()
			.setTitle('🎫 Support Tickets')
			.setDescription('Click the button below to open a private ticket with staff.')
			.setColor(color);

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('ticket_open')
				.setLabel('Open Ticket')
				.setEmoji('🎫')
				.setStyle(ButtonStyle.Primary)
		);

		await message.channel.send({ embeds: [embed], components: [row] });
		message.delete().catch(() => {});
	},
};
