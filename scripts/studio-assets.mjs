// builds the studio's asset tree from local builds of Zacess Scenes, Zacess Games and Zacess Profile,
// then records in src/data/studio-manifest.json which theme and item pairs exist. The tree has the
// same layout wherever it is served from, so the folder this writes can be served by the site as it
// is or copied as it is to a bucket, with only the manifest's "base" changed:
//
//   <base>/scenes/<theme>/<scene>.json          JSON frames from zacess-scenes snapshot --frames
//   <base>/stills/scenes/<theme>/<scene>.svg    the still from zacess-scenes snapshot
//   <base>/games/<theme>/<game>.json            JSON frames from zacess-games snap --frames
//   <base>/games/<theme>/<game>.svg             the still from zacess-games snap
//   <base>/profile/<profile>.json               a starter profile as JSON, with the zprf check output
//
// the frame format is the one the release pages already play: width, height, fps, background and a
// list of runs per frame. The studio reads only the files the manifest lists, so a partial tree is
// fine: anything missing falls back to the release recordings in Deep Contrast Dark.
//
//   node scripts/studio-assets.mjs --sample        3 scenes and 2 games in 3 themes, to prove the pipeline
//   node scripts/studio-assets.mjs                 every scene and game in all ten themes
//   node scripts/studio-assets.mjs --dry-run       prints the commands without running them
//
// options: --themes a,b --scenes a,b --games a,b (or all), --out DIR, --manifest FILE,
// --scene-frames N --scene-fps N --game-frames N --game-fps N --size WxH, --jobs N,
// --scenes-bin FILE --games-bin FILE --zprf-bin FILE (also ZACESS_SCENES_BIN, ZACESS_GAMES_BIN and
// ZPRF_BIN, otherwise each name on the PATH) and --profiles DIR (default ../profile/profiles).
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const THEMES = ["light", "dark", "yellow-on-black", "cream", "high-contrast-dark", "high-contrast-light", "deep-contrast-dark", "deep-contrast-light", "warm-dark", "warm-light"];
const SAMPLE = { themes: ["deep-contrast-dark", "warm-dark", "cream"], scenes: ["koi-pond", "lanterns", "fog"], games: ["drift", "stackline"] };

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const option = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`--${name} needs a value`);
  return value;
};
const list = (name, fallback) => {
  const value = option(name, null);
  if (value === null) return fallback;
  return value === "all" ? "all" : value.split(",").map((s) => s.trim()).filter(Boolean);
};
const number = (name, fallback, low, high) => {
  const n = Number(option(name, fallback));
  if (!Number.isInteger(n) || n < low || n > high) throw new Error(`--${name} takes a whole number from ${low} to ${high}`);
  return n;
};

const sample = flag("sample");
const dry = flag("dry-run");
const out = resolve(ROOT, option("out", "public/studio-assets"));
const manifestPath = resolve(ROOT, option("manifest", "src/data/studio-manifest.json"));
const themes = list("themes", sample ? SAMPLE.themes : THEMES);
const wantScenes = list("scenes", sample ? SAMPLE.scenes : "all");
const wantGames = list("games", sample ? SAMPLE.games : "all");
const size = option("size", "80x24");
if (!/^\d+x\d+$/.test(size)) throw new Error("--size takes WIDTHxHEIGHT, such as 80x24");
const sceneFrames = number("scene-frames", 72, 1, 3600);
const sceneFps = number("scene-fps", 12, 1, 30);
const gameFrames = number("game-frames", 70, 1, 3600);
const gameFps = number("game-fps", 10, 1, 30);
const jobs = number("jobs", 4, 1, 32);
const bins = {
  scenes: option("scenes-bin", process.env.ZACESS_SCENES_BIN || "zacess-scenes"),
  games: option("games-bin", process.env.ZACESS_GAMES_BIN || "zacess-games"),
  zprf: option("zprf-bin", process.env.ZPRF_BIN || "zprf"),
};
const profilesDir = resolve(ROOT, option("profiles", "../profile/profiles"));
for (const t of themes === "all" ? [] : themes) if (!THEMES.includes(t)) throw new Error(`no theme called "${t}"; the themes are ${THEMES.join(", ")}`);
const themeList = themes === "all" ? THEMES : themes;

// runs a command and resolves with its output; a failing command rejects with its error text
function run(cmd, args, { allowFail = false } = {}) {
  return new Promise((done, fail) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", (e) => fail(new Error(`${cmd} could not start (${e.message}); pass --${Object.keys(bins).find((k) => bins[k] === cmd) ?? "bin"}-bin`)));
    child.on("close", (code) => {
      if (code === 0 || allowFail) done({ code, stdout, stderr });
      else fail(new Error(`${basename(cmd)} ${args.join(" ")} exited ${code}: ${stderr.trim() || stdout.trim()}`));
    });
  });
}

// a small pool, so a full run of hundreds of recordings keeps a few going at once
async function pool(tasks, width) {
  const failures = [];
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const task = tasks[next++];
      try { await task(); } catch (e) { failures.push(e.message); console.error(`  failed: ${e.message}`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(width, tasks.length) }, worker));
  return failures;
}

// a recording is only kept when it parses and has frames, so the studio never fetches a broken file
function checkFrames(path) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(json.frames) || !json.frames.length || !json.fps || !json.width || !json.height) throw new Error(`${path} has no frames`);
}

// the subset of TOML the starter profiles use: tables, strings, numbers, booleans and arrays that
// may run over several lines. Anything else stops the run rather than being guessed
function parseToml(text, source) {
  const result = {};
  let table = result;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const header = line.match(/^\[([A-Za-z0-9_.-]+)\]$/);
    if (header) {
      table = result;
      for (const part of header[1].split(".")) table = table[part] ??= {};
      continue;
    }
    const pair = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!pair) throw new Error(`${source}:${i + 1}: cannot read "${line}"`);
    let value = pair[2];
    if (value.startsWith("[")) {
      while (!balanced(value) && i + 1 < lines.length) value += "\n" + lines[++i];
    }
    table[pair[1]] = parseValue(stripComment(value), `${source}:${i + 1}`);
  }
  return result;
}
function balanced(text) {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) { if (c === "\\") i++; else if (c === '"') inString = false; continue; }
    if (c === '"') inString = true;
    else if (c === "#") { const end = text.indexOf("\n", i); if (end < 0) break; i = end; }
    else if (c === "[") depth++;
    else if (c === "]") depth--;
  }
  return depth === 0;
}
function stripComment(text) {
  let inString = false;
  let outText = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) { outText += c; if (c === "\\") outText += text[++i]; else if (c === '"') inString = false; continue; }
    if (c === '"') { inString = true; outText += c; continue; }
    if (c === "#") { const end = text.indexOf("\n", i); if (end < 0) break; i = end - 1; continue; }
    outText += c;
  }
  return outText.trim();
}
function parseValue(text, where) {
  if (text === "true" || text === "false") return text === "true";
  if (/^[-+]?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (/^"([^"\\]|\\.)*"$/.test(text) || text.startsWith("[")) {
    try { return JSON.parse(text.replace(/,\s*\]/g, "]")); } catch { /* falls through to the error below */ }
  }
  throw new Error(`${where}: cannot read the value ${text}`);
}

async function sceneCatalogue() {
  const { stdout } = await run(bins.scenes, ["list"]);
  const scenes = [];
  // the scene table ends where the sound sets begin, so a set's line is never read as a scene
  for (const line of stdout.split(/\nSound sets/)[0].split("\n")) {
    // the kind is the second column; a kind added later is kept as it is rather than dropped
    const m = line.match(/^ {2}([a-z0-9-]+)\s+([a-z]+)\s{2,}(.+)$/);
    if (m) scenes.push({ id: m[1], kind: m[2], description: m[3].trim() });
  }
  if (!scenes.length) throw new Error(`${bins.scenes} list printed no scenes`);
  return scenes;
}

async function gameCatalogue() {
  const { stdout } = await run(bins.games, ["list"]);
  const games = [];
  for (const line of stdout.split("\n")) {
    const m = line.match(/^([a-z0-9-]+)\s+(.+?)\s{2,}/);
    if (m) games.push({ id: m[1], summary: m[2].trim() });
  }
  if (!games.length) throw new Error(`${bins.games} list printed no games`);
  return games;
}

function pick(want, catalogue, what) {
  if (want === "all") return catalogue.map((c) => c.id);
  for (const id of want) if (!catalogue.some((c) => c.id === id)) throw new Error(`${bins[what]} has no ${what.slice(0, -1)} called "${id}"`);
  return want;
}

// what is on disk decides what the manifest lists, so a run that stopped part way leaves a true manifest
function scan() {
  const found = { scenes: {}, sceneStills: {}, games: {}, gameStills: {}, profile: [] };
  const ids = (dir, ext) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length)).sort() : []);
  for (const t of THEMES) {
    const add = (key, dir, ext) => { const got = ids(dir, ext); if (got.length) found[key][t] = got; };
    add("scenes", join(out, "scenes", t), ".json");
    add("sceneStills", join(out, "stills", "scenes", t), ".svg");
    add("games", join(out, "games", t), ".json");
    add("gameStills", join(out, "games", t), ".svg");
  }
  found.profile = ids(join(out, "profile"), ".json");
  return found;
}

function bytes(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).reduce((n, f) => {
    const p = join(dir, f);
    const s = statSync(p);
    return n + (s.isDirectory() ? bytes(p) : s.size);
  }, 0);
}

async function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const scenesCat = wantScenes.length === 0 ? [] : await sceneCatalogue();
  const gamesCat = wantGames.length === 0 ? [] : await gameCatalogue();
  const scenes = pick(wantScenes, scenesCat, "scenes");
  const games = pick(wantGames, gamesCat, "games");
  const tasks = [];
  const say = (cmd, args) => console.log(`  ${basename(cmd)} ${args.join(" ")}`);
  const exec = async (cmd, args) => { if (dry) say(cmd, args); else await run(cmd, args); };

  for (const t of themeList) {
    for (const id of scenes) {
      tasks.push(async () => {
        const frames = join(out, "scenes", t, `${id}.json`);
        const still = join(out, "stills", "scenes", t, `${id}.svg`);
        if (!dry) { mkdirSync(dirname(frames), { recursive: true }); mkdirSync(dirname(still), { recursive: true }); }
        await exec(bins.scenes, ["snapshot", id, "--theme", t, "--size", size, "--frames", String(sceneFrames), "--fps", String(sceneFps), "--out", frames]);
        await exec(bins.scenes, ["snapshot", id, "--theme", t, "--size", size, "--out", still]);
        if (!dry) checkFrames(frames);
      });
    }
    for (const id of games) {
      tasks.push(async () => {
        const dir = join(out, "games", t);
        // snap names its still <game>-<short theme>.svg, so it is written to a scratch folder and renamed
        const scratch = dry ? join(tmpdir(), "studio") : mkdtempSync(join(tmpdir(), "studio-"));
        if (!dry) mkdirSync(dir, { recursive: true });
        await exec(bins.games, ["snap", id, "--theme", t, "--size", size, "--frames", String(gameFrames), "--fps", String(gameFps), "--out", dir]);
        await exec(bins.games, ["snap", id, "--theme", t, "--out", scratch]);
        if (dry) return;
        const svg = readdirSync(scratch).find((f) => f.startsWith(`${id}-`) && f.endsWith(".svg"));
        if (!svg) throw new Error(`zacess-games snap ${id} wrote no still`);
        renameSync(join(scratch, svg), join(dir, `${id}.svg`));
        rmSync(scratch, { recursive: true, force: true });
        checkFrames(join(dir, `${id}.json`));
      });
    }
  }

  // the starter profiles: the TOML as written, parsed for the preview, with what zprf check says of it
  const profiles = existsSync(profilesDir) ? readdirSync(profilesDir).filter((f) => f.endsWith(".toml")).sort() : [];
  if (!profiles.length) console.warn(`studio-assets: no starter profiles in ${profilesDir}; pass --profiles`);
  for (const file of profiles) {
    tasks.push(async () => {
      const path = join(profilesDir, file);
      const toml = readFileSync(path, "utf8");
      const parsed = parseToml(toml, file);
      const id = parsed.id ?? file.replace(/\.toml$/, "");
      if (dry) { say(bins.zprf, ["check", `profiles/${file}`]); return; }
      let check = null;
      try {
        const r = await run(bins.zprf, ["check", path], { allowFail: true });
        // the path printed is the one on this machine, so it is shown as the repository path instead
        const text = (r.stdout + r.stderr).split(path).join(`profiles/${file}`).trimEnd();
        check = { command: `zprf check profiles/${file}`, output: text, passed: r.code === 0 };
      } catch (e) {
        console.warn(`studio-assets: ${e.message}; ${file} is written without a check`);
      }
      const json = { id, name: parsed.name, description: parsed.description, appearance: parsed.appearance, needs: parsed.needs ?? {}, palette: parsed.palette ?? {}, file: `profiles/${file}`, toml, check };
      mkdirSync(join(out, "profile"), { recursive: true });
      writeFileSync(join(out, "profile", `${id}.json`), JSON.stringify(json) + "\n");
    });
  }

  console.log(`studio-assets: ${scenes.length} scenes and ${games.length} games in ${themeList.length} themes, ${profiles.length} profiles, into ${out}${dry ? " (dry run)" : ""}`);
  const failures = await pool(tasks, dry ? 1 : jobs);
  if (dry) return;

  const found = scan();
  const generated = new Set(Object.values(found.scenes).flat());
  manifest.available = found;
  // descriptions for scenes newer than the release the site syncs, so the studio can name them
  manifest.catalogue = {
    scenes: scenesCat.filter((s) => generated.has(s.id)),
    games: gamesCat.filter((g) => Object.values(found.games).flat().includes(g.id)),
  };
  manifest.recording = {
    scenes: { size, frames: sceneFrames, fps: sceneFps },
    games: { size, frames: gameFrames, fps: gameFps },
  };
  manifest.generated = new Date().toISOString().slice(0, 10);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`studio-assets: ${(bytes(out) / 1048576).toFixed(1)} MB in ${out}; manifest updated`);
  if (failures.length) {
    console.error(`studio-assets: ${failures.length} item(s) failed`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`studio-assets: ${e.message}`);
  process.exit(1);
});
