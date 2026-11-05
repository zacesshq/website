// checks the built site in dist: headings, internal links and fragments, writing rules, the CSP hash,
// the documentation's sidebar, code colours and search index and the contrast floors
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const DIST = new URL("../dist/", import.meta.url).pathname;
const problems = [];
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const pages = walk(DIST).filter((f) => f.endsWith(".html"));
const html = Object.fromEntries(pages.map((p) => [p, readFileSync(p, "utf8")]));

const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));

const ids = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const fileFor = (path) => {
  const clean = path.split("#")[0].split("?")[0];
  if (clean === "" ) return null;
  const p = join(DIST, clean);
  if (clean.endsWith("/")) return join(p, "index.html");
  return p;
};

let linkCount = 0;
for (const [file, src] of Object.entries(html)) {
  const name = "/" + relative(DIST, file);
  const h1 = (src.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) problems.push(`${name}: ${h1} h1 elements`);
  if (!/<title>[^<]+<\/title>/.test(src)) problems.push(`${name}: no title`);
  if (!/<meta name="description" content="[^"]+"/.test(src)) problems.push(`${name}: no description`);
  if (/target="_blank"/.test(src)) problems.push(`${name}: link opens a new tab`);
  if (/\sstyle="/.test(src)) problems.push(`${name}: inline style attribute (blocked by the CSP)`);
  if ((src.match(/<main[\s>]/g) || []).length !== 1) problems.push(`${name}: main landmark count`);

  // internal links and fragments
  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = decode(m[1]);
    if (/^(https?:|mailto:|data:)/.test(url)) continue;
    linkCount++;
    const [path, frag] = url.split("#");
    const target = path ? fileFor(path) : file;
    if (!existsSync(target)) { problems.push(`${name}: broken link ${url}`); continue; }
    if (frag && target.endsWith(".html") && !ids(html[target] ?? readFileSync(target, "utf8")).has(frag)) {
      problems.push(`${name}: missing fragment ${url}`);
    }
    if (path && path.startsWith("/") && !path.includes(".") && !path.endsWith("/")) problems.push(`${name}: link without trailing slash ${url}`);
  }

  // visible text plus the text people hear or see in attributes
  const attrs = [...src.matchAll(/\s(?:alt|aria-label|content|title)="([^"]*)"/g)].map((m) => m[1]).join("\n");
  // code is commands and characters, not prose, so each piece stands in the text as one word
  const text = decode(src.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<code[\s\S]*?<\/code>/g, " code ").replace(/<[^>]+>/g, " ") + "\n" + attrs).replace(/\s+/g, " ");
  // a documentation page's text comes from another repository, so the problem names the file to fix
  const origin = name.startsWith("/docs/") ? src.match(/<a href="(https:\/\/github\.com\/[^"]+)">Edit this page on GitHub<\/a>/)?.[1] : null;
  const fix = origin ? ` (fix it in ${origin})` : "";
  for (const [re, label] of [[/—/, "em dash"], [/–/, "en dash"], [/, and /, '", and"'], [/, or /, '", or"']]) {
    const m = text.match(new RegExp(`.{0,50}${re.source}.{0,30}`, "g"));
    if (m) m.forEach((x) => problems.push(`${name}: ${label}: ...${x.trim()}...${fix}`));
  }
}

// the bootstrap script hash must match the CSP in _headers
const headers = readFileSync(join(DIST, "_headers"), "utf8");
const inline = new Set();
for (const src of Object.values(html)) {
  for (const m of src.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
    inline.add("sha256-" + createHash("sha256").update(m[1]).digest("base64"));
  }
}
for (const h of inline) if (!headers.includes(`'${h}'`)) problems.push(`_headers: CSP lacks '${h}'`);
if (inline.size !== 1) problems.push(`expected one inline script body, found ${inline.size}`);
for (const need of ["https://static.cloudflareinsights.com", "connect-src 'self' https://cloudflareinsights.com", "script-src 'self' 'wasm-unsafe-eval'"]) {
  if (!headers.includes(need)) problems.push(`_headers: CSP lacks ${need}`);
}
const sec = join(DIST, ".well-known/security.txt");
if (!existsSync(sec)) problems.push("security.txt missing");
else for (const field of ["Contact:", "Expires:", "Canonical:", "Policy:"]) if (!readFileSync(sec, "utf8").includes(field)) problems.push(`security.txt lacks ${field}`);
for (const [file, src] of Object.entries(html)) {
  for (const page of ["/security/", "/credits/", "/privacy/", "/faq/", "/contact/", "/docs/"]) {
    if (!src.includes(`href="${page}"`)) problems.push(`/${relative(DIST, file)}: footer lacks ${page}`);
  }
}

// the canonical address of every page is a page in dist, so a build never names a page it lacks
for (const [file, src] of Object.entries(html)) {
  const canonical = src.match(/<link rel="canonical" href="https:\/\/zacess\.com([^"]+)"/)?.[1];
  if (canonical && !existsSync(fileFor(canonical))) problems.push(`/${relative(DIST, file)}: canonical ${canonical} is not a built page`);
}

// the documentation: every page carries the sidebar landmark, its code colours are all in
// /docs/code.css, it shows no image from another origin and the search index was written
const docsPages = Object.entries(html).filter(([file]) => relative(DIST, file).startsWith("docs/"));
if (!docsPages.length) problems.push("no documentation pages were built");
const codeCss = existsSync(join(DIST, "docs/code.css")) ? readFileSync(join(DIST, "docs/code.css"), "utf8") : "";
for (const [file, src] of docsPages) {
  const name = "/" + relative(DIST, file);
  if (!/<nav class="docs-nav" aria-label="Documentation">/.test(src)) problems.push(`${name}: no documentation sidebar landmark`);
  if (!/<article class="docs-article" data-pagefind-body>/.test(src)) problems.push(`${name}: no article for the search index`);
  if (/<img[^>]+src="https?:/.test(src)) problems.push(`${name}: image from another origin`);
  // a Mermaid block is drawn at sync time; one left as code would show its source instead of a diagram
  if (/language-mermaid|data-language="mermaid"/.test(src)) problems.push(`${name}: a Mermaid block was not drawn as a diagram`);
  for (const m of src.matchAll(/<figure class="diagram" role="img" aria-label="([^"]*)">/g)) {
    if (!m[1]) problems.push(`${name}: a diagram has no label`);
  }
  // every code block carries its Copy button; the script that works it is on the page
  const pres = (src.match(/<pre[\s>]/g) || []).length;
  const buttons = (src.match(/<button type="button" class="code-copy" aria-label="Copy this code">/g) || []).length;
  if (pres !== buttons) problems.push(`${name}: ${pres} code blocks but ${buttons} copy buttons`);
  if (pres && !src.includes('src="/docs-copy.js"')) problems.push(`${name}: code blocks without /docs-copy.js`);
  for (const m of src.matchAll(/\bsk-[A-Za-z0-9_-]+/g)) {
    if (!codeCss.includes(`.${m[0]}{`)) problems.push(`${name}: code class ${m[0]} is not in /docs/code.css`);
  }
}
// the product pages that carry Copy buttons: every code block has one and the script that works it
// is on the page. The profile page is held to it by name, so losing every button fails as well
for (const [file, src] of Object.entries(html)) {
  const name = "/" + relative(DIST, file);
  if (name.startsWith("/docs/") || (!src.includes('class="docs-code"') && name !== "/profile/index.html")) continue;
  const pres = (src.match(/<pre[\s>]/g) || []).length;
  const buttons = (src.match(/<button type="button" class="code-copy" aria-label="Copy this code">/g) || []).length;
  if (!pres || pres !== buttons) problems.push(`${name}: ${pres} code blocks but ${buttons} copy buttons`);
  if (!src.includes('src="/docs-copy.js"')) problems.push(`${name}: copy buttons without /docs-copy.js`);
}
for (const need of ["pagefind/pagefind.js", "pagefind/pagefind-entry.json"]) {
  if (!existsSync(join(DIST, need))) problems.push(`search index missing: ${need}`);
}

// the documentation's colours hold the contrast floors
const contrast = spawnSync(process.execPath, [new URL("./check-contrast.mjs", import.meta.url).pathname], { encoding: "utf8" });
if (contrast.status !== 0) problems.push(`check-contrast failed:\n${contrast.stdout}${contrast.stderr}`);

console.log(`${pages.length} pages (${docsPages.length} documentation), ${linkCount} internal links and assets checked, inline script hash ${[...inline].join(" ")}`);
if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("all checks passed");
