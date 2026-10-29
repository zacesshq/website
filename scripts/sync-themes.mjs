// copies the newest Zacess Themes release into src/data before every build: themes.json, the data the
// themes page is drawn from, the VS Code theme files the code samples are highlighted with and the
// Deep Contrast Dark preview image the homepage card shows, in public/themes/images.
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

const REPO = "zacesshq/themes";
const DATA = new URL("../src/data/", import.meta.url).pathname;
// the homepage card for the themes shows this theme's preview, the one the scene and game stills use
const PREVIEW = "deep-contrast-dark";
const IMAGES = new URL("../public/themes/images/", import.meta.url).pathname;
const strict = process.argv.includes("--strict");
const TIMEOUT = 15000;

const headers = { "User-Agent": "zacess-website-sync", Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function get(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res;
}

const SEMVER = /^v(\d+)\.(\d+)\.(\d+)$/;
const newer = (a, b) => {
  const x = a.match(SEMVER).slice(1).map(Number);
  const y = b.match(SEMVER).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

// the newest vX.Y.Z tag rather than GitHub's latest release, because the release workflow publishes
// to the stores on the tag and the GitHub release is only made afterwards on a maintainer's machine
async function latestTag() {
  const pinned = process.env.THEMES_TAG?.trim();
  if (pinned) {
    if (!SEMVER.test(pinned)) throw new Error(`THEMES_TAG ${pinned} is not a vX.Y.Z tag`);
    return pinned;
  }
  const tags = await (await get(`https://api.github.com/repos/${REPO}/tags?per_page=100`, { headers })).json();
  const releases = tags.map((t) => t.name).filter((n) => SEMVER.test(n));
  if (!releases.length) throw new Error(`no vX.Y.Z tags in ${REPO}`);
  return releases.reduce((best, n) => (newer(n, best) ? n : best));
}

const raw = async (tag, path) => (await get(`https://raw.githubusercontent.com/${REPO}/${tag}/${path}`)).text();

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

  const previewName = `zacess-${PREVIEW}.svg`;
  const preview = await raw(tag, `previews/${previewName}`);
  if (!preview.includes("<svg")) throw new Error(`previews/${previewName} at ${tag} is not an SVG`);

  // written only once everything has downloaded and parsed, so a failure never leaves a mix
  const files = { "themes.json": text, ...Object.fromEntries(Object.entries(editorThemes).map(([n, b]) => [`themes/${n}`, b])) };
  const paths = Object.entries(files).map(([name, body]) => [join(DATA, name), body]);
  mkdirSync(IMAGES, { recursive: true });
  paths.push([join(IMAGES, previewName), preview]);
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
