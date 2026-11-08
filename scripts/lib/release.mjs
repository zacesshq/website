import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

// ZACESS_SYNC_LOCAL names a folder holding local checkouts (scenes, games, profile, themes), so a
// change can be previewed on the site before its release. Each sync then reads the checkout's
// working tree and its Cargo.toml version instead of the newest tag. Never set in the deploy workflow
const localDir = (repo) => (process.env.ZACESS_SYNC_LOCAL ? resolve(process.env.ZACESS_SYNC_LOCAL, repo.split("/")[1]) : null);

// whether a repo is read from its local checkout, for a sync that also needs something only a real
// release has, such as the files attached to a GitHub release
export const isLocal = (repo) => localDir(repo) !== null;

// what every sync script shares: the GitHub request helpers and the release tag lookup, so the
// themes, scenes, games and documentation syncs resolve a release the same way
const TIMEOUT = 15000;

export const headers = { "User-Agent": "zacess-website-sync", Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

export async function get(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res;
}

export const SEMVER = /^v(\d+)\.(\d+)\.(\d+)$/;
export const newer = (a, b) => {
  const x = a.match(SEMVER).slice(1).map(Number);
  const y = b.match(SEMVER).slice(1).map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

// the newest vX.Y.Z tag rather than GitHub's latest release, because a release workflow publishes
// on the tag and the GitHub release is only made afterwards on a maintainer's machine. The named
// environment variable pins a tag: the deploy workflow passes the one a release dispatch names
export async function latestTag(repo, envVar) {
  const dir = localDir(repo);
  if (dir) {
    // a Rust product carries its version in Cargo.toml, the themes in package.json
    const version = existsSync(join(dir, "Cargo.toml"))
      ? readFileSync(join(dir, "Cargo.toml"), "utf8").match(/\nversion = "([^"]+)"/)?.[1]
      : JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).version;
    if (!version) throw new Error(`no version in ${dir}`);
    return `v${version}`;
  }
  const pinned = process.env[envVar]?.trim();
  if (pinned) {
    if (!SEMVER.test(pinned)) throw new Error(`${envVar} ${pinned} is not a vX.Y.Z tag`);
    return pinned;
  }
  const tags = await (await get(`https://api.github.com/repos/${repo}/tags?per_page=100`, { headers })).json();
  const releases = tags.map((t) => t.name).filter((n) => SEMVER.test(n));
  if (!releases.length) throw new Error(`no vX.Y.Z tags in ${repo}`);
  return releases.reduce((best, n) => (newer(n, best) ? n : best));
}

export const raw = async (repo, ref, path) => {
  const dir = localDir(repo);
  return dir ? readFileSync(join(dir, path), "utf8") : (await get(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`)).text();
};

// the same file as bytes, for images
export const rawBytes = async (repo, ref, path) => {
  const dir = localDir(repo);
  return dir ? readFileSync(join(dir, path)) : Buffer.from(await (await get(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`)).arrayBuffer());
};

export const listing = async (repo, ref, path) => {
  const dir = localDir(repo);
  if (dir) return readdirSync(join(dir, path), { withFileTypes: true }).filter((f) => f.isFile()).map((f) => f.name);
  return (await (await get(`https://api.github.com/repos/${repo}/contents/${path}?ref=${ref}`, { headers })).json())
    .filter((f) => f.type === "file")
    .map((f) => f.name);
};
