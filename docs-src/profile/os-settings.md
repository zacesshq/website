# System settings preview

`zprf os --print` prints the system accessibility settings a profile maps to. It is a preview
only: `zprf` never runs the lines it prints and has no option to. `--print` is required so that is
never in doubt. The commands are for a person to read and run, since a wrong system setting can
lock someone out of their own screen.

```sh
zprf os zacess-deep-contrast-dark.toml --print
zprf os zacess-deep-contrast-dark.toml --print --platform gnome
```

Without `--platform` it prints for the system it runs on. `--platform` takes `macos`, `gnome` or
`windows`.

## What each need maps to

| Need | macOS | GNOME | Windows |
| --- | --- | --- | --- |
| `reduce_motion` | Reduce motion | Reduce animation plus a steady text cursor | Window animation and the blinking text cursor off |
| a text floor of 7:1 or more | Increase contrast | High contrast | Contrast themes, chosen in Settings rather than set |
| `appearance` | Dark or light | The colour scheme | Apps and system mode |
| the selection colour | The highlight colour | no line | no line |
| `font.size_pt` | no system setting | Large text, as a scale of the 11 point interface font | Text size, as a scale of 9 point Segoe UI from 100 to 225 per cent |
| `font.family` | no system setting | The monospace font | no system setting |
| `focus_ring_width_px` | no system setting | no system setting | The width of the focus rectangle |

Each platform's output ends by naming the needs it has no setting for. Colours and the appearance
the profile leaves out are the ones `zprf derive` would choose.

## macOS

The lines are `defaults write` and `defaults delete` commands. From the Zacess Deep Contrast Dark
starter profile:

```sh
# reduce_motion: Accessibility > Display > Reduce motion
defaults write com.apple.universalaccess reduceMotion -bool true

# a text floor of 7:1 or more: Accessibility > Display > Increase contrast
defaults write com.apple.universalaccess increaseContrast -bool true

# appearance = dark: Appearance > Dark
defaults write -g AppleInterfaceStyle -string Dark
```

The output notes that writing `com.apple.universalaccess` needs a terminal with Full Disk Access on
recent macOS.

## GNOME

The lines are `gsettings set` commands:

```sh
# reduce_motion: Accessibility > Seeing > Reduce animation plus a steady text cursor
gsettings set org.gnome.desktop.interface enable-animations false
gsettings set org.gnome.desktop.interface cursor-blink false

# a text floor of 7:1 or more: Accessibility > Seeing > High contrast
gsettings set org.gnome.desktop.a11y.interface high-contrast true
```

## Windows

The lines are `reg add` values with the Settings page each one matches:

```powershell
# appearance = dark: Settings > Personalisation > Colours > Choose your mode
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v AppsUseLightTheme /t REG_DWORD /d 0 /f
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v SystemUsesLightTheme /t REG_DWORD /d 0 /f
```

Animation effects in Settings also stop animation inside apps, which has no single registry value,
so the printed values stop window animation and the blinking text cursor only.

## Read every line first

`os --print` maps each need to the closest system setting it knows. The text size scale is the
profile size over 11 points on GNOME and over 9 points on Windows. Increased contrast is suggested
whenever the text floor is 7:1 or more. Read every line before running any of them. The full
option list is in the [os reference](/docs/reference/profile-os/).
