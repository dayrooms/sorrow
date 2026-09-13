const { AuditLogEvent } = require("discord.js");
const { recordAndCheck } = require("../utils/nukeguard");

module.exports = {
  event: "channelDelete",
  execute: async (channel, client) => {
    try {
      if (!channel.guild) return;
      const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete }).catch(() => null);
      const entry = auditLogs && auditLogs.entries.first();
      if (!entry) return;
      await recordAndCheck(channel.guild, entry.executor.id, client, "channel deletes");
    } catch {}
  },
};
