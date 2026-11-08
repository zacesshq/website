---
title: "Install Zacess Scenes"
description: "The formula installs the release binary for the machine (Apple silicon, Intel, Linux on x86-64 or ARM64) after Homebrew has checked it against the checksum"
section: "install"
order: 2
product: "Zacess Scenes"
source: "scenes"
repo: "zacesshq/scenes"
ref: "v1.1.0"
refLabel: "v1.1.0"
release: "1.1.0"
path: "README.md"
heading: "Install"
sourceUrl: "https://github.com/zacesshq/scenes/blob/v1.1.0/README.md"
---

| System | Shortest route |
| --- | --- |
| macOS and Linux | [Homebrew](#homebrew-macos-and-linux) |
| Windows | [winget](#winget-windows) |
| Anywhere with a Rust toolchain | [Cargo](#cargo-cratesio) |
| Anywhere else and any machine without a package manager | [A release archive](#a-release-archive) |

## Homebrew (macOS and Linux)

```sh
brew install zacesshq/tap/zacess-scenes
```

The formula installs the release binary for the machine (Apple silicon, Intel, Linux on x86-64 or
ARM64) after Homebrew has checked it against the checksum recorded in the formula. `brew upgrade
zacess-scenes` moves to a newer release.

## winget (Windows)

```powershell
winget install Zacess.Scenes
```

Each release is submitted to the [winget community repository](https://github.com/microsoft/winget-pkgs)
once its files are attached, so the newest version can take a day or two to reach winget. The
release archive below is current straight away.

## Cargo (crates.io)

```sh
cargo install --locked zacess-scenes
```

Rust 1.85 or later and a C compiler, since Lua 5.4 is built into the program. The dependencies are
crossterm, mlua with its own copy of Lua and signal-hook on Unix. The crate on
[crates.io](https://crates.io/crates/zacess-scenes) carries the code, the docs and the licence; the
gallery stills stay here.

## A release archive

Each [release](https://github.com/zacesshq/scenes/releases/latest) carries a built binary for:

| File | System |
| --- | --- |
| `zacess-scenes-<tag>-aarch64-apple-darwin.tar.gz` | macOS on Apple silicon |
| `zacess-scenes-<tag>-x86_64-apple-darwin.tar.gz` | macOS on Intel |
| `zacess-scenes-<tag>-x86_64-unknown-linux-musl.tar.gz` | Linux on x86-64, no shared libraries needed |
| `zacess-scenes-<tag>-aarch64-unknown-linux-musl.tar.gz` | Linux on ARM64, no shared libraries needed |
| `zacess-scenes-<tag>-x86_64-pc-windows-msvc.zip` | Windows on x86-64 |

Each archive has a `.sha256` file beside it. Download both into the same folder, check the sum,
unpack the archive and put `zacess-scenes` (or `zacess-scenes.exe`) somewhere on your `PATH`.

On macOS:

```sh
shasum -a 256 -c zacess-scenes-v1.1.0-aarch64-apple-darwin.tar.gz.sha256
tar -xzf zacess-scenes-v1.1.0-aarch64-apple-darwin.tar.gz
install -m 755 zacess-scenes-v1.1.0-aarch64-apple-darwin/zacess-scenes ~/.local/bin/
```

On Linux:

```sh
sha256sum -c zacess-scenes-v1.1.0-x86_64-unknown-linux-musl.tar.gz.sha256
tar -xzf zacess-scenes-v1.1.0-x86_64-unknown-linux-musl.tar.gz
install -m 755 zacess-scenes-v1.1.0-x86_64-unknown-linux-musl/zacess-scenes ~/.local/bin/
```

On Windows, in PowerShell, the two hashes printed must match:

```powershell
(Get-FileHash .\zacess-scenes-v1.1.0-x86_64-pc-windows-msvc.zip).Hash
Get-Content .\zacess-scenes-v1.1.0-x86_64-pc-windows-msvc.zip.sha256
Expand-Archive .\zacess-scenes-v1.1.0-x86_64-pc-windows-msvc.zip -DestinationPath .
```

## From a script

A setup script can keep a machine on the newest release without a package manager. The release
names follow one pattern, so the script asks GitHub for the latest tag, downloads the archive for
its own platform with the `.sha256` file and checks the sum before installing:

```sh
tag="$(curl -fsSL https://api.github.com/repos/zacesshq/scenes/releases/latest | sed -n 's/.*"tag_name": *"\(v[0-9.]*\)".*/\1/p')"
target=aarch64-apple-darwin   # or x86_64-apple-darwin, x86_64-unknown-linux-musl, aarch64-unknown-linux-musl
name="zacess-scenes-$tag-$target"
curl -fsSLO "https://github.com/zacesshq/scenes/releases/download/$tag/$name.tar.gz"
curl -fsSLO "https://github.com/zacesshq/scenes/releases/download/$tag/$name.tar.gz.sha256"
shasum -a 256 -c "$name.tar.gz.sha256"   # sha256sum -c on Linux
tar -xzf "$name.tar.gz"
install -m 755 "$name/zacess-scenes" ~/.local/bin/
```

`zacess-scenes --version` prints the installed version, so a script can skip the download when it
already matches the tag.
