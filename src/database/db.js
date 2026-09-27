const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');

/**
 * SQLite-backed persistence for Sorrow.
 *
 * Design goals:
 *  - One file, no external DB server → runs on tiny free hosts.
 *  - Structured so migrating to PostgreSQL later is mechanical
 *    (all access goes through the helper methods below, not raw SQL
 *    scattered across the codebase).
 *  - WAL mode for concurrent reads while the bot is writing.
 */

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'sorrow.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ───────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS guilds (
  guild_id      TEXT PRIMARY KEY,
  prefix        TEXT,
  created_at    INTEGER DEFAULT (strftime('%s','now'))
);

-- Generic per-guild key/value store for module settings kept as JSON.
-- Keeps the schema small while letting each module own its shape.
CREATE TABLE IF NOT EXISTS settings (
  guild_id  TEXT NOT NULL,
  module    TEXT NOT NULL,   -- e.g. 'antinuke', 'antiraid', 'welcome'
  data      TEXT NOT NULL,   -- JSON blob
  PRIMARY KEY (guild_id, module)
);

-- Antinuke: per-guild admins (can edit antinuke config even without perms).
CREATE TABLE IF NOT EXISTS antinuke_admins (
  guild_id  TEXT NOT NULL,
  user_id   TEXT NOT NULL,
  added_by  TEXT,
  added_at  INTEGER DEFAULT (strftime('%s','now')),
  PRIMARY KEY (guild_id, user_id)
);

-- Antinuke / antiraid whitelist: users or bots exempt from triggering.
CREATE TABLE IF NOT EXISTS whitelist (
  guild_id  TEXT NOT NULL,
  entity_id TEXT NOT NULL,   -- user or bot id
  type      TEXT NOT NULL DEFAULT 'user', -- user | bot
  scope     TEXT NOT NULL DEFAULT 'antinuke', -- antinuke | antiraid | both
  added_by  TEXT,
  added_at  INTEGER DEFAULT (strftime('%s','now')),
  PRIMARY KEY (guild_id, entity_id, scope)
);

-- Moderation cases (warn / mute / ban / jail / etc.)
CREATE TABLE IF NOT EXISTS cases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id    TEXT NOT NULL,
  case_no     INTEGER NOT NULL, -- per-guild incrementing number
  user_id     TEXT NOT NULL,
  mod_id      TEXT NOT NULL,
  action      TEXT NOT NULL,    -- warn | mute | ban | kick | jail | timeout ...
  reason      TEXT,
  duration    INTEGER,          -- ms, nullable
  active      INTEGER DEFAULT 1,
  created_at  INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_cases_guild_user ON cases (guild_id, user_id);

-- Scheduled un-actions (tempban / mute / timeout expiry, giveaway ends...)
CREATE TABLE IF NOT EXISTS timers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id    TEXT NOT NULL,
  type        TEXT NOT NULL,    -- unban | unmute | untimeout | unjail | giveaway
  target_id   TEXT,             -- user or message id depending on type
  data        TEXT,             -- JSON extra
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_timers_expiry ON timers (expires_at);

-- Snapshots for restore (deleted channels/roles rebuilt from these).
CREATE TABLE IF NOT EXISTS snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id    TEXT NOT NULL,
  type        TEXT NOT NULL,    -- channel | role | vanity
  ref_id      TEXT,             -- original id
  data        TEXT NOT NULL,    -- JSON
  created_at  INTEGER DEFAULT (strftime('%s','now'))
);
CREATE INDEX IF NOT EXISTS idx_snapshots_guild ON snapshots (guild_id, type);

-- Leveling
CREATE TABLE IF NOT EXISTS levels (
  guild_id  TEXT NOT NULL,
  user_id   TEXT NOT NULL,
  xp        INTEGER DEFAULT 0,
  level     INTEGER DEFAULT 0,
  last_msg  INTEGER DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

-- Starboard posted-message tracking
CREATE TABLE IF NOT EXISTS starboard_posts (
  guild_id    TEXT NOT NULL,
  message_id  TEXT NOT NULL,
  star_msg_id TEXT NOT NULL,
  PRIMARY KEY (guild_id, message_id)
);

-- Simple named tag/afk/highlight style stores kept generic via settings too,
-- but AFK is hot-path enough to warrant its own table.
CREATE TABLE IF NOT EXISTS afk (
  guild_id  TEXT NOT NULL,
  user_id   TEXT NOT NULL,
  reason    TEXT,
  since     INTEGER DEFAULT (strftime('%s','now')),
  PRIMARY KEY (guild_id, user_id)
);
`);

// ── Prepared statements ──────────────────────────────────────
const stmts = {
  getGuild: db.prepare('SELECT * FROM guilds WHERE guild_id = ?'),
  upsertPrefix: db.prepare(`
    INSERT INTO guilds (guild_id, prefix) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET prefix = excluded.prefix
  `),
  getSetting: db.prepare('SELECT data FROM settings WHERE guild_id = ? AND module = ?'),
  setSetting: db.prepare(`
    INSERT INTO settings (guild_id, module, data) VALUES (?, ?, ?)
    ON CONFLICT(guild_id, module) DO UPDATE SET data = excluded.data
  `),
  delSetting: db.prepare('DELETE FROM settings WHERE guild_id = ? AND module = ?'),

  addAdmin: db.prepare(`
    INSERT OR IGNORE INTO antinuke_admins (guild_id, user_id, added_by) VALUES (?, ?, ?)
  `),
  delAdmin: db.prepare('DELETE FROM antinuke_admins WHERE guild_id = ? AND user_id = ?'),
  listAdmins: db.prepare('SELECT user_id FROM antinuke_admins WHERE guild_id = ?'),
  isAdmin: db.prepare('SELECT 1 FROM antinuke_admins WHERE guild_id = ? AND user_id = ?'),

  addWhitelist: db.prepare(`
    INSERT OR REPLACE INTO whitelist (guild_id, entity_id, type, scope, added_by)
    VALUES (?, ?, ?, ?, ?)
  `),
  delWhitelist: db.prepare('DELETE FROM whitelist WHERE guild_id = ? AND entity_id = ? AND scope = ?'),
  listWhitelist: db.prepare('SELECT * FROM whitelist WHERE guild_id = ?'),
  isWhitelisted: db.prepare(`
    SELECT 1 FROM whitelist
    WHERE guild_id = ? AND entity_id = ? AND (scope = ? OR scope = 'both')
  `),

  nextCaseNo: db.prepare('SELECT COALESCE(MAX(case_no), 0) + 1 AS n FROM cases WHERE guild_id = ?'),
  addCase: db.prepare(`
    INSERT INTO cases (guild_id, case_no, user_id, mod_id, action, reason, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  userCases: db.prepare('SELECT * FROM cases WHERE guild_id = ? AND user_id = ? ORDER BY case_no DESC'),
  guildCases: db.prepare('SELECT * FROM cases WHERE guild_id = ? ORDER BY case_no DESC LIMIT ?'),

  addTimer: db.prepare(`
    INSERT INTO timers (guild_id, type, target_id, data, expires_at) VALUES (?, ?, ?, ?, ?)
  `),
  dueTimers: db.prepare('SELECT * FROM timers WHERE expires_at <= ?'),
  delTimer: db.prepare('DELETE FROM timers WHERE id = ?'),

  addSnapshot: db.prepare(`
    INSERT INTO snapshots (guild_id, type, ref_id, data) VALUES (?, ?, ?, ?)
  `),
  getSnapshots: db.prepare('SELECT * FROM snapshots WHERE guild_id = ? AND type = ? ORDER BY id DESC'),

  getLevel: db.prepare('SELECT * FROM levels WHERE guild_id = ? AND user_id = ?'),
  upsertLevel: db.prepare(`
    INSERT INTO levels (guild_id, user_id, xp, level, last_msg) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(guild_id, user_id) DO UPDATE SET
      xp = excluded.xp, level = excluded.level, last_msg = excluded.last_msg
  `),
  topLevels: db.prepare('SELECT * FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ?'),

  setAfk: db.prepare('INSERT OR REPLACE INTO afk (guild_id, user_id, reason) VALUES (?, ?, ?)'),
  getAfk: db.prepare('SELECT * FROM afk WHERE guild_id = ? AND user_id = ?'),
  delAfk: db.prepare('DELETE FROM afk WHERE guild_id = ? AND user_id = ?'),
};

// ── Public API ───────────────────────────────────────────────
module.exports = {
  raw: db,

  // Prefix
  getPrefix(guildId) {
    return stmts.getGuild.get(guildId)?.prefix || null;
  },
  setPrefix(guildId, prefix) {
    stmts.upsertPrefix.run(guildId, prefix);
  },

  // Module settings (JSON)
  getSettings(guildId, module, fallback = {}) {
    const row = stmts.getSetting.get(guildId, module);
    if (!row) return { ...fallback };
    try {
      return { ...fallback, ...JSON.parse(row.data) };
    } catch {
      return { ...fallback };
    }
  },
  saveSettings(guildId, module, obj) {
    stmts.setSetting.run(guildId, module, JSON.stringify(obj));
  },
  clearSettings(guildId, module) {
    stmts.delSetting.run(guildId, module);
  },

  // Antinuke admins
  addAntinukeAdmin(guildId, userId, addedBy) {
    stmts.addAdmin.run(guildId, userId, addedBy);
  },
  removeAntinukeAdmin(guildId, userId) {
    stmts.delAdmin.run(guildId, userId);
  },
  listAntinukeAdmins(guildId) {
    return stmts.listAdmins.all(guildId).map((r) => r.user_id);
  },
  isAntinukeAdmin(guildId, userId) {
    return !!stmts.isAdmin.get(guildId, userId);
  },

  // Whitelist
  addWhitelist(guildId, entityId, type, scope, addedBy) {
    stmts.addWhitelist.run(guildId, entityId, type, scope, addedBy);
  },
  removeWhitelist(guildId, entityId, scope) {
    stmts.delWhitelist.run(guildId, entityId, scope);
  },
  listWhitelist(guildId) {
    return stmts.listWhitelist.all(guildId);
  },
  isWhitelisted(guildId, entityId, scope) {
    return !!stmts.isWhitelisted.get(guildId, entityId, scope);
  },

  // Cases
  addCase(guildId, userId, modId, action, reason, duration = null) {
    const caseNo = stmts.nextCaseNo.get(guildId).n;
    stmts.addCase.run(guildId, caseNo, userId, modId, action, reason, duration);
    return caseNo;
  },
  getUserCases(guildId, userId) {
    return stmts.userCases.all(guildId, userId);
  },
  getGuildCases(guildId, limit = 50) {
    return stmts.guildCases.all(guildId, limit);
  },

  // Timers
  addTimer(guildId, type, targetId, data, expiresAt) {
    stmts.addTimer.run(guildId, type, targetId, JSON.stringify(data || {}), expiresAt);
  },
  getDueTimers(now = Date.now()) {
    return stmts.dueTimers.all(now);
  },
  removeTimer(id) {
    stmts.delTimer.run(id);
  },

  // Snapshots
  addSnapshot(guildId, type, refId, data) {
    stmts.addSnapshot.run(guildId, type, refId, JSON.stringify(data));
  },
  getSnapshots(guildId, type) {
    return stmts.getSnapshots.all(guildId, type).map((r) => ({ ...r, data: JSON.parse(r.data) }));
  },

  // Levels
  getLevel(guildId, userId) {
    return stmts.getLevel.get(guildId, userId) || { guild_id: guildId, user_id: userId, xp: 0, level: 0, last_msg: 0 };
  },
  saveLevel(guildId, userId, xp, level, lastMsg) {
    stmts.upsertLevel.run(guildId, userId, xp, level, lastMsg);
  },
  topLevels(guildId, limit = 10) {
    return stmts.topLevels.all(guildId, limit);
  },

  // AFK
  setAfk(guildId, userId, reason) {
    stmts.setAfk.run(guildId, userId, reason);
  },
  getAfk(guildId, userId) {
    return stmts.getAfk.get(guildId, userId);
  },
  removeAfk(guildId, userId) {
    stmts.delAfk.run(guildId, userId);
  },
};
