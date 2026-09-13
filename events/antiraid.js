const { EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const { color, error } = require("../config.json");

const joinTimestamps = new Map();
const lockedGuilds = new Set();

module.exports = {
  event: "guildMemberAdd",
  execute: async (member, client) => {
    try {
      const db = client.db;
      const guildId = member.guild.id;

      const enabled = await db.get(`antiraid_${guildId}`);
      if (!enabled) return;
      if (lockedGuilds.has(guildId)) return;

      const threshold = await db.get(`antiraid_threshold_${guildId}`) || 5;
      const now = Date.now();

      let timestamps = joinTimestamps.get(guildId) || [];
      timestamps = timestamps.filter(t => now - t < 10000);
      timestamps.push(now);
      joinTimestamps.set(guildId, timestamps);

      if (timestamps.length >= threshold) {
        lockedGuilds.add(guildId);
        joinTimestamps.set(guildId, []);

        let count = 0;
        for (const channel of member.guild.channels.cache.values()) {
          if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) continue;
          try {
            await channel.permissionOverwrites.edit(member.guild.id, { SendMessages: false });
            count++;
          } catch {}
        }

        const logsId = await db.get(`logs_${guildId}`);
        const logChannel = logsId && member.guild.channels.cache.get(logsId);
        const embed = new EmbedBuilder()
          .setDescription(`🚨 **Raid detected** — ${timestamps.length >= threshold ? threshold : timestamps.length}+ joins in 10 seconds.\nLocked ${count} channels automatically. Use \`;raid unlock\` when it's safe.`)
          .setColor(error);
        if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});

        setTimeout(() => lockedGuilds.delete(guildId), 300000);
      }
    } catch {}
  },
};
