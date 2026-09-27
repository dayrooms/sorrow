const fs = require('node:fs');
const path = require('node:path');
const Command = require('../structures/Command');

/**
 * Recursively loads every command in src/commands, registering names and
 * aliases into client.commands / client.aliases. The folder name becomes the
 * command's category (used by the help menu's dropdown).
 */
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

module.exports = function loadCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const files = walk(commandsDir);
  let count = 0;

  for (const file of files) {
    let mod;
    try {
      delete require.cache[require.resolve(file)];
      mod = require(file);
    } catch (err) {
      client.logger?.error(`Failed to require command ${file}: ${err.stack}`);
      continue;
    }

    const defs = Array.isArray(mod) ? mod : [mod];
    for (const def of defs) {
      if (!(def instanceof Command)) {
        client.logger?.warn(`Skipping ${file}: does not export a Command.`);
        continue;
      }
      // category = immediate parent folder under commands/
      const rel = path.relative(commandsDir, file);
      def.category = rel.split(path.sep)[0];

      if (client.commands.has(def.name)) {
        client.logger?.warn(`Duplicate command name "${def.name}" in ${file}.`);
      }
      client.commands.set(def.name, def);
      for (const alias of def.aliases) {
        if (client.aliases.has(alias)) {
          client.logger?.warn(`Duplicate alias "${alias}" (from ${def.name}).`);
        }
        client.aliases.set(alias, def.name);
      }
      count++;
    }
  }

  client.logger?.info(`Loaded ${count} commands (${client.aliases.size} aliases).`);
  return count;
};
