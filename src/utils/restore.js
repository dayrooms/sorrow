const { ChannelType, PermissionsBitField } = require('discord.js');
const db = require('../database/db');

/**
 * Snapshot & restore for antinuke.
 *
 * We keep lightweight JSON snapshots of channels and roles so that, when an
 * attacker deletes one, we can recreate it with the same name/position/perms.
 * Snapshots are refreshed on create/update events and on startup.
 */

function snapshotChannel(channel) {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    parentId: channel.parentId,
    position: channel.rawPosition,
    topic: channel.topic || null,
    nsfw: channel.nsfw || false,
    bitrate: channel.bitrate || null,
    userLimit: channel.userLimit || null,
    rateLimitPerUser: channel.rateLimitPerUser || null,
    permissionOverwrites: channel.permissionOverwrites?.cache.map((o) => ({
      id: o.id,
      type: o.type,
      allow: o.allow.bitfield.toString(),
      deny: o.deny.bitfield.toString(),
    })) || [],
  };
}

function snapshotRole(role) {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    hoist: role.hoist,
    position: role.rawPosition,
    permissions: role.permissions.bitfield.toString(),
    mentionable: role.mentionable,
    iconURL: role.iconURL() || null,
  };
}

/** Store a fresh snapshot of a channel (replaces prior for that ref). */
function saveChannel(guildId, channel) {
  db.addSnapshot(guildId, 'channel', channel.id, snapshotChannel(channel));
}
function saveRole(guildId, role) {
  db.addSnapshot(guildId, 'role', role.id, snapshotRole(role));
}

/** Full re-snapshot (called on ready + occasionally). Keeps only the latest per ref via dedupe on read. */
function snapshotGuild(guild) {
  for (const ch of guild.channels.cache.values()) saveChannel(guild.id, ch);
  for (const role of guild.roles.cache.values()) {
    if (role.id === guild.id) continue; // skip @everyone
    saveRole(guild.id, role);
  }
}

/** Latest snapshot per ref_id for a type. */
function latestSnapshots(guildId, type) {
  const rows = db.getSnapshots(guildId, type); // newest first
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.ref_id)) continue;
    seen.add(r.ref_id);
    out.push(r.data);
  }
  return out;
}

/** Recreate a deleted channel from its most recent snapshot. */
async function restoreChannel(guild, channelId) {
  const snap = latestSnapshots(guild.id, 'channel').find((s) => s.id === channelId);
  if (!snap) return null;
  const created = await guild.channels
    .create({
      name: snap.name,
      type: snap.type,
      parent: snap.parentId || undefined,
      topic: snap.topic || undefined,
      nsfw: snap.nsfw,
      bitrate: snap.bitrate || undefined,
      userLimit: snap.userLimit || undefined,
      rateLimitPerUser: snap.rateLimitPerUser || undefined,
      permissionOverwrites: snap.permissionOverwrites.map((o) => ({
        id: o.id,
        type: o.type,
        allow: BigInt(o.allow),
        deny: BigInt(o.deny),
      })),
      reason: 'Antinuke restore',
    })
    .catch(() => null);
  if (created) {
    await created.setPosition(snap.position).catch(() => {});
    saveChannel(guild.id, created);
  }
  return created;
}

/** Recreate a deleted role from its most recent snapshot. */
async function restoreRole(guild, roleId) {
  const snap = latestSnapshots(guild.id, 'role').find((s) => s.id === roleId);
  if (!snap) return null;
  const created = await guild.roles
    .create({
      name: snap.name,
      color: snap.color,
      hoist: snap.hoist,
      permissions: BigInt(snap.permissions),
      mentionable: snap.mentionable,
      reason: 'Antinuke restore',
    })
    .catch(() => null);
  if (created) {
    await created.setPosition(snap.position).catch(() => {});
    saveRole(guild.id, created);
  }
  return created;
}

/** Restore ALL recently-deleted channels & roles (used by `antinuke restore`). */
async function restoreAll(guild) {
  const results = { channels: 0, roles: 0 };
  const existingCh = new Set(guild.channels.cache.keys());
  const existingRoles = new Set(guild.roles.cache.keys());

  for (const snap of latestSnapshots(guild.id, 'role')) {
    if (!existingRoles.has(snap.id)) {
      const r = await restoreRole(guild, snap.id);
      if (r) results.roles++;
    }
  }
  for (const snap of latestSnapshots(guild.id, 'channel')) {
    if (!existingCh.has(snap.id)) {
      const c = await restoreChannel(guild, snap.id);
      if (c) results.channels++;
    }
  }
  return results;
}

module.exports = {
  snapshotChannel,
  snapshotRole,
  saveChannel,
  saveRole,
  snapshotGuild,
  latestSnapshots,
  restoreChannel,
  restoreRole,
  restoreAll,
};
