#!/usr/bin/env node
/**
 * Build your notetaker — the one-time setup that assembles YOUR config.
 *
 * In a terminal (cmd, PowerShell, VS Code, Cursor, Replit, bash...), just run it and answer:
 *     npm run build           (or:  node build.js)
 *
 * No terminal (an AI agent, CI, a script)? Pass the answers as flags instead — key first:
 *     node build.js --key ak_ac_... --name Juno --display ring --format md
 *     node build.js --key ak_ac_... --image ./logo.png        # your own avatar
 *
 * Either way it writes .env (your key, gitignored) + config.jsonc at the repo root.
 * After this one-time build you can just edit config.jsonc directly. Powered by AgentCall.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.dirname(__dirname);
const AVATARS = path.join(ROOT, "avatars");
const IMG_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

// ── terminal styling (ANSI on a TTY; plain text otherwise) ─────────────────────
const ANSI = !!process.stdout.isTTY;
const BOLD = "1", DIM = "2";
const col = (code, s) => (ANSI ? `\x1b[${code}m${s}\x1b[0m` : s);

// AgentCall brand (truecolor). Unsupported terminals ignore these and fall back
// to default text — readable everywhere, never garbled.
const E = "\x1b[", R = E + "0m";
const INK = E + "38;2;28;29;26m";       // ink text on the cream card
const MUTE = E + "38;2;120;118;108m";   // muted text on the cream card
const CREAM = E + "48;2;243;240;232m";  // #F3F0E8 paper — the card surface
const LIMEBG = E + "48;2;200;255;58m";  // #C8FF3A lime — the badge surface
const ONLIME = E + "38;2;12;13;10m";    // near-black text on lime
const CARD_W = 46;

function emitCard(rows) {
  // Brand colors live only in these non-interactive cards (no input echo to fight);
  // plain text is the graceful fallback.
  if (!ANSI) {
    console.log();
    for (const [, plain] of rows) if (plain) console.log("  " + plain);
    console.log();
    return;
  }
  const blank = "  " + CREAM + " ".repeat(CARD_W) + R;
  console.log();
  console.log(blank);
  for (const [styled, plain] of rows) {
    const pad = " ".repeat(Math.max(0, CARD_W - 2 - plain.length));
    console.log("  " + CREAM + INK + "  " + styled + pad + R);
  }
  console.log(blank);
  console.log();
}

function pill(text) {
  // lime badge: lime background, near-black bold text, then back to the cream card
  return [LIMEBG + ONLIME + E + "1m" + " " + text + " " + R + CREAM + INK, " " + text + " "];
}

function banner() {
  emitCard([
    pill("ONE-TIME SETUP"),
    ["", ""],
    [E + "1m" + "▣  N O T E T A K E R" + R + CREAM + INK, "▣  N O T E T A K E R"],
    [MUTE + "build it once · powered by agentcall.dev" + R + CREAM, "build it once · powered by agentcall.dev"],
  ]);
}

function doneCard(name) {
  emitCard([
    pill("BUILT"),
    ["", ""],
    [E + "1m" + "✓  " + name + " is ready" + R + CREAM + INK, "✓  " + name + " is ready"],
    [MUTE + "config.jsonc + .env are written" + R + CREAM, "config.jsonc + .env are written"],
  ]);
}

function parseFlags(argv) {
  const a = {};
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const x = rest[i];
    if (x === "--key") a.key = rest[++i];
    else if (x === "--name") a.name = rest[++i];
    else if (x === "--display") a.display = rest[++i];
    else if (x === "--format") a.format = rest[++i];
    else if (x === "--image") a.image = rest[++i];
  }
  return a;
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") || "brand";
}

function copyImage(imgPath, name) {
  let p = (imgPath || "").replace(/^["']|["']$/g, "");
  if (p.startsWith("~")) p = path.join(os.homedir(), p.slice(1));
  const ext = path.extname(p).toLowerCase();
  if (!p || !fs.existsSync(p) || !IMG_EXTS.includes(ext)) {
    console.log(`   (couldn't use image '${p}' — falling back to the Pattern mark)`);
    return "pattern";
  }
  const dest = slug(name) + ext;
  try {
    fs.copyFileSync(p, path.join(AVATARS, dest));
    console.log("   " + col(BOLD, "✓") + ` copied your image to avatars/${dest}`);
    return slug(name);
  } catch (e) {
    console.log(`   (couldn't copy: ${e.message} — using the Pattern mark)`);
    return "pattern";
  }
}

function setValue(text, key, value) {
  // JSON.stringify escapes quotes/backslashes so any name stays valid JSON; the value
  // pattern allows backslash-escapes so a re-run matches a previously-escaped value.
  return text.replace(new RegExp(`("${key}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`),
                      (m, p1) => p1 + JSON.stringify(String(value)));
}

function writeConfig(name, display, fmt) {
  const p = path.join(ROOT, "config.jsonc");
  let text = fs.readFileSync(p, "utf-8");
  text = setValue(text, "BOT_NAME", name);
  text = setValue(text, "DISPLAY", display);
  text = setValue(text, "OUTPUT_FORMAT", fmt);
  fs.writeFileSync(p, text);
}

function existingKey() {
  // A key the notetaker could already use — env var, an existing .env, or
  // ~/.agentcall/config.json. Lets the build skip re-asking when one's set.
  const env = (process.env.AGENTCALL_API_KEY || "").trim();
  if (env) return env;
  try {
    for (let line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
      line = line.trim();
      if (line.startsWith("AGENTCALL_API_KEY=")) {
        const v = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
        if (v) return v;
      }
    }
  } catch { /* no .env */ }
  try {
    const v = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".agentcall", "config.json"), "utf-8")).api_key || "";
    if (v) return v;
  } catch { /* no config.json */ }
  return "";
}

function writeEnv(key) {
  // Write the gitignored .env with the AgentCall key. Only called once we have one.
  const p = path.join(ROOT, ".env");
  fs.writeFileSync(p, `AGENTCALL_API_KEY=${key}\n`);
  if (process.platform !== "win32") {           // keep the secret owner-only on POSIX
    try { fs.chmodSync(p, 0o600); } catch { /* best effort */ }
  }
}

function assemble(name, display, fmt, key) {
  console.log();
  console.log("  " + col(BOLD, `Building ${name}`) + col(DIM, " …"));
  console.log("   " + col(BOLD, "✓") + " wired the AgentCall listener");
  console.log("   " + col(BOLD, "✓") + ` set the "${display}" face`);
  writeConfig(name, display, fmt);
  console.log("   " + col(BOLD, "✓") + " wrote config.jsonc");
  if (key) { writeEnv(key); console.log("   " + col(BOLD, "✓") + " saved your key to .env"); }
  else console.log("   " + col(BOLD, "✓") + " using the AgentCall key already set");

  doneCard(name);
  console.log("  " + col(BOLD, "Run it:") + '  node notetaker.js "https://meet.google.com/your-link"');
  console.log("  " + col(DIM, "Edit config.jsonc anytime to change the name, face, or format · your key stays in .env."));
  console.log("  " + col(DIM, "Custom on-camera image? Drop it in avatars/ and set DISPLAY to its name."));
  console.log();
}

async function interactive() {
  const readline = require("readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.on("SIGINT", () => { console.log("\n  Build cancelled."); process.exit(1); });
  const prompt = async () => (await rl.question("  " + col(BOLD, "›") + " ")).trim();
  const ask = async (question, hint = "", def = "") => {
    console.log(`\n  ${col(BOLD, question)}` + (hint ? `  ${col(DIM, hint)}` : ""));
    return (await prompt()) || def;
  };
  const choose = async (question, options, def) => {
    console.log(`\n  ${col(BOLD, question)}`);
    options.forEach(([key, desc], i) =>
      console.log(`    ${col(BOLD, String(i + 1))}  ${key.padEnd(11)}${col(DIM, desc)}${key === def ? col(DIM, "  (default)") : ""}`));
    const raw = await prompt();
    const n = parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1][0];
    const m = options.find(([k]) => k.toLowerCase() === raw.toLowerCase());
    return m ? m[0] : def;
  };

  console.log(col(DIM, "  A few quick questions and it's yours."));
  let key = "";
  if (existingKey()) {
    console.log("  " + col(BOLD, "✓") + col(DIM, " found your AgentCall key already set — using it."));
  } else {
    while (!key) {
      key = await ask("First — paste your AgentCall key",
                      "free at app.agentcall.dev/api-keys · Ctrl-C to cancel");
      if (!key) console.log("  " + col(DIM, "A key is required to run the notetaker — paste it, or Ctrl-C to cancel."));
    }
  }
  const name = await ask("Name your notetaker", "e.g. Juno · enter to keep AgentCall", "AgentCall");
  const face = await choose("How should it show up on camera?", [
    ["audio", "no tile — lightest & cheapest"],
    ["pattern", "the Pattern AI Labs logo"],
    ["ring", "a glowing neon ring"],
    ["transcript", "the live transcript, on screen"],
    ["image", "your own logo or photo"],
  ], "audio");
  let display = face;
  if (face === "image") {
    const ip = await ask("Where's your image?", "png · jpg · gif · svg · webp  (enter to skip)");
    display = ip ? copyImage(ip, name) : "pattern";
  }
  const fmt = await choose("How should it save the notes?", [
    ["md", "Markdown"], ["txt", "plain text"], ["json", "JSON"],
  ], "md");
  rl.close();
  assemble(name, display, fmt, key);
}

async function main() {
  const args = parseFlags(process.argv);
  const hasFlags = !!(args.key || args.name || args.display || args.format || args.image);

  if (!hasFlags && !process.stdin.isTTY) {
    console.log("This builder asks you questions, but there's no terminal here");
    console.log("(an AI agent, CI, or piped input). Run it non-interactively with flags:\n");
    console.log("  node build.js --key ak_ac_... --name Juno --display audio --format md");
    console.log("  (--display: audio | pattern | ring | transcript, or --image ./logo.png)");
    console.log("  A key is required: --key, or AGENTCALL_API_KEY / ~/.agentcall/config.json.\n");
    process.exit(0);
  }

  banner();

  if (hasFlags) {
    const name = args.name || "AgentCall";
    const display = args.image ? copyImage(args.image, name) : (args.display || "audio");
    const key = args.key || "";
    if (!key && !existingKey()) {
      console.log("\n  An AgentCall key is required — the notetaker can't run without one.");
      console.log("  Pass --key ak_ac_...  (free at app.agentcall.dev/api-keys),");
      console.log("  or set AGENTCALL_API_KEY, or add it to .env, then build again.");
      process.exit(1);
    }
    assemble(name, display, args.format || "md", key);
  } else {
    await interactive();
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
