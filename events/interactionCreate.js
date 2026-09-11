const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const { color, error, checked, xmark } = require("../config.json");

module.exports = {
  event: "interactionCreate",
  execute: async (interaction, client) => {
    const db = client.db;
    try {

      // ---------- TICKETS ----------
      if (interaction.isButton() && interaction.customId === 'ticket_open') {
        const staffRoleId = await db.get(`ticket_staffrole_${interaction.guild.id}`);
        const categoryId = await db.get(`ticket_category_${interaction.guild.id}`);

        const existingId = await db.get(`ticket_open_${interaction.guild.id}_${interaction.user.id}`);
        if (existingId && interaction.guild.channels.cache.get(existingId)) {
          return interaction.reply({ content: `${xmark} You already have an open ticket: <#${existingId}>`, ephemeral: true });
        }

        const overwrites = [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ];
        if (staffRoleId) overwrites.push({ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: categoryId || null,
          permissionOverwrites: overwrites,
        });

        await db.set(`ticket_open_${interaction.guild.id}_${interaction.user.id}`, ticketChannel.id);

        const embed = new EmbedBuilder()
          .setTitle('🎫 New Ticket')
          .setDescription(`${interaction.user} opened a ticket. Staff will be with you shortly.`)
          .setColor(color);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );
        await ticketChannel.send({ content: staffRoleId ? `<@&${staffRoleId}>` : '', embeds: [embed], components: [row] });

        return interaction.reply({ content: `${checked} Ticket created: ${ticketChannel}`, ephemeral: true });
      }

      if (interaction.isButton() && interaction.customId === 'ticket_close') {
        const staffRoleId = await db.get(`ticket_staffrole_${interaction.guild.id}`);
        const isStaff = staffRoleId && interaction.member.roles.cache.has(staffRoleId);
        const canManage = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
        if (!isStaff && !canManage) {
          return interaction.reply({ content: `${xmark} Only staff can close this ticket`, ephemeral: true });
        }
        await interaction.reply({ content: `🔒 Closing ticket in 5 seconds...` });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        return;
      }

      // ---------- VOICEMASTER ----------
      if (interaction.isButton() && interaction.customId.startsWith('vm_')) {
        const ownerId = await db.get(`vm_temp_${interaction.channel.id}`);
        if (!ownerId) return interaction.reply({ content: `${xmark} This isn't a VoiceMaster channel`, ephemeral: true });
        if (interaction.user.id !== ownerId) {
          return interaction.reply({ content: `${xmark} Only the channel owner can use these controls`, ephemeral: true });
        }

        const voiceChannel = interaction.guild.channels.cache.get(interaction.channel.id === interaction.channel.id ? interaction.member.voice.channelId : null) || interaction.member.voice.channel;
        if (!voiceChannel) return interaction.reply({ content: `${xmark} Join your voice channel first`, ephemeral: true });

        if (interaction.customId === 'vm_lock') {
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
          return interaction.reply({ content: `🔒 Channel locked`, ephemeral: true });
        }
        if (interaction.customId === 'vm_unlock') {
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, { Connect: true });
          return interaction.reply({ content: `🔓 Channel unlocked`, ephemeral: true });
        }
        if (interaction.customId === 'vm_claim') {
          await db.set(`vm_temp_${interaction.channel.id}`, interaction.user.id);
          return interaction.reply({ content: `👑 You now own this channel`, ephemeral: true });
        }
        if (interaction.customId === 'vm_rename') {
          const modal = new ModalBuilder().setCustomId('vm_rename_modal').setTitle('Rename Voice Channel');
          const input = new TextInputBuilder().setCustomId('vm_new_name').setLabel('New channel name').setStyle(TextInputStyle.Short).setMaxLength(90).setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
        if (interaction.customId === 'vm_limit') {
          const modal = new ModalBuilder().setCustomId('vm_limit_modal').setTitle('Set User Limit');
          const input = new TextInputBuilder().setCustomId('vm_new_limit').setLabel('User limit (0 = unlimited, max 99)').setStyle(TextInputStyle.Short).setMaxLength(2).setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return interaction.showModal(modal);
        }
      }

      if (interaction.isModalSubmit() && interaction.customId === 'vm_rename_modal') {
        const ownerId = await db.get(`vm_temp_${interaction.channel.id}`);
        if (!ownerId || interaction.user.id !== ownerId) return interaction.reply({ content: `${xmark} Not your channel`, ephemeral: true });
        const newName = interaction.fields.getTextInputValue('vm_new_name');
        await interaction.channel.setName(newName).catch(() => {});
        return interaction.reply({ content: `✏️ Channel renamed to **${newName}**`, ephemeral: true });
      }

      if (interaction.isModalSubmit() && interaction.customId === 'vm_limit_modal') {
        const ownerId = await db.get(`vm_temp_${interaction.channel.id}`);
        if (!ownerId || interaction.user.id !== ownerId) return interaction.reply({ content: `${xmark} Not your channel`, ephemeral: true });
        const num = parseInt(interaction.fields.getTextInputValue('vm_new_limit'));
        if (isNaN(num) || num < 0 || num > 99) return interaction.reply({ content: `${xmark} Enter a number between 0 and 99`, ephemeral: true });
        await interaction.channel.setUserLimit(num).catch(() => {});
        return interaction.reply({ content: `🔢 User limit set to **${num === 0 ? 'unlimited' : num}**`, ephemeral: true });
      }

    } catch (err) {
      console.error(err);
    }
  },
};
