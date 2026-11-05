# Starter profiles

The eight Zacess themes ship as complete profiles. Each one passes `check` with no colour left to
derive. The project's CI keeps it that way. Each measures 224 pairs.

| Profile | Background | Text | Text contrast |
| --- | --- | --- | --- |
| `zacess-light` | `#ffffff` | `#111111` | 18.88:1 |
| `zacess-dark` | `#121212` | `#f5f5f5` | 17.18:1 |
| `zacess-yellow-on-black` | `#000000` | `#ffeb3b` | 17.19:1 |
| `zacess-cream` | `#fdf6e3` | `#000000` | 19.46:1 |
| `zacess-high-contrast-dark` | `#000000` | `#ffffff` | 21.00:1 |
| `zacess-high-contrast-light` | `#ffffff` | `#000000` | 21.00:1 |
| `zacess-deep-contrast-dark` | `#000000` | `#ffffff` | 21.00:1 |
| `zacess-deep-contrast-light` | `#ffffff` | `#000000` | 21.00:1 |

The lowest measured value in each class of pair, for every starter profile, is in the
[accessibility statement](/docs/profile/accessibility/#the-starter-profiles).

## Where they are

| Installed with | Folder |
| --- | --- |
| Homebrew | `$(brew --prefix)/share/zacess-profile/profiles` |
| A release archive | `profiles/` inside the unpacked folder |
| The source | [`profiles/`](https://github.com/zacesshq/profile/tree/v0.2.0/profiles) in the repository |

## Check one

```sh
zprf check "$(brew --prefix)/share/zacess-profile/profiles/zacess-deep-contrast-dark.toml"
```

```text
pass /opt/homebrew/share/zacess-profile/profiles/zacess-deep-contrast-dark.toml (Zacess Deep Contrast Dark)
     224 pairs against text 7:1, non-text 3:1, overlay 4.5:1, terminal 7:1 and dim terminal 4.5:1, with paired colours 0.05 apart in tone and 0.04 under colour vision deficiencies
     tightest terminal.ansi[4] #8888ff on background #000000: 7.01:1
```

## Make one your own

Copy a starter profile, change its `name` and `id`, then change what you need: a lower or higher
floor, a different font, motion back on. Run `check` after every change. A profile named
`name-dark.toml` beside `name-light.toml` is treated as one profile in two variants by
[`watch`](/docs/reference/profile-watch/).

## Where they differ from the themes

The profiles carry the measured palette of the [Zacess themes](/themes/), with two allowances.

- The warning colour of Zacess Light, Dark, Cream, High Contrast Light and Deep Contrast Light
  moves in lightness on its own hue, because it matched the error colour in tone and merged with
  it under simulated colour vision deficiencies. Each file names the themes' colour beside the new
  one.
- The four light profiles list their twelve coloured terminal slots in `palette.terminal.dim`, so
  those slots are held to 4.5:1 rather than 7:1. That is the themes' own allowance, kept so red,
  green and blue stay recognisable on white. Set `terminal_dim = 7.0` in your copy to hold every
  slot to 7:1. `check` then names each slot that misses.
