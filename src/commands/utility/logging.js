const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel } = require('../../utils/resolve');
const db = require('../../database/db');

const EVENTS = [
  'messageDelete', 'messageEdit', 'messageBulkDelete',
  'memberJoin', 'memberLeave', 'memberBan', 'memberUnban', 'memberUpdate',
  'channelCreate', 'channelDelete', 'channelUpdate',
  'roleCreate', 'roleDelete', 'roleUpdate',
  'voiceJoin', 'voiceLeave', 'voiceMove',
  'emojiUpdate', 'nicknameChange', 'inviteCreate',
];

module.exports = new Command({
  name: 'logging',
  aliases: ['logs', 'log'],
  category: 'utility',
  description: 'Configure server audit logging.',
  permLevel: LEVELS.ADMIN,
  usage: 'setup [#channel] | edit <event> <#channel> | events | config | reset',
  help: {
    title: 'Server audit logging',
    intro: 'Log server events (message edits/deletes, joins/leaves, bans, role & channel changes, voice activity) to a channel. `;logging setup` routes everything to one channel; `edit` routes individual events.',
    subcommands: [
      { usage: 'setup [#channel]', desc: 'Enable logging and send all events to one channel (defaults to the current channel).' },
      { usage: 'edit <event> <#channel>', desc: 'Route a single event type to its own channel.' },
      { usage: 'events', desc: 'List every event you can log.' },
      { usage: 'config', desc: 'Show the current logging configuration.' },
      { usage: 'reset', desc: 'Turn off logging and clear its config.' },
    ],
  },
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'logging', { channel: null, events: {} });

    switch (sub) {
      case 'setup': {
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first() || message.channel;
        cfg.channel = ch.id;
        // Enable all events pointing to this channel by default.
        for (const e of EVENTS) cfg.events[e] = ch.id;
        db.saveSettings(message.guild.id, 'logging', cfg);
        return message.reply({ embeds: [success(message.author, `Logging enabled — all events → ${ch}.`)] });
      }
      case 'edit': {
        const event = args[1];
        const ch = resolveChannel(message.guild, args[2]) || message.mentions.channels?.first();
        if (!EVENTS.includes(event) || !ch) return message.reply({ embeds: [error(`Usage: \`${prefix}logging edit <event> <#channel>\`\nEvents: ${EVENTS.join(', ')}`)] });
        cfg.events[event] = ch.id;
        db.saveSettings(message.guild.id, 'logging', cfg);
        return message.reply({ embeds: [success(message.author, `\`${event}\` logs → ${ch}.`)] });
      }
      case 'events':
        return message.channel.send({ embeds: [base().setTitle('Loggable events').setDescription(EVENTS.map((e) => `\`${e}\``).join(', '))] });
      case 'config':
        return message.channel.send({ embeds: [base().setTitle('Logging config').setDescription(`**Default channel:** ${cfg.channel ? `<#${cfg.channel}>` : 'none'}\n**Enabled events:** ${Object.keys(cfg.events).length}/${EVENTS.length}`)] });
      case 'reset':
        db.clearSettings(message.guild.id, 'logging');
        return message.reply({ embeds: [success(message.author, 'Logging reset.')] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Logging').setDescription(`\`${prefix}logging setup [#channel]\` — log everything to one channel\n\`${prefix}logging edit <event> <#channel>\` — route one event\n\`${prefix}logging events/config/reset\``)] });
    }
  },
});

module.exports.EVENTS = EVENTS;
