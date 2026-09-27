const { ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

/** VoiceMaster: create a temp channel on join-to-create, delete when empty. */
module.exports = {
  name: 'voiceStateUpdate',
  async execute(client, oldState, newState) {
    const guild = newState.guild;
    const cfg = db.getSettings(guild.id, 'voicemaster', { joinChannel: null, category: null, temps: {} });
    if (!cfg.joinChannel) return;

    try {
      // Joined the "join to create" channel → make them a temp channel.
      if (newState.channelId === cfg.joinChannel) {
        const temp = await guild.channels.create({
          name: `${newState.member.displayName}'s channel`,
          type: ChannelType.GuildVoice,
          parent: cfg.category || undefined,
          permissionOverwrites: [{ id: newState.member.id, allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers] }],
        }).catch(() => null);
        if (temp) {
          cfg.temps = cfg.temps || {};
          cfg.temps[temp.id] = newState.member.id;
          db.saveSettings(guild.id, 'voicemaster', cfg);
          await newState.member.voice.setChannel(temp).catch(() => {});
        }
      }

      // Left a temp channel that's now empty → delete it.
      if (oldState.channelId && cfg.temps?.[oldState.channelId]) {
        const ch = guild.channels.cache.get(oldState.channelId);
        if (ch && ch.members.size === 0) {
          await ch.delete('VoiceMaster: empty').catch(() => {});
          delete cfg.temps[oldState.channelId];
          db.saveSettings(guild.id, 'voicemaster', cfg);
        }
      }
    } catch {}
  },
};
