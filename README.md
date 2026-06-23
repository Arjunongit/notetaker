# Meeting Notetaker

A silent bot that joins your meeting, writes the transcript down **in real time**
(speech *and* chat), shows it live in your browser, and leaves when everyone else does.

That's all it does — **on purpose.** It's a clean base you fork and make your own.
Python **or** Node, one config file. **Powered by [AgentCall](https://agentcall.dev).**

![License](https://img.shields.io/badge/license-MIT-blue) ![Python](https://img.shields.io/badge/python-3.10%2B-blue) ![Node](https://img.shields.io/badge/node-18%2B-green)

---

## What it does

- **Joins** a Google Meet / Zoom / Teams link as a named participant.
- **Writes the transcript to a file in real time** — speech **and** chat (`.md` / `.txt` / `.json`).
- **Shows it live** in your browser at `localhost:8080`.
- **On-camera tile** (optional): the **Pattern AI Labs logo** or the **live transcript** — or just audio.
- **Leaves** the moment the last human leaves — never lingers in an empty room.
- **Never speaks.** No AI, no summaries — fast and real-time.

---

## Setup

**Two ways to set it up — pick whichever fits:**
- 🖥️ **Do it yourself** — run the four steps below.
- 🤖 **Let your AI assistant do it** — using Claude Code, Cursor, Gemini CLI, or similar? [Set it up with one prompt](#build-it-with-one-prompt) instead.

**1. Get it** — "Use this template" / fork / clone this repo, then pick a language:

```bash
cd python      # ...or:  cd node
```

**2. Install** — pick your language.

*Python (3.10+):*
```bash
python -m venv venv
source venv/bin/activate        # Windows:  venv\Scripts\activate
pip install -r requirements.txt
```
*Node (18+):*
```bash
npm install
```
> The venv keeps these deps isolated — and on modern Linux/macOS a plain `pip install` is blocked
> without one (PEP 668), so it's the reliable path everywhere. If `python` / `pip` aren't found, use `python3` / `pip3`.

**3. Build it** 🛠 — the one-time setup that makes it *yours*:

```bash
python build.py        # or:  npm run build
```

It asks a few quick questions — your free [AgentCall key](https://app.agentcall.dev/api-keys) **first**
(it writes a gitignored `.env` for you), then a **name**, its **face on camera** (audio · pattern · ring ·
transcript · or your own logo/photo), and the **notes format** — and assembles your `config.jsonc`.
**You built it.**

> **After this one-time build, just edit [`config.jsonc`](config.jsonc) directly** to change any
> setting — the build is only for first-time setup. Your key stays in `.env` (gitignored, never committed).

> **No terminal** — an AI agent (Claude Code, Cursor), CI, or a script? The builder detects it and won't
> hang. Run it non-interactively with flags (a key is required):
> `python build.py --key ak_ac_... --name Juno --display audio` (or `--image ./logo.png`) — the same
> thing the [one-prompt setup](#build-it-with-one-prompt) does for you.

**4. Run it** — join the meeting first, then:

```bash
python notetaker.py "https://meet.google.com/your-link"
#  or:  node notetaker.js "https://meet.google.com/your-link"
```

Admit the bot (~30–90s), talk, drop a chat message — watch `notes/` fill in live and the page at
**http://localhost:8080**. To stop: **leave the meeting** (the bot follows) or press **Ctrl+C**.

---

## Build it with one prompt

🤖 **Using an AI coding assistant? Set up your notetaker with a single prompt.** Open this
repo in [Claude Code](https://claude.com/claude-code), Cursor, Gemini CLI, or Windsurf and paste the
prompt below. Your agent runs the same one-time setup — your key, a name, the on-camera face, the
notes format — and hands you a working notetaker. **It's a starting point you can edit freely.**

> You're set up in my **notetaker** repo — a silent meeting-notetaker that runs on AgentCall. It's
> already complete: your job is to **configure and run it**, *not* to write a notetaker. Never modify
> `notetaker.py` / `notetaker.js` or anything in `engine/`.
>
> 1. Ask me: **Python or Node?** Then `cd` into that folder (`python/` or `node/`) and install deps —
>    Python: create and activate a venv, then `pip install -r requirements.txt`; Node: `npm install`.
> 2. Ask me for my **AgentCall API key** (free at app.agentcall.dev/api-keys). If I already have
>    `AGENTCALL_API_KEY` exported or a `~/.agentcall/config.json`, use that and don't ask. A key is
>    **required** — never proceed without one.
> 3. Ask me three quick things: a **name** (default: AgentCall); its **on-camera face** — `audio`
>    (no video, just listens), `pattern` (Pattern AI Labs logo), `ring`, `transcript`, or
>    `image` (my own logo/photo); and the **notes format** — `md`, `txt`, or `json`.
> 4. Run the builder **once** with my answers — it writes a gitignored `.env` (the key) and
>    `config.jsonc` (the settings):
>    `python build.py --key <KEY> --name <NAME> --display <FACE> --format <FORMAT>`
>    (Node: `node build.js …`). If I already had a key set, omit `--key`. Show me the output.
> 5. Tell me to join my meeting, then when I give you the link, run it:
>    `python notetaker.py "<MEET_LINK>"` (Node: `node notetaker.js "<MEET_LINK>"`).
>    `notes/` fills in live; the bot leaves when everyone else does.
>
> If any step fails, **stop and show me the exact error** — don't guess or fake success. After this
> one-time setup I can change any setting by editing `config.jsonc` directly.

Your agent copies, configures, and runs a tested notetaker — it never writes bot code, so there's
nothing to debug later. Same result as doing it yourself — your assistant just runs the steps.

---

## Commands

```bash
python notetaker.py "<url>" --name Nova --display transcript
node   notetaker.js "<url>" --name Nova --display transcript     # or:  npm start -- "<url>"
```

| Flag | Overrides | Options |
|---|---|---|
| `--name` | `BOT_NAME` | any short name |
| `--display` | `DISPLAY` | `audio` · `pattern` · `ring` · `transcript` |
| `--format` | `OUTPUT_FORMAT` | `md` · `txt` · `json` |
| `--out` / `--port` | `OUTPUT_DIR` / `WEB_PORT` | folder / port |
| `--web` / `--no-web` | `WEB` | live page on / off |

---

## The on-camera tile

What the bot shows on camera is the **`DISPLAY`** setting in [`config.jsonc`](config.jsonc). **Change it
anytime — edit the file and re-run, no rebuild needed.** Built-in choices:

| `DISPLAY` | The tile shows |
|---|---|
| `"audio"` | nothing — audio only · **lightest, the default** |
| `"pattern"` | the Pattern AI Labs logo + bot name |
| `"ring"` | a glowing neon ring + bot name |
| `"transcript"` | the live transcript, on screen in the call |

### Use your own logo or photo

Two steps, no code:

1. Drop your image in the [`avatars/`](avatars/) folder — e.g. `avatars/acme.png` (`.png` · `.jpg` · `.gif` · `.svg` · `.webp`).
2. Set `"DISPLAY": "acme"` in `config.jsonc` — the file name **without** the extension.

That image becomes the bot's tile. (The builder can do this for you too — pick **image** and give it the path.)
Want an animated or live-updating tile instead of a still image? Use an **HTML page** — see just below.

### Animated or live-data tile (advanced)

Drop an HTML page `avatars/<name>.html` and set `DISPLAY` to `<name>`. Start from
[`avatars/pattern.html`](avatars/pattern.html) or [`avatars/transcript.html`](avatars/transcript.html) —
`{{BOT_NAME}}` and `{{AVATAR_LINES}}` are filled in for you. It's your own HTML/CSS/JS, tunnelled in as the bot's video.

---

## Build on top

This is a clean, minimal base, on purpose — fork it and make it yours: live summaries, email or
Slack delivery, a database, a web UI, anything. There are two empty hooks at the top of the
notetaker waiting for your own logic.

Building something bigger on it? It all runs on **[AgentCall](https://agentcall.dev)** — head there
for the docs, examples, and full API. Whatever you want to build, you'll find what you need.

---

## How it works

```
  notetaker ──spawns──▶ engine/bridge ──▶ AgentCall ──▶ joins the meeting
      ▲                      │
      └──── clean events ◀───┘   participant joined/left · speech · chat · call ended
```

The notetaker runs AgentCall's **bridge** as the transport, reads its events, and writes your file —
your transcript stays on **your** computer. For an avatar it runs the visual bridge, which tunnels a
page you serve as the bot's video. The bot only runs while it's actually in your meeting, and your
notes never leave your machine.

---

## License

MIT. The bundled `engine/` bridge is AgentCall's, also MIT. Powered by
[AgentCall](https://agentcall.dev) · [FirstCall](https://firstcall.dev).
