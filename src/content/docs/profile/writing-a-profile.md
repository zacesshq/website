---
title: "Writing a profile"
description: "A profile records what a person needs to read a screen comfortably: contrast floors, a font and size, spacing, cursor size and freedom from motion."
section: "use"
group: "profile"
order: 25
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.0"
refLabel: "v0.2.0"
release: "0.2.0"
path: "docs-src/profile/writing-a-profile.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/writing-a-profile.md"
---

A profile records what a person needs to read a screen comfortably: contrast floors, a font and
size, spacing, cursor size and freedom from motion. It may also carry colours. This page is a guide
to writing one. The full rules are in the [profile format](/docs/reference/profile-format/), spec
version 1, which is a draft.

## The file

A profile is a [TOML 1.0](https://toml.io/en/v1.0.0) file in UTF-8, usually named with `.toml`.
The [JSON Schema](https://github.com/zacesshq/profile/blob/v0.2.0/spec/profile.schema.json)
(draft 2020-12) describes the same structure, so an app may also store a profile as JSON and
validate it against the schema. `zprf` itself reads and writes TOML only.

Two fields are required. `spec_version` is `1` and `name` is the name shown to the person.
The smallest useful profile states a need and nothing else:

```toml
spec_version = 1
name = "Large text, no motion"

[needs]
reduce_motion = true

[needs.font]
size_pt = 18
```

Unknown fields are errors. A misspelt need such as `reduse_motion` is refused rather than
silently dropped.

## The top level

| Field | Meaning |
| --- | --- |
| `spec_version` | The spec version the profile follows: `1` |
| `name` | The name shown to the person, on one line |
| `id` | Optional. Lowercase letters and digits joined by single dashes, used to name the rendered files. When missing it is made from the name |
| `description` | Optional. One sentence on who the profile is for |
| `appearance` | Optional. `dark` or `light`. When missing it is worked out from the background |

## Needs

Every need is optional. A missing need means the person has none there, so each app keeps its own
setting. The one exception is `reduce_motion`, which is `true` unless the profile turns it off,
because animation can be a barrier and its absence rarely is.

| Field | Takes | What it asks for |
| --- | --- | --- |
| `contrast` | a table | The floors every colour is held to. See [what is checked](/docs/profile/what-is-checked/) |
| `font.family` | a font name | The font. Empty or missing leaves each app on its own |
| `font.fallback` | `sans_serif`, `serif` or `monospace` | The generic family when the font is not installed |
| `font.size_pt` | 6 to 96 | Text size in points |
| `reduce_motion` | `true` or `false` | No blinking cursors, animation, smooth scrolling or flashing bells |
| `cursor_size` | `standard`, `large` or `extra_large` | Large and extra large ask for a block cursor |
| `focus_ring_width_px` | 1 to 10 | The width of the keyboard focus outline |
| `line_spacing` | 1 to 3 | Line height as a multiple of the font size |
| `character_spacing` | 0 to 0.5 | Extra space between letters as a fraction of the font size |
| `column_width` | 20 to 150 | The longest comfortable line in characters, shown as a ruler |
| `single_column` | `true` or `false` | One column with nothing side by side |
| `hide_decoration` | `true` or `false` | No decorative images and borders that carry no meaning |

Each app applies the needs it has a setting for. The
[accessibility statement](/docs/profile/accessibility/#needs-each-target-applies) lists every need
per app, including where an app has no setting.

## Colours

Every colour is optional and written as `#rrggbb`. A colour you set is never changed. A colour you
leave out is derived: `zprf derive` and `zprf check` solve it in OKLCH to meet the profile's own
floors. The colours sit in three tables.

- `[palette]` holds the interface colours: `background`, `foreground`, `surface`, `surface_alt`,
  `muted`, `border`, `accent`, `accent_foreground`, `link`, `focus_ring`, `cursor`, `cursor_text`,
  the three selection colours, `line_highlight` and `error`, `warning` and `info`.
- `[palette.syntax]` holds the syntax colours, each with a font style that writers apply so no role
  rests on colour alone: bold keywords, control flow and tags, italic parameters and comments and
  underlined invalid code.
- `[palette.terminal]` holds the sixteen ANSI colours in `ansi`, with `dim` and `background_slots`
  naming slots that are measured differently.

`surface_alt` is the one colour that is never derived. When it is missing it takes the value of
`surface` and adds no pairs. The [colour vision checks](/docs/profile/colour-vision/) page says
what changes when it is set.

## Start from needs, finish with colours

Write the needs and any colour you care about, then let `derive` fill in the rest:

```sh
zprf derive mine.toml --out complete.toml
zprf check complete.toml
```

Each colour `derive` chose is marked `# derived` in the file it writes, so your choices stay apart
from the tool's. Starting from one of the [starter profiles](/docs/profile/starter-profiles/)
works too: every colour is already set and checked.

## Versions of the format

The format is versioned apart from the tool. A new optional field that keeps every existing
profile valid does not raise `spec_version`. Removing or renaming a field, changing a default or
changing a pair or a floor raises it. While version 1 is a draft, a pair or a floor may still be
added to it, so a profile that passed before can fail `check` after an update and name the new
pair.
