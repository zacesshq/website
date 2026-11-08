# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-08

### Added

- Sound in the studio for scenes and games. It is off until someone presses Play sound, which becomes Pause sound. A volume slider keeps its level between visits. A scene plays the background loop that suits it and a game plays its music with its own loop. Tone buttons play each event in any of the eight sound sets. A game's panel plays each of its effects, the new warning tone included. The files are made by `scripts/studio-sounds.mjs` from the Scenes and Games programs themselves and served from the media bucket, so they sound the way the programs do.
- A Check workflow that type checks, builds and verifies the site on every pull request, so a change that breaks the build is caught before it merges. It is required before a merge.
- Zacess Warm Dark and Zacess Warm Light on `/themes/`, taking the code themes from eight to ten: in
  the playground, the side by side grid and the browser table, plus a section with both preview
  images that explains the gentler pair. Their body text sits at about 12:1 in warm, earthy colours
  with a 4.5:1 floor, while the other eight keep 7:1. The playground shows each theme's own target.
- The theme sync copies the Warm pair's preview images with the Deep Contrast Dark one.
- A studio at `/studio/` and a compact one on the home page: a laptop whose screen shows any scene,
  game, code sample or starter profile in any of the ten themes. Scenes and games play their real
  recordings through the scenes player, code samples come from the themes playground and each
  starter profile shows its TOML and `zprf check` in its own palette. It opens on Deep Contrast Dark
  with Harbour as the scene and Drift as the game.
- The studio's pickers: a mode switch and native selects for the theme and for each mode's item.
  The theme picker shows the chosen theme's own colours beside its name and each item picker has
  Previous and Next buttons with an "(n of N)" count.
- The laptop is drawn flat by default. A 3D view button tilts it with a gentle parallax that follows
  a mouse. Under reduced motion the button is hidden, the laptop stays flat and recordings wait for
  Play. Every recording has a visible Pause button and pauses while the studio is off screen or the
  tab is hidden. The two are tracked apart, so coming back to the tab never restarts a recording
  that is off screen.
- `src/data/studio-manifest.json`, which puts every studio asset behind one base: the R2 bucket at
  `https://media.zacess.com` in a build and `public/studio-assets` under `astro dev`. Anything the
  bucket lacks falls back to the release copy, with a note saying so. The CSP allows the bucket.
- A build copies `public/` into `dist/` itself and leaves out `public/studio-assets`, the local
  development copy of the studio's assets, so it is never uploaded with the site. `.gitignore` and
  `public/.assetsignore` keep it out as well.
- `ZACESS_SYNC_LOCAL`, which points the scenes, games, profile and themes syncs at a folder of local
  checkouts so unreleased work can be previewed on the site. Each sync then reads the checkout's
  working tree and the version in its `Cargo.toml` or `package.json` instead of the newest tag. The
  Profile sync keeps the committed list of release files, named under the local version. The deploy
  workflow never sets it.
- `scripts/studio-assets.mjs`, which writes the studio's asset tree from local builds of Zacess
  Scenes, Zacess Games and Zacess Profile and records what it wrote in the manifest.
- The studio on each product page, opened in that page's mode: Editor themes on `/themes/`, Scenes
  on `/scenes/`, Games on `/games/` and Profile on `/profile/`. On the themes page it chooses the
  theme and language while the contrast figures, the copy button and the side by side grid follow
  it. Older playground links such as `#warm-dark-rust` still open the right view. On the scenes and
  games pages it replaces the single theme player. Play the recording under each game still plays
  it in the studio. A scene the tool adds appears once the asset script has generated it.
- Studio in the main navigation. The header row now starts at 76rem and may run wider than the
  page, so the nine links stay centred clear of the logo. Narrower screens use the Menu button.
- The studio remembers the last mode, theme and item for each mode in this browser, as the code
  themes playground did. A link that names a view always wins. The page works without storage.
- An In your browser section on `/themes/` with a link to each of the eight browser themes in the
  Chrome Web Store and on Firefox Add-ons. An install card for the browser themes notes that Edge
  installs the Chrome ones.
- The Profile install page links the browser extension in the Chrome Web Store, on Firefox Add-ons
  and on Microsoft Edge Add-ons. The Profile page shows the same links from the 0.2.2 release.

### Changed

- The Profile install page and browser extension guide link the three store listings directly.
- The themes page lists the browser themes as live in the Chrome Web Store and on Firefox Add-ons.
- The Profile documentation written on this site is checked against Zacess Profile 0.2.2. The
  release archive names, the version `zprf --version` prints and the source links follow it.
- The home page, Features, the FAQ, the roadmap and the scenes, games, themes and profile pages
  speak of ten themes: the eight contrast themes and the gentler Warm pair. The homepage themes card
  calls them code themes, from the strongest contrast to a gentler warm pair.
- Features lists five reading presets, adding Gentle Warm: the system font at 14 point, 1.6 line
  spacing, 65 characters to a line, Warm Dark and no ruler. It lists the reader's ten themes. The
  home page names the gentle warm view among the presets.
- The scenes, games, profile and themes pages and their documentation follow the newest work in
  each product: 65 scenes drawn as pixel art with a still for each, the games' pixel art boards with
  new stills and recordings, ten starter profiles and ten code themes. The scenes sync reads the
  More general scenes table when the scenes list has one.
- `scenes-player.js` is now only the drawing core the studio uses. It draws block glyphs as
  rectangles, as a terminal does, so pixel art in full and half blocks shows no seams.

### Removed

- The single theme players on the scenes and games pages, their styles and the playground's own
  theme and language selects, all replaced by the studio.

## [0.4.0] - 2026-11-05

### Added

- An accessibility profile page at `/profile/` for Zacess Profile, drawn from its newest release:
  what a profile is, how `zprf` derives and checks colours, every floor, target, command and starter
  profile, the browser extension, the accessibility guarantees, the plans and the four install
  routes with the release builds. The Profile mark follows the colour mode in light and dark.
- `scripts/sync-profile.mjs`, which copies that release into `src/data/profile.json` and
  `public/profile/images` before every build, with the version at `/profile/version.txt`.
- Zacess Profile in the documentation, covered as fully as Zacess Scenes: an install page with every
  route, the checksum steps, building from source and uninstalling. A Profile group in the Use
  section with the quick start, writing a profile, what is checked, the colour vision checks, the
  targets, loading the files in each app, the starter profiles, the browser extension, the system
  settings preview, the accessibility statement and troubleshooting. A page for each `zprf` command
  in the Reference section beside the command line summary and the profile format.
- Documentation pages written in this repository under `docs-src/`, for a product whose repository
  has no file for a page yet. Each names the release it was checked against and the sync says when a
  newer one is out.
- A Copy button on every command and code block of the profile page, the same button and script
  the documentation uses, with `npm run verify` checking each block has one.
- The accessibility profile first in the homepage's More from Zacess cards, with a still of real
  `zprf check` output in Zacess Deep Contrast Dark drawn by `scripts/draw-profile-still.mjs`.
  Profile also comes first among the products in the footer and the documentation.
- A `profile-release` dispatch that starts a deploy, with the daily run comparing
  `/profile/version.txt` with the live site as it does for the other products.

### Changed

- The homepage's More from Zacess cards stand two across on a laptop and four across on a wide
  screen.
- The Copy button on every code block sits beside the first line instead of above the code, and
  long lines wrap around it rather than scroll sideways under it.

## [0.3.0] - 2026-11-03

### Added

- A Copy button on every code block in the documentation, 44 pixels each way, that reads out the
  copy and works from the keyboard.
- `npm run verify` checks that every code block in the documentation carries its Copy button.

### Changed

- The documentation's reading column is wider, so an install command of about 80 characters fits
  on a 1190 pixel screen and more on a wider one. A longer command scrolls sideways on a scrollbar
  that is always drawn in both colour modes and is never broken across lines.
- A file name or a command in a table cell stays whole; the table scrolls sideways in its region.

## [0.2.0] - 2026-11-03

### Added

- A documentation section at `/docs/`, drawn from the markdown in every product repository at the
  release it describes: install pages for the reader, the scenes, the games and the themes, a page
  for each product document, the Lua guides, the community files in full and a reference sheet for
  each tool. Every page names its release and links to its source on GitHub.
- `scripts/sync-docs.mjs` and `scripts/docs-manifest.mjs`, which pull those pages before every
  build, with the release lookup the sync scripts share moved into `scripts/lib/release.mjs`.
- Search over the documentation with Pagefind, built into the sidebar and working without a server.
- Mermaid diagrams in the documentation drawn at sync time as images in both high contrast themes,
  with the source kept on the page as text.
- The documentation drawn in the two high contrast themes from the themes release, with
  `scripts/check-contrast.mjs` holding every colour pair to the site's floors on every build.
- Docs in the main navigation and a Docs column in the footer, with a copyright line.
- A weekly link check over every outbound link in the built site.
- The four install routes of Zacess Scenes and Zacess Games on their product pages: Homebrew,
  winget, Cargo from crates.io and the release archives.

### Changed

- `npm run verify` also checks the documentation pages, the search index, the security header the
  search needs, the canonical address of every page and the contrast floors.
- Routine tidy-up.

[Unreleased]: https://github.com/zacesshq/website/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/zacesshq/website/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/zacesshq/website/releases/tag/v0.4.0
[0.3.0]: https://github.com/zacesshq/website/releases/tag/v0.3.0
[0.2.0]: https://github.com/zacesshq/website/releases/tag/v0.2.0
