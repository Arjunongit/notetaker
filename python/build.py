#!/usr/bin/env python3
"""Build your notetaker — assembles YOUR config.

In a terminal (cmd, VS Code, Cursor, Replit, bash...), just run it and answer:
    python build.py

No terminal (an AI agent, CI, a script)? Pass the answers as flags instead:
    python build.py --name Juno --display ring --format md --key ak_ac_...
    python build.py --name Juno --image ./logo.png        # your own avatar

Either way it writes config.jsonc + .env at the repo root. Powered by AgentCall.
"""

import argparse
import os
import re
import shutil
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
_AVATARS = os.path.join(_ROOT, "avatars")
_IMG_EXTS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")


def ask(label, default=""):
    hint = f" [{default}]" if default else ""
    try:
        val = input(f"  {label}{hint}: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\n  Build cancelled.")
        sys.exit(1)
    return val or default


def choose(label, options, default):
    print(f"\n  {label}")
    for i, (key, desc) in enumerate(options, 1):
        star = "  (default)" if key == default else ""
        print(f"    {i}) {key:11s}{desc}{star}")
    raw = ask("Choose", default)
    if raw.isdigit() and 1 <= int(raw) <= len(options):
        return options[int(raw) - 1][0]
    for key, _ in options:
        if raw.lower() == key.lower():
            return key
    return default


def slug(name):
    s = "".join(c for c in name.lower() if c.isalnum())
    return s or "brand"


def copy_image(path, name):
    """Copy an image into avatars/ and return its display name (or 'pattern')."""
    path = os.path.expanduser((path or "").strip().strip('"').strip("'"))
    ext = os.path.splitext(path)[1].lower()
    if not path or not os.path.isfile(path) or ext not in _IMG_EXTS:
        print(f"  (couldn't use image '{path}' — falling back to the Pattern mark)")
        return "pattern"
    dest = slug(name)
    try:
        shutil.copyfile(path, os.path.join(_AVATARS, dest + ext))
        print(f"  -> copied your image to avatars/{dest}{ext}")
        return dest
    except Exception as e:
        print(f"  (couldn't copy: {e} — using the Pattern mark)")
        return "pattern"


def set_value(text, key, value):
    return re.sub(rf'("{key}"\s*:\s*)"[^"]*"', lambda m: m.group(1) + f'"{value}"', text, count=1)


def write_config(name, display, fmt):
    p = os.path.join(_ROOT, "config.jsonc")
    with open(p, encoding="utf-8") as f:
        text = f.read()
    text = set_value(text, "BOT_NAME", name)
    text = set_value(text, "DISPLAY", display)
    text = set_value(text, "OUTPUT_FORMAT", fmt)
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)


def write_env(key):
    with open(os.path.join(_ROOT, ".env"), "w", encoding="utf-8") as f:
        f.write(f"AGENTCALL_API_KEY={key}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Build your notetaker. No flags in a terminal = interactive; "
                    "pass flags for non-interactive / AI-agent / CI use.")
    parser.add_argument("--name")
    parser.add_argument("--display", help="audio | pattern | ring | transcript | <your avatar name>")
    parser.add_argument("--format", choices=["md", "txt", "json"])
    parser.add_argument("--image", help="path to a logo/photo to use as the avatar")
    parser.add_argument("--key", help="your AgentCall API key")
    args = parser.parse_args()

    has_flags = any([args.name, args.display, args.format, args.image, args.key])

    if not has_flags and not sys.stdin.isatty():
        print("This builder asks you questions, but there's no terminal here")
        print("(an AI agent, CI, or piped input). Two ways to build instead:\n")
        print("  1) Pass the answers as flags:")
        print("       python build.py --name Juno --display ring --format md --key ak_ac_...")
        print("       (--display can be audio/pattern/ring/transcript, or --image ./logo.png)")
        print("  2) Edit config.jsonc directly (BOT_NAME, DISPLAY, OUTPUT_FORMAT), key in .env.\n")
        sys.exit(0)

    print("\n  Let's build your meeting notetaker.\n")

    if has_flags:
        name = args.name or "Scribe"
        display = copy_image(args.image, name) if args.image else (args.display or "pattern")
        fmt = args.format or "md"
        key = args.key or ""
    else:
        name = ask("Name it", "Scribe")
        face = choose("Its face on camera:", [
            ("pattern", "the Pattern sunburst mark"),
            ("ring", "a glowing neon ring"),
            ("transcript", "the live transcript on screen"),
            ("audio", "no video, just listens (lightest)"),
            ("image", "your own logo/photo"),
        ], "pattern")
        if face == "image":
            ipath = ask("Path to your image (png/jpg/gif/svg/webp), or blank to skip")
            display = copy_image(ipath, name) if ipath else "pattern"
        else:
            display = face
        fmt = choose("Save notes as:", [
            ("md", "Markdown"), ("txt", "plain text"), ("json", "JSON"),
        ], "md")
        print()
        key = ask("Your AgentCall key (free at app.agentcall.dev/api-keys; blank to add later)")

    print(f"\n  Building {name}...")
    print("  -> wiring the listener (AgentCall bridge)")
    print(f"  -> giving {name} the '{display}' face")
    write_config(name, display, fmt)
    print("  -> wrote config.jsonc")
    if key:
        write_env(key)
        print("  -> saved your key to .env")

    print(f"\n  Done — you built {name}.")
    if not key:
        print("  Add your key: copy .env.example to .env and paste it in.")
    print("  Launch it:")
    print('     python notetaker.py "https://meet.google.com/your-link"\n')


if __name__ == "__main__":
    main()
