const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base } = require('../../utils/embed');
const config = require('../../config');

/**
 * Music commands. Fully present, but playback needs a Lavalink server, which
 * free hosts don't provide. Until MUSIC_ENABLED=true and a Lavalink node is
 * configured, these reply with a clear "not enabled" message rather than
 * failing. Wire a Lavalink client (e.g. shoukaku/lavalink-client) into
 * play()/skip()/etc. when you move to a real host.
 */
function musicStub(name, aliases, desc) {
  return new Command({
    name, aliases, category: 'music', description: desc, permLevel: LEVELS.USER, usage: name === 'play' ? '<query>' : '',
    async run({ message }) {
      if (!config.music.enabled) {
        return message.reply({ embeds: [base(config.colors.warn).setDescription('🎵 Music is not enabled yet.\nIt requires a **Lavalink** server. Set `MUSIC_ENABLED=true` and configure `LAVALINK_*` in `.env` once you have one running (needs a paid/VPS host).')] });
      }
      // When enabled, plug your Lavalink client calls in here.
      return message.reply({ embeds: [base().setDescription('🎵 Music backend connected — implement Lavalink calls here.')] });
    },
  });
}

module.exports = [
  musicStub('play', ['p'], 'Play a song.'),
  musicStub('skip', ['sk'], 'Skip the current song.'),
  musicStub('stop', [], 'Stop playback.'),
  musicStub('queue', ['q'], 'View the queue.'),
  musicStub('nowplaying', ['np'], 'Show the current song.'),
  musicStub('pause', [], 'Pause playback.'),
  musicStub('resume', [], 'Resume playback.'),
  musicStub('disconnect', ['dc', 'leave'], 'Disconnect from voice.'),
  musicStub('volume', ['vol'], 'Set the volume.'),
  musicStub('shuffle', [], 'Shuffle the queue.'),
  musicStub('loop', ['repeat'], 'Loop the queue/track.'),
];
