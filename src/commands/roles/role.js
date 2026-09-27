const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base, pickSubColor } = require('../../utils/embed');
const { resolveMember, resolveRole, parseColor } = require('../../utils/resolve');
const db = require('../../database/db');

const SUBS = ['add', 'remove', 'create', 'delete', 'edit', 'color', 'colour', 'mentionable', 'hoist', 'icon', 'cancel', 'restore', 'all', 'bots', 'humans', 'has'];

module.exports = new Command({
  name: 'role',
  aliases: ['r'],
  category: 'roles',
  description: 'Manage server roles (add/remove/create/delete/edit/color/all/bots/humans...).',
  permLevel: LEVELS.MOD, // uses Manage Roles internally; MOD+manage roles fakeperm covered by check
  usage: '<member> <role> | <subcommand> ...',
  botPerms: [PermissionFlagsBits.ManageRoles],
  async run({ client, message, args, prefix, sub }) {
    const me = message.guild.members.me;
    const canManage = (role) => role.editable && role.position < me.roles.highest.position;

    // Not a subcommand → treat as: role <member> <role...> (toggle roles)
    if (!SUBS.includes(sub)) {
      const member = (await resolveMember(message.guild, args[0])) || message.mentions.members?.first();
      if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}role <member> <role>\` or \`${prefix}role <subcommand>\``)] });
      const roleQuery = args.slice(1).join(' ');
      const roles = roleQuery.split(',').map((r) => resolveRole(message.guild, r.trim())).filter(Boolean);
      const mentioned = [...message.mentions.roles.values()];
      const all = [...new Set([...roles, ...mentioned])];
      if (!all.length) return message.reply({ embeds: [error('No valid role found.')] });
      const added = [];
      const removed = [];
      for (const role of all) {
        if (!canManage(role)) { message.channel.send({ embeds: [error(`I can't manage **${role.name}** (above my role).`)] }).catch(() => {}); continue; }
        if (member.roles.cache.has(role.id)) { await member.roles.remove(role).catch(() => {}); removed.push(role.name); }
        else { await member.roles.add(role).catch(() => {}); added.push(role.name); }
      }
      const parts = [];
      if (added.length) parts.push(`added **${added.join(', ')}**`);
      if (removed.length) parts.push(`removed **${removed.join(', ')}**`);
      return message.reply({ embeds: [success(message.author, `${parts.join(' and ') || 'no changes'} for **${member.user.tag}**.`)] });
    }

    const color = pickSubColor(sub);

    switch (sub) {
      case 'add':
      case 'remove': {
        const member = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        const role = resolveRole(message.guild, args.slice(2).join(' ')) || message.mentions.roles?.first();
        if (!member || !role) return message.reply({ embeds: [error(`Usage: \`${prefix}role ${sub} <member> <role>\``)] });
        if (!canManage(role)) return message.reply({ embeds: [error(`I can't manage **${role.name}**.`)] });
        if (sub === 'add') await member.roles.add(role).catch(() => {});
        else await member.roles.remove(role).catch(() => {});
        return message.reply({ embeds: [base(color).setDescription(`✅ ${sub === 'add' ? 'Added' : 'Removed'} **${role.name}** ${sub === 'add' ? 'to' : 'from'} **${member.user.tag}**.`)] });
      }

      case 'create': {
        // role create [color] [color2] <name>  (gradient => first color used, note gradients need boosts)
        let rest = args.slice(1);
        let roleColor = null;
        const c1 = parseColor(rest[0]);
        if (c1 !== null) { roleColor = c1; rest = rest.slice(1); const c2 = parseColor(rest[0]); if (c2 !== null) rest = rest.slice(1); }
        const name = rest.join(' ') || 'new role';
        const role = await message.guild.roles.create({ name, color: roleColor ?? undefined, reason: `Created by ${message.author.tag}` }).catch(() => null);
        if (!role) return message.reply({ embeds: [error('Failed to create the role.')] });
        return message.reply({ embeds: [base(color).setDescription(`✅ Created role **${role.name}** (${role}).`)] });
      }

      case 'delete': {
        const role = resolveRole(message.guild, args.slice(1).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}role delete <role>\``)] });
        if (!canManage(role)) return message.reply({ embeds: [error(`I can't delete **${role.name}**.`)] });
        const name = role.name;
        await role.delete(`Deleted by ${message.author.tag}`).catch(() => {});
        return message.reply({ embeds: [base(color).setDescription(`🗑️ Deleted role **${name}**.`)] });
      }

      case 'edit': {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        const newName = args.slice(2).join(' ');
        if (!role || !newName) return message.reply({ embeds: [error(`Usage: \`${prefix}role edit <role> <new name>\``)] });
        if (!canManage(role)) return message.reply({ embeds: [error(`I can't edit **${role.name}**.`)] });
        await role.setName(newName).catch(() => {});
        return message.reply({ embeds: [base(color).setDescription(`✏️ Renamed to **${newName}**.`)] });
      }

      case 'color':
      case 'colour': {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        const hex = parseColor(args[2]);
        if (!role || hex === null) return message.reply({ embeds: [error(`Usage: \`${prefix}role color <role> <hex>\``)] });
        if (!canManage(role)) return message.reply({ embeds: [error(`I can't edit **${role.name}**.`)] });
        await role.setColor(hex).catch(() => {});
        return message.reply({ embeds: [base(hex).setDescription(`🎨 Set **${role.name}** color to \`#${hex.toString(16).padStart(6, '0')}\`.`)] });
      }

      case 'mentionable': {
        const role = resolveRole(message.guild, args.slice(1).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}role mentionable <role>\``)] });
        await role.setMentionable(!role.mentionable).catch(() => {});
        return message.reply({ embeds: [base(color).setDescription(`**${role.name}** is now ${!role.mentionable ? '' : 'not '}mentionable.`)] });
      }

      case 'hoist': {
        const role = resolveRole(message.guild, args.slice(1).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}role hoist <role>\``)] });
        await role.setHoist(!role.hoist).catch(() => {});
        return message.reply({ embeds: [base(color).setDescription(`**${role.name}** is now ${!role.hoist ? '' : 'not '}hoisted.`)] });
      }

      case 'icon': {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}role icon <role> <emoji/url/attachment>\``)] });
        const icon = message.attachments.first()?.url || args[2];
        if (!icon) return message.reply({ embeds: [error('Provide an emoji, URL, or attachment.')] });
        await role.setIcon(icon).catch(() => message.reply({ embeds: [error('Failed — server may lack the boost level for role icons.')] }));
        return message.reply({ embeds: [success(message.author, `Set icon for **${role.name}**.`)] });
      }

      case 'all':
      case 'humans': {
        const removeMode = (args[1] || '').toLowerCase() === 'remove';
        const role = resolveRole(message.guild, args.slice(removeMode ? 2 : 1).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}role ${sub} [remove] <role>\``)] });
        if (!canManage(role)) return message.reply({ embeds: [error(`I can't manage **${role.name}**.`)] });
        const m = await message.reply({ embeds: [base(color).setDescription(`⏳ ${removeMode ? 'Removing' : 'Adding'} **${role.name}** ${removeMode ? 'from' : 'to'} all humans...`)] });
        await message.guild.members.fetch().catch(() => {});
        client._roleOp = client._roleOp || {};
        client._roleOp[message.guild.id] = true;
        let n = 0;
        for (const mem of message.guild.members.cache.values()) {
          if (!client._roleOp[message.guild.id]) break;
          if (mem.user.bot) continue;
          if (removeMode ? mem.roles.cache.has(role.id) : !mem.roles.cache.has(role.id)) {
            await (removeMode ? mem.roles.remove(role) : mem.roles.add(role)).then(() => n++).catch(() => {});
          }
        }
        return m.edit({ embeds: [success(message.author, `${removeMode ? 'Removed' : 'Added'} **${role.name}** ${removeMode ? 'from' : 'to'} **${n}** humans.`)] });
      }

      case 'bots': {
        const removeMode = (args[1] || '').toLowerCase() === 'remove';
        const role = resolveRole(message.guild, args.slice(removeMode ? 2 : 1).join(' ')) || message.mentions.roles?.first();
        if (!role) return message.reply({ embeds: [error(`Usage: \`${prefix}role bots [remove] <role>\``)] });
        const m = await message.reply({ embeds: [base(color).setDescription('⏳ Working...')] });
        await message.guild.members.fetch().catch(() => {});
        let n = 0;
        for (const mem of message.guild.members.cache.values()) {
          if (!mem.user.bot) continue;
          if (removeMode ? mem.roles.cache.has(role.id) : !mem.roles.cache.has(role.id)) await (removeMode ? mem.roles.remove(role) : mem.roles.add(role)).then(() => n++).catch(() => {});
        }
        return m.edit({ embeds: [success(message.author, `${removeMode ? 'Removed' : 'Added'} **${role.name}** for **${n}** bots.`)] });
      }

      case 'has': {
        const removeMode = (args[1] || '').toLowerCase() === 'remove';
        const baseRole = resolveRole(message.guild, args[removeMode ? 2 : 1]);
        const targetRole = resolveRole(message.guild, args.slice(removeMode ? 3 : 2).join(' '));
        if (!baseRole || !targetRole) return message.reply({ embeds: [error(`Usage: \`${prefix}role has [remove] <haveRole> <assignRole>\``)] });
        const m = await message.reply({ embeds: [base(color).setDescription('⏳ Working...')] });
        await message.guild.members.fetch().catch(() => {});
        let n = 0;
        for (const mem of message.guild.members.cache.values()) {
          if (!mem.roles.cache.has(baseRole.id)) continue;
          if (removeMode ? mem.roles.cache.has(targetRole.id) : !mem.roles.cache.has(targetRole.id)) await (removeMode ? mem.roles.remove(targetRole) : mem.roles.add(targetRole)).then(() => n++).catch(() => {});
        }
        return m.edit({ embeds: [success(message.author, `${removeMode ? 'Removed' : 'Added'} **${targetRole.name}** ${removeMode ? 'from' : 'to'} **${n}** members with **${baseRole.name}**.`)] });
      }

      case 'cancel': {
        if (client._roleOp) client._roleOp[message.guild.id] = false;
        return message.reply({ embeds: [success(message.author, 'Cancelled the running mass role operation.')] });
      }

      case 'restore': {
        const member = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        if (!member) return message.reply({ embeds: [error(`Usage: \`${prefix}role restore <member>\``)] });
        const stored = db.getSettings(message.guild.id, `stickyroles:${member.id}`, { roles: [] });
        const toAdd = stored.roles.filter((id) => { const r = message.guild.roles.cache.get(id); return r && canManage(r); });
        if (!toAdd.length) return message.reply({ embeds: [error('No saved roles to restore for that member.')] });
        await member.roles.add(toAdd, 'Role restore').catch(() => {});
        return message.reply({ embeds: [success(message.author, `Restored **${toAdd.length}** role(s) to **${member.user.tag}**.`)] });
      }

      default:
        return message.reply({ embeds: [error(`Unknown role subcommand.`)] });
    }
  },
});
