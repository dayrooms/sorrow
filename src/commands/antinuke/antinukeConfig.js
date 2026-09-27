const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const an = require('../../utils/antinuke');
const ar = require('../../utils/antiraid');
const db = require('../../database/db');
const config = require('../../config');
const { isBotOwner } = require('../../utils/permissions');

/**
 * Interactive configurators for `;antinuke edit` and `;antiraid edit`.
 *
 * Flow (matches the reference UX):
 *   edit  ->  intro embed + module dropdown
 *   pick  ->  module card (status/punishment/threshold) + Configure/Back buttons
 *   Configure -> modal (threshold, window, status, punishment)
 *   submit -> save + refreshed card
 *
 * All component/modal interactions are routed here from events/interactionCreate.js
 * by their customId prefix: `ancfg:` for antinuke, `arcfg:` for antiraid.
 */

function canEdit(interaction) {
  const uid = interaction.user.id;
  if (isBotOwner(uid)) return true;
  if (interaction.guild.ownerId === uid) return true;
  return db.isAntinukeAdmin(interaction.guild.id, uid);
}

// ─────────────────────────────────────────────────────────────
//  ANTINUKE
// ─────────────────────────────────────────────────────────────

function antinukeIntro(prefix) {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🛡️ Antinuke Configuration')
    .setDescription(
      [
        'Antinuke watches for mass bans, channel deletes, role changes, webhooks and other raid behavior. Use this menu to tune each protection module.',
        '',
        '**How to use**',
        '1. Select a module from the dropdown',
        '2. Review its current settings',
        '3. Click **Configure** to enable it and set punishment + threshold',
        '',
        `Want to edit dangerous permission grants? Run \`${prefix}antinuke permissions\`.`,
      ].join('\n')
    );
}

function antinukeModuleMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ancfg:select')
    .setPlaceholder('Select a protection module')
    .addOptions(
      Object.entries(an.MODULES).slice(0, 25).map(([key, v]) => ({
        label: v.label,
        value: key,
        description: `${v.label} protection`.slice(0, 100),
      }))
    );
  return new ActionRowBuilder().addComponents(menu);
}

/** Sends the initial edit menu (called from the command). */
async function sendAntinukeEdit(message, prefix) {
  return message.channel.send({
    embeds: [antinukeIntro(prefix)],
    components: [antinukeModuleMenu()],
  });
}

function antinukeModuleCard(guildId, key) {
  const cfg = an.getConfig(guildId);
  const mod = cfg.modules[key] || { ...an.DEFAULT_MODULE };
  const label = an.MODULES[key]?.label || key;
  const embed = new EmbedBuilder()
    .setColor(config.colors.accent)
    .setTitle('🛡️ Antinuke Configuration')
    .addFields(
      { name: 'Module', value: label, inline: true },
      { name: 'Status', value: mod.on ? '🟢 enabled' : '🔴 disabled', inline: true },
      { name: 'Punishment', value: mod.punishment, inline: true },
      { name: 'Threshold', value: `${mod.threshold} in ${Math.round((cfg.windowMs || config.antinukeDefaults.windowMs) / 1000)}s`, inline: true }
    );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ancfg:configure:${key}`).setLabel('Configure').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`ancfg:toggle:${key}`).setLabel(mod.on ? 'Quick Disable' : 'Quick Enable').setStyle(mod.on ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ancfg:back').setLabel('Back').setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [row] };
}

function antinukeModal(guildId, key) {
  const cfg = an.getConfig(guildId);
  const mod = cfg.modules[key] || { ...an.DEFAULT_MODULE };
  return new ModalBuilder()
    .setCustomId(`ancfg:modal:${key}`)
    .setTitle(`Configure ${an.MODULES[key]?.label || key}`.slice(0, 45))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('threshold').setLabel('Threshold (actions before punishment)').setStyle(TextInputStyle.Short).setValue(String(mod.threshold)).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('status').setLabel('Status (enabled / disabled)').setStyle(TextInputStyle.Short).setValue(mod.on ? 'enabled' : 'disabled').setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('punishment').setLabel('Punishment (ban / kick / strip)').setStyle(TextInputStyle.Short).setValue(mod.punishment).setRequired(true)
      )
    );
}

async function handleAntinuke(client, interaction) {
  if (!canEdit(interaction)) {
    return interaction.reply({ content: 'Only the server owner or antinuke admins can configure antinuke.', ephemeral: true }).catch(() => {});
  }
  const [, action, key] = interaction.customId.split(':');
  const guildId = interaction.guild.id;

  if (interaction.isStringSelectMenu() && action === 'select') {
    const chosen = interaction.values[0];
    return interaction.update(antinukeModuleCard(guildId, chosen)).catch(() => {});
  }

  if (interaction.isButton()) {
    if (action === 'back') {
      return interaction.update({ embeds: [antinukeIntro(client.prefixFor(guildId))], components: [antinukeModuleMenu()] }).catch(() => {});
    }
    if (action === 'toggle') {
      const cfg = an.getConfig(guildId);
      cfg.modules[key] = cfg.modules[key] || { ...an.DEFAULT_MODULE };
      cfg.modules[key].on = !cfg.modules[key].on;
      if (cfg.modules[key].on && !cfg.enabled) cfg.enabled = true;
      an.saveConfig(guildId, cfg);
      return interaction.update(antinukeModuleCard(guildId, key)).catch(() => {});
    }
    if (action === 'configure') {
      return interaction.showModal(antinukeModal(guildId, key)).catch(() => {});
    }
  }

  if (interaction.isModalSubmit() && action === 'modal') {
    const cfg = an.getConfig(guildId);
    cfg.modules[key] = cfg.modules[key] || { ...an.DEFAULT_MODULE };
    const th = parseInt(interaction.fields.getTextInputValue('threshold'), 10);
    if (!Number.isNaN(th) && th > 0) cfg.modules[key].threshold = th;
    const status = interaction.fields.getTextInputValue('status').toLowerCase();
    cfg.modules[key].on = status.startsWith('e') || status === 'on' || status === 'true';
    const pun = interaction.fields.getTextInputValue('punishment').toLowerCase();
    if (['ban', 'kick', 'strip'].includes(pun)) cfg.modules[key].punishment = pun;
    if (cfg.modules[key].on && !cfg.enabled) cfg.enabled = true;
    an.saveConfig(guildId, cfg);
    return interaction.update(antinukeModuleCard(guildId, key)).catch(() =>
      interaction.reply({ content: 'Saved.', ephemeral: true }).catch(() => {})
    );
  }
}

// ─────────────────────────────────────────────────────────────
//  ANTIRAID
// ─────────────────────────────────────────────────────────────

const AR_MODULES = {
  massjoin: 'Mass Join',
  newaccounts: 'New / Young Accounts',
  noavatar: 'Default Avatar',
};

function antiraidIntro() {
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('🚨 Antiraid Configuration')
    .setDescription(
      [
        'Antiraid watches your front door: mass joins, brand-new/young accounts, and default-avatar accounts.',
        '',
        '**How to use**',
        '1. Select a module from the dropdown',
        '2. Click **Configure** to enable it and set its options',
      ].join('\n')
    );
}

function antiraidModuleMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('arcfg:select')
    .setPlaceholder('Select an antiraid module')
    .addOptions(Object.entries(AR_MODULES).map(([key, label]) => ({ label, value: key, description: `${label} protection`.slice(0, 100) })));
  return new ActionRowBuilder().addComponents(menu);
}

async function sendAntiraidEdit(message) {
  return message.channel.send({ embeds: [antiraidIntro()], components: [antiraidModuleMenu()] });
}

function antiraidModuleCard(guildId, key) {
  const cfg = ar.getConfig(guildId);
  const mod = cfg[key] || {};
  const fields = [
    { name: 'Module', value: AR_MODULES[key] || key, inline: true },
    { name: 'Status', value: mod.on ? '🟢 enabled' : '🔴 disabled', inline: true },
    { name: 'Action', value: mod.action || 'kick', inline: true },
  ];
  if (key === 'massjoin') fields.push({ name: 'Trigger', value: `${mod.threshold} joins / ${Math.round((mod.windowMs || 10000) / 1000)}s`, inline: true });
  if (key === 'newaccounts') fields.push({ name: 'Min age', value: `${Math.round((mod.minAgeMs || 0) / 86400000)}d`, inline: true });
  const embed = new EmbedBuilder().setColor(config.colors.accent).setTitle('🚨 Antiraid Configuration').addFields(fields);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`arcfg:configure:${key}`).setLabel('Configure').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`arcfg:toggle:${key}`).setLabel(mod.on ? 'Quick Disable' : 'Quick Enable').setStyle(mod.on ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder().setCustomId('arcfg:back').setLabel('Back').setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [row] };
}

function antiraidModal(guildId, key) {
  const cfg = ar.getConfig(guildId);
  const mod = cfg[key] || {};
  const rows = [
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('status').setLabel('Status (enabled / disabled)').setStyle(TextInputStyle.Short).setValue(mod.on ? 'enabled' : 'disabled').setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('action').setLabel('Action (kick / ban / lockdown / timeout)').setStyle(TextInputStyle.Short).setValue(mod.action || 'kick').setRequired(true)),
  ];
  if (key === 'massjoin') {
    rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('threshold').setLabel('Join threshold').setStyle(TextInputStyle.Short).setValue(String(mod.threshold || 10)).setRequired(true)));
    rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('window').setLabel('Window (seconds)').setStyle(TextInputStyle.Short).setValue(String(Math.round((mod.windowMs || 10000) / 1000))).setRequired(true)));
  }
  if (key === 'newaccounts') {
    rows.push(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('minage').setLabel('Minimum account age in days').setStyle(TextInputStyle.Short).setValue(String(Math.round((mod.minAgeMs || 7 * 86400000) / 86400000))).setRequired(true)));
  }
  return new ModalBuilder().setCustomId(`arcfg:modal:${key}`).setTitle(`Configure ${AR_MODULES[key] || key}`.slice(0, 45)).addComponents(...rows);
}

async function handleAntiraid(client, interaction) {
  if (!canEdit(interaction)) {
    return interaction.reply({ content: 'Only the server owner or antiraid admins can configure antiraid.', ephemeral: true }).catch(() => {});
  }
  const [, action, key] = interaction.customId.split(':');
  const guildId = interaction.guild.id;

  if (interaction.isStringSelectMenu() && action === 'select') {
    return interaction.update(antiraidModuleCard(guildId, interaction.values[0])).catch(() => {});
  }
  if (interaction.isButton()) {
    if (action === 'back') return interaction.update({ embeds: [antiraidIntro()], components: [antiraidModuleMenu()] }).catch(() => {});
    if (action === 'toggle') {
      const cfg = ar.getConfig(guildId);
      cfg[key] = cfg[key] || {};
      cfg[key].on = !cfg[key].on;
      if (cfg[key].on && !cfg.enabled) cfg.enabled = true;
      ar.saveConfig(guildId, cfg);
      return interaction.update(antiraidModuleCard(guildId, key)).catch(() => {});
    }
    if (action === 'configure') return interaction.showModal(antiraidModal(guildId, key)).catch(() => {});
  }
  if (interaction.isModalSubmit() && action === 'modal') {
    const cfg = ar.getConfig(guildId);
    cfg[key] = cfg[key] || {};
    const status = interaction.fields.getTextInputValue('status').toLowerCase();
    cfg[key].on = status.startsWith('e') || status === 'on';
    const act = interaction.fields.getTextInputValue('action').toLowerCase();
    if (['kick', 'ban', 'lockdown', 'timeout'].includes(act)) cfg[key].action = act;
    if (key === 'massjoin') {
      const th = parseInt(interaction.fields.getTextInputValue('threshold'), 10);
      if (!Number.isNaN(th) && th > 0) cfg[key].threshold = th;
      const w = parseInt(interaction.fields.getTextInputValue('window'), 10);
      if (!Number.isNaN(w) && w > 0) cfg[key].windowMs = w * 1000;
    }
    if (key === 'newaccounts') {
      const d = parseInt(interaction.fields.getTextInputValue('minage'), 10);
      if (!Number.isNaN(d) && d > 0) cfg[key].minAgeMs = d * 86400000;
    }
    if (cfg[key].on && !cfg.enabled) cfg.enabled = true;
    ar.saveConfig(guildId, cfg);
    return interaction.update(antiraidModuleCard(guildId, key)).catch(() =>
      interaction.reply({ content: 'Saved.', ephemeral: true }).catch(() => {})
    );
  }
}

module.exports = { sendAntinukeEdit, handleAntinuke, sendAntiraidEdit, handleAntiraid };
