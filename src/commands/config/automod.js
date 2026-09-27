const { PermissionFlagsBits, AutoModerationRuleTriggerType, AutoModerationActionType, AutoModerationRuleEventType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');

const automod = new Command({
  name: 'automod',
  category: 'config',
  description: "Manage Discord's native AutoMod rules.",
  permLevel: LEVELS.ADMIN,
  usage: 'list/remove/keyword <...>',
  botPerms: [PermissionFlagsBits.ManageGuild],
  async run({ message, args, prefix, sub }) {
    const rules = await message.guild.autoModerationRules.fetch().catch(() => null);
    switch (sub) {
      case 'list': {
        if (!rules?.size) return message.reply({ embeds: [base().setDescription('No AutoMod rules configured.')] });
        return message.channel.send({ embeds: [base().setTitle('AutoMod rules').setDescription([...rules.values()].map((r) => `• **${r.name}** (${r.enabled ? 'on' : 'off'})`).join('\n'))] });
      }
      case 'remove': {
        const name = args.slice(1).join(' ').toLowerCase();
        const rule = rules?.find((r) => r.name.toLowerCase() === name);
        if (!rule) return message.reply({ embeds: [error('Rule not found.')] });
        await rule.delete().catch(() => {});
        return message.reply({ embeds: [success(message.author, `Deleted AutoMod rule **${rule.name}**.`)] });
      }
      case 'keyword': {
        const words = args.slice(1);
        if (!words.length) return message.reply({ embeds: [error(`Usage: \`${prefix}automod keyword <word...>\``)] });
        await message.guild.autoModerationRules.create({
          name: `Sorrow keyword ${Date.now().toString().slice(-4)}`,
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: { keywordFilter: words },
          actions: [{ type: AutoModerationActionType.BlockMessage }],
          enabled: true,
        }).catch((e) => message.reply({ embeds: [error(`Failed: ${e.message}`)] }));
        return message.reply({ embeds: [success(message.author, `Created a keyword AutoMod rule blocking **${words.length}** word(s).`)] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('AutoMod').setDescription(`\`${prefix}automod list\`\n\`${prefix}automod keyword <words>\`\n\`${prefix}automod remove <name>\``)] });
    }
  },
});

const joingate = new Command({
  name: 'joingate',
  category: 'config',
  description: 'Manage membership screening / approvals.',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle/config/list',
  async run({ message, args, prefix, sub }) {
    const db = require('../../database/db');
    const data = db.getSettings(message.guild.id, 'joingate', { enabled: false, logChannel: null, pending: {} });
    switch (sub) {
      case 'toggle':
        data.enabled = !data.enabled;
        db.saveSettings(message.guild.id, 'joingate', data);
        return message.reply({ embeds: [success(message.author, `Joingate review is now **${data.enabled ? 'on' : 'off'}**.`)] });
      case 'config':
        return message.channel.send({ embeds: [base().setTitle('Joingate').setDescription(`**Enabled:** ${data.enabled}\n**Log:** ${data.logChannel ? `<#${data.logChannel}>` : 'none'}\n**Pending:** ${Object.keys(data.pending || {}).length}`)] });
      default:
        return message.channel.send({ embeds: [base().setTitle('Joingate').setDescription(`\`${prefix}joingate toggle\` · \`${prefix}joingate config\`\n\nNote: full membership-screening review requires Discord's Community screening enabled on the server.`)] });
    }
  },
});

const honey = new Command({
  name: 'honey',
  aliases: ['honeypot'],
  category: 'config',
  description: 'Honeypot trap channels that auto-punish scammers/bots.',
  permLevel: LEVELS.ADMIN,
  usage: 'edit/config/reset <channel> <action>',
  async run({ message, args, prefix, sub }) {
    const db = require('../../database/db');
    const { resolveChannel } = require('../../utils/resolve');
    const data = db.getSettings(message.guild.id, 'honey', { channel: null, action: 'ban', logChannel: null });
    switch (sub) {
      case 'edit': {
        const ch = resolveChannel(message.guild, args[1]) || message.mentions.channels?.first();
        const action = (args[2] || 'ban').toLowerCase();
        if (!ch) return message.reply({ embeds: [error(`Usage: \`${prefix}honey edit <#trap-channel> <ban|kick|timeout>\``)] });
        data.channel = ch.id;
        if (['ban', 'kick', 'timeout'].includes(action)) data.action = action;
        db.saveSettings(message.guild.id, 'honey', data);
        return message.reply({ embeds: [success(message.author, `Honeypot set: ${ch} → **${data.action}** anyone who posts there.`)] });
      }
      case 'reset':
        db.saveSettings(message.guild.id, 'honey', { channel: null, action: 'ban', logChannel: null });
        return message.reply({ embeds: [success(message.author, 'Honeypot reset.')] });
      case 'config':
      default:
        return message.channel.send({ embeds: [base().setTitle('Honeypot').setDescription(`**Trap channel:** ${data.channel ? `<#${data.channel}>` : 'none'}\n**Action:** ${data.action}`)] });
    }
  },
});

module.exports = [automod, joingate, honey];
