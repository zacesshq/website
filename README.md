# Zacess website

The source of [zacess.com](https://zacess.com): what Zacess is, how it works, the roadmap and our
accessibility, privacy and security statements.

Zacess is a free, open-source reader that turns slides, PDFs, handouts, whiteboards and web pages
into notes in your own reading profile.

## Built with

- [Astro](https://astro.build), as a static site with no server
- Hand-drawn inline SVG icons and the Atkinson Hyperlegible typeface (SIL Open Font Licence)
- Hosted on Cloudflare Pages

## Working on it

```sh
npm install
npm run dev      # local preview
npm run build    # static site in dist/
npm run verify   # headings, links, writing style and the security headers
```

Every page meets WCAG 2.2 AA with text at 7:1 contrast or higher, works fully from the keyboard and
respects reduced motion. Please keep it that way in any change.

## Licence

AGPL-3.0. The font is under the SIL Open Font Licence 1.1; see [the credits page](https://zacess.com/credits/).
