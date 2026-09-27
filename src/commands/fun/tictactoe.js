const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { error, base } = require('../../utils/embed');
const { resolveMember } = require('../../utils/resolve');

module.exports = new Command({
  name: 'tictactoe',
  aliases: ['ttt'],
  category: 'fun',
  description: 'Play tic-tac-toe with another member.',
  permLevel: LEVELS.USER,
  usage: '<member>',
  async run({ message, args }) {
    const opponent = (await resolveMember(message.guild, args[0]))?.user || message.mentions.users.first();
    if (!opponent || opponent.bot || opponent.id === message.author.id) return message.reply({ embeds: [error('Mention another (human) member to play.')] });

    const players = [message.author, opponent];
    const marks = ['❌', '⭕'];
    let turn = 0;
    const board = Array(9).fill(null);

    const render = () => {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder();
        for (let c = 0; c < 3; c++) {
          const i = r * 3 + c;
          row.addComponents(new ButtonBuilder().setCustomId(`ttt_${i}`).setStyle(board[i] ? ButtonStyle.Secondary : ButtonStyle.Primary).setEmoji(board[i] || '➖').setDisabled(!!board[i]));
        }
        rows.push(row);
      }
      return rows;
    };
    const checkWin = () => {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
      return board.every(Boolean) ? 'tie' : null;
    };

    const msg = await message.channel.send({ embeds: [base().setTitle('Tic-Tac-Toe').setDescription(`${marks[turn]} <@${players[turn].id}>'s turn`)], components: render() });
    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });

    collector.on('collect', async (i) => {
      if (i.user.id !== players[turn].id) return i.reply({ content: "It's not your turn.", ephemeral: true }).catch(() => {});
      const idx = parseInt(i.customId.split('_')[1], 10);
      if (board[idx]) return i.deferUpdate().catch(() => {});
      board[idx] = marks[turn];
      const result = checkWin();
      if (result) {
        collector.stop();
        const desc = result === 'tie' ? "It's a tie!" : `${result} <@${players[marks.indexOf(result)].id}> wins! 🎉`;
        return i.update({ embeds: [base().setTitle('Tic-Tac-Toe').setDescription(desc)], components: render().map((r) => { r.components.forEach((b) => b.setDisabled(true)); return r; }) }).catch(() => {});
      }
      turn = 1 - turn;
      return i.update({ embeds: [base().setTitle('Tic-Tac-Toe').setDescription(`${marks[turn]} <@${players[turn].id}>'s turn`)], components: render() }).catch(() => {});
    });
    collector.on('end', (_, reason) => { if (reason === 'time') msg.edit({ components: [] }).catch(() => {}); });
  },
});
