const { PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error } = require('../../utils/embed');
const { resolveMember, resolveRole } = require('../../utils/resolve');

const MAX = 1000;

/** Bulk-delete messages matching a predicate, up to `limit`, in batches of 100. */
async function purgeMatching(channel, limit, predicate) {
  let deleted = 0;
  let remaining = Math.min(limit, MAX);
  let before;
  while (remaining > 0) {
    const batch = await channel.messages.fetch({ limit: 100, before }).catch(() => null);
    if (!batch || batch.size === 0) break;
    before = batch.last().id;
    const toDelete = [...batch.values()].filter(predicate).slice(0, remaining);
    if (toDelete.length) {
      // bulkDelete only works on messages < 14 days old.
      const fresh = toDelete.filter((m) => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      if (fresh.length) {
        const res = await channel.bulkDelete(fresh, true).catch(() => null);
        if (res) {
          deleted += res.size;
          remaining -= res.size;
        }
      }
    }
    if (batch.size < 100) break;
  }
  return deleted;
}

const purge = new Command({
  name: 'purge',
  aliases: ['clear', 'prune', 'c'],
  category: 'moderation',
  description: 'Advanced message purging.',
  permLevel: LEVELS.MOD,
  usage: '<amount | subcommand> [args]',
  botPerms: [PermissionFlagsBits.ManageMessages],
  async run({ message, args, prefix }) {
    const sub = (args[0] || '').toLowerCase();
    const channel = message.channel;
    await message.delete().catch(() => {});

    const announce = async (n) => {
      const m = await channel.send({ embeds: [success(message.author, `Deleted **${n}** message(s).`)] });
      setTimeout(() => m.delete().catch(() => {}), 4000);
    };

    // Plain amount: `purge 50`
    if (/^\d+$/.test(sub)) {
      const n = Math.min(parseInt(sub, 10), MAX);
      const deleted = await purgeMatching(channel, n, () => true);
      return announce(deleted);
    }

    const amountAfter = (i) => {
      const n = parseInt(args[i], 10);
      return Number.isNaN(n) ? 100 : Math.min(n, MAX);
    };

    switch (sub) {
      case 'amount': {
        const n = Math.min(parseInt(args[1], 10) || 100, MAX);
        return announce(await purgeMatching(channel, n, () => true));
      }
      case 'user': {
        const member = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        if (!member) return channel.send({ embeds: [error('Member not found.')] }).then((m) => setTimeout(() => m.delete().catch(() => {}), 4000));
        const n = amountAfter(2);
        return announce(await purgeMatching(channel, n, (m) => m.author.id === member.id));
      }
      case 'role': {
        const role = resolveRole(message.guild, args[1]) || message.mentions.roles?.first();
        if (!role) return channel.send({ embeds: [error('Role not found.')] });
        return announce(await purgeMatching(channel, amountAfter(2), (m) => m.member?.roles.cache.has(role.id)));
      }
      case 'bots':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => m.author.bot));
      case 'humans':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => !m.author.bot));
      case 'webhooks':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => m.webhookId));
      case 'embeds':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => m.embeds.length));
      case 'files':
      case 'attachments':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => m.attachments.size));
      case 'images':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => m.attachments.some((a) => /\.(png|jpe?g|gif|webp)$/i.test(a.name))));
      case 'links':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => /https?:\/\//i.test(m.content)));
      case 'stickers':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => m.stickers.size));
      case 'emoji':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => /\p{Extended_Pictographic}/u.test(m.content)));
      case 'emotes':
        return announce(await purgeMatching(channel, amountAfter(1), (m) => /<a?:\w+:\d+>/.test(m.content)));
      case 'mentions': {
        const member = (await resolveMember(message.guild, args[1])) || message.mentions.members?.first();
        return announce(await purgeMatching(channel, amountAfter(2), (m) => (member ? m.mentions.users.has(member.id) : m.mentions.users.size)));
      }
      case 'contains': {
        const text = args.slice(1).join(' ').toLowerCase();
        if (!text) return channel.send({ embeds: [error('Provide text.')] });
        return announce(await purgeMatching(channel, 100, (m) => m.content.toLowerCase().includes(text)));
      }
      case 'startswith': {
        const s = args.slice(1).join(' ').toLowerCase();
        return announce(await purgeMatching(channel, 100, (m) => m.content.toLowerCase().startsWith(s)));
      }
      case 'endswith': {
        const s = args.slice(1).join(' ').toLowerCase();
        return announce(await purgeMatching(channel, 100, (m) => m.content.toLowerCase().endsWith(s)));
      }
      case 'reactions': {
        const batch = await channel.messages.fetch({ limit: amountAfter(1) }).catch(() => null);
        let n = 0;
        if (batch) for (const m of batch.values()) if (m.reactions.cache.size) { await m.reactions.removeAll().catch(() => {}); n++; }
        return announce(n);
      }
      default:
        return channel.send({ embeds: [error(`Usage: \`${prefix}purge <amount>\` or a subcommand (user, bots, links, images, embeds, contains, ...).`)] }).then((m) => setTimeout(() => m.delete().catch(() => {}), 6000));
    }
  },
});

const botclear = new Command({
  name: 'bc',
  aliases: ['botclear', 'clearbots'],
  category: 'moderation',
  description: 'Delete recent bot messages.',
  permLevel: LEVELS.MOD,
  botPerms: [PermissionFlagsBits.ManageMessages],
  async run({ message, args }) {
    await message.delete().catch(() => {});
    const n = Math.min(parseInt(args[0], 10) || 100, MAX);
    const deleted = await purgeMatching(message.channel, n, (m) => m.author.bot);
    const m = await message.channel.send({ embeds: [success(message.author, `Deleted **${deleted}** bot message(s).`)] });
    setTimeout(() => m.delete().catch(() => {}), 4000);
  },
});

module.exports = [purge, botclear];
