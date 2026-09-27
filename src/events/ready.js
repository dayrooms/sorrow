const { ActivityType } = require('discord.js');
const { startScheduler } = require('../utils/scheduler');
const { initAntinuke } = require('../utils/antinukeListeners');
const { initAntiraid } = require('../utils/antiraidListeners');
const { initLogging } = require('../utils/loggingListeners');
const restore = require('../utils/restore');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    client.logger.success(
      `Logged in as ${client.user.tag} — serving ${client.guilds.cache.size} guild(s).`
    );
    client.user.setPresence({
      activities: [{ name: `${client.config.defaultPrefix}help`, type: ActivityType.Watching }],
      status: 'dnd',
    });

    // Start the timer scheduler (tempban/mute expiry, giveaways, reminders).
    startScheduler(client);

    // Attach protection listeners.
    initAntinuke(client);
    initAntiraid(client);
    initLogging(client);

    // Snapshot every guild's structure so antinuke restore has data to work with.
    for (const guild of client.guilds.cache.values()) {
      try {
        restore.snapshotGuild(guild);
      } catch (err) {
        client.logger.warn(`Snapshot failed for ${guild.id}: ${err.message}`);
      }
    }
    client.logger.success('Startup snapshots complete.');
  },
};
