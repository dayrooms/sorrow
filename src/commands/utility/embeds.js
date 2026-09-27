const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { success, error, base } = require('../../utils/embed');
const { buildMessage, VARIABLE_LIST } = require('../../utils/messageBuilder');

const createembed = new Command({
  name: 'createembed', aliases: ['ce', 'embed'], category: 'utility', description: 'Create and send an embed from an embed script.', permLevel: LEVELS.MOD, usage: '<script>',
  async run({ message, args, prefix }) {
    const script = args.join(' ');
    if (!script) return message.reply({ embeds: [base().setTitle('Embed builder').setDescription(`\`${prefix}createembed {title: Hi} {description: text} {color: #ff0000}\`\n\nTokens: title, description, color, image, thumbnail, footer, author, content, field (name | value).\nVariables:\n${VARIABLE_LIST.join('\n')}`)] });
    const payload = buildMessage(script, { user: message.author, member: message.member, guild: message.guild, channel: message.channel });
    if (!payload) return message.reply({ embeds: [error('Could not build that embed.')] });
    await message.channel.send(payload).catch(() => message.reply({ embeds: [error('Failed to send — check your script.')] }));
    return message.delete().catch(() => {});
  },
});

const editembed = new Command({
  name: 'editembed', aliases: ['ee'], category: 'utility', description: 'Edit an embed the bot sent.', permLevel: LEVELS.MOD, usage: '<messageId> <script>',
  async run({ message, args, prefix }) {
    const id = args[0];
    const script = args.slice(1).join(' ');
    if (!id || !script) return message.reply({ embeds: [error(`Usage: \`${prefix}editembed <messageId> <script>\``)] });
    const target = await message.channel.messages.fetch(id).catch(() => null);
    if (!target || target.author.id !== message.client.user.id) return message.reply({ embeds: [error('Message not found or not sent by me.')] });
    const payload = buildMessage(script, { user: message.author, guild: message.guild });
    await target.edit(payload).catch(() => {});
    return message.reply({ embeds: [success(message.author, 'Edited the embed.')] });
  },
});

const copyembed = new Command({
  name: 'copyembed', aliases: ['stealembed'], category: 'utility', description: 'Copy an embed as a script.', permLevel: LEVELS.MOD, usage: '<messageId | reply>',
  async run({ message, args }) {
    let target = null;
    if (message.reference) target = await message.fetchReference().catch(() => null);
    else if (args[0]) target = await message.channel.messages.fetch(args[0]).catch(() => null);
    if (!target?.embeds.length) return message.reply({ embeds: [error('No embed found.')] });
    const em = target.embeds[0];
    const tokens = [];
    if (em.title) tokens.push(`{title: ${em.title}}`);
    if (em.description) tokens.push(`{description: ${em.description}}`);
    if (em.color) tokens.push(`{color: #${em.color.toString(16).padStart(6, '0')}}`);
    if (em.image) tokens.push(`{image: ${em.image.url}}`);
    if (em.thumbnail) tokens.push(`{thumbnail: ${em.thumbnail.url}}`);
    if (em.footer) tokens.push(`{footer: ${em.footer.text}}`);
    return message.channel.send({ content: `\`\`\`\n${tokens.join(' ')}\n\`\`\`` });
  },
});

module.exports = [createembed, editembed, copyembed];
