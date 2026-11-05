# zprf apply

Recolour the running terminal with OSC 4, 10, 11 and 12 sequences.

```text
zprf apply [OPTIONS] <PROFILE>
```

`apply --live` sends the sequences to standard output, which recolours the terminal they are shown
in until the terminal is reset, often when it is restarted. It changes only the terminal it is run
in and writes no file. OSC 4 sets the sixteen ANSI colours, OSC 10 the text, OSC 11 the background
and OSC 12 the cursor. A profile that fails a pair is refused with nothing sent.

## Options

| Option | Does |
| --- | --- |
| `<PROFILE>` | The profile to apply |
| `--live` | Send the sequences to standard output, which recolours the terminal it is shown in |
| `--escaped` | Print the sequences as readable text with ESC written as `\e`, sending nothing. It can be given with or without `--live` |
| `--tmux` | Wrap the sequences for tmux passthrough. Needs `set -g allow-passthrough on` |
| `-h`, `--help` | Print help |

One of `--live` and `--escaped` is required. Without either, `apply` exits 2 and asks for `--live`.

## Exit codes

| Code | When |
| --- | --- |
| 0 | The sequences were sent or printed |
| 2 | The profile is invalid, cannot be completed or fails a pair |

## Examples

Recolour this terminal:

```sh
zprf apply profiles/zacess-deep-contrast-dark.toml --live
```

See what would be sent first. The output is 19 lines: sixteen OSC 4 lines, then OSC 10, 11 and 12.
The last three for Zacess Deep Contrast Dark:

```sh
zprf apply profiles/zacess-deep-contrast-dark.toml --escaped
```

```text
\e]10;rgb:ff/ff/ff\e\\
\e]11;rgb:00/00/00\e\\
\e]12;rgb:ff/ff/00\e\\
```

Inside tmux, with `set -g allow-passthrough on` in `tmux.conf`:

```sh
zprf apply profiles/zacess-deep-contrast-dark.toml --live --tmux
```
