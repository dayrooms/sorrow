# Sorrow

An all-in-one Discord bot: hardened **antinuke** & **antiraid**, full **moderation**,
roles, config/automation, engagement systems, utility, VoiceMaster, fun, tickets,
and an owner-only **developer/eval** suite. Built with discord.js v14.

- **253 commands** across 13 categories
- Customizable per-server prefix (default `;`)
- SQLite storage (one file — runs on tiny hosts; easy to move to PostgreSQL later)
- Owner bypasses every permission check everywhere

---

## 1. Requirements

- **Node.js 18+** (built and tested on Node 22)
- A Discord bot application + token

## 2. Setup

```bash
# 1. Install dependencies (do this on your host — needs npm registry access)
npm install

# 2. Create your .env from the template
cp .env.example .env
#    then edit .env and fill in TOKEN and CLIENT_ID (OWNER_IDS is already set to you)

# 3. Start the bot
npm start
```

That's it. The SQLite database is created automatically in `data/sorrow.db`.

## 3. Discord Developer Portal

In the **Bot** tab, enable all three **Privileged Gateway Intents**:

- **Presence Intent** — activity/vanity-status features
- **Server Members Intent** — antiraid, autorole, welcome, counters, antinuke-on-join
- **Message Content Intent** — prefix commands, filters, autoresponders

Invite the bot with the **`bot`** + **`applications.commands`** scopes and
**Administrator** permission (antinuke needs it). An invite link is also printed
by the `;invite` command.

> **Antinuke reality check:** move **Sorrow's role to the very top** of the role
> list. A bot can never punish the server owner, and can only punish members
> *below* its highest role. Antinuke reacts to the first action(s), stops the
> attacker within ~1s, and restores what was destroyed — it can't prevent the
> very first click.

## 4. Configuration (`.env`)

| Variable | Required | Purpose |
|---|---|---|
| `TOKEN` | ✅ | Bot token |
| `CLIENT_ID` | ✅ | Application/client ID |
| `OWNER_IDS` | ✅ | Comma-separated owner IDs (already set to you). Owners bypass all checks and can use `;dev`. |
| `DEFAULT_PREFIX` | – | Global default prefix (default `;`) |
| `OPENWEATHER_API_KEY` | – | Enables `;weather` |
| `AI_API_KEY` / `AI_PROVIDER` / `AI_MODEL` | – | Enables `;ask` |
| `MUSIC_ENABLED` + `LAVALINK_*` | – | Enables music (needs a Lavalink server) |

Anything left unset simply makes that one command reply "not configured" — the
rest of the bot runs fine.

## 5. Prefix & shortcuts

- Default prefix is `;` and is **customizable per server**: `;prefix set <p>`.
- Mentioning the bot also works as a prefix.
- Many commands have short aliases: `;r` = `;role`, `;h` = `;help`,
  `;ui` = `;userinfo`, `;av` = `;avatar`, `;bc` = bot-clear, etc.
- Server admins can make their own with `;alias add <name> <command>`.

## 6. Command categories

`antinuke` · `antiraid` · `moderation` · `roles` (& expressions/channels) ·
`config` (& automation) · `engagement` · `utility` · `voice` (VoiceMaster) ·
`fun` (& roleplay) · `tickets` · `giveaway` · `music` · `developer`

Browse them in Discord with **`;help`** (dropdown menu) or `;help <command>`.

### Developer suite (owner only)

`;dev help` shows it. Includes `eval`, `guilds`, `leaveguild`, `blacklist`,
`reload`, `setstatus`, `say`. Locked to `OWNER_IDS`; nobody else can see or run it.

## 7. Hosting

- **Free, right now:** a Node.js panel host such as Wispbyte. Upload the folder
  (or connect this Git repo), set the env vars, run `npm install`, start `npm start`.
- **When you upgrade:** any VPS or panel host. Enable music by running a Lavalink
  server and setting `MUSIC_ENABLED=true`.

## 8. Notes on external-API commands

TikTok / Instagram / Twitter / YouTube / Roblox / Steam / Valorant / TMDB /
sports scores are present as commands but reply "not configured" until you wire
their APIs — as requested. `weather`, `ask`, and `translate` activate as soon as
you add their keys.

## 9. Project layout

```
src/
  index.js            entry point
  config.js           static config + palette
  structures/         Command class, SorrowClient
  handlers/           command & event loaders
  events/             gateway event handlers
  utils/              antinuke/antiraid/logging engines, db, helpers
  commands/<category>/  all command files
data/                 sqlite db (auto-created, git-ignored)
COMMAND_SPEC.md       the full command spec this was built against
```

---

Built for **foreignbank**. Colors: deep red `#8B0A0A` + bright yellow `#FBE70A`
(subcommands auto-shift shade). Change them in `src/config.js`.
