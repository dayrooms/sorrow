const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveChannel } = require('../../utils/resolve');
const { buildMessage, VARIABLE_LIST } = require('../../utils/messageBuilder');
const db = require('../../database/db');

/**
 * Factory for the greet-style systems (welcome, goodbye, boosts). Each stores
 * { channel, message } under its own settings module. joindm is separate
 * (no channel — DMs the user).
 */
function greetCommand(name, moduleKey, label, dm = false) {
  return new Command({
    name,
    category: 'engagement',
    description: `Configure ${label} messages.`,
    permLevel: LEVELS.ADMIN,
    usage: 'add/edit/remove/list/test <...>',
    async run({ message, args, prefix, sub }) {
      const data = db.getSettings(message.guild.id, moduleKey, { channel: null, message: null });

      switch (sub) {
        case 'add':
        case 'edit': {
          // First arg may be a channel (for non-dm), rest is the script.
          let script = args.slice(1).join(' ');
          if (!dm) {
            const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
            if (ch) {
              data.channel = ch.id;
              script = args.slice(2).join(' ');
            }
          }
          if (!script && !data.message) return message.reply({ embeds: [error(`Usage: \`${prefix}${name} add ${dm ? '' : '[#channel] '}<message>\`\nSee \`${prefix}variables\` for variables.`)] });
          if (script) data.message = script;
          db.saveSettings(message.guild.id, moduleKey, data);
          return message.reply({ embeds: [success(message.author, `${label} message ${sub === 'add' ? 'set' : 'updated'}${!dm && data.channel ? ` for <#${data.channel}>` : ''}.`)] });
        }
        case 'remove':
          db.clearSettings(message.guild.id, moduleKey);
          return message.reply({ embeds: [success(message.author, `Removed the ${label} message.`)] });
        case 'list':
        case 'view':
          return message.channel.send({ embeds: [base().setTitle(`${label} config`).setDescription(`**Channel:** ${data.channel ? `<#${data.channel}>` : dm ? 'DM' : 'not set'}\n**Message:**\n\`\`\`${data.message || 'none'}\`\`\``)] });
        case 'test': {
          if (!data.message) return message.reply({ embeds: [error('No message configured.')] });
          const payload = buildMessage(data.message, { user: message.author, member: message.member, guild: message.guild, channel: message.channel });
          if (dm) { await message.author.send(payload).catch(() => message.reply({ embeds: [error('I could not DM you.')] })); return message.reply({ embeds: [success(message.author, 'Sent the test to your DMs.')] }); }
          const ch = data.channel ? message.guild.channels.cache.get(data.channel) : message.channel;
          await ch?.send(payload).catch(() => {});
          return message.reply({ embeds: [success(message.author, `Sent a test ${label} message.`)] });
        }
        default:
          return message.channel.send({ embeds: [base().setTitle(label).setDescription(`\`${prefix}${name} add ${dm ? '' : '[#channel] '}<message>\`\n\`${prefix}${name} edit/remove/list/test\``)] });
      }
    },
  });
}

const welcome = greetCommand('welcome', 'welcome', 'Welcome', false);
const goodbye = greetCommand('goodbye', 'goodbye', 'Goodbye', false);
const boosts = greetCommand('boosts', 'boosts', 'Boost', false);
const joindm = greetCommand('joindm', 'joindm', 'Join DM', true);

const variables = new Command({
  name: 'variables',
  aliases: ['vars'],
  category: 'engagement',
  description: 'List variables usable in custom messages.',
  permLevel: LEVELS.USER,
  async run({ message }) {
    return message.channel.send({ embeds: [base().setTitle('Message variables').setDescription(VARIABLE_LIST.join('\n') + '\n\n**Embed tokens:** `{title:}` `{description:}` `{color:}` `{image:}` `{thumbnail:}` `{footer:}` `{content:}` `{field: name | value}`')] });
  },
});

module.exports = [welcome, goodbye, boosts, joindm, variables];
