const SorrowClient = require('./structures/SorrowClient');
const loadCommands = require('./handlers/commandHandler');
const loadEvents = require('./handlers/eventHandler');
const config = require('./config');
const logger = require('./utils/logger');

// ── Fail fast on missing critical config ─────────────────────
if (!config.token) {
  logger.error('No TOKEN set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
if (!config.ownerIds.length) {
  logger.warn('No OWNER_IDS set — nobody will have dev/owner access.');
}

const client = new SorrowClient();

loadCommands(client);
loadEvents(client);

// ── Global safety nets so one bad command never crashes the bot ──
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err?.stack || err}`);
});

client.login(config.token).catch((err) => {
  logger.error(`Login failed: ${err.message}`);
  process.exit(1);
});
