---
title: "Install Zacess Themes"
description: "Every file is also in the latest release for an offline install."
section: "install"
order: 4
product: "Zacess Themes"
source: "themes"
repo: "zacesshq/themes"
ref: "v1.0.0"
refLabel: "v1.0.0"
release: "1.0.0"
path: "README.md"
heading: "Install"
sourceUrl: "https://github.com/zacesshq/themes/blob/v1.0.0/README.md"
---

| App | Install | Details |
| --- | --- | --- |
| VS Code | Search **Zacess Themes** in Extensions or run `code --install-extension zacess.zacess-themes`. Editors built on VS Code use [Open VSX](https://open-vsx.org/extension/zacess/zacess-themes) | [editors/vscode](https://github.com/zacesshq/themes/blob/v1.0.0/editors/vscode/README.md) |
| JetBrains IDEs | **Settings**, **Plugins**, **Marketplace**, search **Zacess Themes** (IntelliJ Platform 2025.3 or later) | [editors/jetbrains](https://github.com/zacesshq/themes/blob/v1.0.0/editors/jetbrains/README.md) |
| Obsidian | **Settings**, **Appearance**, **Themes**, **Manage**, search **Zacess**. Five themes, one per pair of looks, each following light and dark mode | [editors/obsidian](https://github.com/zacesshq/themes/blob/v1.0.0/editors/obsidian/README.md) |
| Neovim | `{ "zacesshq/zacess.nvim", lazy = false, priority = 1000 }` with lazy.nvim | [editors/neovim](https://github.com/zacesshq/themes/blob/v1.0.0/editors/neovim/README.md) |
| Zed | **zed: extensions**, search **Zacess Themes** | [editors/zed](https://github.com/zacesshq/themes/blob/v1.0.0/editors/zed/README.md) |
| Sublime Text | Copy the `.sublime-color-scheme` files into `Packages/User` | [editors/sublime](https://github.com/zacesshq/themes/blob/v1.0.0/editors/sublime/README.md) |
| Helix | Copy the themes into `~/.config/helix/themes/` | [editors/helix](https://github.com/zacesshq/themes/blob/v1.0.0/editors/helix/README.md) |
| Emacs | Copy the `-theme.el` files into `~/.emacs.d/themes/` | [editors/emacs](https://github.com/zacesshq/themes/blob/v1.0.0/editors/emacs/README.md) |
| Eclipse | **Help**, **Install New Software...** with the update site `https://zacesshq.github.io/themes/eclipse/` | [editors/eclipse](https://github.com/zacesshq/themes/blob/v1.0.0/editors/eclipse/README.md) |
| Xcode | Copy the `.xccolortheme` files into `~/Library/Developer/Xcode/UserData/FontAndColorThemes/` | [editors/xcode](https://github.com/zacesshq/themes/blob/v1.0.0/editors/xcode/README.md) |
| Terminals | Run the installer below in the terminal to theme | [editors/terminals](https://github.com/zacesshq/themes/blob/v1.0.0/editors/terminals/README.md) |
| Chrome and Firefox | Search **Zacess** in the [Chrome Web Store](https://chromewebstore.google.com/search/zacess) or [Firefox Add-ons](https://addons.mozilla.org/firefox/search/?q=zacess&type=statictheme). Edge installs the Chrome versions | [browsers](https://github.com/zacesshq/themes/blob/v1.0.0/browsers/README.md) |

Every file is also in the [latest release](https://github.com/zacesshq/themes/releases/latest) for an
offline install. [docs/recommended-settings.md](/docs/themes/recommended-settings/) has the settings that
switch with the system light and dark setting and keep terminal text readable.

The terminal installer works out which terminal it runs in (Terminal.app, iTerm2, Ghostty, kitty,
WezTerm, Warp, Alacritty or Windows Terminal), copies all ten themes to the folder that terminal
reads and prints the one step that turns one on. It never edits a configuration file. For btop, add
`-s -- btop` after `bash`.

```sh
curl -fsSL https://raw.githubusercontent.com/zacesshq/themes/main/install.sh | bash
```

In Windows Terminal, run this in PowerShell instead. For btop4win, run `$env:ZACESS_THEMES_APP = 'btop'` first:

```powershell
irm https://raw.githubusercontent.com/zacesshq/themes/main/install.ps1 | iex
```

The first eight themes are also in the [iTerm2 Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes)
collection, which Ghostty, WezTerm and Windows Terminal theme lists draw from. To make shell syntax
highlighting follow the active theme, see [docs/shell-colours.md](/docs/themes/shell-colours/).
