---
title: "What is checked"
description: "Every pair is measured with the WCAG 2.2 contrast formula and held to a floor from [needs.contrast]. The defaults follow the Zacess themes."
section: "use"
group: "profile"
order: 26
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v1.0.0"
refLabel: "v1.0.0"
release: "1.0.0"
path: "README.md"
heading: "What is checked"
sourceUrl: "https://github.com/zacesshq/profile/blob/v1.0.0/README.md"
---

Every pair is measured with the WCAG 2.2 contrast formula and held to a floor from
`[needs.contrast]`. The defaults follow the Zacess themes. Panels are `surface` and, when a profile
sets it, the second panel colour `surface_alt` that some apps draw behind their activity and status
bars and inactive tabs.

| Floor | Default | Pairs |
| --- | --- | --- |
| `text` | 7:1 | Text, muted text, links, errors, warnings, information and the accent on the background and on panels. Every syntax colour on the background and on panels. The cursor, the selected text, the text on the accent and the default text over the current line and a soft selection. The default text on any terminal slot listed as a background fill |
| `non_text` | 3:1 | Borders and the focus ring on the background and on panels. The selection block against the background |
| `overlay` | 4.5:1 | Every syntax colour over the current line and over a soft selection. Muted text, links, errors, warnings, information and the accent over the current line |
| `terminal` | 7:1 | The sixteen ANSI colours on the background, apart from slots listed as background fills |
| `terminal_dim` | 4.5:1 | ANSI slots a profile lists in `palette.terminal.dim`, which four of the light starter profiles use to keep their colours vivid |
| `highlight_distance` | 0.08 | OKLab distance between the background and both the current line and a soft selection, so each stays visible |
| `colour_vision_distance` | 0.04 | OKLab distance between paired colours under simulated protanopia, deuteranopia and tritanopia (Machado, Oliveira and Fernandes, 2009) |
| `tone_difference` | 0.05 | Difference in tone, the cube root of relative luminance, between paired colours, so they differ with no colour vision at all |
| `check_error_warning` | on | Whether errors and warnings are held to the two floors above as a pair |
| `apca` | off | An optional APCA Lc floor for text on the background, checked on top of WCAG |

The paired colours are the neighbouring syntax roles the Zacess themes pair, such as functions and
types or strings and comments, checked when the two share a font style. Strings and numbers,
strings and regular expressions, strings and invalid code, the three diff colours and errors and
warnings are often red and green, so they are checked whatever their style. The full list is in
[the spec](/docs/reference/profile-format/#pairs).
