require('dotenv').config();

/**
 * Central static configuration for Sorrow.
 * Per-server settings (prefix, module toggles, etc.) live in the database,
 * NOT here. This file holds things that are the same across every server.
 */

const OWNER_IDS = (process.env.OWNER_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  ownerIds: OWNER_IDS,
  defaultPrefix: process.env.DEFAULT_PREFIX || ';',

  // ── Branding ───────────────────────────────────────────────
  name: 'Sorrow',

  colors: {
    // Primary palette (from the user's reference image)
    primary: 0x8b0a0a, // deep red — default for most embeds
    accent: 0xfbe70a, // bright yellow — used for highlights / subcommands
    success: 0x57f287, // green  — confirmations
    error: 0xed4245, // red    — failures / no-permission
    warn: 0xfee75c, // yellow — warnings
    info: 0x5865f2, // blurple— neutral info
    // A rotating set used so that subcommand embeds shift color automatically.
    // pickSubColor() in utils/embed.js walks through these.
    rotation: [0x8b0a0a, 0xfbe70a, 0xb31217, 0xf5c518, 0xa50e0e, 0xffd60a],
  },

  emojis: {
    // Swap these for custom emoji strings like "<:yes:123456789>" once uploaded.
    yes: '✅',
    no: '❌',
    warn: '⚠️',
    loading: '⏳',
    arrowLeft: '⬅️',
    arrowRight: '➡️',
    sort: '🔃',
    trash: '🗑️',
  },

  // ── Feature flags ──────────────────────────────────────────
  music: {
    enabled: String(process.env.MUSIC_ENABLED).toLowerCase() === 'true',
    host: process.env.LAVALINK_HOST || '127.0.0.1',
    port: parseInt(process.env.LAVALINK_PORT || '2333', 10),
    password: process.env.LAVALINK_PASSWORD || 'youshallnotpass',
  },

  ai: {
    key: process.env.AI_API_KEY || '',
    provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },

  weatherKey: process.env.OPENWEATHER_API_KEY || '',

  // ── Antinuke defaults ──────────────────────────────────────
  // Applied when a server first enables antinuke. Editable per server after.
  antinukeDefaults: {
    enabled: false,
    punishment: 'ban', // ban | kick | strip
    // How many actions within the window before punishment triggers.
    threshold: 3,
    windowMs: 10_000,
  },

  antiraidDefaults: {
    enabled: false,
    // Mass-join: X joins within Y ms trips the raid.
    joinThreshold: 10,
    joinWindowMs: 10_000,
    // Minimum account age (ms) to be allowed in when antiraid is strict.
    minAccountAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    punishment: 'kick', // kick | ban | timeout
  },

  links: {
    support: '', // put your support-server invite here later
  },
};
