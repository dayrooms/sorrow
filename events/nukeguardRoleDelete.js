const { AuditLogEvent } = require("discord.js");
const { recordAndCheck } = require("../utils/nukeguard");

module.exports = {
  event: "roleDelete",
  execute: async (role, client) => {
    try {
      const auditLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete }).catch(() => null);
      const entry = auditLogs && auditLogs.entries.first();
      if (!entry) return;
      await recordAndCheck(role.guild, entry.executor.id, client, "role deletes");
    } catch {}
  },
};
