const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require('discord.js');
const { color, error, checked, xmark } = require("../config.json");

module.exports = {
	name: 'voteban',
	description: 'start a staff vote to ban a member',
	aliases: [],
	usage: ';voteban @user reason',
	category: "moderation",
	guildOnly: false,
	args: false,
	permissions: { bot: [], user: [] },
	execute: async (message, args, client) => {
		if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
			return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} You're missing \`Ban Members\` permission`).setColor(error)] });
		}
		const member = message.mentions.members.first();
		if (!member) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} Mention a valid member`).setColor(error)] });
		if (!member.bannable) return message.reply({ embeds: [new EmbedBuilder().setDescription(`${xmark} I can't ban that user`).setColor(error)] });
		const reason = args.slice(1).join(' ') || 'No reason provided';

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId('voteban_yes').setLabel('Vote Ban').setEmoji('🔨').setStyle(ButtonStyle.Danger),
			new ButtonBuilder().setCustomId('voteban_no').setLabel('Vote No').setStyle(ButtonStyle.Secondary)
		);
		const msg = await message.reply({ embeds: [new EmbedBuilder().setDescription(`🔨 Staff vote: ban ${member}?\n**Reason:** ${reason}\n\n✅ 0 · ❌ 0`).setColor(color)], components: [row] });

		const voters = new Map();
		const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
		collector.on('collect', async i => {
			if (!i.member.permissions.has(PermissionFlagsBits.BanMembers)) {
				return i.reply({ content: `${xmark} Only staff with Ban Members can vote`, ephemeral: true });
			}
			voters.set(i.user.id, i.customId === 'voteban_yes');
			const yes = Array.from(voters.values()).filter(v => v).length;
			const no = Array.from(voters.values()).filter(v => !v).length;
			await i.update({ embeds: [new EmbedBuilder().setDescription(`🔨 Staff vote: ban ${member}?\n**Reason:** ${reason}\n\n✅ ${yes} · ❌ ${no}`).setColor(color)] });
		});
		collector.on('end', async () => {
			const yes = Array.from(voters.values()).filter(v => v).length;
			const no = Array.from(voters.values()).filter(v => !v).length;
			if (yes > no && yes > 0) {
				await member.ban({ reason }).catch(() => {});
				msg.edit({ embeds: [new EmbedBuilder().setDescription(`${checked} Vote passed (${yes}-${no}) — ${member.user.tag} was banned`).setColor(color)], components: [] }).catch(() => {});
			} else {
				msg.edit({ embeds: [new EmbedBuilder().setDescription(`Vote failed (${yes}-${no}) — no action taken`).setColor(error)], components: [] }).catch(() => {});
			}
		});
	},
};
