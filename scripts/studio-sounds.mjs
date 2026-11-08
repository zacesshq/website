// exports the studio's sounds from local builds of Zacess Scenes and Zacess Games: the background
// loops, every tone in every sound set, each game's music and effects. The programs synthesise each
// sound into a WAV file in their cache folder before handing it to the system's player, so they are
// run with a scratch cache folder and a stand-in player that exits at once. Each WAV is then turned
// into a small AAC file with afconvert (macOS). Everything is made at volume 100; the studio applies
// each kind's default level, so the balance between them matches the programs.
//
//   node scripts/studio-sounds.mjs                 writes public/studio-assets/sounds and the manifest
//   node scripts/studio-sounds.mjs --dry-run       lists what it would make
//
// options: --out DIR, --manifest FILE, --scenes-bin FILE --games-bin FILE (also ZACESS_SCENES_BIN
// and ZACESS_GAMES_BIN, otherwise each name on the PATH) and --scenes-repo DIR --games-repo DIR for
// the tables that say which loop plays under each scene and game (default ../scenes and ../games).
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i < 0 ? fallback : argv[i + 1];
};
const dry = argv.includes("--dry-run");
const out = resolve(ROOT, option("out", "public/studio-assets/sounds"));
const manifestPath = resolve(ROOT, option("manifest", "src/data/studio-manifest.json"));
const scenesBin = option("scenes-bin", process.env.ZACESS_SCENES_BIN || "zacess-scenes");
const gamesBin = option("games-bin", process.env.ZACESS_GAMES_BIN || "zacess-games");
const scenesRepo = resolve(ROOT, option("scenes-repo", "../scenes"));
const gamesRepo = resolve(ROOT, option("games-repo", "../games"));

const SETS = ["bells", "marimba", "kalimba", "pad", "chip", "glass", "piano", "rain"];
const EVENTS = ["pass", "fail", "tick", "recovered", "still_failing", "warnings", "typo", "clean", "stopped"];

// which loop plays under each scene, from the table in the Scenes sound guide; a scene not named
// there plays the night bed, as the program does
function sceneAmbience() {
  const text = readFileSync(join(scenesRepo, "docs/sounds.md"), "utf8");
  const map = {};
  let names = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\| `([a-z]+)`: ([^|]+) \| (.+) \|$/);
    if (!m) continue;
    names.push({ id: m[1], summary: m[2].trim() });
    for (const scene of m[3].matchAll(/`([a-z0-9-]+)`/g)) map[scene[1]] = m[1];
  }
  if (names.length !== 10) throw new Error(`expected ten background sounds in docs/sounds.md, found ${names.length}`);
  return { map, names };
}

// which loop plays under each game, from the match in src/background.rs
function gameAmbience() {
  const text = readFileSync(join(gamesRepo, "src/background.rs"), "utf8");
  const map = {};
  for (const m of text.matchAll(/^\s+((?:"[a-z-]+"(?: \| )?)+) => Ambience::(\w+),$/gm)) {
    for (const id of m[1].matchAll(/"([a-z-]+)"/g)) map[id[1]] = m[2].toLowerCase();
  }
  if (Object.keys(map).length !== 14) throw new Error(`expected fourteen games in src/background.rs, found ${Object.keys(map).length}`);
  return map;
}

const work = mkdtempSync(join(tmpdir(), "zacess-sounds-"));
const cache = join(work, "cache");
const fake = join(work, "bin");
mkdirSync(fake, { recursive: true });
for (const name of ["afplay", "pw-play", "paplay", "aplay"]) {
  writeFileSync(join(fake, name), "#!/bin/sh\nexit 0\n");
  chmodSync(join(fake, name), 0o755);
}
const config = join(work, "scenes.toml");
writeFileSync(config, "[ambient]\nvolume = 100\n");
const env = {
  ...process.env,
  PATH: `${fake}:${process.env.PATH}`,
  XDG_CACHE_HOME: cache,
  ZACESS_CONFIG: config,
  ZACESS_VOLUME: "100",
  ZACESS_GAMES_STATE: join(work, "games-state"),
  ZACESS_SOUND: "1",
};
const run = (bin, args) => execFileSync(bin, args, { env, stdio: ["ignore", "pipe", "pipe"] }).toString();

const { map: scenes, names: ambiences } = sceneAmbience();
const games = gameAmbience();
console.log(`${ambiences.length} background sounds, ${SETS.length} sets of ${EVENTS.length} tones, ${Object.keys(games).length} games`);
if (dry) process.exit(0);

console.log(run(scenesBin, ["--version"]).trim(), "|", run(gamesBin, ["--version"]).trim());
run(scenesBin, ["sounds", "ambient"]);
for (const set of SETS) for (const event of EVENTS) run(scenesBin, ["sounds", "play", set, event]);
// the games preview sleeps eight seconds per game for the music whatever the player does
run(gamesBin, ["sounds", "--volume", "100", "--music-volume", "100", "--background-volume", "100"]);

const pick = (dir, pattern) => {
  const found = readdirSync(dir).filter((f) => pattern.test(f));
  if (found.length !== 1) throw new Error(`${dir}: ${found.length} files match ${pattern}`);
  return join(dir, found[0]);
};
const sc = join(cache, "zacess-scenes");
const gc = join(cache, "zacess-games");
const jobs = [];
for (const a of ambiences) jobs.push([pick(sc, new RegExp(`^ambient-${a.id}-v100-`)), `ambient/${a.id}.m4a`]);
for (const set of SETS) for (const event of EVENTS) jobs.push([pick(sc, new RegExp(`^${set}-${event}-v100[-.]`)), `tones/${set}/${event}.m4a`]);
for (const id of Object.keys(games)) jobs.push([pick(gc, new RegExp(`^music-${id}-v100-`)), `music/${id}.m4a`]);
const EFFECTS = ["tick", "tap", "good", "win", "low", "warn", "note0"];
for (const fx of EFFECTS) jobs.push([pick(gc, new RegExp(`^${fx}-v100-`)), `effects/${fx}.m4a`]);

rmSync(out, { recursive: true, force: true });
for (const [wav, rel] of jobs) {
  const dest = join(out, rel);
  mkdirSync(join(dest, ".."), { recursive: true });
  execFileSync("afconvert", ["-f", "m4af", "-d", "aac", "-s", "3", "-q", "96", wav, dest]);
}
rmSync(work, { recursive: true, force: true });

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.layout.sound = "sounds/{path}.m4a";
manifest.sounds = {
  ambient: ambiences,
  scenes,
  games,
  sets: SETS,
  events: EVENTS,
  effects: EFFECTS,
  // the programs' own default volumes out of 100, so the studio keeps their balance
  levels: { tone: 50, ambient: 20, music: 20, effect: 35 },
};
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`wrote ${jobs.length} files to ${out} and the sounds section of ${manifestPath}`);
