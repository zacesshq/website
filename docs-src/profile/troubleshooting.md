# Troubleshooting

The messages `zprf` prints and what to do about each, with the limits the project's
[accessibility statement](/docs/profile/accessibility/#known-limits) lists. Every example here is
real output from `zprf` 0.2.0.

## Exit codes

| Code | Means |
| --- | --- |
| 0 | Every profile passed. For `render`, `apply` and `os`, the files were written or the lines sent |
| 1 | A pair failed in `check`. In `derive`, a colour you set fails |
| 2 | A file is unreadable or invalid, no colour can be derived to meet a floor, an option is wrong or `render`, `apply` or `os` was given a profile that fails |

A mistyped command or option also exits 2. `check` reports a bad file and still checks the rest.

## A pair fails

```text
FAIL dim-comments.toml (Zacess Deep Contrast Dark)
     224 pairs against text 7:1, non-text 3:1, overlay 4.5:1, terminal 7:1 and dim terminal 4.5:1, with paired colours 0.05 apart in tone and 0.04 under colour vision deficiencies
     FAIL syntax.comment #555555 on background #000000: 2.81:1, below needs.contrast.text of 7:1
```

The line names the colour, the colour it sits on, the measured ratio and the floor it missed.
Ratios are rounded down, so a printed figure never overstates the real one. Change the colour you
set. You can also delete it from the profile so `derive` chooses one that passes. `render`, `watch` and
`apply` write or send nothing until every pair passes.

## No colour can be derived

```text
error: dim.toml cannot be completed: no colour could be derived that meets these floors:
```

This follows a list of the colours and floors that could not be met, then any colour you set that
already misses its own floor. A common cause is a foreground set too close to the background: a
highlight can only move away from the background while the text on it keeps its floor. Set the
colours by hand or change the floors in `[needs.contrast]`.

## Paired colours cannot be separated on a mid grey

On a mid grey the band of lightness left above the text floor is too narrow for four
regular-style syntax roles to sit 0.05 apart in tone, so `derive` names the paired roles and the
background instead of choosing colours. In the project's sweep of greys and tinted greys this
happened from about `#373737` to `#5f5f5f` and from `#919191` to `#a5a5a5` at a 4.5:1 text floor.
At 7:1 it happened from about `#2d2d2d` to `#5f5f5f` and from `#919191` to `#afafaf`. Set those
colours by hand, move the background towards black or white or lower `tone_difference` in your
copy.

## --no-derive fails a profile that looks fine

`check --no-derive` fails a profile that leaves any colour to derive, even when every derived
colour would pass:

```text
FAIL --no-derive was given but the profile leaves colours to derive
```

Run `zprf derive <profile> --out <file>` to write the complete profile, then check that file.

## An unknown field

Unknown fields are errors, so a misspelt need is refused rather than dropped. Check the spelling
against the [profile format](/docs/reference/profile-format/#needs).

## os asks for --print

```text
error: the following required arguments were not provided:
  --print
```

`zprf os` only ever prints. `--print` is required so that is never in doubt. See the
[system settings preview](/docs/profile/os-settings/).

## A target name is wrong

```text
error: there is no target called "nope". The targets are ghostty, kitty, wezterm, alacritty, tmux, neovim and vscode
```

`zprf list-targets` lists them with the file each writes.

## A change does not show in an open app

`render` and `watch` write files only. An app that is already open needs reloading to pick up a
change. `watch` looks for a change every half second rather than being told of one. It reads the
system appearance the same way.

## Colours from the VS Code theme still show

The VS Code fragment is layered over whichever colour theme is active. Any interface colour it does
not set, such as a notification or a hover, still comes from that theme and is not checked. Pick a
base theme close to the profile, such as one of the [Zacess themes](/themes/).

## A setting in alacritty.toml wins

Alacritty reads its imports first and its own `alacritty.toml` after them, so an `opacity` or any
other setting the main file sets itself still wins over the rendered import. Its `blur` works on
macOS and KDE only.

## apply --live stopped working

`apply --live` lasts until the terminal resets its colours, often when it is restarted. It changes
only the terminal it is run in. Inside tmux, add `--tmux` and set `set -g allow-passthrough on`.

## The browser extension leaves some colours alone

The extension draws the profile's colours only when every pair it uses is set and meets its floor.
A profile that leaves colours to derive still applies its font, size, spacing, focus ring and
motion needs. Run `zprf derive` and load the complete file to apply its colours too. The extension
cannot reach inside shadow roots. A page's own important rule that is more specific or comes later
can still win. The [browser extension](/docs/profile/browser-extension/) page and the
accessibility statement have the full list.

## Reporting a problem

An accessibility problem is a bug. Open an issue with the
[accessibility form](https://github.com/zacesshq/profile/issues/new?template=accessibility.yml).
You never need to share a diagnosis or anything personal. To report privately, email
[contact@zacess.com](mailto:contact@zacess.com).
