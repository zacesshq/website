---
title: "zprf check"
description: "Check every colour pair of one or more profiles and exit non-zero on any failure."
section: "reference"
order: 57
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "docs-src/profile/reference/check.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/reference/check.md"
---

Check every colour pair of one or more profiles and exit non-zero on any failure.

```text
zprf check [OPTIONS] <PROFILES>...
```

`check` derives any missing colour, then checks every pair of every file given against the
profile's floors: contrast, highlight distance and the [colour vision checks](/docs/profile/colour-vision/).
A bad file is reported and the rest are still checked.

## Options

| Option | Does |
| --- | --- |
| `<PROFILES>...` | Profile files to check |
| `-v`, `--verbose` | Print every pair, not only the failures and the tightest one |
| `--no-derive` | Fail when the profile leaves any colour to be derived |
| `-h`, `--help` | Print help |

## Exit codes

| Code | When |
| --- | --- |
| 0 | Every profile passes |
| 1 | A pair fails |
| 2 | A file is unreadable or invalid. Also when no colour can be derived to meet a floor |

## Examples

Check one starter profile:

```sh
zprf check profiles/zacess-deep-contrast-dark.toml
```

```text
pass profiles/zacess-deep-contrast-dark.toml (Zacess Deep Contrast Dark)
     224 pairs against text 7:1, non-text 3:1, overlay 4.5:1, terminal 7:1 and dim terminal 4.5:1, with paired colours 0.05 apart in tone and 0.04 under colour vision deficiencies
     tightest terminal.ansi[4] #8888ff on background #000000: 7.01:1
```

Check every starter profile at once:

```sh
zprf check profiles/*.toml
```

A copy of that profile with its comment colour set to `#555555` fails, with each failing pair
named:

```text
FAIL dim-comments.toml (Zacess Deep Contrast Dark)
     224 pairs against text 7:1, non-text 3:1, overlay 4.5:1, terminal 7:1 and dim terminal 4.5:1, with paired colours 0.05 apart in tone and 0.04 under colour vision deficiencies
     FAIL syntax.comment #555555 on background #000000: 2.81:1, below needs.contrast.text of 7:1
     FAIL syntax.comment #555555 on surface #000000: 2.81:1, below needs.contrast.text of 7:1
     FAIL syntax.comment #555555 on surface_alt #0a0a0a: 2.65:1, below needs.contrast.text of 7:1
     FAIL syntax.comment #555555 on line_highlight #262626: 2.02:1, below needs.contrast.overlay of 4.5:1
     FAIL syntax.comment #555555 on selection_soft #720072: 1.43:1, below needs.contrast.overlay of 4.5:1
     tightest syntax.comment #555555 on selection_soft #720072: 1.43:1, below needs.contrast.overlay of 4.5:1
```

Fail a profile that still leaves colours to derive, for example before committing it:

```sh
zprf check --no-derive mine.toml
```
