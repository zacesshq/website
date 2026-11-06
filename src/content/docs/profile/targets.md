---
title: "Targets"
description: "ACCESSIBILITY.md lists each need per app, including where an app has no setting for one."
section: "use"
group: "profile"
order: 28
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "README.md"
heading: "Targets"
sourceUrl: "https://github.com/zacesshq/profile/blob/v0.2.2/README.md"
---

| Target | App | File written | What it sets |
| --- | --- | --- | --- |
| `ghostty` | Ghostty | `ghostty/<id>` | Palette, cursor, selection, `minimum-contrast` at the text floor, a block cursor kept through shell integration, cursor blink, font, size, cell height and a solid background |
| `kitty` | kitty | `kitty/<id>.conf` | Palette, cursor, selection, tabs, borders, URL colour, a block cursor kept through shell integration, cursor blink, font, size, cell height, the focus border width, a one column layout and a solid background |
| `wezterm` | WezTerm | `wezterm/<id>.lua` | Palette, tab bar, cursor style and blink, animation rate, font, size, line height and a solid background |
| `alacritty` | Alacritty | `alacritty/<id>.toml` | Palette, cursor, selection, cursor shape and blink, font, size, line offset and a solid background |
| `tmux` | tmux | `tmux/<id>.tmux.conf` | Status bar, windows, pane borders, messages, copy mode, clock and heavy borders for a wide focus ring |
| `neovim` | Neovim | `neovim/colors/<id>.lua` | Editor, syntax, Tree-sitter, diff and diagnostic groups, terminal colours, cursor blink, a column ruler, stacked diffs and no see-through windows |
| `vscode` | VS Code | `vscode/<id>.settings.json` | A `settings.json` fragment: interface and terminal colours, token colours with font styles, font, size, line height, cursor, reduced motion, rulers, editors and diffs in one column, no minimap and `terminal.integrated.minimumContrastRatio` |

[ACCESSIBILITY.md](/docs/profile/accessibility/#needs-each-target-applies) lists each need per app, including
where an app has no setting for one.

Templates are [minijinja](https://github.com/mitsuhiko/minijinja) files in [templates](https://github.com/zacesshq/profile/tree/v0.2.2/templates).
Adding a target is a template plus one entry in `src/render.rs`. [CONTRIBUTING.md](https://github.com/zacesshq/profile/blob/v0.2.2/CONTRIBUTING.md)
has the steps.
