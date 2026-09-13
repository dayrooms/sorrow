// Shared helper: a member can use a moderation command if they either
// natively hold the required Discord permission, OR are on the server's
// antinuke whitelist (trusted users the owner has explicitly approved).
async function hasModPermission(member, guild, db, permissionFlag) {
  if (member.permissions.has(permissionFlag)) return true;
  const trustedusers = await db.get(`trustedusers_${guild.id}`) || [];
  return !!trustedusers.find(t => t.user == member.id);
}

module.exports = { hasModPermission };
