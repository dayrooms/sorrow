const { LEVELS } = require('../utils/permissions');

/**
 * A command definition. Every file in src/commands/**\/*.js exports one of
 * these (or an array of them). Subcommands are handled inside the run()
 * function by inspecting args[0], keeping one file per top-level command.
 *
 * Fields:
 *  - name:        primary invocation, e.g. "role"
 *  - aliases:     alternative names, e.g. ["r"]
 *  - description: shown in help
 *  - category:    folder name, auto-filled by the loader
 *  - permLevel:   one of LEVELS.* (see utils/permissions)
 *  - usage:       argument hint for help, e.g. "<member> <role>"
 *  - examples:    array of example invocations
 *  - guildOnly:   default true — most commands need a guild
 *  - botPerms:    array of PermissionFlagsBits the BOT needs to run this
 *  - run:         async ({ client, message, args, prefix, sub }) => {}
 *
 * Subcommand help: declare `subcommands` as
 *   { create: { usage, description }, delete: {...} }
 * purely for the help system; dispatch still happens in run().
 */
class Command {
  constructor(opts) {
    this.name = opts.name;
    this.aliases = opts.aliases || [];
    this.description = opts.description || 'No description provided.';
    this.category = opts.category || 'misc';
    this.permLevel = opts.permLevel ?? LEVELS.USER;
    this.usage = opts.usage || '';
    this.examples = opts.examples || [];
    this.guildOnly = opts.guildOnly !== false;
    this.botPerms = opts.botPerms || [];
    this.subcommands = opts.subcommands || null;
    this.help = opts.help || null; // { title, intro, subcommands: [{usage, desc}] }
    this.cooldown = opts.cooldown || 0; // ms
    this.run = opts.run;
    if (typeof this.run !== 'function') {
      throw new Error(`Command "${this.name}" is missing a run() function.`);
    }
  }
}

module.exports = Command;
