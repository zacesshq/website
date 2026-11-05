# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/zacesshq/website/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/zacesshq/website/releases/tag/v0.4.0
[0.3.0]: https://github.com/zacesshq/website/releases/tag/v0.3.0
[0.2.0]: https://github.com/zacesshq/website/releases/tag/v0.2.0
