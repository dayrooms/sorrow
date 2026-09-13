// Fast, rate-based catch-all antinuke layer. This runs IN ADDITION to the
// per-event-type checks elsewhere — even if a specific sub-toggle (antiban,
// antichannel, etc.) isn't individually enabled, anyone performing several
// destructive actions in rapid succession gets stopped immediately as long
// as the antinuke master switch is on. This closes the gap where an
// attacker uses an action type nobody thought to specifically toggle.
const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { color, error } = require("../config.json");

const actionLog = new Map(); // guildId -> [{executorId, timestamp}]
const RATE_WINDOW_MS = 8000;
const RATE_THRESHOLD = 3;

async function recordAndCheck(guild, executorId, client, actionLabel) {
  if (executorId === client.user.id) return;
  if (executorId === guild.ownerId) return;

  const db = client.db;
  const enabled = await db.get(`anti-new_${guild.id}`);
  if (!enabled) return;

  const trustedusers = await db.get(`trustedusers_${guild.id}`) || [];
  if (trustedusers.find(t => t.user == executorId)) return;

  const now = Date.now();
  let log = actionLog.get(guild.id) || [];
  log = log.filter(e => now - e.timestamp < RATE_WINDOW_MS);
  log.push({ executorId, timestamp: now });
  actionLog.set(guild.id, log);

  const executorActions = log.filter(e => e.executorId === executorId);
  if (executorActions.length < RATE_THRESHOLD) return;

  // Threshold crossed — this executor is moving too fast to be legitimate.
  actionLog.set(guild.id, log.filter(e => e.executorId !== executorId));

  try {
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (member && member.bannable) {
      await member.ban({ reason: `Nukeguard: ${executorActions.length} destructive actions (${actionLabel}) within ${RATE_WINDOW_MS / 1000}s` });
    }

    const logsId = await db.get(`logs_${guild.id}`);
    const logChannel = logsId && guild.channels.cache.get(logsId);
    if (logChannel) {
      logChannel.send({ embeds: [new EmbedBuilder()
        .setDescription(`🚨 **Nukeguard triggered** — <@${executorId}> performed ${executorActions.length} destructive actions in ${RATE_WINDOW_MS / 1000}s and was banned.`)
        .setColor(error)] }).catch(() => {});
    }
  } catch {}
}

module.exports = { recordAndCheck };
