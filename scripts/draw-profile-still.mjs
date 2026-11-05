// draws the homepage card still for Zacess Profile: a terminal in Zacess Deep Contrast Dark showing
// real zprf check output, at the size and in the style of the games stills. Unlike the other stills
// the profile repository makes none, so this one is drawn here from a real run of the installed zprf
// and committed. Run it by hand after a profile release; it refuses a zprf whose version differs
// from src/data/profile.json, so the picture always shows the release the site describes.
//
//   node scripts/draw-profile-still.mjs
//
// PROFILES_DIR names the starter profiles to run against; it defaults to the ones Homebrew installs.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = new URL("../public/profile/stills/check-deep-dark.svg", import.meta.url).pathname;
const data = JSON.parse(readFileSync(new URL("../src/data/profile.json", import.meta.url), "utf8"));

const version = execFileSync("zprf", ["--version"], { encoding: "utf8" }).trim();
if (version !== `zprf ${data.version}`) throw new Error(`${version} is installed but the site describes zprf ${data.version}`);
const brew = spawnSync("brew", ["--prefix"], { encoding: "utf8" }).stdout?.trim();
const source = process.env.PROFILES_DIR || (brew && join(brew, "share/zacess-profile/profiles"));
if (!source) throw new Error("set PROFILES_DIR to the starter profiles folder");

// the colours of Zacess Deep Contrast Dark, as the games stills draw them
const BG = "#000000";
const TEXT = "#ffffff";
const MUTED = "#b3b3b3";
const ACCENT = "#00ffff";
const FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,'DejaVu Sans Mono',monospace";
const COLS = 100;
const CELL = 8.4;
const ROW = 17;
const WIDTH = 868;
const HEIGHT = 568;

// a starter profile that passes, then a copy with its comment colour dimmed, so a named failure shows
const dir = mkdtempSync(join(tmpdir(), "zprf-still-"));
const lines = [];
try {
  mkdirSync(join(dir, "profiles"));
  cpSync(source, join(dir, "profiles"), { recursive: true });
  const starter = "profiles/zacess-deep-contrast-dark.toml";
  const dim = readFileSync(join(dir, starter), "utf8").replace(/^comment = "#[0-9a-f]{6}"/m, 'comment = "#555555"');
  if (!dim.includes('comment = "#555555"')) throw new Error(`${starter} has no comment colour to dim`);
  writeFileSync(join(dir, "dim-comments.toml"), dim);
  for (const file of [starter, "dim-comments.toml"]) {
    const run = spawnSync("zprf", ["check", file], { cwd: dir, encoding: "utf8" });
    lines.push({ prompt: true, text: `zprf check ${file}` });
    for (const l of (run.stdout + run.stderr).trimEnd().split("\n")) {
      // a terminal wraps a long line at its width, so the still does too
      for (let i = 0; i < Math.max(l.length, 1); i += COLS) lines.push({ text: l.slice(i, i + COLS) });
    }
    lines.push({ text: "" });
  }
  lines.push({ prompt: true, text: "" });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
if (lines.length > 30) throw new Error(`the output is ${lines.length} rows, more than the 30 the still holds`);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const text = (x, y, fill, s) => s ? `<text x="${+x.toFixed(2)}" y="${y}" fill="${fill}" textLength="${+(s.length * CELL).toFixed(2)}" lengthAdjust="spacingAndGlyphs">${esc(s)}</text>` : "";
const rows = lines.map((l, i) => {
  const y = 57 + i * ROW;
  // leading spaces become an offset, since a renderer may trim them from a text element
  const lead = l.text.length - l.text.trimStart().length;
  if (!l.prompt) return text(14 + lead * CELL, y, TEXT, l.text.trim());
  return text(14, y, ACCENT, "$") + text(14 + 2 * CELL, y, TEXT, l.text);
}).filter(Boolean);

const label = "zprf check in Zacess Deep Contrast Dark: the Deep Contrast Dark starter profile passes 224 pairs, then a copy with a dim comment colour fails, each failing pair named with its colours, its ratio and the floor it missed";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${label}">
<title>${label}</title>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="10" fill="${BG}" stroke="${MUTED}"/>
<line x1="0.5" y1="30" x2="${WIDTH - 0.5}" y2="30" stroke="${MUTED}"/>
<circle cx="18" cy="15" r="5" fill="#ff5f5f"/>
<circle cx="34" cy="15" r="5" fill="#cdcd00"/>
<circle cx="50" cy="15" r="5" fill="#00cd00"/>
<text x="${WIDTH / 2}" y="19.5" fill="${TEXT}" font-family="${FONT}" font-size="13" text-anchor="middle">zprf</text>
<g font-family="${FONT}" font-size="14" xml:space="preserve">
${rows.join("\n")}
</g>
</svg>
`;
mkdirSync(new URL("../public/profile/stills/", import.meta.url).pathname, { recursive: true });
writeFileSync(OUT, svg);
console.log(`draw-profile-still: ${version}, ${lines.length} rows written to public/profile/stills/check-deep-dark.svg`);
