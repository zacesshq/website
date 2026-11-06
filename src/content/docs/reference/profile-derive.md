---
title: "zprf derive"
description: "Fill in every missing colour and print the complete profile."
section: "reference"
order: 58
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "docs-src/profile/reference/derive.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/reference/derive.md"
---

Fill in every missing colour and print the complete profile.

```text
zprf derive [OPTIONS] <PROFILE>
```

`derive` keeps every colour the profile sets and solves each missing one in OKLCH to meet the
profile's floors. Each colour it chose is marked `# derived`, so your choices stay apart from the
tool's. `surface_alt` is never derived. The exact colours it chooses are not part of the spec and
may change between versions. The guarantee that they pass is.

## Options

| Option | Does |
| --- | --- |
| `<PROFILE>` | The profile to complete |
| `-o`, `--out <OUT>` | Write the complete profile to this file instead of standard output |
| `-h`, `--help` | Print help |

## Exit codes

| Code | When |
| --- | --- |
| 0 | The result passes |
| 1 | A colour you set fails, with the profile still printed |
| 2 | The file is unreadable or invalid. Also when no colour can be derived to meet a floor |

## Examples

Complete the minimal example from the spec, which sets only the background, then check the result:

```sh
zprf derive spec/examples/minimal.toml --out complete.toml
zprf check complete.toml
```

```text
wrote complete.toml
derived 36 colours: foreground, surface, line_highlight, muted, accent, accent_foreground, link, focus_ring, border, cursor, cursor_text, selection_background, selection_foreground, selection_soft, error, warning, info, syntax.keyword, syntax.control, syntax.function, syntax.type, syntax.variable, syntax.parameter, syntax.property, syntax.string, syntax.number, syntax.comment, syntax.operator, syntax.tag, syntax.attribute, syntax.regex, syntax.invalid, syntax.added, syntax.removed, syntax.changed, terminal.ansi
pass complete.toml (Warm dark, large text)
     197 pairs against text 7:1, non-text 3:1, overlay 4.5:1, terminal 7:1 and dim terminal 4.5:1, with paired colours 0.05 apart in tone and 0.04 under colour vision deficiencies
     tightest terminal.ansi[6] #00b6b6 on background #1b1612: 7.15:1
```

The written file fills in every default floor and marks each colour it chose. Its first lines:

```toml
# completed by zprf from minimal.toml; lines marked derived were filled in
spec_version = 1
name = "Warm dark, large text"
appearance = "dark"

[needs]
reduce_motion = true
cursor_size = "large"
line_spacing = 1.3
column_width = 80

[needs.contrast]
text = 7.0
non_text = 3.0
overlay = 4.5
terminal = 7.0
terminal_dim = 4.5
highlight_distance = 0.08
colour_vision_distance = 0.04
tone_difference = 0.05
check_error_warning = true

[needs.font]
family = "Atkinson Hyperlegible Mono"
fallback = "monospace"
size_pt = 18.0

[palette]
background = "#1b1612"
foreground = "#ffffff" # derived
```

Without `--out` the complete profile goes to standard output.
