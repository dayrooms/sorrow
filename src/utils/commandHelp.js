const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require('discord.js');
const { base } = require('./embed');
const { chunk } = require('./paginate');
const config = require('../config');
const { LEVELS } = require('./permissions');

/** Readable permission label from a permLevel (fallback when a schema gives none). */
function permLabel(level) {
  switch (level) {
    case LEVELS.MOD: return 'Manage Messages';
    case LEVELS.ADMIN: return 'Administrator';
    case LEVELS.ANTINUKE_ADMIN: return 'Antinuke Admin';
    case LEVELS.GUILD_OWNER: return 'Server Owner';
    case LEVELS.BOT_OWNER: return 'Bot Owner';
    default: return 'Everyone';
  }
}

/**
 * Renders rich help for a grouped command from its `help` schema:
 *   help = { title, intro, subcommands: [{ usage, desc }] }
 *
 * Produces: an intro embed + a dropdown to jump to any subcommand's detail
 * card, and (via the dropdown's "Full list" option) paginated list pages.
 * Command/subcommand names are shown in bold.
 *
 * @param {Message} message
 * @param {Command} cmd     the command whose .help schema to render
 * @param {string}  prefix
 * @param {string}  [emoji] optional emoji string to prefix titles
 */
async function renderCommandHelp(message, cmd, prefix, emoji = '') {
  const schema = cmd.help;
  // Emoji live only on the main help dropdown — command help cards are clean text.
  const pfx = '';
  const name = cmd.name;

  const intro = base(config.colors.primary)
    .setTitle(`${pfx}${name} — ${schema.title || cmd.description}`)
    .setDescription(
      [
        schema.intro || cmd.description,
        '',
        cmd.aliases.length ? `**Aliases:** ${cmd.aliases.map((a) => `\`${a}\``).join(', ')}` : null,
        `**Usage:** \`${prefix}${name} ${cmd.usage || ''}\``,
        '',
        `Use the dropdown to view any subcommand, or pick **Full list**.`,
      ].filter(Boolean).join('\n')
    )
    .setFooter({ text: `${schema.subcommands.length} subcommands` });

  // Build the full-list pages (bold subcommand names).
  const listPages = [];
  for (const group of chunk(schema.subcommands, 8)) {
    const e = base(config.colors.accent).setTitle(`${pfx}${name} — all commands`);
    e.setDescription(group.map((sc) => `**${prefix}${name} ${firstWord(sc.usage)}**\n${sc.desc}`).join('\n\n'));
    listPages.push(e);
  }

  // The dropdown: one option per subcommand + Overview + Full list.
  const options = [
    { label: 'Overview', value: '__overview', emoji: '🏠', description: 'Back to the intro' },
    { label: 'Full list', value: '__list', emoji: '📜', description: 'Every subcommand at once' },
    ...schema.subcommands.slice(0, 23).map((sc, idx) => ({
      label: `${name} ${firstWord(sc.usage)}`.slice(0, 100),
      value: String(idx),
      description: sc.desc.slice(0, 100),
    })),
  ];
  const menu = new StringSelectMenuBuilder()
    .setCustomId('cmdhelp')
    .setPlaceholder(`Select a ${name} subcommand`)
    .addOptions(options);

  const detailFor = (idx) => {
    const sc = schema.subcommands[idx];
    const key = firstWord(sc.usage);
    const syntax = `${prefix}${name} ${sc.usage}`;
    const example = sc.example ? `${prefix}${name} ${sc.example}` : exampleFromUsage(prefix, name, sc.usage);
    // Permission: per-subcommand override -> command-level default -> from permLevel
    const perm = sc.perm || schema.perm || permLabel(cmd.permLevel);
    // Aliases: per-subcommand aliases if given, else none
    const aliases = (sc.aliases && sc.aliases.length) ? sc.aliases.map((a) => `\`${a}\``).join(', ') : 'None';

    const e = base(config.colors.accent)
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
      .setTitle(`Command: ${name} ${key}`)
      .setDescription(
        sc.desc + (config.links.support ? `\nNeed Help? [Documentation](${config.links.support})` : '')
      )
      .addFields(
        { name: 'Aliases', value: aliases, inline: true },
        { name: 'Permissions', value: perm, inline: true },
        { name: 'How To Use', value: `\`\`\`\nSyntax:  ${syntax}\nExample: ${example}\n\`\`\`` }
      );
    return e;
  };

  let listIndex = 0;
  const msg = await message.channel.send({ embeds: [intro], components: [new ActionRowBuilder().addComponents(menu)] });
  const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300000 });

  collector.on('collect', async (i) => {
    if (i.user.id !== message.author.id) return i.reply({ content: 'This menu is not for you.', ephemeral: true }).catch(() => {});
    const v = i.values[0];
    if (v === '__overview') return i.update({ embeds: [intro] }).catch(() => {});
    if (v === '__list') {
      listIndex = 0;
      return i.update({ embeds: [listPages[0].setFooter({ text: `Full list · page 1/${listPages.length}` })] }).catch(() => {});
    }
    return i.update({ embeds: [detailFor(parseInt(v, 10))] }).catch(() => {});
  });
  collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
  return msg;
}

/** Everything up to the first space or the first `<`/`[` — the actual subcommand keyword. */
function firstWord(usage) {
  const m = usage.match(/^([a-z0-9]+(?:\/[a-z0-9]+)*)/i);
  return m ? m[1] : usage;
}

/**
 * Turn a usage string into a plausible concrete example by replacing common
 * placeholder tokens with sample values. e.g.
 *   "add <role> <perms...>"  ->  "add @Mods banmembers"
 */
function exampleFromUsage(prefix, name, usage) {
  const samples = {
    '<member>': '@user',
    '<user>': '@user',
    '<role>': '@role',
    '<role/user>': '@user',
    '<channel>': '#channel',
    '<#channel>': '#channel',
    '[#channel]': '#general',
    '[channel]': '#general',
    '<amount>': '50',
    '[amount]': '50',
    '<duration>': '10m',
    '[duration]': '1h',
    '<reason>': 'spam',
    '[reason]': 'spam',
    '<name>': 'name',
    '[name]': 'default',
    '<message>': 'hello {user}',
    '<text>': 'hello',
    '<word...>': 'badword',
    '<perms...>': 'banmembers',
    '<hex>': '#8b0a0a',
    '<level>': '5',
    '<n>': '3',
    '<on/off>': 'on',
    '<messageId>': '123456789',
    '<event>': 'messageDelete',
    '<emoji>': ':smile:',
    '<emoji/url>': ':smile:',
    '<winners>': '1',
    '<prize>': 'Nitro',
    '<module>': 'channeldelete',
    '<permission>': 'administrator',
  };
  let out = usage;
  // ordered replacement: multi-word tokens first
  for (const [tok, val] of Object.entries(samples).sort((a, b) => b[0].length - a[0].length)) {
    out = out.split(tok).join(val);
  }
  // drop any remaining optional [..] and leftover <..> placeholders
  out = out.replace(/\[[^\]]*\]/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return `${prefix}${name} ${out}`.trim();
}

module.exports = { renderCommandHelp };
