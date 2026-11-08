// copies the documentation of every Zacess product into the site before every build: one markdown
// file per page in src/content/docs, drawn from the repositories named in scripts/docs-manifest.mjs,
// plus the images those pages show in public/docs/<source>/images.
//
// Each product with releases is read at its newest vX.Y.Z tag, so the site documents what people
// can install; the reader and the community files are read at the commit the manifest pins. The
// first heading becomes the page title, badges are dropped, GitHub alerts become plain notes, links
// between pages point at their addresses on this site and every other relative link points at the
// file on GitHub at the same ref. Nothing is written until every page and image has been fetched,
// so a failure never leaves a mix of two releases.
//
//   node scripts/sync-docs.mjs            keeps the committed files if a fetch fails
//   node scripts/sync-docs.mjs --strict   fails instead, for the deploy workflow
//
// A page the manifest marks local is written in this repository under docs-src/ rather than pulled,
// for a page the product repository has no file for yet. It names the release it was checked
// against and the sync says so when a newer release is out, so the page is checked again.
//
// SCENES_TAG, GAMES_TAG, THEMES_TAG and PROFILE_TAG pin a tag, ZACESS_REF and COMMUNITY_REF a commit, and
// GITHUB_TOKEN, when set, lifts the API rate limit.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, statSync, existsSync, mkdtempSync } from "node:fs";
import { join, dirname, posix } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { latestTag, raw, rawBytes } from "./lib/release.mjs";
import { SOURCES, PAGES } from "./docs-manifest.mjs";

const CONTENT = new URL("../src/content/docs/", import.meta.url).pathname;
const SITE_REPO = "zacesshq/website";
const PUBLIC = new URL("../public/docs/", import.meta.url).pathname;
const strict = process.argv.includes("--strict");

const ALERTS = { NOTE: "Note", TIP: "Tip", IMPORTANT: "Important", WARNING: "Warning", CAUTION: "Caution" };
const MMDC = new URL("../node_modules/.bin/mmdc", import.meta.url).pathname;
// the GitHub runner's Ubuntu blocks unprivileged user namespaces, so Chromium needs the sandbox flags off
const PUPPETEER_CONFIG = new URL("./puppeteer-config.json", import.meta.url).pathname;
const THEMES = JSON.parse(readFileSync(new URL("../src/data/themes.json", import.meta.url), "utf8"));
const run = promisify(execFile);

// a Mermaid diagram cannot be drawn in the browser, since the site's security policy allows no
// inline script, so each block is drawn here once per high contrast theme with the theme's own
// colours and shown as an image; the source stays on the page as text under a disclosure
function mermaidConfig(id) {
  const ui = THEMES.themes.find((t) => t.id === id)?.ui;
  if (!ui) throw new Error(`themes.json has no ${id} theme for the diagrams`);
  return {
    theme: "base",
    securityLevel: "strict",
    // labels as SVG text rather than HTML, so the image reads the same in every browser
    htmlLabels: false,
    flowchart: { htmlLabels: false },
    themeVariables: {
      background: ui.background, primaryColor: ui.background, primaryTextColor: ui.foreground, primaryBorderColor: ui.border,
      lineColor: ui.foreground, textColor: ui.foreground, secondaryColor: ui.surface, secondaryTextColor: ui.foreground,
      secondaryBorderColor: ui.border, tertiaryColor: ui.surfaceAlt, tertiaryTextColor: ui.foreground, tertiaryBorderColor: ui.border,
      edgeLabelBackground: ui.background, clusterBkg: ui.surface, clusterBorder: ui.border, noteBkgColor: ui.surfaceAlt,
      noteTextColor: ui.foreground, noteBorderColor: ui.border, fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif", fontSize: "16px",
    },
  };
}

// the name a screen reader hears: the diagram's title where it has one, otherwise its first node
function diagramLabel(source) {
  const title = source.match(/^\s*title:?\s+(.+)$/m)?.[1]?.trim();
  if (title) return title;
  const node = source.match(/\w+\s*[\[({]+\s*"?([^"\]})]+?)"?\s*[\])}]+/)?.[1]?.trim();
  return node ? `Diagram beginning with ${node}` : "Diagram";
}

async function renderDiagrams(diagrams) {
  if (!diagrams.length) return;
  if (!existsSync(MMDC)) throw new Error("@mermaid-js/mermaid-cli is not installed, so the diagrams cannot be drawn");
  const dir = mkdtempSync(join(tmpdir(), "zacess-docs-"));
  const configs = {};
  for (const [name, id] of [["light", "high-contrast-light"], ["dark", "high-contrast-dark"]]) {
    configs[name] = join(dir, `${name}.json`);
    writeFileSync(configs[name], JSON.stringify(mermaidConfig(id)));
  }
  try {
    for (const d of diagrams) {
      const input = join(dir, "diagram.mmd");
      writeFileSync(input, d.source);
      for (const name of ["light", "dark"]) {
        const out = join(dir, `${name}.svg`);
        await run(MMDC, ["-i", input, "-o", out, "-c", configs[name], "-p", PUPPETEER_CONFIG, "-b", "transparent", "-q"]);
        d.files[name] = readFileSync(out);
      }
      const box = d.files.light.toString().match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/);
      d.width = box ? Math.round(+box[1]) : 800;
      d.height = box ? Math.round(+box[2]) : 400;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// the ref each source is read at: a release tag or the pinned commit of a repository without tags
async function resolveRefs() {
  const refs = {};
  for (const [id, source] of Object.entries(SOURCES)) {
    if (source.ref) {
      const ref = process.env[source.env]?.trim() || source.ref;
      if (!/^[0-9a-f]{7,40}$/.test(ref)) throw new Error(`${source.env} ${ref} is not a commit`);
      refs[id] = { ref, label: `main at ${ref.slice(0, 7)}`, release: null };
    } else {
      const tag = await latestTag(source.repo, source.env);
      refs[id] = { ref: tag, label: tag, release: tag.slice(1) };
    }
  }
  return refs;
}

// the lines of a heading's section: from the heading to the next one of the same or a higher level
function section(lines, heading, where) {
  const level = heading.match(/^#+/)[0].length;
  const start = lines.indexOf(heading);
  if (start < 0) throw new Error(`${where} has no "${heading}" section`);
  const out = [];
  let fence = false;
  for (const line of lines.slice(start + 1)) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const m = !fence && line.match(/^(#+) /);
    if (m && m[1].length <= level) break;
    out.push(line);
  }
  return out;
}

const isBadge = (line) => /^\s*(\[?!\[[^\]]*\]\([^)]*\)\]?(\([^)]*\))?\s*)+$/.test(line) && /shields\.io|badge\.svg/.test(line);

// markdown stripped to its words, for the description
const plain = (s) => s
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[`*_]/g, "")
  .replace(/\s+/g, " ")
  .trim();

// the first paragraph, cut at a sentence end where one falls in its first 160 characters; a page
// that opens with a list takes its first item instead
function describe(lines, title) {
  const para = [];
  let fence = false;
  let firstItem = "";
  for (const line of lines) {
    if (/^(```|~~~)/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    const item = line.match(/^\s*(?:[-*]|\d+\.) (.*)$/);
    if (item && !firstItem) firstItem = item[1];
    const skip = /^\s*$/.test(line) || /^(\s|#|>|[-*] |\d+\. |\||!\[)/.test(line);
    if (skip && para.length) break;
    if (!skip) para.push(line);
  }
  let text = plain(para.join(" ")) || plain(firstItem) || `${title}, from the Zacess documentation.`;
  if (text.length > 160) {
    const cut = text.slice(0, 160);
    const sentence = cut.lastIndexOf(". ");
    text = sentence > 60 ? cut.slice(0, sentence + 1) : cut.slice(0, cut.lastIndexOf(" "));
  }
  return text.replace(/[,;:]$/, "");
}

// a relative path in the repository, resolved from the page's own folder
const resolvePath = (from, target) => posix.normalize(posix.join(posix.dirname(from), target)).replace(/^\.\//, "");

function transform(markdown, page, refs, pagesByFile) {
  const source = SOURCES[page.source];
  const { ref } = refs[page.source];
  const where = `${source.repo} ${page.path} at ${ref}`;
  let lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (page.heading) lines = section(lines, page.heading, where);

  // the title: the first heading of a whole file, the manifest's name for a section of one
  let title = page.title;
  const first = lines.findIndex((l) => /^# /.test(l));
  if (!page.heading && first >= 0) {
    title ??= lines[first].slice(2).trim();
    lines.splice(first, 1);
  }
  if (!title) throw new Error(`${where} has no heading to take a title from`);

  const images = new Map();
  const diagrams = [];
  const out = [];
  let fence = false;
  let mermaid = null;
  let levels = [];
  for (let line of lines) {
    if (mermaid) {
      if (/^(```|~~~)/.test(line)) {
        const n = diagrams.length + 1;
        const base = `/docs/${page.source}/images/diagrams/${page.slug.replace(/\//g, "-")}-${n}`;
        const d = { source: mermaid.join("\n"), base, files: {}, width: 0, height: 0 };
        diagrams.push(d);
        out.push(`<!--diagram ${n}-->`, "", "<details class=\"diagram-source\">", "<summary>Diagram source, as text</summary>", "", "```text", ...mermaid, "```", "", "</details>");
        mermaid = null;
      } else {
        mermaid.push(line);
      }
      continue;
    }
    if (/^(```|~~~)\s*mermaid\s*$/.test(line)) { mermaid = []; continue; }
    if (/^(```|~~~)/.test(line)) { fence = !fence; out.push(line); continue; }
    if (fence) { out.push(line); continue; }
    if (isBadge(line)) continue;
    const alert = line.match(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/);
    if (alert) { out.push(`> **${ALERTS[alert[1]]}**`, ">"); continue; }
    const h = line.match(/^(#+) /);
    if (h) levels.push(h[1].length);

    // links and images: between pages by their address here, otherwise to GitHub at the same ref
    line = line.replace(/(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, bang, text, target, titleAttr) => {
      if (/^(https?:|mailto:|#|data:|\/)/.test(target)) return whole;
      const [path, frag = ""] = target.split("#");
      const resolved = resolvePath(page.path, decodeURI(path));
      if (bang) {
        const rel = resolved.replace(/^docs\/images\//, "");
        const href = `/docs/${page.source}/images/${rel}`;
        images.set(resolved, href);
        return `![${text}](${href}${titleAttr})`;
      }
      const local = pagesByFile.get(`${page.source}:${resolved}`);
      if (local) return `[${text}](/docs/${local.slug}/${frag ? `#${frag}` : ""}${titleAttr})`;
      const kind = path.endsWith("/") || !posix.basename(resolved).includes(".") ? "tree" : "blob";
      return `[${text}](https://github.com/${source.repo}/${kind}/${ref}/${resolved}${frag ? `#${frag}` : ""}${titleAttr})`;
    });
    if (/!\[[^\]]*\]\(https?:/.test(line)) throw new Error(`${where} shows a remote image, which the site's security policy blocks`);
    out.push(line);
  }

  // a second top-level heading becomes a section heading; a section of a file starts at level two
  const min = Math.min(...levels.filter((l) => l > 1), Infinity);
  const shift = Number.isFinite(min) && min > 2 ? min - 2 : 0;
  fence = false;
  const body = out.map((line) => {
    if (/^(```|~~~)/.test(line)) { fence = !fence; return line; }
    if (fence) return line;
    const h = line.match(/^(#+) (.*)$/);
    if (!h) return line;
    const level = h[1].length === 1 ? 2 : Math.max(2, h[1].length - shift);
    return `${"#".repeat(level)} ${h[2]}`;
  }).join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

  return { title, description: describe(out, title), body, images, diagrams };
}

// the figure for each diagram, once its images are drawn and measured
function placeDiagrams(body, diagrams) {
  return body.replace(/<!--diagram (\d+)-->/g, (_, n) => {
    const d = diagrams[+n - 1];
    const label = escapeHtml(diagramLabel(d.source));
    return [
      `<figure class="diagram" role="img" aria-label="${label}">`,
      `<img class="diagram-light" src="${d.base}-light.svg" alt="" width="${d.width}" height="${d.height}">`,
      `<img class="diagram-dark" src="${d.base}-dark.svg" alt="" width="${d.width}" height="${d.height}">`,
      "</figure>",
    ].join("\n");
  });
}

const yaml = (v) => JSON.stringify(v);

function frontmatter(page, meta, refs) {
  const source = SOURCES[page.source];
  const { ref, label, release } = page.local
    ? { ref: page.checked, label: page.checked, release: page.checked.slice(1) }
    : refs[page.source];
  const order = PAGES.indexOf(page);
  const fields = [
    `title: ${yaml(meta.title)}`,
    `description: ${yaml(meta.description)}`,
    `section: ${yaml(page.section)}`,
    page.group ? `group: ${yaml(page.group)}` : null,
    `order: ${order}`,
    `product: ${yaml(source.name)}`,
    `source: ${yaml(page.source)}`,
    `repo: ${yaml(source.repo)}`,
    `ref: ${yaml(ref)}`,
    `refLabel: ${yaml(label)}`,
    release ? `release: ${yaml(release)}` : null,
    `path: ${yaml(page.local ?? page.path)}`,
    page.heading ? `heading: ${yaml(page.heading.replace(/^#+ /, ""))}` : null,
    `sourceUrl: ${yaml(page.local ? `https://github.com/${SITE_REPO}/blob/main/${page.local}` : `https://github.com/${source.repo}/blob/${ref}/${page.path}`)}`,
  ].filter(Boolean);
  return `---\n${fields.join("\n")}\n---\n\n`;
}

const walk = (dir) => (existsSync(dir) ? readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
}) : []);

async function sync() {
  const refs = await resolveRefs();
  const pagesByFile = new Map(PAGES.filter((p) => !p.heading && !p.local).map((p) => [`${p.source}:${p.path}`, p]));

  const files = new Map();
  const skipped = [];
  const notes = [];
  const pending = [];
  for (const page of PAGES) {
    const source = SOURCES[page.source];
    const { ref } = refs[page.source];
    let markdown;
    if (page.local) {
      if (!page.checked || !/^v\d+\.\d+\.\d+$/.test(page.checked)) throw new Error(`${page.slug} is local but names no release it was checked against`);
      markdown = readFileSync(new URL(`../${page.local}`, import.meta.url), "utf8");
      if (page.checked !== ref) notes.push(`${page.slug} was checked against ${source.name} ${page.checked} and the newest release is ${ref}, so check ${page.local} again`);
      const meta = transform(markdown, page, refs, pagesByFile);
      pending.push({ page, meta });
      continue;
    }
    try {
      markdown = await raw(source.repo, ref, page.path);
    } catch (error) {
      if (page.optional && /answered 404$/.test(error.message)) {
        skipped.push(`${page.slug} (${page.path} is not in ${source.repo} at ${refs[page.source].label} yet)`);
        continue;
      }
      throw error;
    }
    const meta = transform(markdown, page, refs, pagesByFile);
    pending.push({ page, meta });
    for (const [path, href] of meta.images) {
      const dest = join(PUBLIC, href.replace(/^\/docs\//, ""));
      if (files.has(dest)) continue;
      files.set(dest, await rawBytes(source.repo, ref, path));
    }
  }

  const diagrams = pending.flatMap(({ meta }) => meta.diagrams);
  await renderDiagrams(diagrams);
  for (const { page, meta } of pending) {
    files.set(join(CONTENT, `${page.slug}.md`), frontmatter(page, meta, refs) + placeDiagrams(meta.body, meta.diagrams));
    for (const d of meta.diagrams) {
      for (const name of ["light", "dark"]) files.set(join(PUBLIC, `${d.base}-${name}.svg`.replace(/^\/docs\//, "")), d.files[name]);
    }
  }

  // written only once everything has downloaded, so a failure never leaves a mix
  let changed = 0;
  for (const [path, body] of files) {
    mkdirSync(dirname(path), { recursive: true });
    let current = null;
    try { current = readFileSync(path); } catch {}
    const next = Buffer.isBuffer(body) ? body : Buffer.from(body);
    if (!current || !current.equals(next)) { writeFileSync(path, next); changed++; }
  }
  // pages and images a newer release dropped go, so the site never shows a page that no longer exists
  for (const dir of [CONTENT, PUBLIC]) {
    for (const f of walk(dir)) {
      if (!files.has(f)) { rmSync(f); changed++; }
    }
  }
  const sources = Object.entries(refs).map(([id, r]) => `${SOURCES[id].name === "Zacess" ? id : SOURCES[id].name} ${r.label}`).join(", ");
  console.log(`sync-docs: ${pending.length} pages and ${diagrams.length} diagrams from ${sources}, ${changed ? `${changed} file(s) updated` : "already up to date"}`);
  for (const s of skipped) console.log(`sync-docs: skipped ${s}`);
  for (const n of notes) console.log(`sync-docs: ${n}`);
}

try {
  await sync();
} catch (error) {
  if (strict) {
    console.error(`sync-docs: ${error.message}`);
    process.exit(1);
  }
  const kept = walk(CONTENT).filter((f) => f.endsWith(".md")).length;
  console.warn(`sync-docs: could not fetch the documentation (${error.message}); building with the committed copy, ${kept} page(s)`);
}
