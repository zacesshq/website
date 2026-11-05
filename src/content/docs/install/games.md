---
title: "Install Zacess Games"
description: "The games are one program, zacess-games. Sound is played by the system's own player (afplay on macOS, PipeWire, PulseAudio or ALSA on Linux and PowerShell on"
section: "install"
order: 3
product: "Zacess Games"
source: "games"
repo: "zacesshq/games"
ref: "v0.4.0"
refLabel: "v0.4.0"
release: "0.4.0"
path: "README.md"
heading: "Install"
sourceUrl: "https://github.com/zacesshq/games/blob/v0.4.0/README.md"
---

The games are one program, `zacess-games`. Sound is played by the system's own player (`afplay` on
macOS, PipeWire, PulseAudio or ALSA on Linux and PowerShell on Windows), so nothing else is needed.

> **Note**
>
> The Homebrew tap and the winget package follow the 0.4.0 release. Until each is live, Cargo or a
> release archive works on every platform.

## macOS and Linux with Homebrew

```sh
brew install zacesshq/tap/zacess-games
```

## Windows with winget

```powershell
winget install Zacess.Games
```

## Any platform with Cargo

```sh
cargo install --locked zacess-games
```

Rust 1.88 or later and a C compiler, since Lua 5.4 is built into the program.

## From a release

Each [release](https://github.com/zacesshq/games/releases/latest) carries a built binary for:

| File | System |
| --- | --- |
| `zacess-games-<tag>-aarch64-apple-darwin.tar.gz` | macOS on Apple silicon |
| `zacess-games-<tag>-x86_64-apple-darwin.tar.gz` | macOS on Intel |
| `zacess-games-<tag>-x86_64-unknown-linux-musl.tar.gz` | Linux on x86-64, no shared libraries needed |
| `zacess-games-<tag>-aarch64-unknown-linux-musl.tar.gz` | Linux on ARM64, no shared libraries needed |
| `zacess-games-<tag>-x86_64-pc-windows-msvc.zip` | Windows on x86-64 |

Each archive has a `.sha256` file beside it and holds the guides as well as the program. Check the
sum, unpack the archive and put `zacess-games` (or `zacess-games.exe`) somewhere on your `PATH`.

```sh
shasum -a 256 -c zacess-games-v0.4.0-aarch64-apple-darwin.tar.gz.sha256
tar -xzf zacess-games-v0.4.0-aarch64-apple-darwin.tar.gz
```
