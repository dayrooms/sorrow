// Shared helper for logging a moderation action as a numbered case.
// Cases are capped at the last 500 per server so this can't grow forever
// and eat up disk space on hosts with small storage allocations.
async function logCase(db, guildId, action, targetId, moderatorId, reason) {
  let cases = await db.get(`cases_${guildId}`) || [];
  let nextId = await db.get(`nextcaseid_${guildId}`) || 1;

  cases.push({
    id: nextId,
    action,
    targetId,
    moderatorId,
    reason: reason || 'No reason provided',
    timestamp: Date.now(),
  });

  if (cases.length > 500) cases = cases.slice(-500);

  await db.set(`cases_${guildId}`, cases);
  await db.set(`nextcaseid_${guildId}`, nextId + 1);
  return nextId;
}

module.exports = { logCase };
