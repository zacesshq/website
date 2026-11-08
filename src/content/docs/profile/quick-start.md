---
title: "Quick start"
description: "Check one of the ten starter profiles, then write its files into a folder of your choosing"
section: "use"
group: "profile"
order: 24
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v1.0.0"
refLabel: "v1.0.0"
release: "1.0.0"
path: "README.md"
heading: "Quick start"
sourceUrl: "https://github.com/zacesshq/profile/blob/v1.0.0/README.md"
---

Check one of the ten starter profiles, then write its files into a folder of your choosing:

```sh
zprf check profiles/zacess-deep-contrast-dark.toml
zprf render profiles/zacess-deep-contrast-dark.toml --target all --out ./build
```

Or start from needs alone. This profile sets one colour and lets the tool choose the rest:

```toml
spec_version = 1
name = "Warm dark, large text"

[needs]
cursor_size = "large"
line_spacing = 1.3
column_width = 80

[needs.contrast]
text = 7.0

[needs.font]
family = "Atkinson Hyperlegible Mono"
size_pt = 18

[palette]
background = "#1b1612"
```

```sh
zprf derive spec/examples/minimal.toml --out mine.toml
zprf check mine.toml
```

Each colour `derive` chose is marked `# derived`, so you can tell your choices from the tool's.

> **Note**
>
> `render` only ever writes inside the folder given to `--out`. Copying a file into an app's
> config folder is a step you take yourself. Each rendered file says in its header how to load it.
