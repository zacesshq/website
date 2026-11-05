---
title: "Colour vision checks"
description: "Contrast alone does not keep two colours apart. A red and a green with the same contrast on the background can look the same to a person with a colour vision"
section: "use"
group: "profile"
order: 27
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.0"
refLabel: "v0.2.0"
release: "0.2.0"
path: "docs-src/profile/colour-vision.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/colour-vision.md"
---

Contrast alone does not keep two colours apart. A red and a green with the same contrast on the
background can look the same to a person with a colour vision deficiency. Since version 0.2.0, `zprf check` also measures colours that sit side by side and are told
apart by colour, so they stay apart for every viewer.

## The two floors

Each paired colour is held to two floors in `[needs.contrast]`.

| Floor | Default | What it measures |
| --- | --- | --- |
| `tone_difference` | 0.05 | The difference in tone between the two colours. Tone is the cube root of relative luminance, the OKLab lightness of the grey with the same luminance, which is all a viewer with no colour vision has to go on |
| `colour_vision_distance` | 0.04 | The OKLab distance between the two colours as a person with protanopia, deuteranopia or tritanopia sees them |

## How a deficiency is simulated

A simulation applies the Machado, Oliveira and Fernandes (2009) matrix at full severity to linear
sRGB, clamps each channel to the gamut and rounds the result to 8 bit sRGB before it is measured.
Each pair is measured under all three simulations: protanopia, deuteranopia and tritanopia. These
are the matrices and the floors the [Zacess themes](https://github.com/zacesshq/themes) use.

## Which colours are paired

The pairs are neighbouring syntax roles, the three diff colours and errors and warnings. A pair of
syntax roles is checked only when both roles share a font style, since a difference in style
already tells them apart. A pair whose colours are often red and green is checked whatever the
style.

| Pair | Checked |
| --- | --- |
| `string` and `number`, `string` and `regex`, `string` and `invalid` | always |
| `added` and `removed`, `added` and `changed`, `removed` and `changed` | always |
| `error` and `warning` | always, unless `check_error_warning` is `false` |
| neighbouring syntax roles, such as `function` and `type` or `string` and `comment` | when both share a font style |

The [profile format](/docs/reference/profile-format/#paired-colours) lists all 31 pairs. Of those,
19 apply to each starter profile. The rest join roles with different font styles.

## Errors and warnings

`check_error_warning` decides whether `error` and `warning` are held to the two floors as a pair.
It is `true` by default. The Zacess themes do not pair them, so `false` keeps a themes palette as it
is. In five of the eight starter profiles, Zacess Light, Dark, Cream, High Contrast Light and Deep
Contrast Light, the warning colour moved in lightness on its own hue so errors and warnings stay
apart. Each file names the themes' colour beside the new one.

## The second panel colour

`surface_alt` is the second panel colour some apps draw behind their activity and status bars,
inactive tabs and list rows. When a profile sets it, `check` measures on it every pair it measures
on `surface`: the default text, muted text, links, errors, warnings, information, the accent and
every syntax colour at the text floor, with borders and the focus ring at the non-text floor.
`derive` solves the colours it chooses against it as well but never fills it in. A profile that
leaves it out renders it as `surface` and gains no pairs, so profiles written before it stay valid.

## How derive keeps pairs apart

Every role `derive` solves starts at the same floor and so at the same tone, which paired colours
must not share. `derive` then places the derived syntax colours, error and warning one at a time,
each at the nearest lightness on its own hue where it meets its floors and stays apart from every
role placed before it. Colours the profile sets are placed first and never move. When the band of
lightness above the floors is too narrow for every pair, derivation fails and names the pair. The
[troubleshooting](/docs/profile/troubleshooting/) page has the backgrounds where this happens.

## What a failure looks like

A failing pair is reported like a contrast failure, naming both colours, the simulation and the
distance. `check` exits 1 and `render` writes nothing until the pair is fixed.
