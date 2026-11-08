// copies the newest Zacess Profile release into the site before every build: src/data/profile.json,
// the data the profile page is drawn from, plus the extension's real screenshot in
// public/profile/images. The homepage card still is drawn by scripts/draw-profile-still.mjs.
//
// The tagline, the reasons, the example profile, the commands, the checks, the targets and the
// starter profiles come from the README, the version and the Rust version from Cargo.toml, the
// plans from ROADMAP.md and the release files from the GitHub release of the tag. The light and dark
// marks come from assets/ and are kept as SVG text, since the page draws them inline with their own
// role and label. Any section that cannot be read fails the sync rather than guessing.
//
//   node scripts/sync-profile.mjs            keeps the committed files if the fetch fails
//   node scripts/sync-profile.mjs --strict   fails instead, for the deploy workflow
//
// PROFILE_TAG pins a tag and GITHUB_TOKEN, when set, lifts the API rate limit.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { latestTag as latest, raw as fetchRaw, rawBytes, isLocal, get, headers } from "./lib/release.mjs";

const REPO = "zacesshq/profile";
const DATA = new URL("../src/data/", import.meta.url).pathname;
const PUBLIC = new URL("../public/profile/", import.meta.url).pathname;
const strict = process.argv.includes("--strict");
const latestTag = () => latest(REPO, "PROFILE_TAG");
const raw = (tag, path) => fetchRaw(REPO, tag, path);

// each release build's target, in the words the games page uses for the same targets
const SYSTEMS = {
  "aarch64-apple-darwin": "macOS on Apple silicon",
  "x86_64-apple-darwin": "macOS on Intel",
  "x86_64-unknown-linux-musl": "Linux on x86-64, no shared libraries needed",
  "aarch64-unknown-linux-musl": "Linux on ARM64, no shared libraries needed",
  "x86_64-pc-windows-msvc": "Windows on x86-64",
};

// the lines from a heading to the next heading of the same or a higher level, outside code fences
function section(text, heading, source) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const level = heading.match(/^#+/)[0].length;
  const start = lines.indexOf(heading);
  if (start < 0) throw new Error(`${source} has no "${heading}" section`);
  const out = [];
  let fence = false;
  for (const line of lines.slice(start + 1)) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const m = !fence && line.match(/^(#+) /);
    if (m && m[1].length <= level) break;
    out.push(line);
  }
  return out.join("\n");
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

// the paragraphs of a block, each joined into one line, leaving out lists, tables, code and notes
function paragraphs(text) {
  return text.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, "").split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((t) => t && !/^([-*] |\d+\. |\||>|#|<|\[!\[)/.test(t))
    .map((t) => t.replace(/\s*\n\s*/g, " "));
}

// the items of the first list in a block, each joined into one line
function items(text, what) {
  const list = [];
  for (const line of text.split("\n")) {
    if (/^[-*] /.test(line)) list.push(line.slice(2).trim());
    else if (list.length && /^\s+\S/.test(line)) list[list.length - 1] += ` ${line.trim()}`;
    else if (list.length && line.trim() === "") break;
  }
  if (!list.length) throw new Error(`no list in ${what}`);
  return list;
}

// the body of each fenced block of a language, in order
const fences = (text, lang) => [...text.matchAll(new RegExp("^```" + lang + "\\n([\\s\\S]*?)\\n```", "gm"))].map((m) => m[1]);

// relative links point at the file on GitHub at the release, so a link on the page never moves
const absolute = (tag) => (s) => s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text, target) => {
  if (/^(https?:|mailto:)/.test(target)) return whole;
  if (target.startsWith("#")) return `[${text}](https://github.com/${REPO}/blob/${tag}/README.md${target})`;
  const [path, frag = ""] = target.split("#");
  const kind = path.endsWith("/") || !path.split("/").pop().includes(".") ? "tree" : "blob";
  return `[${text}](https://github.com/${REPO}/${kind}/${tag}/${path.replace(/\/$/, "")}${frag ? `#${frag}` : ""})`;
});

// the marks are drawn inline, so only plain shapes and a title get through: no script, style or link
function mark(svg, path) {
  if (!svg.startsWith("<svg") || !/role="img"/.test(svg) || !/aria-label="[^"]+"/.test(svg)) {
    throw new Error(`${path} is not an SVG with a role and a label`);
  }
  for (const [, tag] of svg.matchAll(/<\/?([a-zA-Z]+)/g)) {
    if (!["svg", "title", "rect", "path", "circle", "g"].includes(tag)) throw new Error(`${path} holds a <${tag}> element`);
  }
  if (/\son\w+=|\sstyle=|href=/i.test(svg)) throw new Error(`${path} holds an event, a style or a link attribute`);
  // the page sets the size, so the file's own width and height go
  return svg.trim().replace(/^<svg([^>]*?)\swidth="\d+"\sheight="\d+"/, "<svg$1").replace(/^<svg /, '<svg class="profile-mark-svg" focusable="false" ');
}

async function sync() {
  const tag = await latestTag();
  const version = tag.slice(1);
  const cargo = await raw(tag, "Cargo.toml");
  if (!cargo.includes(`\nversion = "${version}"`)) throw new Error(`Cargo.toml at ${tag} is not version ${version}`);
  const rust = cargo.match(/\nrust-version = "([\d.]+)"/)?.[1];
  if (!rust) throw new Error(`Cargo.toml at ${tag} has no rust-version`);
  const crate = cargo.match(/\[package\]\nname = "([a-z0-9-]+)"/)?.[1];
  const bin = cargo.match(/\[\[bin\]\]\nname = "([a-z0-9-]+)"/)?.[1];
  if (!crate || !bin) throw new Error(`Cargo.toml at ${tag} has no package or binary name`);
  const licence = cargo.match(/\nlicense = "([^"]+)"/)?.[1];
  if (!licence) throw new Error(`Cargo.toml at ${tag} has no licence`);

  const readme = (await raw(tag, "README.md")).replace(/\r\n/g, "\n");
  const roadmap = await raw(tag, "ROADMAP.md");
  const link = absolute(tag);

  // the opening: the line under the logo, then the paragraph under the badges
  const head = readme.slice(readme.indexOf("</h1>") + 5, readme.indexOf("\n## "));
  const [tagline, summary] = paragraphs(head);
  if (!tagline || !summary) throw new Error("the README has no tagline and summary under its heading");

  const why = section(readme, "## Why it exists", "the README");
  const reasons = items(why, "the README's Why it exists section").map((item) => {
    const m = item.match(/^\*\*([^*]+?)\.?\*\*\s+(.+)$/);
    if (!m) throw new Error(`"${item}" in the README's reasons has no bold title`);
    return { title: m[1], text: link(m[2]) };
  });
  const problem = paragraphs(why).map(link);

  const quick = section(readme, "## Quick start", "the README");
  const [checkCommands, deriveCommands] = fences(quick, "sh");
  const [example] = fences(quick, "toml");
  if (!checkCommands || !deriveCommands || !example) throw new Error("the README's Quick start lacks its commands or its example profile");
  if (!example.includes("spec_version = 1")) throw new Error("the README's example profile has no spec_version");

  const commands = table(section(readme, "## Commands", "the README"), "the README's command table")
    .map(([command, does, exit]) => ({ command, does: link(does), exit }));
  const checked = section(readme, "## What is checked", "the README");
  const floors = table(checked, "the README's floors table").map(([floor, value, pairs]) => ({ floor, value, pairs }));
  const targets = table(section(readme, "## Targets", "the README"), "the README's targets table")
    .map(([id, app, file, sets]) => ({ id: id.replace(/`/g, ""), app, file, sets }));
  const starters = table(section(readme, "## Starter profiles", "the README"), "the README's starter profiles table")
    .map(([id, background, text, contrast]) => ({ id: id.replace(/`/g, ""), background: background.replace(/`/g, ""), text: text.replace(/`/g, ""), contrast }));
  for (const s of starters) {
    if (!/^#[0-9a-f]{6}$/i.test(s.background) || !/^#[0-9a-f]{6}$/i.test(s.text)) throw new Error(`the starter profile ${s.id} has no colours`);
  }
  const extension = paragraphs(section(readme, "## Browser extension", "the README")).map(link);
  if (!extension.length) throw new Error("the README's Browser extension section has no text");
  const later = items(section(roadmap, "## Later", "ROADMAP.md"), "ROADMAP.md's Later section").map(link);

  // the release files, from the GitHub release made from the tag. A local checkout may be ahead of
  // its newest tag, whose release does not exist yet, so a local preview keeps the committed list
  // and names each file under the local tag, as the release workflow will
  let downloads;
  if (isLocal(REPO)) {
    const committed = JSON.parse(readFileSync(join(DATA, "profile.json"), "utf8"));
    if (!committed.downloads?.length) throw new Error("src/data/profile.json has no release files to keep");
    downloads = committed.downloads.map((d) => ({ ...d, file: d.file.replace(`-${committed.tag}-`, `-${tag}-`) }));
  } else {
    const release = await (await get(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`, { headers })).json();
    const names = (release.assets ?? []).map((a) => a.name);
    downloads = names.filter((n) => !n.endsWith(".sha256")).map((file) => {
      const triple = file.match(new RegExp(`^${crate}-${tag.replace(/\./g, "\\.")}-(.+)\\.(?:tar\\.gz|zip)$`))?.[1];
      if (!triple || !SYSTEMS[triple]) throw new Error(`the release file ${file} is not a build this page knows`);
      if (!names.includes(`${file}.sha256`)) throw new Error(`the release file ${file} has no .sha256 beside it`);
      return { file, system: SYSTEMS[triple] };
    }).sort((a, b) => Object.values(SYSTEMS).indexOf(a.system) - Object.values(SYSTEMS).indexOf(b.system));
  }
  if (!downloads.length) throw new Error(`the ${tag} release has no files attached yet`);

  const marks = {
    light: mark(await raw(tag, "assets/profile-light.svg"), "assets/profile-light.svg"),
    dark: mark(await raw(tag, "assets/profile-dark.svg"), "assets/profile-dark.svg"),
  };
  const files = {};
  // the store screenshot is a real capture of the extension at work, made by npm run store:screenshot
  const shotPath = "extension/store/screenshot-1280x800.png";
  const shot = await rawBytes(REPO, tag, shotPath);
  if (shot.subarray(1, 4).toString() !== "PNG" || shot.readUInt32BE(16) !== 1280 || shot.readUInt32BE(20) !== 800) {
    throw new Error(`${shotPath} at ${tag} is not a 1280 by 800 PNG`);
  }
  files["images/screenshot.png"] = shot;

  const data = JSON.stringify({
    version, tag, rust, crate, bin, licence, tagline, summary: link(summary), problem, reasons,
    example, checkCommands, deriveCommands, commands, floors, targets, starters, extension, later, downloads, marks,
  }, null, 2) + "\n";

  // written only once everything has downloaded and parsed, so a failure never leaves a mix
  let changed = 0;
  const write = (path, body) => {
    const next = Buffer.isBuffer(body) ? body : Buffer.from(body);
    let current = null;
    try { current = readFileSync(path); } catch {}
    if (!current || !current.equals(next)) { writeFileSync(path, next); changed++; }
  };
  write(join(DATA, "profile.json"), data);
  mkdirSync(join(PUBLIC, "images"), { recursive: true });
  for (const [name, body] of Object.entries(files)) write(join(PUBLIC, name), body);
  for (const f of readdirSync(join(PUBLIC, "images"))) {
    if (!(`images/${f}` in files)) { unlinkSync(join(PUBLIC, "images", f)); changed++; }
  }
  console.log(`sync-profile: Zacess Profile ${tag}, ${targets.length} targets, ${downloads.length} release builds, ${changed ? `${changed} file(s) updated` : "already up to date"}`);
}

try {
  await sync();
} catch (error) {
  if (strict) {
    console.error(`sync-profile: ${error.message}`);
    process.exit(1);
  }
  let kept = "none";
  try { kept = JSON.parse(readFileSync(join(DATA, "profile.json"), "utf8")).version; } catch {}
  console.warn(`sync-profile: could not fetch the latest profile release (${error.message}); building with the committed copy, version ${kept}`);
}
