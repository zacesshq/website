---
title: "zprf watch"
description: "Check and render a profile again each time it changes, following the system's light or dark appearance when the profile has both variants."
section: "reference"
order: 61
product: "Zacess Profile"
source: "profile"
repo: "zacesshq/profile"
ref: "v0.2.2"
refLabel: "v0.2.2"
release: "0.2.2"
path: "docs-src/profile/reference/watch.md"
sourceUrl: "https://github.com/zacesshq/website/blob/main/docs-src/profile/reference/watch.md"
---

Check and render a profile again each time it changes, following the system's light or dark
appearance when the profile has both variants.

```text
zprf watch [OPTIONS] --target <TARGET> --out <OUT> <PROFILE>
```

`watch` checks and renders the profile, then does it again each time the file changes. A change
that fails a pair is reported and the last good files are kept. It writes only inside `--out` and
runs until Ctrl+C, which ends it the way Ctrl+C ends any command.

## Light and dark variants

A profile named `name-dark.toml` or `name-light.toml` is paired with the other one in the same
folder. `--variant` names another file when it is not found by name. The variant that matches the
system's light or dark setting is rendered, on macOS, Windows and freedesktop desktops. Both are
written under the id without its `-dark` or `-light` ending, so an app can point at one file for
both.

## Options

| Option | Does |
| --- | --- |
| `<PROFILE>` | The profile to watch |
| `-t`, `--target <TARGET>` | A target from `list-targets` or `all` |
| `-o`, `--out <OUT>` | The directory to write into. Each target gets its own folder inside it |
| `--variant <VARIANT>` | The other variant, when it is not found by name |
| `--appearance <APPEARANCE>` | Which variant to use: `system` (the default) follows the system, `dark` or `light` always uses that one |
| `--interval-ms <INTERVAL_MS>` | How often to look for a change, in milliseconds. The default is 500 |
| `-h`, `--help` | Print help |

## Exit codes

`watch` exits 2 at the start when the target is unknown, `--out` is empty or the variant given does
not exist. A file that cannot be written later is reported and the watch carries on.

## Examples

Keep a kitty file up to date for a pair of profiles, following the system appearance:

```sh
zprf watch zacess-high-contrast-dark.toml --target kitty --out ./build
```

Pin the light variant. With `zacess-high-contrast-dark.toml` and `zacess-high-contrast-light.toml`
in the same folder:

```sh
zprf watch zacess-high-contrast-dark.toml --target kitty --out ./build --appearance light
```

```text
watching zacess-high-contrast-dark.toml and zacess-high-contrast-light.toml; following the light variant only (--appearance light)
writing kitty into ./build; press Ctrl+C to stop
rendered zacess-high-contrast-light.toml (light): 1 of 1 files changed: ./build/kitty/zacess-high-contrast.conf
```

The file is written as `zacess-high-contrast.conf`, without the variant ending, so kitty loads the
same file whichever variant is in use.

## Limits

`watch` looks for a change every half second rather than being told of one. It reads the system
appearance the same way. It writes files only: an app that is already open needs reloading to pick
up a change.
