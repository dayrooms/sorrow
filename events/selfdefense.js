// Protects the bot's own permissions. If someone removes a role from the
// bot itself (an obvious attempt to disable its protections before nuking),
// immediately ban whoever did it and try to restore the role.
const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const { color, error } = require("../config.json");

module.exports = {
  event: "guildMemberUpdate",
  execute: async (oldMember, newMember, client) => {
    try {
      if (newMember.id !== client.user.id) return;

      const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
      if (!removedRoles.size) return;

      const db = client.db;
      const enabled = await db.get(`anti-new_${newMember.guild.id}`);
      if (!enabled) return;

      const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate }).catch(() => null);
      const entry = auditLogs && auditLogs.entries.first();
      if (!entry) return;

      const executorId = entry.executor.id;
      if (executorId === newMember.guild.ownerId || executorId === client.user.id) return;

      const trustedusers = await db.get(`trustedusers_${newMember.guild.id}`) || [];
      if (trustedusers.find(t => t.user == executorId)) return;

      const executorMember = await newMember.guild.members.fetch(executorId).catch(() => null);
      if (executorMember && executorMember.bannable) {
        await executorMember.ban({ reason: "Attempted to strip the bot's own roles/permissions" }).catch(() => {});
      }

      for (const role of removedRoles.values()) {
        await newMember.roles.add(role).catch(() => {});
      }

      const logsId = await db.get(`logs_${newMember.guild.id}`);
      const logChannel = logsId && newMember.guild.channels.cache.get(logsId);
      if (logChannel) {
        logChannel.send({ embeds: [new EmbedBuilder()
          .setDescription(`🛡️ **Self-defense triggered** — <@${executorId}> tried to strip my own roles and was banned. Roles restored.`)
          .setColor(error)] }).catch(() => {});
      }
    } catch {}
  },
};
