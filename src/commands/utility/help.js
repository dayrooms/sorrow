const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base } = require('../../utils/embed');

const CATEGORY_META = {
  antinuke: { emoji: '<:moderator:1240071902077390920>', label: 'Antinuke', desc: 'Server nuke protection' },
  antiraid: { emoji: '<:rank6:1549593957254701106>', label: 'Antiraid', desc: 'Raid & mass-join protection' },
  moderation: { emoji: '<:tele:1491195323199127562>', label: 'Moderation', desc: 'Ban, kick, mute, purge & more' },
  roles: { emoji: '<:lastfm_mode:1545496428040822954>', label: 'Roles & Expressions', desc: 'Roles, emojis, stickers, channels' },
  config: { emoji: '<:developer:1240068752872312902>', label: 'Config', desc: 'Prefix, settings, automation' },
  engagement: { emoji: '<:chat:1510129917042622484>', label: 'Engagement', desc: 'Welcome, levels, giveaways, more' },
  utility: { emoji: '<:darkblueflag:1552361100677480478>', label: 'Utility', desc: 'Info, embeds, logging, tools' },
  voice: { emoji: '<:claim:1552114546175385631>', label: 'Voice', desc: 'VoiceMaster temp channels' },
  fun: { emoji: '<:suggestion:1249351902463004743>', label: 'Fun', desc: 'Games, memes & roleplay' },
  tickets: { emoji: '<:lastfm_reactions:1552114572985638932>', label: 'Tickets', desc: 'Support ticket system' },
  giveaway: { emoji: '<:18510boost:1552114721350619187>', label: 'Giveaways', desc: 'Server giveaways' },
  music: { emoji: '<:video2gif:1545496599692574870>', label: 'Music', desc: 'Music playback' },
  developer: { emoji: '🛠️', label: 'Developer', desc: 'Owner-only' },
};

// Custom emoji for the "Home" dropdown option.
const HOME_EMOJI = '<:owner:1552114698021769378>';

/** Parse a custom-emoji string "<a:name:id>" into the object select menus want. */
function parseEmoji(str) {
  if (!str) return undefined;
  const m = String(str).match(/^<(a)?:(\w+):(\d+)>$/);
  if (m) return { id: m[3], name: m[2], animated: !!m[1] };
  return str; // plain unicode emoji
}

module.exports = new Command({
  name: 'help',
  aliases: ['h', 'commands', 'cmds'],
  category: 'utility',
  description: 'Browse all commands.',
  permLevel: LEVELS.USER,
  usage: '[command]',
  async run({ client, message, args, prefix }) {
    // Specific command help
    if (args[0]) {
      const name = args[0].toLowerCase();
      const cmd = client.commands.get(name) || client.commands.get(client.aliases.get(name));
      if (cmd) {
        // If the command ships a subcommand help schema, render the rich guide
        // (intro + dropdown to each subcommand + full list).
        if (cmd.help && Array.isArray(cmd.help.subcommands) && cmd.help.subcommands.length) {
          const { renderCommandHelp } = require('../../utils/commandHelp');
          const meta = CATEGORY_META[cmd.category];
          return renderCommandHelp(message, cmd, prefix, meta?.emoji || '');
        }
        // Otherwise the simple card.
        return message.channel.send({
          embeds: [
            base()
              .setTitle(`Command: ${prefix}${cmd.name}`)
              .setDescription(cmd.description)
              .addFields(
                { name: 'Usage', value: `\`${prefix}${cmd.name} ${cmd.usage || ''}\``, inline: false },
                { name: 'Aliases', value: cmd.aliases.length ? cmd.aliases.map((a) => `\`${a}\``).join(', ') : 'none', inline: true },
                { name: 'Category', value: cmd.category, inline: true }
              ),
          ],
        });
      }
    }

    // Build categories present in the bot.
    // The developer category is NEVER shown in the help menu (even to the owner);
    // it's only reachable via `;dev help`.
    const byCat = {};
    for (const cmd of client.commands.values()) {
      if (cmd.category === 'developer') continue;
      (byCat[cmd.category] = byCat[cmd.category] || []).push(cmd);
    }
    const categories = Object.keys(byCat).sort();

    const home = base(client.config.colors.primary)
      .setAuthor({ name: 'Sorrow', iconURL: client.user.displayAvatarURL() })
      .setDescription(
        [
          'The all-in-one Discord bot for moderation, security, automation, and community management.',
          '',
          'Browse all commands using the dropdown below.',
          '',
          `**Prefix:** \`${prefix}\` · **Commands:** ${client.commands.size}`,
        ].join('\n')
      )
      .setFooter({ text: `Use ${prefix}help <command> for details` });

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_cat')
      .setPlaceholder('📚 Select a category')
      .addOptions(
        { label: 'Home', value: 'home', emoji: parseEmoji(HOME_EMOJI), description: 'Overview & getting started' },
        ...categories.map((c) => ({
          label: CATEGORY_META[c]?.label || c,
          value: c,
          emoji: parseEmoji(CATEGORY_META[c]?.emoji) || '📁',
          description: (CATEGORY_META[c]?.desc || `${byCat[c].length} commands`).slice(0, 100),
        }))
      );

    const msg = await message.channel.send({ embeds: [home], components: [new ActionRowBuilder().addComponents(menu)] });
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== message.author.id) return i.reply({ content: 'This menu is not for you.', ephemeral: true }).catch(() => {});
      const cat = i.values[0];
      if (cat === 'home') return i.update({ embeds: [home] }).catch(() => {});
      const cmds = byCat[cat] || [];
      // Emoji live only on the dropdown options — keep category cards clean text.
      const embed = base(client.config.colors.accent)
        .setTitle(`${CATEGORY_META[cat]?.label || cat}`)
        .setDescription(
          (
            (CATEGORY_META[cat]?.desc ? `*${CATEGORY_META[cat].desc}*\n\n` : '') +
            cmds.map((c) => `**${c.name}** — ${c.description}`).join('\n')
          ).slice(0, 4096)
        )
        .setFooter({ text: `${cmds.length} commands · ${prefix}help <command> for details` });
      return i.update({ embeds: [embed] }).catch(() => {});
    });
    collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
  },
});
