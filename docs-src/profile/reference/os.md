# zprf os

Print the system accessibility settings a profile maps to, without changing any.

```text
zprf os [OPTIONS] --print <PROFILE>
```

The lines are `defaults write` and `defaults delete` commands on macOS, `gsettings set` on GNOME and
`reg add` values with their Settings page on Windows. `zprf` never runs them. This is a preview.
`--print` is required so that is never in doubt. A test in the project fails the build if this
code ever runs a program or touches a file.

## Options

| Option | Does |
| --- | --- |
| `<PROFILE>` | The profile to map |
| `--print` | Print the settings. Nothing is ever applied |
| `--platform <PLATFORM>` | The platform to print for, when it is not the one this runs on: `macos`, `gnome` or `windows` |
| `-h`, `--help` | Print help |

## Exit codes

| Code | When |
| --- | --- |
| 0 | The lines were printed |
| 2 | The profile is invalid or fails a pair. Also when `--print` is missing |

## Examples

```sh
zprf os profiles/zacess-deep-contrast-dark.toml --print
zprf os profiles/zacess-deep-contrast-dark.toml --print --platform windows
```

The [system settings preview](/docs/profile/os-settings/) page shows the output on each platform
and what each need maps to.
