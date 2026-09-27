# Command Specification (from user-provided docs)

This file mirrors the reference bot's command trees so Sorrow matches them.
Permissions map to Sorrow's check system:
- "Server Owner"      -> ownerOnly (guild owner) OR bot owner
- "AntiNuke Admin"    -> antinuke admin (db) OR guild owner OR bot owner
- "Administrator"     -> Administrator permission OR fakeperms OR bot owner
- "Manage Server"     -> ManageGuild permission OR fakeperms OR bot owner
- "Manage Messages"   -> ManageMessages permission OR fakeperms OR bot owner
Bot owner (OWNER_IDS) bypasses ALL checks everywhere.

## antinuke  (perm: Server Owner)
- antinuke                 — overview/help
- antinuke edit            — configure any protection module
- antinuke setup           — pick logging + which modules to enable
- antinuke toggle          — enable/disable the whole system
- antinuke logging <channel>            — set log channel
- antinuke dmlogs          — configure DM alert logs         (Owner, AN Admin)
- antinuke whitelist <user>             — allow bypass
- antinuke unwhitelist <user>           — remove bypass
- antinuke admin <user>                 — grant AN admin
- antinuke unadmin <user>               — revoke AN admin
- antinuke settings        — show toggles, thresholds, punishments
- antinuke reset           — reset everything to default
- antinuke permissions     — configure permission-based protection modules
- antinuke restore         — restore deleted channels/roles   (AN Admin) [was Premium; free in Sorrow]

### antinuke protection modules (each: enable/disable + punishment + threshold)
antiguildupdate, antichannelcreate, antichanneldelete, antichannelupdate,
antiban, antikick, antibotadd, antirolecreate, antiroledelete, antiroleupdate,
antirolemember (mass role give/remove), antiwebhookcreate, antiwebhookdelete,
antiwebhookupdate, antivanity (vanity change -> restore), antiprune,
antiemoji (emoji/sticker delete), antimassmention
### antinuke permission modules (grant of dangerous perms -> strip or ban)
administrator, manage webhooks, manage channels, moderate members,
manage expressions, ban members, manage guild, mention everyone,
manage roles, kick members  (each: enabled/disabled, action strip|ban)

## antiraid  (perm: administrator to view; config = Server Owner)
- antiraid
- antiraid toggle
- antiraid logging <channel>
- antiraid setup
- antiraid edit
- antiraid lockdown <on/off> [role]
- antiraid raid <duration> <action> [reason]   — punish accounts joined within duration
- antiraid recentban <amount> [reason]         — ban most recent joins
- antiraid settings
- antiraid admin <user>
- antiraid unadmin <user>
- antiraid reset
- antiraid whitelist <user>
- antiraid unwhitelist <user>
### antiraid modules
massjoin (joinThreshold/joinWindow), newaccounts (minAccountAge),
noavatar (default avatar), youngaccounts, joinraid autolock

## automod  (perm: Manage Server) — Discord native automod
- automod, automod edit, automod list, automod remove, automod log <#channel>

## autopurge  (perm: Manage Messages)
- autopurge, autopurge add, autopurge remove <channel>, autopurge edit, autopurge list

## fakeperms  (perm: Server Owner)
- fakeperms, fakeperms add <role/user> <permissions>, fakeperms remove <role/user> <permissions>,
  fakeperms list [role/user], fakeperms reset, fakeperms check <role/user>, fakeperms permissions

## filter  (perm: Administrator)
- filter, filter add, filter remove <word|#n>, filter list, filter reset,
  filter config, filter log <channel>

## honey  (perm: Administrator) — honeypot
- honey, honey edit, honey logging <#channel>, honey config, honey reset

## joingate  (perm: Administrator)
- joingate, joingate toggle, joingate edit, joingate list, joingate view <user>,
  joingate accept <user>, joingate deny <user/all> [reason], joingate config, joingate reset

## appeal  (Manage Guild; list/view/close/open/approve/pending = Manage Guild or Reviewer Role)
appeal, appeal toggle, appeal edit, appeal config, appeal list, appeal view <id>,
appeal close <id> [reason], appeal open <id>, appeal approve <id> [reason], appeal pending

## Moderation
warn <member> [reason] [proof]        (Moderate Members) ; warn user ; warn punish (Administrator)
kick <member> [reason] [$silent]      (Kick Members)
votekick <member> [reason]            (Kick Members)
voteban <member> [reason]             (Ban Members)
ban <user> [$days] [reason] [$silent] (Ban Members) ; ban user ; ban recent
tempban <user> <duration> [$days] [reason]   (Ban Members)
unban <user> [reason]                 (Ban Members)
timeout <member> <duration> [reason]  (Moderate Members)
untimeout <member> [reason] ; untimeout all [reason]   (Moderate Members)
mute <member> <duration> [reason]     (Moderate Members)
unmute <member> [reason]              (Moderate Members / Manage Roles)
hardban <user> [$days] [reason] [$silent]   (Ban Members; needs antinuke admin) ; auto re-ban on rejoin
unhardban <user> [reason]             (Ban Members)
hardbanlist                           (Ban Members)
hardbanclear                          (Ban Members / Administrator)
imagemute / imageunmute <member> [reason]      (Moderate Members)
reactionmute / unreactionmute <member> [reason](Moderate Members)
streammute / streamunmute <member> [reason]    (Moderate Members)
timeoutlist / mutelist                (Moderate Members)
jaillist                              (Manage Messages)
jail <member> [duration] [reason]     (Moderate Members)
unjail <member> [reason]              (Moderate Members)
strip <member> [reason]               (Administrator)  -- remove all dangerous-perm roles
restore <member>                      (Manage Roles)   -- alias of role restore
rename <member> <nickname>            (Manage Nicknames)
forcenickname <member> <nickname>     (Manage Guild) ; forcenicklist
temprole <member> <duration> <role>   (Manage Roles)
immune / immune add/remove/edit/list/reset   (Administrator)
warnings <member>                     (Manage Messages)
modstats <member> [time]              (Manage Messages)
modhistory <member> [command]         (Manage Messages)
history <member> [command]            (Manage Messages)
audit                                 (View Audit Log)

## Channel control
lock [channel] [role/member] ; lock channel ; lock reactions ; lock images
lock ignore add/remove/list           (Manage Guild)
lockall [reason] ; unlockall [reason]  (Manage Channels)
unlock [channel] [role/member] ; unlock reactions ; unlock images
hide <channel> [role/member] ; reveal <channel> [role/member]   (Manage Channels)
slowmode <duration> [channel]         (Manage Channels)
revokefiles / unrevokefiles <role/member>   (Manage Channels)
naughty [channel]                     (Manage Channels)  -- 30s nsfw
topic <channel> <text> ; topic remove  (Manage Channels)
channel create/remove/edit/sync       (Manage Channels)
nuke [channel]                        (AntiNuke Admin)   -- clone channel
autonuke add/remove/edit/list         (AntiNuke Admin)
autothread add/remove/list/clear      (Manage Channels)
drag <member> <channel> (Move Members) ; dragall (Manage Server)

## Roles
role <member> <role...>                (Manage Roles)
role add/remove <member> <role>
role create [color] [color2] <name>    -- gradient support
role delete <role> ; role edit <role> <name>
role color <role> <hex> [hex2] ; role mentionable/hoist <role>
role icon <role> <emoji/url/attachment>
role cancel ; role restore <member>
role all [remove] <role> ; role bots [remove] <role> ; role humans [remove] <role>
role has [remove] <role> <assignRole>  (Manage Roles / Manage Guild)

## Purge  (Manage Messages)
purge <member/amount> [search] ; purge amount <n> ; purge user <member> [amount]
purge role/bots/humans/webhooks/embeds/files/links/images/stickers/emoji/emotes
purge contains <text> ; purge startswith <s> ; purge endswith <s>
purge mentions <member> ; purge reactions ; purge activity
purge after/before/upto <msg> ; purge between <startId> <finishId>
bc <amount>  -- alias: delete bot messages

## Expressions
sticker add/remove/rename/tag/cleanup/zip   (Manage Expressions; zip=Admin)
emoji add/addmany/remove/removemany/rename/cleanduplicates/info/zip

## Threads  (Manage Threads unless noted)
thread lock/unlock/add/remove/rename ; thread watch [list] (Manage Channels)
thread tag <keyword> ; thread config (Manage Channels)

## Cases  (Manage Messages)
case add/remove/reset/edit/view ; reason <member|caseId> <newReason>
proof add/remove/list <caseId>

## Misc setup
setup                                 (Manage Server/Channels/Roles) -- auto create mod roles+channels
permissions <member/role> [channel]   (Manage Roles)
unbanall ; unbanall cancel            (AntiNuke Admin)

## Config / Settings
prefix ; prefix set <prefix> ; prefix reset          (Manage Guild)
selfprefix set/reset                                 (per-user)
imagelock add/remove/list                            (Manage Guild)
settings ; settings roles/channels/default/timezone  (Manage Guild)
alias add/edit/remove/list                           (Manage Guild)
invoke add/edit/remove/test/list                     (Manage Guild)  -- custom punishment msgs
suppress add/edit/remove/list/reset/copy             (Manage Channels)
ignore add/remove/list                               (Administrator)
restrict add/edit/remove/list/reset                  (Manage Guild)
disablecommand / enablecommand                       (info)

## Engagement / Customization (from attachment)
autopfp add/remove/edit/list/reset/post            (Manage Server)  -- pinterest pfp feeds
autoresponder add/edit/remove/list/reset           (Manage Channels)
autorole add/remove/list/reset                      (Manage Server + Manage Roles)  -- humans/bots
autounmute <channel>                                (Manage Server)
badge toggle/edit/config/test/sync                  (Manage Guild)  -- clan tag roles
boostroles toggle/base/edit/create/color/rename/remove/dominant/random/icon/share/sharelist/unshare/leave/sync/syncshares/list/cleanup/link/unlink  (mix: Server Booster / Manage Guild)
boosts add/edit/remove/list/test                    (Manage Guild)
counters setup/remove/list/reset                    (Manage Server)  -- live channel-name stats
vote                                                 (everyone)
variables                                            (everyone)  -- list message variables
goodbye add/edit/remove/list/test                   (Manage Guild)
joindm add/edit/remove/test                          (Manage Guild)
logging edit/setup/events/config/test/reset         (Manage Server)
partner edit/xprate/config/view/test/profile/leaderboard/addxp/removexp/setlevel/setservers/resetprofile/reset  (Manage Guild; profile/leaderboard=everyone)
reaction add/react/remove/list/multiple/reset       (Manage Expressions; react=Manage Messages)
reactionroles add/addmany/mode/edit/remove/removeall/reset/list/panel + blacklist(add/remove/view/clear) + whitelist(add/remove/view/clear)  (Manage Server + Manage Roles)
rolelink add/remove/edit/list/reset/sync            (Manage Server + Manage Roles; sync=Guild Owner)  -- sticky roles
vanity toggle/edit/config/test/reset                (Manage Guild)  -- status vanity reward roles
welcome add/edit/remove/list/test                   (Manage Guild)

## Activity / Community (attachment 3)
activity server/user/messages/voice/top/quickstats/channel/reactions/peak/growth/toggle/leaderboard/role/sticky/rewards  (view=everyone; toggle/quickstats/sticky/rewards=Manage Guild)
bumpreminder edit/remove/config/test/leaderboard   (Manage Channels)
confessions toggle/edit/reset/revoke/unrevoke/blacklisted/config ; confess  (Manage Channels; revoke=Manage Server)
counting toggle/edit/reset/set/limit/leaderboard/stats  (Manage Server; lb/stats=everyone)
giveaway start/end/reroll/list/cancel/edit/default/entries  (Manage Server)
rank [member] ; vclevel [member]                    (everyone)
levels toggle/config/edit/sync/test/setxp/addxp/removexp/setlevel/resetxp/cleanup/reset  (Manage Server; cleanup=Owner; reset=Admin)
leaderboard ; vcleaderboard                          (everyone)
qotd add/role/time/post/settings                     (Manage Guild; settings=everyone)
starboard add/remove/config/edit/ping/selfstar/maxage  (Manage Channels)
streak ; streaks toggle/edit/profile/leaderboard/restore/claim/config/preview  (Manage Guild; profile/lb/restore/claim=everyone)
swear toggle/edit/leaderboard/profile/reset          (Manage Server; lb/profile=everyone)
tracker toggle/stack/server/graph/leaderboard/who/reset/fake/channel/rewards(add/remove/list)/message/test ; invites [member]  (Manage Guild; invites/server/lb=everyone)

## VoiceMaster  (Manage Server for config; channel ops = voice channel owner)
voicemaster setup/reset/config/sendinterface/embed/edit/blacklist   (Manage Server)
voicemaster permit/reject/ghost/unghost/lock/unlock/name/limit/bitrate/region/status/music/claim/transfer/kick/info  (VC owner)

## Utility / Media / Embeds (attachment 4)
backup create/list/view/remove/load/cancel          (Manage Guild)  [was Premium; free in Sorrow]
studio add/remove/list/admin/unadmin/admins/clear   (Owner/Studio Admin) -> Sorrow: web builder access
avatar [user] ; banner [user] ; servericon [guildid] ; guildbanner ; guildsplash   (everyone)
poll <duration> <question> <opt1> <opt2>...          (Manage Channels+Messages)
firstmsg [channel]                                    (everyone)
translate <lang> <text> ; transcribe <lang> <attachment> ; autotranscribe add/remove/list/clear
enlarge <emoji> ; steal <name> ; image <query> ; google <search>  (steal=Manage Expressions)
setbanner/seticon/setsplash <url/attachment>          (Manage Guild)
embedaccent <msg link> ; recolor <emoji|url> <hex>    (everyone)
afk [reason] ; afkmentions ; afkmessage set/view/reset/test
catfish <url> ; shazam <url> ; topcommands ; topcommands
nba/nfl/mlb/soccer/nhl                                (everyone) -- scores
customize                                             (Manage Guild) -- bot appearance
autoreact add/remove/list/clear/reset                 (Manage Server)
embed ; createembed <code|.txt> ; copyembed <msg> ; editembed <msg> <code>  (Manage Messages)
remind <time> <message> ; remind remove/list
autoping add/edit/remove/list/test/reset              (Manage Guild)
snipe/editsnipe/multisnipe/multieditsnipe/reactionsnipe [amount] [channel] ; clearsnipes  (clear=Manage Messages)
stickymessage add/remove/edit/reset/list              (Manage Server)
pins config                                            (Manage Server)
webhook                                                (Manage Webhooks) -- web builder
birthday view/set/unset/switch/list/config/setup/test (set/view=everyone; config/setup/test=Manage Server)
page add/edit/list/remove                              (Manage Messages)  -- multi-embed pagination
calculate <expr> ; lookup <length> ; lookup vanity ; builder  (everyone; builder=Manage Messages)
movie <query> ; tv <query> ; character <name>         (everyone)

## Fun (attachment 5) — all everyone-perm unless noted
howgay/howlesbian [member] ; howsus [member] (alias howautism -> neutral output)
bitches/dih/rizz/aura/iq/motion [member]  -- random meters
rps <choice> ; choose <opt1> <opt2>... ; wouldyourather ; eightball <question>
uwulock add/remove/list/reset (+ shortcuts uwunlock/uwulist/uwuclear)  (Manage Messages [+Webhooks for add])
gaylock add/remove/list/reset (+ shortcut gayunlock)                   (Manage Messages [+Webhooks for add])
flag start/end (end=Manage Messages)
blacktea start/end/stats/leaderboard (end=Manage Messages)
ship [member] ; wanted <member> [bounty] ; tweet [member]
fakemessage <member> <text>   -- rendered with "fake" marker
family [member] ; adopt <member> ; disown <member> ; runaway ; marry <member> ; divorce
tictactoe <member> ; tictactoe self/stats/leaderboard
blunt light/hit/give/steal/leaderboard ; smoke (alias blunt hit)

## Roleplay (attachment 6) — everyone; sexual ones (fuck, spank, choke, whip, lick) require NSFW channel
roleplay (Manage Server: toggle which are enabled)
kiss/slap/hug/pat/bite/poke/tickle/punch/blush/greet/highfive/fistbump/bonk/tackle/boop/cry/
dance/feed/handhold/lick/nuzzle/wink/smile/pout/stare/yeet/throw/laugh/cuddle/nod/kill/shoot/
run/bully/spank/whip/choke/cookie/cake/pizza/coffee/tea/fuck/nyah  [member]
interact <action> <member>   -- same actions under one command

## Social / Lookup (everyone unless noted)
repost <url> ; autorepost (Manage Server) ; fyp
tiktok/instagram/pinterest/twitter/telegram/snapchat/twitch/kickuser/reddit <username>
youtube <search> ; roblox user/avatar <username> ; steam <id> ; github <username>
valorant <name#tag> ; minecraft <username>
feeds add/remove/reset/edit/list/test   (Manage Channels)

## Tickets (attachment 7) — panel mgmt=Administrator; in-ticket actions=staff/everyone
tickets panels/setup/reset/forms/resend/blacklist/export/profiles/staffroles   (Administrator)
tickets stats/list/profile                                                      (everyone)
tickets close/claim/unclaim/reopen/delete/rename/move/transcript/allow/deny/reason  (staff)
