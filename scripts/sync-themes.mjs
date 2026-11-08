// copies the newest Zacess Themes release into src/data before every build: themes.json, the data the
// themes page is drawn from, the VS Code theme files the code samples are highlighted with and the
// preview images in public/themes/images: Deep Contrast Dark for the homepage card and the Warm pair
// for their section on the themes page.
//
// themes.json is previews/themes.json from the themes repository, which scripts/preview.mjs there
// writes from palette/zacess.json. That repository's verify step rebuilds it and fails on any
// difference, in CI and again before every release, so the committed copy at a release tag is
// exactly the generator's output for that tag's palette. Taking it as is, rather than copying the
// generator here, means the two can never drift apart.
//
//   node scripts/sync-themes.mjs            keeps the committed files if the fetch fails
//   node scripts/sync-themes.mjs --strict   fails instead, for the deploy workflow
//
// THEMES_TAG pins a tag (the deploy workflow passes the one a release dispatch names) and
// GITHUB_TOKEN, when set, lifts the API rate limit.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { latestTag as latest, raw as fetchRaw } from "./lib/release.mjs";

const REPO = "zacesshq/themes";
const DATA = new URL("../src/data/", import.meta.url).pathname;
// the homepage card for the themes shows the first, the one the scene and game stills use; the themes
// page shows the Warm pair in the section that explains their gentler floor
const PREVIEWS = ["deep-contrast-dark", "warm-dark", "warm-light"];
const IMAGES = new URL("../public/themes/images/", import.meta.url).pathname;
const strict = process.argv.includes("--strict");
const latestTag = () => latest(REPO, "THEMES_TAG");
const raw = (tag, path) => fetchRaw(REPO, tag, path);

async function sync() {
  const tag = await latestTag();
  const version = tag.slice(1);
  const palette = JSON.parse(await raw(tag, "palette/zacess.json"));
  if (palette.version !== version) throw new Error(`palette/zacess.json at ${tag} says version ${palette.version}`);

  const text = await raw(tag, "previews/themes.json");
  const data = JSON.parse(text);
  if (data.version !== version) throw new Error(`previews/themes.json at ${tag} says version ${data.version}`);
  for (const key of ["generatedFrom", "repository", "rules", "styles", "sample", "themes"]) {
    if (!(key in data)) throw new Error(`previews/themes.json at ${tag} has no ${key}`);
  }
  // every theme the palette defines must be in the page data, so a stale previews file is refused
  const ids = palette.themes.map((t) => t.id).join();
  if (data.themes.map((t) => t.id).join() !== ids) throw new Error(`previews/themes.json at ${tag} does not list the palette's themes`);

  const editorThemes = Object.fromEntries(await Promise.all(data.themes.map(async (t) => {
    const name = `zacess-${t.id}-color-theme.json`;
    const body = await raw(tag, `editors/vscode/themes/${name}`);
    JSON.parse(body);
    return [name, body];
  })));

  const previews = await Promise.all(PREVIEWS.map(async (id) => {
    const name = `zacess-${id}.svg`;
    const body = await raw(tag, `previews/${name}`);
    if (!body.includes("<svg")) throw new Error(`previews/${name} at ${tag} is not an SVG`);
    return [name, body];
  }));

  // written only once everything has downloaded and parsed, so a failure never leaves a mix
  const files = { "themes.json": text, ...Object.fromEntries(Object.entries(editorThemes).map(([n, b]) => [`themes/${n}`, b])) };
  const paths = Object.entries(files).map(([name, body]) => [join(DATA, name), body]);
  mkdirSync(IMAGES, { recursive: true });
  for (const [name, body] of previews) paths.push([join(IMAGES, name), body]);
  let changed = 0;
  for (const [path, body] of paths) {
    let current = null;
    try { current = readFileSync(path, "utf8"); } catch {}
    if (current !== body) { writeFileSync(path, body); changed++; }
  }
  const known = new Set(Object.keys(editorThemes));
  const extra = readdirSync(join(DATA, "themes")).filter((f) => f.endsWith("-color-theme.json") && !known.has(f));
  if (extra.length) console.warn(`sync-themes: ${extra.join(", ")} is not in ${tag}; remove it once nothing imports it`);
  console.log(`sync-themes: Zacess Themes ${tag}, ${changed ? `${changed} file(s) updated` : "already up to date"}`);
}

try {
  await sync();
} catch (error) {
  if (strict) {
    console.error(`sync-themes: ${error.message}`);
    process.exit(1);
  }
  const kept = JSON.parse(readFileSync(join(DATA, "themes.json"), "utf8")).version;
  console.warn(`sync-themes: could not fetch the latest themes release (${error.message}); building with the committed copy, version ${kept}`);
}
