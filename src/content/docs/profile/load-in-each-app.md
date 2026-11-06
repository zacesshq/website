---
title: "Load the files in each app"
description: "zprf render writes files only inside the folder given to --out. It never edits an app's real config."
section: "use"
group: "profile"
order: 29
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "docs-src/profile/load-in-each-app.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/load-in-each-app.md"
---

`zprf render` writes files only inside the folder given to `--out`. It never edits an app's real
config. Copying a file into place and loading it is a step you take yourself, so you always know
what changed. Each rendered file says in its header how to load it, apart from the VS Code
fragment, which is JSON. The lines below are those headers, from rendering the Zacess Deep Contrast
Dark starter profile:

```sh
zprf render zacess-deep-contrast-dark.toml --target all --out ./build
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

Each file is named after the profile's `id`. Every file but the VS Code one opens with the line
"written by zprf; change the profile and render again rather than editing this file".

## Ghostty

Load it from the main config:

```text
config-file = <path to this file>
```

## kitty

Load it from `kitty.conf`:

```text
include <path to this file>
```

## WezTerm

The file is a Lua module. Use it from `wezterm.lua`:

```lua
require("zacess-deep-contrast-dark").apply(config)
```

The module name is the profile's `id`. The file has to be somewhere `require` finds it.

## Alacritty

Load it from `alacritty.toml`:

```toml
[general]
import = ["<path to this file>"]
```

Alacritty reads its imports first and its own `alacritty.toml` after them, so a setting the main
file sets itself, such as `opacity`, still wins over the import.

## tmux

Load it from `tmux.conf`:

```text
source-file <path to this file>
```

## Neovim

Put the file in a `colors` folder on the runtimepath, then:

```vim
colorscheme zacess-deep-contrast-dark
```

`render` already writes it as `neovim/colors/<id>.lua`, so the `neovim` folder it writes can be
added to the runtimepath as it is.

## VS Code

The file is a `settings.json` fragment: interface and terminal colours, token colours with font
styles, font, size, line height, cursor, reduced motion, rulers and the editor layout. Its keys go
into your own `settings.json`. It is layered over whichever colour theme is active. Every colour it
sets is checked, but any interface colour it does not set, such as a notification or a hover, still
comes from that theme. Pick a base theme close to the profile, such as one of the
[Zacess themes](/themes/).

## Keeping files up to date

`zprf watch` checks and renders a profile again each time the file changes, so a file an app loads
stays current. An app that is already open needs reloading to pick up a change. The
[watch reference](/docs/reference/profile-watch/) has the detail.

## Recolouring a terminal without a file

`zprf apply --live` recolours the terminal it runs in straight away with OSC 4, 10, 11 and 12. It
lasts until the terminal resets its colours, often when it is restarted. See the
[apply reference](/docs/reference/profile-apply/).
