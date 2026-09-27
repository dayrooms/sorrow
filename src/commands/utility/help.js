const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS, isBotOwner } = require('../../utils/permissions');
const { base } = require('../../utils/embed');

const CATEGORY_META = {
  antinuke: { emoji: '🛡️', label: 'Antinuke', desc: 'Server nuke protection' },
  antiraid: { emoji: '🚨', label: 'Antiraid', desc: 'Raid & mass-join protection' },
  moderation: { emoji: '🔨', label: 'Moderation', desc: 'Ban, kick, mute, purge & more' },
  roles: { emoji: '🎭', label: 'Roles & Expressions', desc: 'Roles, emojis, stickers, channels' },
  config: { emoji: '⚙️', label: 'Config', desc: 'Prefix, settings, automation' },
  engagement: { emoji: '🏆', label: 'Engagement', desc: 'Welcome, levels, giveaways, more' },
  utility: { emoji: '🔧', label: 'Utility', desc: 'Info, embeds, logging, tools' },
  voice: { emoji: '🔊', label: 'Voice', desc: 'VoiceMaster temp channels' },
  fun: { emoji: '🎮', label: 'Fun', desc: 'Games, memes & roleplay' },
  tickets: { emoji: '🎫', label: 'Tickets', desc: 'Support ticket system' },
  giveaway: { emoji: '🎉', label: 'Giveaways', desc: 'Server giveaways' },
  music: { emoji: '🎵', label: 'Music', desc: 'Music playback' },
  developer: { emoji: '🛠️', label: 'Developer', desc: 'Owner-only' },
};

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

    // Build categories present in the bot
    const owner = isBotOwner(message.author.id);
    const byCat = {};
    for (const cmd of client.commands.values()) {
      if (cmd.category === 'developer' && !owner) continue;
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
        { label: 'Home', value: 'home', emoji: '🏠', description: 'Overview & getting started' },
        ...categories.map((c) => ({
          label: CATEGORY_META[c]?.label || c,
          value: c,
          emoji: CATEGORY_META[c]?.emoji || '📁',
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
      const embed = base(client.config.colors.accent)
        .setTitle(`${CATEGORY_META[cat]?.emoji || '📁'} ${CATEGORY_META[cat]?.label || cat}`)
        .setDescription(cmds.map((c) => `\`${c.name}\` — ${c.description}`).join('\n').slice(0, 4096))
        .setFooter({ text: `${cmds.length} commands · ${prefix}help <command> for details` });
      return i.update({ embeds: [embed] }).catch(() => {});
    });
    collector.on('end', () => msg.edit({ components: [] }).catch(() => {}));
  },
});
