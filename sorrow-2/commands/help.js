const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

const { color, error, default_prefix } = require("../config.json");

const CATEGORY_EMOJI = {
  security: "🛡️",
  moderation: "🔨",
  config: "⚙️",
  utility: "🛠️",
  information: "ℹ️",
  image: "🖼️",
  games: "🎮",
  owner: "👑",
  miscellaneous: "📦",
};

function buildPages(client) {
  const byCategory = {};
  client.commands.forEach((cmd) => {
    const cat = (cmd.category || "miscellaneous").toLowerCase();
    if (!byCategory[cat]) byCategory[cat] = [];
    if (!byCategory[cat].includes(cmd.name)) byCategory[cat].push(cmd.name);
  });

  const categories = Object.keys(byCategory).sort();
  const pages = [];
  const PER_PAGE = 20;

  for (const cat of categories) {
    const names = byCategory[cat].sort();
    for (let i = 0; i < names.length; i += PER_PAGE) {
      pages.push({
        category: cat,
        names: names.slice(i, i + PER_PAGE),
      });
    }
  }
  return pages;
}

function renderPage(pages, index, client) {
  const page = pages[index];
  const emoji = CATEGORY_EMOJI[page.category] || "📦";
  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: `${client.user.username} | Help Menu`, iconURL: client.user.displayAvatarURL() })
    .setDescription(`${emoji} **${page.category.charAt(0).toUpperCase() + page.category.slice(1)}**\n\n\`\`\`${page.names.join(", ")}\`\`\``)
    .setFooter({ text: `Page ${index + 1}/${pages.length} · Prefix: ${default_prefix} · Use ${default_prefix}help <command> for details` });
  return embed;
}

function buildRow(index, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("help_prev").setEmoji("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(index === 0),
    new ButtonBuilder().setCustomId("help_next").setEmoji("➡️").setStyle(ButtonStyle.Secondary).setDisabled(index === total - 1),
    new ButtonBuilder().setCustomId("help_search").setEmoji("🔍").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("help_delete").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  name: "help",
  description: "shows all available commands or info about one command",
  aliases: ["commands", "h"],
  usage: ";help\n;help <command>",
  category: "information",
  guildOnly: false,
  args: false,
  permissions: { bot: [], user: [] },
  execute: async (message, args, client) => {
    // ;help <command> -> detailed single-command view
    if (args[0]) {
      const name = args[0].toLowerCase();
      const cmd = client.commands.get(name) || client.commands.find((c) => c.aliases && c.aliases.includes(name));
      if (!cmd) return message.reply({ embeds: [new EmbedBuilder().setDescription(`❌ No command called \`${name}\` found`).setColor(error)] });

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`Command: ${cmd.name}`)
        .addFields(
          { name: "Description", value: cmd.description || "No description", inline: false },
          { name: "Usage", value: `\`\`\`${cmd.usage || cmd.name}\`\`\``, inline: false },
          { name: "Aliases", value: cmd.aliases && cmd.aliases.length ? cmd.aliases.join(", ") : "None", inline: true },
          { name: "Category", value: cmd.category || "miscellaneous", inline: true }
        );
      return message.reply({ embeds: [embed] });
    }

    const pages = buildPages(client);
    if (!pages.length) return message.reply({ content: "No commands loaded." });

    let index = 0;
    const msg = await message.reply({ embeds: [renderPage(pages, index, client)], components: [buildRow(index, pages.length)] });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== message.author.id) {
        return i.reply({ content: "❌ Only the person who ran this command can use these buttons", ephemeral: true });
      }

      if (i.customId === "help_prev") {
        index = Math.max(0, index - 1);
        await i.update({ embeds: [renderPage(pages, index, client)], components: [buildRow(index, pages.length)] });
      } else if (i.customId === "help_next") {
        index = Math.min(pages.length - 1, index + 1);
        await i.update({ embeds: [renderPage(pages, index, client)], components: [buildRow(index, pages.length)] });
      } else if (i.customId === "help_delete") {
        await msg.delete().catch(() => {});
        collector.stop();
      } else if (i.customId === "help_search") {
        const modal = new ModalBuilder().setCustomId("help_search_modal").setTitle("Search commands");
        const input = new TextInputBuilder().setCustomId("help_search_input").setLabel("Command name").setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await i.showModal(modal);

        const submitted = await i.awaitModalSubmit({ time: 30000, filter: (m) => m.customId === "help_search_modal" && m.user.id === message.author.id }).catch(() => null);
        if (!submitted) return;

        const query = submitted.fields.getTextInputValue("help_search_input").toLowerCase();
        const found = client.commands.get(query) || client.commands.find((c) => c.aliases && c.aliases.includes(query));
        if (!found) {
          return submitted.reply({ content: `❌ No command called \`${query}\` found`, ephemeral: true });
        }
        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`Command: ${found.name}`)
          .addFields(
            { name: "Description", value: found.description || "No description" },
            { name: "Usage", value: `\`\`\`${found.usage || found.name}\`\`\`` },
            { name: "Aliases", value: found.aliases && found.aliases.length ? found.aliases.join(", ") : "None", inline: true },
            { name: "Category", value: found.category || "miscellaneous", inline: true }
          );
        return submitted.reply({ embeds: [embed], ephemeral: true });
      }
    });

    collector.on("end", () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },
};
