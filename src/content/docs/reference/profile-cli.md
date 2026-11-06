---
title: "Profile command line"
description: "A mistyped command or option also exits 2."
section: "reference"
order: 56
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "README.md"
heading: "Commands"
sourceUrl: "https://github.com/zacesshq/profile/blob/v0.2.2/README.md"
---

| Command | What it does | Exit code |
| --- | --- | --- |
| `check <profile>...` | Derives any missing colour, then checks every pair of every file given. `--verbose` lists every pair. `--no-derive` also fails a profile that leaves colours to derive | 0 when every profile passes. 1 when a pair fails. 2 when any file is unreadable or invalid or when no colour can be derived to meet a floor. A bad file is reported and the rest are still checked |
| `derive <profile>` | Prints the complete profile with every derived colour marked. `--out <file>` writes it instead | 0 when the result passes. 1 when a colour you set fails, with the profile still printed. 2 when the file is unreadable or invalid or when no colour can be derived to meet a floor |
| `render <profile> --target <name> --out <dir>` | Writes `<dir>/<target>/` from the templates. `--target all` writes every target | 0 when written. 2 when the profile is invalid, cannot be completed or fails a pair, with nothing written |
| `apply <profile> --live` | Sends OSC 4, 10, 11 and 12 to standard output, which recolours the terminal it runs in until the terminal is reset. `--escaped` prints them as readable text with nothing sent, with or without `--live`. `--tmux` wraps them for tmux passthrough | 0 when sent. 2 when the profile is invalid, cannot be completed or fails a pair |
| `watch <profile> --target <name> --out <dir>` | Checks and renders the profile, then does it again each time the file changes. A profile named `name-dark.toml` or `name-light.toml` is paired with the other in the same folder (`--variant` names another) and the variant matching the system's light or dark setting is rendered. Both are written under the id without its ending, so an app can point at one file. A change that fails a pair is reported and the last good files are kept. `--appearance dark` or `light` pins one variant. Runs until Ctrl+C, which ends it the way Ctrl+C ends any command | 2 at the start when the target is unknown, `--out` is empty or the variant given does not exist. A file that cannot be written later is reported and the watch carries on |
| `os <profile> --print` | Prints the system accessibility settings the profile maps to: `defaults write` and `defaults delete` lines on macOS, `gsettings set` on GNOME and `reg add` values with their Settings page on Windows. **A preview only.** zprf never runs them and has no option to. `--platform` prints another platform's lines | 0 when printed. 2 when the profile is invalid or fails a pair |
| `list-targets` | Lists every target with the file it writes | 0 |

A mistyped command or option also exits 2.
