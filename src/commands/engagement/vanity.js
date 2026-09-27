const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { resolveRole, resolveChannel, parseColor } = require('../../utils/resolve');
const db = require('../../database/db');

/** vanity — reward roles for members repping a vanity in their status. */
const vanity = new Command({
  name: 'vanity',
  category: 'engagement',
  description: 'Reward roles for members repping your server in their status.',
  permLevel: LEVELS.ADMIN,
  usage: 'toggle | edit <status> <role> | config | reset',
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'vanityroles', { enabled: false, text: null, roles: [], channel: null });
    switch (sub) {
      case 'toggle': cfg.enabled = !cfg.enabled; db.saveSettings(message.guild.id, 'vanityroles', cfg); return message.reply({ embeds: [success(message.author, `Vanity roles **${cfg.enabled ? 'on' : 'off'}**.`)] });
      case 'edit': {
        const role = resolveRole(message.guild, args[args.length - 1]) || message.mentions.roles?.first();
        const text = args.slice(1).filter((a) => !a.startsWith('<@&')).join(' ');
        if (text) cfg.text = text;
        if (role && !cfg.roles.includes(role.id)) cfg.roles.push(role.id);
        db.saveSettings(message.guild.id, 'vanityroles', cfg);
        return message.reply({ embeds: [success(message.author, `Vanity: status must contain \`${cfg.text || '(unset)'}\` → ${cfg.roles.map((r) => `<@&${r}>`).join(', ')}`)] });
      }
      case 'reset': db.clearSettings(message.guild.id, 'vanityroles'); return message.reply({ embeds: [success(message.author, 'Vanity reset.')] });
      default: return message.channel.send({ embeds: [base().setTitle('Vanity roles').setDescription(`**Enabled:** ${cfg.enabled}\n**Trigger:** ${cfg.text || 'none'}\n**Roles:** ${cfg.roles.map((r) => `<@&${r}>`).join(', ') || 'none'}`)] });
    }
  },
});

/** badge — same idea for clan tag. */
const badge = new Command({
  name: 'badge',
  category: 'engagement',
  description: "Award roles to members repping the server's clan tag.",
  permLevel: LEVELS.ADMIN,
  usage: 'toggle | edit | config',
  async run({ message, args, prefix, sub }) {
    const cfg = db.getSettings(message.guild.id, 'badge', { enabled: false, roles: [] });
    if (sub === 'toggle') { cfg.enabled = !cfg.enabled; db.saveSettings(message.guild.id, 'badge', cfg); return message.reply({ embeds: [success(message.author, `Badge system **${cfg.enabled ? 'on' : 'off'}**.`)] }); }
    return message.channel.send({ embeds: [base().setTitle('Badge').setDescription(`**Enabled:** ${cfg.enabled}\nAwards roles to members using the server's guild tag.`)] });
  },
});

/** boostroles — personal booster roles. */
const boostroles = new Command({
  name: 'boostroles',
  aliases: ['boostrole', 'br'],
  category: 'engagement',
  description: 'Custom roles for server boosters.',
  permLevel: LEVELS.USER,
  usage: 'create <color> <name> | color <hex> | rename <name> | remove',
  async run({ message, args, prefix, sub }) {
    const isBooster = !!message.member.premiumSince;
    const cfg = db.getSettings(message.guild.id, 'boostroles', { base: null, enabled: true, roles: {} });
    const adminSubs = ['toggle', 'base', 'edit', 'list', 'cleanup'];

    if (adminSubs.includes(sub)) {
      const { check } = require('../../utils/permissions');
      if (!check(message.member, LEVELS.ADMIN, message.guild.id).ok) return message.reply({ embeds: [error('You need Manage Server for that.')] });
      if (sub === 'toggle') { cfg.enabled = !cfg.enabled; db.saveSettings(message.guild.id, 'boostroles', cfg); return message.reply({ embeds: [success(message.author, `Booster roles **${cfg.enabled ? 'on' : 'off'}**.`)] }); }
      if (sub === 'base') { const r = resolveRole(message.guild, args.slice(1).join(' ')) || message.mentions.roles?.first(); cfg.base = r?.id || null; db.saveSettings(message.guild.id, 'boostroles', cfg); return message.reply({ embeds: [success(message.author, `Base position role set to ${r ? r.name : 'none'}.`)] }); }
      if (sub === 'list') return message.channel.send({ embeds: [base().setTitle('Booster roles').setDescription(Object.entries(cfg.roles).map(([u, r]) => `<@${u}> → <@&${r}>`).join('\n') || 'None.')] });
      return message.reply({ embeds: [base().setDescription('Booster admin command.')] });
    }

    if (!isBooster) return message.reply({ embeds: [error('This is for server boosters only. 💜')] });
    if (!cfg.enabled) return message.reply({ embeds: [error('Booster roles are disabled here.')] });

    const existingId = cfg.roles[message.author.id];
    let role = existingId ? message.guild.roles.cache.get(existingId) : null;

    switch (sub) {
      case 'create': {
        if (role) return message.reply({ embeds: [error('You already have a booster role. Use `color`/`rename`.')] });
        const color = parseColor(args[1]);
        const name = args.slice(color !== null ? 2 : 1).join(' ') || `${message.author.username}'s role`;
        role = await message.guild.roles.create({ name, color: color ?? undefined, reason: 'Booster role' }).catch(() => null);
        if (!role) return message.reply({ embeds: [error('Failed to create your role.')] });
        if (cfg.base) { const baseRole = message.guild.roles.cache.get(cfg.base); if (baseRole) await role.setPosition(baseRole.position - 1).catch(() => {}); }
        await message.member.roles.add(role).catch(() => {});
        cfg.roles[message.author.id] = role.id;
        db.saveSettings(message.guild.id, 'boostroles', cfg);
        return message.reply({ embeds: [success(message.author, `Created your booster role **${role.name}**.`)] });
      }
      case 'color': {
        if (!role) return message.reply({ embeds: [error('Create a role first with `boostroles create`.')] });
        const c = parseColor(args[1]);
        if (c === null) return message.reply({ embeds: [error('Provide a hex color.')] });
        await role.setColor(c).catch(() => {});
        return message.reply({ embeds: [success(message.author, 'Updated your role color.')] });
      }
      case 'rename': {
        if (!role) return message.reply({ embeds: [error('Create a role first.')] });
        await role.setName(args.slice(1).join(' ') || role.name).catch(() => {});
        return message.reply({ embeds: [success(message.author, 'Renamed your role.')] });
      }
      case 'remove': {
        if (role) await role.delete().catch(() => {});
        delete cfg.roles[message.author.id];
        db.saveSettings(message.guild.id, 'boostroles', cfg);
        return message.reply({ embeds: [success(message.author, 'Removed your booster role.')] });
      }
      default:
        return message.channel.send({ embeds: [base().setTitle('Booster roles').setDescription(`\`${prefix}boostroles create [color] <name>\`\n\`${prefix}boostroles color <hex>\` · \`rename <name>\` · \`remove\``)] });
    }
  },
});

module.exports = [vanity, badge, boostroles];
