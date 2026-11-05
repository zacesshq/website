---
title: "How it works"
description: "<!--diagram 1-->"
section: "use"
group: "themes"
order: 42
product: "Zacess Themes"
source: "themes"
repo: "zacesshq/themes"
ref: "v0.12.1"
refLabel: "v0.12.1"
release: "0.12.1"
path: "docs/how-it-works.md"
sourceUrl: "https://github.com/zacesshq/themes/blob/v0.12.1/docs/how-it-works.md"
---

<figure class="diagram" role="img" aria-label="Diagram beginning with palette/zacess.json">
<img class="diagram-light" src="/docs/themes/images/diagrams/themes-how-it-works-1-light.svg" alt="" width="552" height="568">
<img class="diagram-dark" src="/docs/themes/images/diagrams/themes-how-it-works-1-dark.svg" alt="" width="552" height="568">
</figure>

<details class="diagram-source">
<summary>Diagram source, as text</summary>

```text
flowchart LR
    Palette["palette/zacess.json"] --> Build["scripts/build.mjs"]
    Palette --> Check["scripts/check.mjs"]
    Palette --> Preview["scripts/preview.mjs"]
    Build --> Editors["editors/: VS Code, JetBrains, Obsidian, Neovim, Zed, Sublime Text, Helix, Emacs, Eclipse, Xcode, terminals"]
    Build --> Tables["Contrast tables in docs/contrast.md and ACCESSIBILITY.md"]
    Preview --> Previews["previews/: SVG images and themes.json"]
    Check --> CI["CI fails below a floor"]
```

</details>

1. [`palette/zacess.json`](https://github.com/zacesshq/themes/blob/v0.12.1/palette/zacess.json) holds every colour: the interface, the syntax tokens
   and the 16 terminal colours of each theme, the font style of each token, the pairs of tokens that
   must look different and the floors the checks enforce. [`palette/schema.json`](https://github.com/zacesshq/themes/blob/v0.12.1/palette/schema.json)
   describes its shape.
2. `npm run build` writes every editor's files from the palette. The generated files are committed,
   so each folder under `editors/` stands alone.
3. `npm run check` validates the palette against its schema, measures every colour against the floors
   in [contrast.md](/docs/themes/contrast/#the-floors) and parses every generated file. It prints a table of every failure and exits non-zero.
4. `npm run preview` draws the SVG previews as real text in each theme's colours and writes
   `previews/themes.json`, the data the themes page on the Zacess website is built from.
5. `npm run verify` runs the build and the previews again and fails if anything committed differs.

The checks need Node.js 24 and nothing else: the scripts have no dependencies.

## Layout

| Path | What lives there |
| --- | --- |
| `palette/` | The palette and its schema |
| `scripts/` | The generator, the checks, the previews and their shared colour maths |
| `scripts/screenshot/` | The Obsidian screenshots: a mock of an Obsidian window drawn from each theme's variables, rendered by Playwright with `npm ci` then `node render.mjs` in that folder |
| `editors/vscode/` | The VS Code extension |
| `editors/jetbrains/` | The JetBrains theme plugin and its Gradle build |
| `editors/obsidian/` | The four Obsidian themes, one folder each with its manifest, stylesheet and README |
| `editors/neovim/` | The Neovim colour schemes |
| `editors/zed/` | The Zed theme extension |
| `editors/sublime/` | The Sublime Text colour schemes |
| `editors/helix/` | The Helix themes |
| `editors/emacs/` | The Emacs themes |
| `editors/eclipse/` | The Eclipse preference files, the Eclipse plugin and its Maven and Tycho build |
| `editors/xcode/` | The Xcode themes |
| `editors/terminals/` | Terminal.app, iTerm2, Ghostty, kitty, WezTerm, Warp, Alacritty and Windows Terminal themes, plus btop |
| `install.sh`, `install.ps1` | The terminal installers |
| `previews/` | The preview images and the data for the website |
| `assets/` | The Zacess mark the icons are made from |
