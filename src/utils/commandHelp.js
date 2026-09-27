const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require('discord.js');
const { base } = require('./embed');
const { chunk } = require('./paginate');
const config = require('../config');

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
  const pfx = emoji ? `${emoji} ` : '';
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
    return base(config.colors.accent)
      .setTitle(`${pfx}${name} ${firstWord(sc.usage)}`)
      .setDescription(sc.desc)
      .addFields({ name: 'Usage', value: `\`${prefix}${name} ${sc.usage}\`` })
      .setFooter({ text: `${name} · pick another from the menu` });
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

module.exports = { renderCommandHelp };
