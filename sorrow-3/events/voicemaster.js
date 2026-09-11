const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require("discord.js");

const { color } = require("../config.json");

function controlPanel() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vm_lock').setLabel('Lock').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vm_unlock').setLabel('Unlock').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vm_rename').setLabel('Rename').setEmoji('✏️').setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('vm_limit').setLabel('Set Limit').setEmoji('🔢').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('vm_claim').setLabel('Claim').setEmoji('👑').setStyle(ButtonStyle.Secondary)
  );
  return [row1, row2];
}

module.exports = {
  event: "voiceStateUpdate",
  execute: async (oldState, newState, client) => {
    const db = client.db;
    try {
      const guild = newState.guild || oldState.guild;
      const joinChannelId = await db.get(`vm_joinchannel_${guild.id}`);
      if (!joinChannelId) return;

      // User joined the "Join to Create" channel -> make them a new temp VC
      if (newState.channelId === joinChannelId) {
        const category = newState.channel.parent;
        const tempChannel = await guild.channels.create({
          name: `${newState.member.user.username}'s Channel`,
          type: ChannelType.GuildVoice,
          parent: category ? category.id : null,
          permissionOverwrites: [
            {
              id: newState.member.id,
              allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers]
            }
          ]
        });

        await db.set(`vm_temp_${tempChannel.id}`, newState.member.id);
        await newState.member.voice.setChannel(tempChannel).catch(() => {});

        const embed = new EmbedBuilder()
          .setDescription(`🔊 This is your voice channel. Use the buttons below to manage it.`)
          .setColor(color);
        tempChannel.send({ embeds: [embed], components: controlPanel() }).catch(() => {});
        return;
      }

      // Channel emptied out -> delete it if it's a temp VM channel
      if (oldState.channelId) {
        const ownerId = await db.get(`vm_temp_${oldState.channelId}`);
        if (ownerId) {
          const channel = guild.channels.cache.get(oldState.channelId);
          if (channel && channel.members.size === 0) {
            await db.delete(`vm_temp_${oldState.channelId}`);
            channel.delete().catch(() => {});
          }
        }
      }
    } catch {}
  },
};
