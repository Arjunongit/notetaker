#!/usr/bin/env node
/**
 * Build your notetaker — an interactive setup that assembles YOUR config.
 *
 *   npm run build        (or:  node build.js)
 *
 * Walks you through naming it, choosing its on-camera face, the notes format,
 * and your key, then writes config.jsonc + .env at the repo root. Powered by AgentCall.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline/promises");

const ROOT = path.dirname(__dirname);
const AVATARS = path.join(ROOT, "avatars");
const IMG_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function ask(label, def = "") {
  const hint = def ? ` [${def}]` : "";
  const v = (await rl.question(`  ${label}${hint}: `)).trim().replace(/^\\ufeff/, "");
  return v || def;
}

async function choose(label, options, def) {
  console.log(`\n  ${label}`);
  options.forEach(([key, desc], i) => {
    const star = key === def ? "  (default)" : "";
    console.log(`    ${i + 1}) ${key.padEnd(11)}${desc}${star}`);
  });
  const raw = await ask("Choose", def);
  const n = parseInt(raw, 10);
  if (Number.isInteger(n) && n >= 1 && n <= options.length) return options[n - 1][0];
  const match = options.find(([k]) => k.toLowerCase() === raw.toLowerCase());
  return match ? match[0] : def;
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") || "brand";
}

async function installImage(name) {
  let p = await ask("Path to your image (png/jpg/gif/svg/webp), or blank to skip");
  if (!p) { console.log("  (skipped — using the Pattern mark)"); return "pattern"; }
  p = p.replace(/^["']|["']$/g, "");
  if (p.startsWith("~")) p = path.join(os.homedir(), p.slice(1));
  const ext = path.extname(p).toLowerCase();
  if (!fs.existsSync(p) || !IMG_EXTS.includes(ext)) {
    console.log(`  (couldn't read '${p}' — using the Pattern mark)`);
    return "pattern";
  }
  const dest = slug(name) + ext;
  try {
    fs.copyFileSync(p, path.join(AVATARS, dest));
    console.log(`  -> copied your image to avatars/${dest}`);
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

async function main() {
  console.log("\n  Let's build your meeting notetaker.\n");

  const name = await ask("Name it", "Scribe");

  const face = await choose("Its face on camera:", [
    ["pattern", "the Pattern sunburst mark"],
    ["ring", "a glowing neon ring"],
    ["transcript", "the live transcript on screen"],
    ["audio", "no video, just listens (lightest)"],
    ["image", "your own logo/photo"],
  ], "pattern");
  const display = face === "image" ? await installImage(name) : face;

  const fmt = await choose("Save notes as:", [
    ["md", "Markdown"],
    ["txt", "plain text"],
    ["json", "JSON"],
  ], "md");

  console.log();
  const key = await ask("Your AgentCall key (free at app.agentcall.dev/api-keys; blank to add later)");

  console.log(`\n  Building ${name}...`);
  console.log("  -> wiring the listener (AgentCall bridge)");
  console.log(`  -> giving ${name} the '${display}' face`);
  writeConfig(name, display, fmt);
  console.log("  -> wrote config.jsonc");
  if (key) { writeEnv(key); console.log("  -> saved your key to .env"); }

  console.log(`\n  Done — you built ${name}.`);
  if (!key) console.log("  Add your key: copy .env.example to .env and paste it in.");
  console.log("  Launch it:");
  console.log('     node notetaker.js "https://meet.google.com/your-link"\n');

  rl.close();
}

main().catch((e) => { console.error(e.message); rl.close(); process.exit(1); });
