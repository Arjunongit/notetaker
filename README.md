# Meeting Notetaker

A silent bot that joins your video call, writes the transcript down **in real time**
(speech *and* chat), shows it live in your browser, and leaves when everyone else does.

That's all it does — **on purpose.** It's a clean base you fork and make your own.
Python **or** Node, one config file. **Powered by [AgentCall](https://agentcall.dev).**

![License](https://img.shields.io/badge/license-MIT-blue) ![Python](https://img.shields.io/badge/python-3.10%2B-blue) ![Node](https://img.shields.io/badge/node-18%2B-green)

---

## What it does

- **Joins** a Google Meet / Zoom / Teams link as a named participant.
- **Writes the transcript to a file in real time** — speech **and** chat (`.md` / `.txt` / `.json`).
- **Shows it live** in your browser at `localhost:8080`.
- **On-camera tile** (optional): the **Pattern mark** or the **live transcript** — or just audio.
- **Leaves** the moment the last human leaves — never bills an empty room.
- **Never speaks.** No AI, no summaries — fast and real-time.

---

## Setup

**1. Get it** — "Use this template" / fork / clone this repo, then pick a language:

```bash
cd python      # ...or:  cd node
```

**2. Install** — pick your language.

*Python (3.10+):*
```bash
python -m venv venv
venv\Scripts\activate          # Windows  ·  macOS/Linux:  source venv/bin/activate
pip install -r requirements.txt
```
*Node (18+):*
```bash
npm install
```
> macOS / Linux: if `python` / `pip` aren't found, use `python3` / `pip3`.

**3. Build it** 🛠 — the fun part:

```bash
python build.py        # or:  npm run build
```

It walks you through it — **name** your notetaker, pick its **face on camera** (pattern · ring ·
transcript · or your own logo/photo), choose the **notes format**, and paste your free
[AgentCall key](https://app.agentcall.dev/api-keys). It assembles your `config.jsonc` + `.env`.
**You built it.** *(Prefer to do it by hand? Edit [`config.jsonc`](config.jsonc) yourself.)*

> **No terminal** — an AI agent (Claude Code, Cursor), CI, or a script? The builder detects it and
> won't hang. Pass flags instead: `python build.py --name Juno --display ring --key ak_ac_...`
> (or `--image ./logo.png`), or just edit [`config.jsonc`](config.jsonc) directly.

**4. Run it** — join the meeting first, then:

```bash
python notetaker.py "https://meet.google.com/your-link"
#  or:  node notetaker.js "https://meet.google.com/your-link"
```

Admit the bot (~30–90s), talk, drop a chat message — watch `notes/` fill in live and the page at
**http://localhost:8080**. To stop: **leave the meeting** (the bot follows) or press **Ctrl+C**.

---

## Commands

```bash
python notetaker.py "<url>" --name Nova --display transcript
node   notetaker.js "<url>" --name Nova --display transcript     # or:  npm start -- "<url>"
```

| Flag | Overrides | Options |
|---|---|---|
| `--name` | `BOT_NAME` | any short name |
| `--display` | `DISPLAY` | `audio` · `pattern` · `transcript` |
| `--format` | `OUTPUT_FORMAT` | `md` · `txt` · `json` |
| `--out` / `--port` | `OUTPUT_DIR` / `WEB_PORT` | folder / port |
| `--web` / `--no-web` | `WEB` | live page on / off |

---

## The bot's video tile

Set **`DISPLAY`** in `config.jsonc`:

| `DISPLAY` | The tile shows |
|---|---|
| `"audio"` | nothing — audio only (lightest, most reliable) |
| `"pattern"` | the Pattern radial-sunburst mark + bot name |
| `"ring"` | a glowing neon ring + bot name |
| `"transcript"` | the live transcript, on screen in the call |

**Your own avatar — two ways**, both in the shared [`avatars/`](avatars/) folder:

- **An image** — drop `avatars/<name>.png` (or `.jpg` / `.gif` / `.svg` / `.webp`) and set `DISPLAY` to
  `<name>`. That image becomes the bot's video tile. Easiest path.
- **An HTML page** (for animation or live data) — drop `avatars/<name>.html` and set `DISPLAY` to `<name>`.
  Start from [`avatars/pattern.html`](avatars/pattern.html) or [`avatars/transcript.html`](avatars/transcript.html);
  `{{BOT_NAME}}` and `{{AVATAR_LINES}}` are filled in for you. It's your HTML/CSS/JS, tunnelled in as the bot's video.

---

## Make it your own

This is a clean notetaker, on purpose. Add your own code in the two empty hooks at the top of the
notetaker — `on_line` (every line, live) and `on_meeting_end` (the full transcript) — with whatever
stack you like: summaries, email, Slack, a database, anything.

Want to build something **beyond** a notetaker? It all runs on **[AgentCall](https://agentcall.dev)** —
head there to go further.

---

## How it works

```
  notetaker ──spawns──▶ engine/bridge ──▶ AgentCall ──▶ joins the meeting
      ▲                      │
      └──── clean events ◀───┘   participant joined/left · speech · chat · call ended
```

The notetaker runs AgentCall's **bridge** as the transport, reads its events, and writes your file —
your transcript stays on **your** computer. For an avatar it runs the visual bridge, which tunnels a
page you serve as the bot's video. You only pay for the minutes the bot is in the call (~$0.47/hr).

---

## Build from scratch (advanced)

Prefer to build it yourself? Have your AI agent build the notetaker from AgentCall's own repo. The
trick to a clean **one-shot** (verified): make it read the working examples *and the bridges* first.

**1.** `git clone https://github.com/pattern-ai-labs/agentcall && cd agentcall`, open it in Claude Code / Cursor / Gemini CLI.
**2.** Have a free key saved to `~/.agentcall/config.json`.
**3.** Paste this prompt verbatim:

> Read `SKILL.md` and the `examples/notetaker-simple/` and `examples/notetaker-smart/` folders **first**, and
> skim `scripts/python/bridge.py` and `scripts/python/bridge-visual.py`, so you use the real AgentCall API and
> bridges the way they actually work.
>
> Then build me one self-contained **silent meeting notetaker** in a new folder `my-notetaker/`, based on
> `examples/notetaker-simple`. It must **never speak, never screenshare, and use no LLM** — it only listens,
> writes, shows, and leaves.
>
> **Core:**
> 1. Takes a meeting link as a CLI argument; joins in **audio mode** (`voice_strategy:"direct"`, `transcription:true`) —
>    it **listens and never sends any TTS/speak/screenshare command**.
> 2. Captures **speech** (`transcript.final`) and **meeting chat** (`chat.message`) and writes them to
>    `meeting-notes-<timestamp>.md` **in real time** (append + flush each line): a `## Transcript` of
>    `[HH:MM:SS] Speaker: text` (mark chat lines `(chat)`), then `## Participants` and a `## Meeting Info` block
>    (Call ID, Duration, End reason, Total utterances).
> 3. **Leaves when the last human leaves:** track `participant.joined`/`participant.left`; set `alone_timeout` as a safety net.
> 4. **Always stops billing:** `DELETE` the call on every exit path — normal end, leave-when-empty, exception, Ctrl-C (use a `finally`).
> 5. Reads the key from `AGENTCALL_API_KEY` or `~/.agentcall/config.json`. Put all settings (bot name, output format,
>    leave-when-empty, and the `DISPLAY` mode below) in a `CONFIG` block at the top. One readable file.
>
> **Avatar — the bot's video tile, chosen by a `DISPLAY` setting (`"audio"` | `"pattern"` | `"transcript"`):**
> 6. For `"audio"`, run the plain `bridge.py` (no video). For `"pattern"`/`"transcript"`, run `bridge-visual.py` with
>    `--ui-port <port>`, where `<port>` is a tiny local HTTP server **you** start that serves ONE page: `pattern` = a clean
>    static brand mark showing the bot name; `transcript` = a page that fetches your own `/transcript.json` and shows the
>    last few lines. (Read `bridge-visual.py` to confirm `--ui-port` tunnels your local page in as the bot's video. Still
>    **never** send tts/screenshare — the bridge supports them, but the notetaker must not use them.)
>
> When done, run it once in `"audio"` mode against a test link I give you and show me the notes file.

**4.** Run what it built. You built a notetaker from scratch — running on AgentCall.

---

## License

MIT. The bundled `engine/` bridge is AgentCall's, also MIT. Powered by
[AgentCall](https://agentcall.dev) · [FirstCall](https://firstcall.dev).
