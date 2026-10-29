// copies the newest Zacess Scenes release into the site before every build: src/data/scenes.json, the
// list the scenes page is drawn from, plus the gallery stills and the demo frames in public/scenes.
//
// The list comes from the three scene tables and the sound set table in the release's README, the
// stills from docs/images/scenes and the frames from docs/frames. The scenes repository's CI fails when
// a still or a frame file is out of date with its generator, so a tag always carries matching files.
//
//   node scripts/sync-scenes.mjs            keeps the committed files if the fetch fails
//   node scripts/sync-scenes.mjs --strict   fails instead, for the deploy workflow
//
// SCENES_TAG pins a tag and GITHUB_TOKEN, when set, lifts the API rate limit.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const REPO = "zacesshq/scenes";
const DATA = new URL("../src/data/", import.meta.url).pathname;
const PUBLIC = new URL("../public/scenes/", import.meta.url).pathname;
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

async function latestTag() {
  const pinned = process.env.SCENES_TAG?.trim();
  if (pinned) {
    if (!SEMVER.test(pinned)) throw new Error(`SCENES_TAG ${pinned} is not a vX.Y.Z tag`);
    return pinned;
  }
  const tags = await (await get(`https://api.github.com/repos/${REPO}/tags?per_page=100`, { headers })).json();
  const releases = tags.map((t) => t.name).filter((n) => SEMVER.test(n));
  if (!releases.length) throw new Error(`no vX.Y.Z tags in ${REPO}`);
  return releases.reduce((best, n) => (newer(n, best) ? n : best));
}

const raw = async (tag, path) => (await get(`https://raw.githubusercontent.com/${REPO}/${tag}/${path}`)).text();
const listing = async (tag, path) =>
  (await (await get(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${tag}`, { headers })).json())
    .filter((f) => f.type === "file")
    .map((f) => f.name);

// the rows of the first table after a heading: `name` | description | reduced motion
function table(readme, heading) {
  const start = readme.indexOf(`\n${heading}\n`);
  if (start < 0) throw new Error(`the README has no "${heading}" section`);
  const rows = [];
  let inTable = false;
  for (const line of readme.slice(start + heading.length + 2).split("\n")) {
    if (line.startsWith("|")) {
      inTable = true;
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (/^-+$/.test(cells[0]) || cells[0] === "Scene" || cells[0] === "Set") continue;
      rows.push(cells);
    } else if (inTable) break;
    else if (line.startsWith("#")) break;
  }
  if (!rows.length) throw new Error(`no table under "${heading}" in the README`);
  return rows;
}

const code = (cell) => {
  const m = cell.match(/^`([a-z0-9-]+)`/);
  if (!m) throw new Error(`"${cell}" is not a scene or set name in backticks`);
  return m[1];
};

async function sync() {
  const tag = await latestTag();
  const version = tag.slice(1);
  const cargo = await raw(tag, "Cargo.toml");
  if (!cargo.includes(`\nversion = "${version}"`)) throw new Error(`Cargo.toml at ${tag} is not version ${version}`);

  const readme = await raw(tag, "README.md");
  const scenes = [];
  for (const [heading, kind] of [["### The original scenes", "general"], ["### Pass scenes", "pass"], ["### Fail scenes", "fail"]]) {
    for (const [name, description, reduced] of table(readme, heading)) {
      scenes.push({ id: code(name), kind, description, reduced });
    }
  }
  const soundSets = table(readme, "## Sound sets").map(([name, sound]) => ({ id: code(name), sound }));

  const stills = await listing(tag, "docs/images/scenes");
  const frameFiles = await listing(tag, "docs/frames");
  for (const s of scenes) {
    if (!stills.includes(`${s.id}.svg`)) throw new Error(`docs/images/scenes/${s.id}.svg is missing at ${tag}`);
  }
  for (const extra of ["watch-pass.svg", "watch-fail.svg"]) {
    if (!stills.includes(extra)) throw new Error(`docs/images/scenes/${extra} is missing at ${tag}`);
  }

  const files = {};
  await Promise.all(stills.filter((f) => f.endsWith(".svg")).map(async (f) => {
    const body = await raw(tag, `docs/images/scenes/${f}`);
    if (!body.includes("<svg")) throw new Error(`docs/images/scenes/${f} at ${tag} is not an SVG`);
    files[`images/${f}`] = body;
  }));
  const frames = [];
  await Promise.all(frameFiles.filter((f) => f.endsWith(".json")).map(async (f) => {
    const body = await raw(tag, `docs/frames/${f}`);
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed.frames) || !parsed.fps) throw new Error(`docs/frames/${f} at ${tag} has no frames`);
    files[`frames/${f}`] = body;
    frames.push(f.replace(/\.json$/, ""));
  }));

  const data = JSON.stringify({ version, tag, scenes, soundSets, frames: frames.sort() }, null, 2) + "\n";

  // written only once everything has downloaded and parsed, so a failure never leaves a mix
  let changed = 0;
  const write = (path, body) => {
    let current = null;
    try { current = readFileSync(path, "utf8"); } catch {}
    if (current !== body) { writeFileSync(path, body); changed++; }
  };
  write(join(DATA, "scenes.json"), data);
  for (const dir of ["images", "frames"]) mkdirSync(join(PUBLIC, dir), { recursive: true });
  for (const [name, body] of Object.entries(files)) write(join(PUBLIC, name), body);
  // files a newer release dropped go, so the site never links a scene that no longer exists
  for (const dir of ["images", "frames"]) {
    for (const f of readdirSync(join(PUBLIC, dir))) {
      if (!(`${dir}/${f}` in files)) { unlinkSync(join(PUBLIC, dir, f)); changed++; }
    }
  }
  console.log(`sync-scenes: Zacess Scenes ${tag}, ${changed ? `${changed} file(s) updated` : "already up to date"}`);
}

try {
  await sync();
} catch (error) {
  if (strict) {
    console.error(`sync-scenes: ${error.message}`);
    process.exit(1);
  }
  let kept = "none";
  try { kept = JSON.parse(readFileSync(join(DATA, "scenes.json"), "utf8")).version; } catch {}
  console.warn(`sync-scenes: could not fetch the latest scenes release (${error.message}); building with the committed copy, version ${kept}`);
}
