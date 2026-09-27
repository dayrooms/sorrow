const fs = require('node:fs');
const path = require('node:path');

/**
 * Loads every event in src/events. Each file exports:
 *   { name: 'messageCreate', once?: false, execute(client, ...args) {} }
 */
module.exports = function loadEvents(client) {
  const eventsDir = path.join(__dirname, '..', 'events');
  if (!fs.existsSync(eventsDir)) return 0;

  let count = 0;
  for (const file of fs.readdirSync(eventsDir)) {
    if (!file.endsWith('.js')) continue;
    const mod = require(path.join(eventsDir, file));
    const events = Array.isArray(mod) ? mod : [mod];
    for (const event of events) {
      if (!event?.name || typeof event.execute !== 'function') {
        client.logger?.warn(`Skipping an event in ${file}: missing name/execute.`);
        continue;
      }
      const bound = (...args) => event.execute(client, ...args);
      if (event.once) client.once(event.name, bound);
      else client.on(event.name, bound);
      count++;
    }
  }

  client.logger?.info(`Loaded ${count} events.`);
  return count;
};
