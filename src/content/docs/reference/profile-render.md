---
title: "zprf render"
description: "Write config files for a target from a profile that passes its checks."
section: "reference"
order: 59
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "docs-src/profile/reference/render.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/reference/render.md"
---

Write config files for a target from a profile that passes its checks.

```text
zprf render --target <TARGET> --out <OUT> <PROFILE>
```

`render` writes `<OUT>/<target>/` from the templates. It only ever writes inside the folder given
to `--out` and never edits an app's real config. A profile that fails a pair is refused with
nothing written.

## Options

| Option | Does |
| --- | --- |
| `<PROFILE>` | The profile to render |
| `-t`, `--target <TARGET>` | A target from `list-targets` or `all` |
| `-o`, `--out <OUT>` | The directory to write into. Each target gets its own folder inside it |
| `-h`, `--help` | Print help |

## Exit codes

| Code | When |
| --- | --- |
| 0 | The files were written |
| 2 | The profile is invalid, cannot be completed or fails a pair, with nothing written |

## Examples

Write every target for a starter profile:

```sh
zprf render profiles/zacess-deep-contrast-dark.toml --target all --out ./build
```

```text
wrote ./build/ghostty/zacess-deep-contrast-dark
wrote ./build/kitty/zacess-deep-contrast-dark.conf
wrote ./build/wezterm/zacess-deep-contrast-dark.lua
wrote ./build/alacritty/zacess-deep-contrast-dark.toml
wrote ./build/tmux/zacess-deep-contrast-dark.tmux.conf
wrote ./build/neovim/colors/zacess-deep-contrast-dark.lua
wrote ./build/vscode/zacess-deep-contrast-dark.settings.json
```

Write one target:

```sh
zprf render profiles/zacess-deep-contrast-dark.toml --target kitty --out ./build
```

What each target sets is on the [targets](/docs/profile/targets/) page and how to load each file
is on the [load in each app](/docs/profile/load-in-each-app/) page.
