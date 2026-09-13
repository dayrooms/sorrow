const { AuditLogEvent } = require("discord.js");
const { recordAndCheck } = require("../utils/nukeguard");

module.exports = {
  event: "guildBanAdd",
  execute: async (ban, client) => {
    try {
      const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
      const entry = auditLogs && auditLogs.entries.first();
      if (!entry) return;
      await recordAndCheck(ban.guild, entry.executor.id, client, "bans");
    } catch {}
  },
};
