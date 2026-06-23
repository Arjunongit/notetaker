#!/usr/bin/env node
/**
 * Build your notetaker — assembles YOUR config.
 *
 * In a terminal (cmd, VS Code, Cursor, Replit, bash...), just run it and answer:
 *     npm run build           (or:  node build.js)
 *
 * No terminal (an AI agent, CI, a script)? Pass the answers as flags instead:
 *     node build.js --name Juno --display ring --format md --key ak_ac_...
 *     node build.js --name Juno --image ./logo.png        # your own avatar
 *
 * Either way it writes config.jsonc + .env at the repo root. Powered by AgentCall.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.dirname(__dirname);
const AVATARS = path.join(ROOT, "avatars");
const IMG_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

// ── terminal styling (ANSI on a TTY; plain text otherwise) ─────────────────────
const ANSI = !!process.stdout.isTTY;
const CYAN = "36", GREEN = "32", DIM = "2", BOLD = "1";
const col = (code, s) => (ANSI ? `\x1b[${code}m${s}\x1b[0m` : s);

function row(colored, plain, w) {
  const pad = " ".repeat(Math.max(0, w - 1 - plain.length));
  return col(CYAN, "  │") + " " + colored + pad + col(CYAN, "│");
}

function banner() {
  const w = 48;
  console.log();
  console.log(col(CYAN, "  ╭" + "─".repeat(w) + "╮"));
  console.log(row(col(BOLD, "◆  N O T E T A K E R"), "◆  N O T E T A K E R", w));
  console.log(row(col(DIM, "build your own  ·  powered by AgentCall"),
                  "build your own  ·  powered by AgentCall", w));
  console.log(col(CYAN, "  ╰" + "─".repeat(w) + "╯"));
}

function parseFlags(argv) {
  const a = {};
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const x = rest[i];
    if (x === "--name") a.name = rest[++i];
    else if (x === "--display") a.display = rest[++i];
    else if (x === "--format") a.format = rest[++i];
    else if (x === "--image") a.image = rest[++i];
    else if (x === "--key") a.key = rest[++i];
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
    console.log(`  (couldn't use image '${p}' — falling back to the Pattern mark)`);
    return "pattern";
  }
  const dest = slug(name) + ext;
  try {
    fs.copyFileSync(p, path.join(AVATARS, dest));
    console.log(col(GREEN, "     ✓ ") + `copied your image to avatars/${dest}`);
    return slug(name);
  } catch (e) {
    console.log(`  (couldn't copy: ${e.message} — using the Pattern mark)`);
    return "pattern";
  }
}

function setValue(text, key, value) {
  return text.replace(new RegExp(`("${key}"\\s*:\\s*)"[^"]*"`), `$1"${value}"`);
}

function writeConfig(name, display, fmt) {
  const p = path.join(ROOT, "config.jsonc");
  let text = fs.readFileSync(p, "utf-8");
  text = setValue(text, "BOT_NAME", name);
  text = setValue(text, "DISPLAY", display);
  text = setValue(text, "OUTPUT_FORMAT", fmt);
  fs.writeFileSync(p, text);
}

function writeEnv(key) {
  fs.writeFileSync(path.join(ROOT, ".env"), `AGENTCALL_API_KEY=${key}\n`);
}

function assemble(name, display, fmt, key) {
  console.log(col(CYAN, "\n  ⚙  ") + col(BOLD, `Building ${name}`) + col(DIM, " ..."));
  console.log(col(GREEN, "     ✓ ") + "wired the listener (AgentCall bridge)");
  console.log(col(GREEN, "     ✓ ") + `set the '${display}' face`);
  writeConfig(name, display, fmt);
  console.log(col(GREEN, "     ✓ ") + "wrote config.jsonc");
  if (key) { writeEnv(key); console.log(col(GREEN, "     ✓ ") + "saved your key to .env"); }
  console.log(col(`${GREEN};${BOLD}`, `\n  ✦  Done — you built ${name}.`));
  if (!key) console.log(col(DIM, "     add your key: copy .env.example to .env and paste it in"));
  console.log(col(DIM, "     launch:") + ' node notetaker.js "https://meet.google.com/your-link"\n');
}

async function interactive() {
  const readline = require("readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (label, def = "") => {
    const hint = def ? col(DIM, ` [${def}]`) : "";
    const v = (await rl.question(`  ${label}${hint} ` + col(CYAN, "› "))).trim();
    return v || def;
  };
  const choose = async (label, options, def) => {
    console.log(`\n  ${col(BOLD, label)}`);
    options.forEach(([key, desc], i) =>
      console.log(`    ${col(CYAN, String(i + 1))}) ${key.padEnd(11)}${col(DIM, desc)}${key === def ? col(CYAN, "  ‹ default") : ""}`));
    const raw = await ask("choose", def);
    const n = parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1][0];
    const m = options.find(([k]) => k.toLowerCase() === raw.toLowerCase());
    return m ? m[0] : def;
  };

  console.log(col(DIM, "\n  Four quick choices and it's yours.\n"));
  const name = await ask("1 · name it", "Scribe");
  const face = await choose("2 · its face on camera", [
    ["pattern", "the Pattern sunburst mark"],
    ["ring", "a glowing neon ring"],
    ["transcript", "the live transcript on screen"],
    ["audio", "no video, just listens (lightest)"],
    ["image", "your own logo/photo"],
  ], "pattern");
  let display = face;
  if (face === "image") {
    const ip = await ask("    path to your image (png/jpg/gif/svg/webp), blank to skip");
    display = ip ? copyImage(ip, name) : "pattern";
  }
  const fmt = await choose("3 · save notes as", [
    ["md", "Markdown"], ["txt", "plain text"], ["json", "JSON"],
  ], "md");
  console.log();
  const key = await ask("4 · your AgentCall key (free at app.agentcall.dev/api-keys; blank to add later)");
  rl.close();
  assemble(name, display, fmt, key);
}

async function main() {
  const args = parseFlags(process.argv);
  const hasFlags = !!(args.name || args.display || args.format || args.image || args.key);

  if (!hasFlags && !process.stdin.isTTY) {
    console.log("This builder asks you questions, but there's no terminal here");
    console.log("(an AI agent, CI, or piped input). Two ways to build instead:\n");
    console.log("  1) Pass the answers as flags:");
    console.log("       node build.js --name Juno --display ring --format md --key ak_ac_...");
    console.log("       (--display can be audio/pattern/ring/transcript, or --image ./logo.png)");
    console.log("  2) Edit config.jsonc directly (BOT_NAME, DISPLAY, OUTPUT_FORMAT), key in .env.\n");
    process.exit(0);
  }

  banner();

  if (hasFlags) {
    const name = args.name || "Scribe";
    const display = args.image ? copyImage(args.image, name) : (args.display || "pattern");
    assemble(name, display, args.format || "md", args.key || "");
  } else {
    await interactive();
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
