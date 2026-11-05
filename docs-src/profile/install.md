# Install Zacess Profile

Zacess Profile is one program, `zprf`, from the `zacess-profile` crate. Version 0.2.0 has four ways
in. The shortest for each system comes first.

## macOS and Linux with Homebrew

```sh
brew install zacesshq/tap/zacess-profile
```

The formula installs the release build for the machine, not a build from source. It puts `zprf` on
your `PATH`, the eight starter profiles and the spec in `$(brew --prefix)/share/zacess-profile` and
the README, changelog, accessibility statement, roadmap and notice with the formula's documents.
List the starter profiles with:

```sh
ls "$(brew --prefix)/share/zacess-profile/profiles"
```

`brew upgrade zacess-profile` moves to a newer release.

## Windows with winget

> **Note**
>
> The package `Zacess.Profile` is waiting for review in the winget community repository. The
> command below works once it is accepted. Until then, use Cargo or a release archive on Windows.

```powershell
winget install Zacess.Profile
```

The package installs the Windows zip from the release as a portable program with the command alias
`zprf`.

## Any platform with Cargo

Needs Rust 1.88 or later.

```sh
cargo install zacess-profile
```

The crate on [crates.io](https://crates.io/crates/zacess-profile) carries the code, the templates,
the starter profiles and the spec.

## From a release archive

Each build on the [v0.2.0 release](https://github.com/zacesshq/profile/releases/tag/v0.2.0) has a
`.sha256` file beside it.

| System | Archive |
| --- | --- |
| macOS on Apple silicon | `zacess-profile-v0.2.0-aarch64-apple-darwin.tar.gz` |
| macOS on Intel | `zacess-profile-v0.2.0-x86_64-apple-darwin.tar.gz` |
| Linux on x86-64 | `zacess-profile-v0.2.0-x86_64-unknown-linux-musl.tar.gz` |
| Linux on ARM64 | `zacess-profile-v0.2.0-aarch64-unknown-linux-musl.tar.gz` |
| Windows on x86-64 | `zacess-profile-v0.2.0-x86_64-pc-windows-msvc.zip` |

The Linux builds are static and the Windows build links its C runtime statically, so nothing else
needs installing. Each archive unpacks into a folder of the same name that holds `zprf`
(`zprf.exe` on Windows), the starter profiles in `profiles/`, the spec in `spec/` and the README,
licence, notice, changelog, roadmap and accessibility statement.

Download the archive and its `.sha256` file into the same folder. On macOS, for Apple silicon:

```sh
shasum -a 256 -c zacess-profile-v0.2.0-aarch64-apple-darwin.tar.gz.sha256
tar -xzf zacess-profile-v0.2.0-aarch64-apple-darwin.tar.gz
install -m 755 zacess-profile-v0.2.0-aarch64-apple-darwin/zprf ~/.local/bin/
```

`shasum` prints `OK` beside the file name when the sum matches. On Linux, for x86-64:

```sh
sha256sum -c zacess-profile-v0.2.0-x86_64-unknown-linux-musl.tar.gz.sha256
tar -xzf zacess-profile-v0.2.0-x86_64-unknown-linux-musl.tar.gz
install -m 755 zacess-profile-v0.2.0-x86_64-unknown-linux-musl/zprf ~/.local/bin/
```

On Windows, in PowerShell, compare the hash with the first word of the `.sha256` file, then unpack
the zip and put `zprf.exe` in a folder on your `PATH`:

```powershell
Get-FileHash zacess-profile-v0.2.0-x86_64-pc-windows-msvc.zip -Algorithm SHA256
Get-Content zacess-profile-v0.2.0-x86_64-pc-windows-msvc.zip.sha256
Expand-Archive zacess-profile-v0.2.0-x86_64-pc-windows-msvc.zip -DestinationPath .
```

`~/.local/bin` is one common folder on the `PATH`. Any folder on yours works.

## Build from source

With a Rust toolchain of 1.88 or newer:

```sh
git clone https://github.com/zacesshq/profile.git
cd profile
cargo install --path .
```

The checks the project runs on every change are in its
[contributing guide](https://github.com/zacesshq/profile/blob/v0.2.0/CONTRIBUTING.md). The browser
extension has its own build, described on the [browser extension](/docs/profile/browser-extension/)
page.

## Check the install

```sh
zprf --version
zprf list-targets
```

The first prints `zprf 0.2.0`. The second lists the seven targets `render` can write.

## Uninstall

Remove the program the same way it was installed:

```sh
brew uninstall zacess-profile
cargo uninstall zacess-profile
```

```powershell
winget uninstall Zacess.Profile
```

For a release archive, delete the `zprf` or `zprf.exe` you copied onto your `PATH`.

`zprf` keeps no settings of its own. `render` and `watch` write only inside the folder given to
`--out`, so the only other files are the folders you rendered into and any file you copied into an
app's config yourself. Remove the line that loads it from that app's config as well. The
[load in each app](/docs/profile/load-in-each-app/) page lists those lines.
