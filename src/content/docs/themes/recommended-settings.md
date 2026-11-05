---
title: "Recommended settings"
description: "A theme sets colours, not how an app uses them. These settings get the most out of the Zacess themes. None of them is required."
section: "use"
group: "themes"
order: 45
product: "Zacess Themes"
source: "themes"
repo: "zacesshq/themes"
ref: "v0.12.1"
refLabel: "v0.12.1"
release: "0.12.1"
path: "docs/recommended-settings.md"
sourceUrl: "https://github.com/zacesshq/themes/blob/v0.12.1/docs/recommended-settings.md"
---

A theme sets colours, not how an app uses them. These settings get the most out of the Zacess
themes. None of them is required.

## Follow the system light and dark setting

Pick one dark and one light theme and let the app switch between them with the system.

VS Code and editors built on it, in `settings.json`:

```jsonc
"window.autoDetectColorScheme": true,
"workbench.preferredDarkColorTheme": "Zacess Deep Contrast Dark",
"workbench.preferredLightColorTheme": "Zacess Deep Contrast Light"
```

Zed, in `settings.json`:

```jsonc
"theme": { "mode": "system", "dark": "Zacess Deep Contrast Dark", "light": "Zacess Deep Contrast Light" }
```

The JetBrains IDEs: **Settings**, **Appearance & Behavior**, **Appearance**, tick **Sync with OS**
and choose a Zacess theme for each side. Ghostty takes
`theme = light:zacess-deep-contrast-light,dark:zacess-deep-contrast-dark`. In Obsidian each of the
four themes follows the system: **Settings**, **Appearance**, **Base color scheme**, **Adapt to
system**, which gives the theme's light look by day and its dark look by night.

## Keep terminal text readable

Programs sometimes print text in a colour of their own on a background of their own, which no theme
controls. Most terminals can raise that text to a contrast floor. 4.5:1 matches the floor the
terminal colours themselves meet.

| Terminal | Setting |
| --- | --- |
| VS Code terminal | `"terminal.integrated.minimumContrastRatio": 4.5` |
| iTerm2 | **Settings**, **Profiles**, **Colors**, **Minimum contrast** at about the middle |
| kitty | `text_fg_override_threshold 4.5 ratio` in `kitty.conf` |
| Ghostty | `minimum-contrast = 4.5` |
| Windows Terminal | `"adjustIndistinguishableColors": "always"` in a profile |
| Zed terminal | `"terminal": { "minimum_contrast": 60 }` (Zed's own scale) |

Terminal.app, Alacritty and the JetBrains terminal have no such setting.

## Shell command colours

To make commands, arguments and errors in your shell follow the active theme, see
[shell-colours.md](/docs/themes/shell-colours/).
