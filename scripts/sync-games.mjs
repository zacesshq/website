// copies the newest Zacess Games release into the site before every build: src/data/games.json, the
// data the games page is drawn from, plus the Deep Contrast Dark stills and the recordings in public/games.
//
// The games, their descriptions, the stills' alt text, the documentation links and the release files
// come from the README, the recordings the games page plays from docs/frames. Each game's goal, ending and tip come from docs/how-to-play.md and its keys,
// the shared keys and the window sizes from docs/controls.md. The Learn to Code tracks come from the
// level files in levels/code. Any section that cannot be read fails the sync rather than guessing.
//
//   node scripts/sync-games.mjs            keeps the committed files if the fetch fails
//   node scripts/sync-games.mjs --strict   fails instead, for the deploy workflow
//
// GAMES_TAG pins a tag and GITHUB_TOKEN, when set, lifts the API rate limit.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const REPO = "zacesshq/games";
const DATA = new URL("../src/data/", import.meta.url).pathname;
const PUBLIC = new URL("../public/games/", import.meta.url).pathname;
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
  const pinned = process.env.GAMES_TAG?.trim();
  if (pinned) {
    if (!SEMVER.test(pinned)) throw new Error(`GAMES_TAG ${pinned} is not a vX.Y.Z tag`);
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

// the text from a heading line up to the next heading of the same or a higher level
function section(text, heading, source) {
  const level = heading.match(/^#+/)[0].length;
  const start = text.indexOf(`\n${heading}\n`);
  if (start < 0) throw new Error(`${source} has no "${heading}" section`);
  const body = text.slice(start + heading.length + 2);
  const end = body.split("\n").findIndex((l) => {
    const m = l.match(/^(#+) /);
    return m && m[1].length <= level;
  });
  return end < 0 ? body : body.split("\n").slice(0, end).join("\n");
}

// the rows of the first table in a block of text, without its header and divider
function table(text, what) {
  const rows = [];
  let inTable = false;
  for (const line of text.split("\n")) {
    if (line.startsWith("|")) {
      const cells = line.split(/(?<!\\)\|/).slice(1, -1).map((c) => c.trim());
      if (!inTable) { inTable = true; continue; }
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      rows.push(cells);
    } else if (inTable) break;
  }
  if (!rows.length) throw new Error(`no table in ${what}`);
  return rows;
}

// the first paragraph under a heading, joined into one line
const paragraph = (text, heading, source) => {
  const body = section(text, heading, source).trim();
  const first = body.split(/\n\s*\n/)[0].replace(/\s*\n\s*/g, " ").trim();
  if (!first || first.startsWith("-") || first.startsWith("|")) throw new Error(`no paragraph under "${heading}" in ${source}`);
  return first;
};

// markdown links become their text; the page renders backticks itself
const unlink = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

async function sync() {
  const tag = await latestTag();
  const version = tag.slice(1);
  const cargo = await raw(tag, "Cargo.toml");
  if (!cargo.includes(`\nversion = "${version}"`)) throw new Error(`Cargo.toml at ${tag} is not version ${version}`);
  const rust = cargo.match(/\nrust-version = "([\d.]+)"/)?.[1];
  if (!rust) throw new Error(`Cargo.toml at ${tag} has no rust-version`);

  const readme = await raw(tag, "README.md");
  const howTo = await raw(tag, "docs/how-to-play.md");
  const controls = await raw(tag, "docs/controls.md");
  const access = (await raw(tag, "ACCESSIBILITY.md")).replace(/\s+/g, " ");

  // the README's game table: [Name](docs/how-to-play.md#id) | what it is
  const games = table(section(readme, "## The games", "the README"), "the README's game table").map(([cell, description]) => {
    const m = cell.match(/^\[([^\]]+)\]\(docs\/how-to-play\.md#([a-z0-9-]+)\)$/);
    if (!m) throw new Error(`"${cell}" in the README's game table is not a link to how-to-play.md`);
    return { id: m[2], name: m[1], description: unlink(description) };
  });

  // the README's still gallery gives the alt text of each Deep Contrast Dark still
  const alts = Object.fromEntries(
    [...readme.matchAll(/!\[([^\]]+)\]\(docs\/images\/([a-z0-9-]+)-deep-dark\.svg\)/g)].map((m) => [m[2], m[1]]),
  );
  const contents = Object.fromEntries(
    [...howTo.matchAll(/^- \[([^\]]+)\]\(#([a-z0-9-]+)\): (.+)$/gm)].map((m) => [m[2], m[3].trim()]),
  );
  const keyRows = Object.fromEntries(table(section(controls, "## Each game", "docs/controls.md"), "the controls sheet's game table"));

  // which games run in time comes from the accessibility statement and which type every character
  // from the header of the shared keys table; a game in neither list never moves on its own
  const names = (list) => list.replace(/ and /g, ", ").split(", ").map((n) => n.trim());
  const timed = access.match(/Only ([A-Z][^.]+?) run in time\./)?.[1];
  if (!timed) throw new Error("ACCESSIBILITY.md does not say which games run in time");
  const realTime = names(timed);
  const sharedHead = section(controls, "## Keys every game shares", "docs/controls.md").split("\n").find((l) => l.startsWith("| Key"));
  const typingHead = sharedHead?.split("|").slice(1, -1).map((c) => c.trim())[3];
  if (!typingHead) throw new Error("docs/controls.md has no typing games column");
  const typing = names(typingHead);

  for (const g of games) {
    g.kind = realTime.includes(g.name) ? "real time" : "turn based";
    g.typing = typing.includes(g.name);
    const page = section(howTo, `## ${g.name}`, "docs/how-to-play.md");
    const src = `the ${g.name} section of docs/how-to-play.md`;
    g.summary = contents[g.id] ?? (() => { throw new Error(`docs/how-to-play.md lists no summary for ${g.id}`); })();
    g.goal = paragraph(page, "### Goal", src);
    g.ending = paragraph(page, "### Winning and losing", src);
    g.tip = paragraph(page, "### Tip", src);
    g.keys = keyRows[g.name];
    if (!g.keys) throw new Error(`docs/controls.md has no keys row for ${g.name}`);
    g.alt = alts[g.id];
    if (!g.alt) throw new Error(`the README gallery has no still of ${g.id}`);
    g.still = `/games/images/${g.id}-deep-dark.svg`;
  }

  const menuAlt = readme.match(/!\[([^\]]+)\]\(docs\/images\/menu-deep-dark\.svg\)/)?.[1];
  if (!menuAlt) throw new Error("the README has no menu still");

  const shared = table(section(controls, "## Keys every game shares", "docs/controls.md"), "the shared keys table")
    .map(([key, most, termle, typing]) => ({ key, most, termle, typing }));
  const sizes = table(section(controls, "## Window sizes", "docs/controls.md"), "the window sizes table")
    .map(([size, layout]) => ({ size, layout }));
  const layouts = table(section(controls, "## Keyboard layouts", "docs/controls.md"), "the keyboard layouts table")
    .map(([id, where]) => ({ id: id.replace(/`/g, ""), where }));
  const docs = table(section(readme, "## Documentation", "the README"), "the README's documentation table").map(([cell, covers]) => {
    const m = cell.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (!m) throw new Error(`"${cell}" in the README's documentation table is not a link`);
    return { title: m[1], href: `https://github.com/${REPO}/blob/${tag}/${m[2]}`, covers };
  });
  const downloads = table(section(readme, "### From a release", "the README"), "the README's release files table")
    .map(([file, system]) => ({ file: file.replace(/`/g, "").replace("<tag>", tag), system }));

  // Learn to Code tracks, in the order the README names them
  for (const n of [...realTime, ...typing]) {
    if (!games.some((g) => g.name === n)) throw new Error(`"${n}" is not a game in the README`);
  }
  const ltc = games.find((g) => g.id === "learn-to-code");
  if (!ltc) throw new Error("the README lists no Learn to Code");
  const trackFiles = (await listing(tag, "levels/code")).filter((f) => f.endsWith(".lua"));
  const tracks = await Promise.all(trackFiles.map(async (f) => {
    const lua = await raw(tag, `levels/code/${f}`);
    const language = lua.match(/\blanguage = \[==\[([^\]]+)\]==\]/)?.[1];
    const id = lua.match(/\bid = \[==\[([^\]]+)\]==\]/)?.[1];
    const levels = (lua.match(/\btopic = \[==\[/g) || []).length;
    if (!language || !id || !levels) throw new Error(`levels/code/${f} at ${tag} has no language, id or levels`);
    return { id, language, levels };
  }));
  const at = (t) => { const i = ltc.description.indexOf(t.language); return i < 0 ? Infinity : i; };
  tracks.sort((a, b) => at(a) - at(b) || a.language.localeCompare(b.language));

  const stills = await listing(tag, "docs/images");
  const files = {};
  const sizeOf = (svg, f) => {
    const w = svg.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1];
    const h = svg.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1];
    if (!w || !h) throw new Error(`docs/images/${f} at ${tag} has no size`);
    return { width: Math.round(+w), height: Math.round(+h) };
  };
  let size = null;
  await Promise.all(["menu", ...games.map((g) => g.id)].map(async (id) => {
    const f = `${id}-deep-dark.svg`;
    if (!stills.includes(f)) throw new Error(`docs/images/${f} is missing at ${tag}`);
    const body = await raw(tag, `docs/images/${f}`);
    if (!body.includes("<svg")) throw new Error(`docs/images/${f} at ${tag} is not an SVG`);
    files[`images/${f}`] = body;
    size ??= sizeOf(body, f);
  }));

  // the recording of each game, in the Scenes frames format, which the games page plays on demand
  const frameFiles = await listing(tag, "docs/frames");
  let recording = null;
  await Promise.all(games.map(async (g) => {
    const f = `${g.id}.json`;
    if (!frameFiles.includes(f)) throw new Error(`docs/frames/${f} is missing at ${tag}`);
    const body = await raw(tag, `docs/frames/${f}`);
    const parsed = JSON.parse(body);
    if (!Array.isArray(parsed.frames) || !parsed.frames.length || !parsed.fps || !parsed.width || !parsed.height) {
      throw new Error(`docs/frames/${f} at ${tag} has no frames`);
    }
    files[`frames/${f}`] = body;
    g.frames = `/games/frames/${f}`;
    recording ??= { width: parsed.width, height: parsed.height, fps: parsed.fps, frames: parsed.frames.length };
  }));

  const data = JSON.stringify({
    version, tag, rust, still: size, recording,
    menu: { still: "/games/images/menu-deep-dark.svg", alt: menuAlt },
    games, tracks, shared, sizes, layouts, docs, downloads,
  }, null, 2) + "\n";

  // written only once everything has downloaded and parsed, so a failure never leaves a mix
  let changed = 0;
  const write = (path, body) => {
    let current = null;
    try { current = readFileSync(path, "utf8"); } catch {}
    if (current !== body) { writeFileSync(path, body); changed++; }
  };
  write(join(DATA, "games.json"), data);
  for (const dir of ["images", "frames"]) mkdirSync(join(PUBLIC, dir), { recursive: true });
  for (const [name, body] of Object.entries(files)) write(join(PUBLIC, name), body);
  // files a newer release dropped go, so the site never shows a game that no longer exists
  for (const dir of ["images", "frames"]) {
    for (const f of readdirSync(join(PUBLIC, dir))) {
      if (!(`${dir}/${f}` in files)) { unlinkSync(join(PUBLIC, dir, f)); changed++; }
    }
  }
  console.log(`sync-games: Zacess Games ${tag}, ${games.length} games, ${changed ? `${changed} file(s) updated` : "already up to date"}`);
}

try {
  await sync();
} catch (error) {
  if (strict) {
    console.error(`sync-games: ${error.message}`);
    process.exit(1);
  }
  let kept = "none";
  try { kept = JSON.parse(readFileSync(join(DATA, "games.json"), "utf8")).version; } catch {}
  console.warn(`sync-games: could not fetch the latest games release (${error.message}); building with the committed copy, version ${kept}`);
}
