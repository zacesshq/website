# Zacess website

The source of [zacess.com](https://zacess.com): what Zacess is, how it works, the roadmap, our
accessibility, privacy and security statements and the documentation of every Zacess product.

Zacess is a free, open-source reader that turns slides, PDFs, handouts, whiteboards and web pages
into notes in your own reading profile.

## Built with

- [Astro](https://astro.build), as a static site with no server
- Hand-drawn inline SVG icons and the Atkinson Hyperlegible typeface (SIL Open Font Licence)
- Hosted on Cloudflare as static assets (see `wrangler.jsonc`); no server code runs

## Working on it

```sh
npm install
npm run dev      # local preview
npm run sync-themes   # copy the latest Zacess Themes release into src/data (build does this too)
npm run sync-scenes   # the same for Zacess Scenes
npm run sync-games    # the same for Zacess Games
npm run sync-profile  # the same for Zacess Profile
npm run sync-docs     # the documentation pages, from every product repository
npm run build    # static site in dist/, then the search index in dist/pagefind
npm run verify   # headings, links, writing style, the security headers, the docs and the contrast floors
npx wrangler deploy --autoconfig=false   # publish dist/ as static assets on Cloudflare
```

Every page meets WCAG 2.2 AA with text at 7:1 contrast or higher, works fully from the keyboard and
respects reduced motion. Please keep it that way in any change.

## How releases reach the site

The [code themes page](https://zacess.com/themes/) is drawn from two kinds of file copied from
[zacesshq/themes](https://github.com/zacesshq/themes): `src/data/themes.json`, which that repository
generates from its palette as `previews/themes.json` plus the VS Code theme files in
`src/data/themes/`. Neither is edited by hand.

1. `scripts/sync-themes.mjs` finds the newest `vX.Y.Z` tag in the themes repository, downloads those
   files at that tag, checks their version matches the tag and writes them. It runs before every
   `npm run build`. Without a network connection it keeps the committed copies and says so, so an
   offline build still works.
2. The build publishes the version it used at [`/themes/version.txt`](https://zacess.com/themes/version.txt).
3. [`deploy.yml`](.github/workflows/deploy.yml) syncs, checks, builds, verifies and deploys to
   Cloudflare. It runs on every push to `main`, by hand, on a `themes-release`, `scenes-release`,
   `games-release` or `profile-release` dispatch from a release workflow and once a day. The daily
   run deploys only when a latest release differs from the version the live site reports, so it
   catches a release whose dispatch was not sent. In the workflow a failed sync stops the run rather
   than deploying an old copy. The [workflows README](.github/workflows/README.md) has the detail.

The [terminal scenes page](https://zacess.com/scenes/) and the
[terminal games page](https://zacess.com/games/) work the same way. `scripts/sync-scenes.mjs` copies
the scene list, stills and demo frames from the newest [zacesshq/scenes](https://github.com/zacesshq/scenes)
release into `src/data/scenes.json` and `public/scenes/`. `scripts/sync-games.mjs` reads the games,
their rules and keys, the Learn to Code tracks and the release files from the newest
[zacesshq/games](https://github.com/zacesshq/games) release into `src/data/games.json` and copies the
stills into `public/games/images`. Each publishes its version at `/scenes/version.txt` and
`/games/version.txt`.

The [accessibility profile page](https://zacess.com/profile/) follows the same pattern.
`scripts/sync-profile.mjs` reads the tagline, the reasons, the example profile, the commands, the
checks, the targets and the starter profiles from the README of the newest
[zacesshq/profile](https://github.com/zacesshq/profile) release, the plans from its `ROADMAP.md` and
the release files from the GitHub release of that tag into `src/data/profile.json`. The light and
dark marks are kept there as SVG text, since the page draws them inline. The extension's screenshot
goes into `public/profile/images`. It publishes its version at `/profile/version.txt`. The profile
repository makes no terminal still, so the homepage card's still in `public/profile/stills/` is
drawn here by `node scripts/draw-profile-still.mjs` from a real run of the installed `zprf`, which
must match the synced version. Run it by hand after a profile release and commit the result.

## The documentation

[zacess.com/docs](https://zacess.com/docs/) is drawn from the markdown in each product repository
rather than written here, so a page can never drift from the release it describes.

1. `scripts/docs-manifest.mjs` lists every page: its address under `/docs/`, the repository and
   file it comes from and, for a section of a README, the heading to take. The sidebar in
   `src/data/docs-nav.ts` reads the same list, so the order is decided in one place.
   A page whose product repository has no file for it yet is written here instead, under
   `docs-src/`. Its manifest entry is marked `local` with the release it was checked against. The
   Zacess Profile install page, guides and command pages are written this way. The sync prints a
   note once a newer release is out, so those pages are read against it again.
2. `scripts/sync-docs.mjs` reads Zacess Scenes, Zacess Games, Zacess Themes and Zacess Profile at
   their newest release tag (the same tag the product pages use) and the reader and the
   organisation's community files at the commit the manifest pins. It takes the first heading as
   the title, drops badges, turns GitHub alerts into plain notes, points links between pages at
   their addresses here and every other relative link at the file on GitHub at the same ref, copies
   the images into `public/docs/<source>/images/` and writes one file per page into
   `src/content/docs/`. A Mermaid
   block is drawn with mermaid-cli once per high contrast theme into
   `public/docs/<source>/images/diagrams/`, since the security policy allows no script to draw it in
   the browser; the page shows the image for the colour mode and keeps the source as text under a
   disclosure. Drawing needs the browser `npx puppeteer browsers install chrome` fetches. It writes
   only once every fetch has succeeded and removes pages a newer release dropped. A page whose
   source file does not exist yet is skipped with a note rather than failing the build.
3. `src/content.config.ts` loads those files as the `docs` collection; `src/layouts/DocsLayout.astro`
   draws each one with the sidebar, the "On this page" list, the release it came from and a link to
   edit it on GitHub. Code blocks are highlighted at build time in the two high contrast themes and
   their colours written to `/docs/code.css` as classes, since the Content Security Policy allows no
   inline styles; `/docs/theme.css` carries the page colours from the same themes release and
   `scripts/check-contrast.mjs` holds every pair to 7:1 for text and 3:1 for lines.
4. After the build, [Pagefind](https://github.com/Pagefind/pagefind) indexes the documentation pages into
   `dist/pagefind/`. The search field in the sidebar queries that index in the browser; without
   JavaScript the sidebar is shown in full instead.

The deploy needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. The
committed copies are refreshed by running the sync scripts and committing the result, which is
only needed for offline builds. [`links.yml`](.github/workflows/links.yml) checks every outbound
link in the built site weekly and on a pull request.

## Licence

AGPL-3.0. The font is under the SIL Open Font Licence 1.1; see [the credits page](https://zacess.com/credits/).
