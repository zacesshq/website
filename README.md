# Zacess website

The source of [zacess.com](https://zacess.com): what Zacess is, how it works, the roadmap and our
accessibility, privacy and security statements.

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
npm run build    # static site in dist/
npm run verify   # headings, links, writing style and the security headers
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
   Cloudflare. It runs on every push to `main`, by hand, when the themes release workflow sends a
   `themes-release` dispatch and once a day. The daily run deploys only when the latest release
   differs from the version the live site reports, so it catches a release whose dispatch was not
   sent. In the workflow a failed sync stops the run rather than deploying an old copy.

The deploy needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. The
committed copies are refreshed by running `npm run sync-themes` and committing the result, which is
only needed for offline builds.

## Licence

AGPL-3.0. The font is under the SIL Open Font Licence 1.1; see [the credits page](https://zacess.com/credits/).
