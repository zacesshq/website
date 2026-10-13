// checks the built site in dist: headings, internal links and fragments, writing rules, the CSP hash
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";

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
  const text = decode(src.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ") + "\n" + attrs).replace(/\s+/g, " ");
  for (const [re, label] of [[/—/, "em dash"], [/–/, "en dash"], [/, and /, '", and"'], [/, or /, '", or"']]) {
    const m = text.match(new RegExp(`.{0,50}${re.source}.{0,30}`, "g"));
    if (m) m.forEach((x) => problems.push(`${name}: ${label}: ...${x.trim()}...`));
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
for (const need of ["https://static.cloudflareinsights.com", "connect-src 'self' https://cloudflareinsights.com"]) {
  if (!headers.includes(need)) problems.push(`_headers: CSP lacks ${need}`);
}
const sec = join(DIST, ".well-known/security.txt");
if (!existsSync(sec)) problems.push("security.txt missing");
else for (const field of ["Contact:", "Expires:", "Canonical:", "Policy:"]) if (!readFileSync(sec, "utf8").includes(field)) problems.push(`security.txt lacks ${field}`);
for (const [file, src] of Object.entries(html)) {
  for (const page of ["/security/", "/credits/", "/privacy/", "/faq/", "/contact/"]) {
    if (!src.includes(`href="${page}"`)) problems.push(`/${relative(DIST, file)}: footer lacks ${page}`);
  }
}

console.log(`${pages.length} pages, ${linkCount} internal links and assets checked, inline script hash ${[...inline].join(" ")}`);
if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("all checks passed");
