const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../database/db');

/**
 * The Sorrow client. Extends discord.js Client with our own collections and
 * shared services so command/event files can reach everything via `client`.
 */
class SorrowClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // privileged — antiraid, autorole, counters
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // privileged — prefix commands, filters
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates, // voicemaster, vc levels
        GatewayIntentBits.GuildModeration, // ban/unban audit events
        GatewayIntentBits.GuildPresences, // privileged — activity, vanity status, seen
        GatewayIntentBits.GuildExpressions, // emoji/sticker events for antinuke
        GatewayIntentBits.GuildWebhooks, // webhook antinuke
        GatewayIntentBits.GuildInvites, // invite tracker
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
      ],
      allowedMentions: { parse: ['users'], repliedUser: false },
    });

    this.config = config;
    this.logger = logger;
    this.db = db;

    this.commands = new Collection(); // name -> Command
    this.aliases = new Collection(); // alias -> name
    this.cooldowns = new Collection(); // `${cmd}:${user}` -> timestamp

    // In-memory guards for antinuke/antiraid rate windows.
    // Map<guildId, Map<actorId, {count, first}>>
    this.antinukeBuckets = new Map();
    this.antiraidJoinBucket = new Map(); // guildId -> [timestamps]

    // Snipe caches: Map<channelId, Array>
    this.snipes = new Map();
    this.editSnipes = new Map();
    this.reactionSnipes = new Map();
  }

  /** Resolve a guild's active prefix (custom or default). */
  prefixFor(guildId) {
    return db.getPrefix(guildId) || config.defaultPrefix;
  }
}

module.exports = SorrowClient;
