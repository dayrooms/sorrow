const Command = require('../../structures/Command');
const { LEVELS } = require('../../utils/permissions');
const { base, error } = require('../../utils/embed');
const config = require('../../config');

/**
 * Commands that need external APIs or a host you haven't set up yet.
 * Each is fully wired: it checks for its key/config and, if missing, replies
 * "not configured" instead of erroring. Add the key in .env to activate.
 */
function notConfigured(feature, envHint) {
  return base(config.colors.warn).setDescription(`⚠️ **${feature}** isn't configured yet.\nAdd \`${envHint}\` to your \`.env\` to enable it.`);
}

const weather = new Command({
  name: 'weather', category: 'utility', description: 'Get the weather for a location.', permLevel: LEVELS.USER, usage: '<location>',
  async run({ message, args }) {
    if (!config.weatherKey) return message.reply({ embeds: [notConfigured('Weather', 'OPENWEATHER_API_KEY')] });
    const q = args.join(' ');
    if (!q) return message.reply({ embeds: [error('Provide a location.')] });
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${config.weatherKey}`);
      if (!res.ok) return message.reply({ embeds: [error('Location not found.')] });
      const d = await res.json();
      return message.channel.send({ embeds: [base().setTitle(`Weather — ${d.name}, ${d.sys.country}`).setDescription(`**${d.weather[0].main}** (${d.weather[0].description})\n🌡️ ${d.main.temp}°C (feels ${d.main.feels_like}°C)\n💧 ${d.main.humidity}% · 💨 ${d.wind.speed} m/s`)] });
    } catch {
      return message.reply({ embeds: [error('Weather lookup failed.')] });
    }
  },
});

const translate = new Command({
  name: 'translate', aliases: ['tr'], category: 'utility', description: 'Translate text.', permLevel: LEVELS.USER, usage: '<lang> <text>',
  async run({ message, args }) {
    const lang = args[0];
    const text = args.slice(1).join(' ');
    if (!lang || !text) return message.reply({ embeds: [error('Usage: `translate <lang> <text>`')] });
    // Uses the free, keyless Google translate endpoint. Network egress must be allowed.
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error('bad');
      const data = await res.json();
      const out = data[0].map((p) => p[0]).join('');
      return message.channel.send({ embeds: [base().setTitle(`Translation → ${lang}`).setDescription(out)] });
    } catch {
      return message.reply({ embeds: [base(config.colors.warn).setDescription('⚠️ Translation service is unreachable from this host.')] });
    }
  },
});

const ask = new Command({
  name: 'ask', aliases: ['ai', 'chat'], category: 'utility', description: 'Ask the AI a question.', permLevel: LEVELS.USER, usage: '<question>',
  cooldown: 5000,
  async run({ message, args }) {
    if (!config.ai.key) return message.reply({ embeds: [notConfigured('AI', 'AI_API_KEY')] });
    const q = args.join(' ');
    if (!q) return message.reply({ embeds: [error('Ask a question.')] });
    const thinking = await message.channel.send({ embeds: [base().setDescription('🤔 Thinking...')] });
    try {
      let answer;
      if (config.ai.provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': config.ai.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: config.ai.model, max_tokens: 1024, messages: [{ role: 'user', content: q }] }),
        });
        const d = await res.json();
        answer = d.content?.[0]?.text || 'No response.';
      } else {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { authorization: `Bearer ${config.ai.key}`, 'content-type': 'application/json' },
          body: JSON.stringify({ model: config.ai.model, messages: [{ role: 'user', content: q }] }),
        });
        const d = await res.json();
        answer = d.choices?.[0]?.message?.content || 'No response.';
      }
      return thinking.edit({ embeds: [base().setDescription(answer.slice(0, 4096))] });
    } catch {
      return thinking.edit({ embeds: [error('AI request failed.')] });
    }
  },
});

// Pure "not configured" stubs for social/media lookups.
function stub(name, aliases, feature, category = 'social') {
  return new Command({
    name, aliases, category, description: `${feature} (requires external API — not configured).`, permLevel: LEVELS.USER, usage: '<query>',
    async run({ message }) {
      return message.reply({ embeds: [notConfigured(feature, 'the relevant API key')] });
    },
  });
}

const socialStubs = [
  stub('tiktok', [], 'TikTok lookup'),
  stub('instagram', ['ig'], 'Instagram lookup'),
  stub('twitter', ['x'], 'Twitter/X lookup'),
  stub('pinterest', [], 'Pinterest lookup'),
  stub('youtube', ['yt'], 'YouTube search'),
  stub('telegram', [], 'Telegram lookup'),
  stub('snapchat', [], 'Snapchat lookup'),
  stub('twitch', [], 'Twitch lookup'),
  stub('kickuser', [], 'Kick lookup'),
  stub('reddit', [], 'Reddit lookup'),
  stub('roblox', [], 'Roblox lookup'),
  stub('steam', [], 'Steam lookup'),
  stub('github', ['gh'], 'GitHub lookup'),
  stub('valorant', ['val'], 'Valorant stats'),
  stub('minecraft', ['mcuser'], 'Minecraft lookup'),
  stub('fyp', [], 'TikTok FYP'),
  stub('repost', [], 'Social media repost'),
  stub('image', ['img'], 'Image search'),
  stub('google', ['g'], 'Google search'),
  stub('movie', [], 'Movie lookup (TMDB)', 'utility'),
  stub('tv', [], 'TV lookup (TMDB)', 'utility'),
  stub('character', [], 'Person lookup (TMDB)', 'utility'),
  stub('shazam', [], 'Song identification', 'utility'),
  stub('transcribe', [], 'Audio transcription', 'utility'),
  stub('nba', [], 'NBA scores', 'utility'),
  stub('nfl', [], 'NFL scores', 'utility'),
  stub('mlb', [], 'MLB scores', 'utility'),
  stub('nhl', [], 'NHL scores', 'utility'),
  stub('soccer', [], 'Soccer scores', 'utility'),
];

module.exports = [weather, translate, ask, ...socialStubs];
