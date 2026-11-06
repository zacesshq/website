// @ts-check
// where every documentation page on the site comes from. scripts/sync-docs.mjs reads this to pull
// the markdown, src/data/docs-nav.ts reads it to shape the sidebar, so the two can never disagree.
//
// A product with a release tag is pulled at its newest vX.Y.Z tag (or the tag its environment
// variable pins, as the other sync scripts do). The reader and the community files have no tags,
// so they are pinned to a recorded commit on main and move only when that commit is updated here.
// A page marked local is written in this repository under docs-src/, for a page its product
// repository has no file for. It names the release it was checked against.

/**
 * @typedef {object} Source
 * @property {string} repo the GitHub repository, owner/name
 * @property {string} name the product name as the pages say it
 * @property {string} env the environment variable that pins a ref
 * @property {string} [ref] a commit on main for a repository that has no release tags
 */

/** @type {Record<string, Source>} */
export const SOURCES = {
  reader: { repo: "zacesshq/zacess", name: "Zacess", env: "ZACESS_REF", ref: "2bc7be2c19f00523ab7ceea6e58f0fabc5120f03" },
  profile: { repo: "zacesshq/profile", name: "Zacess Profile", env: "PROFILE_TAG" },
  scenes: { repo: "zacesshq/scenes", name: "Zacess Scenes", env: "SCENES_TAG" },
  games: { repo: "zacesshq/games", name: "Zacess Games", env: "GAMES_TAG" },
  themes: { repo: "zacesshq/themes", name: "Zacess Themes", env: "THEMES_TAG" },
  community: { repo: "zacesshq/.github", name: "Zacess", env: "COMMUNITY_REF", ref: "9d13dfbf2f52894883982e73f4a193056a61039d" },
};

/** the sections in sidebar order */
export const SECTIONS = [
  { id: "install", title: "Install", summary: "Get the reader, the accessibility profile, the terminal scenes, the terminal games and the code themes." },
  { id: "use", title: "Use", summary: "How each part of Zacess works, page by page." },
  { id: "extend", title: "Extend", summary: "Scenes and levels of your own, written in Lua." },
  { id: "contribute", title: "Contribute", summary: "How to take part, the rules we work by and how we handle your data." },
  { id: "reference", title: "Reference", summary: "Every command, key, flag and file on one sheet each." },
];

/** the product groups inside the Use section, in order */
export const GROUPS = [
  { id: "reader", title: "Reader", summary: "The Zacess reader: what each part of the core does and how it is checked." },
  { id: "profile", title: "Profile", summary: "One file of reading needs, checked and written for every terminal, editor and web page." },
  { id: "scenes", title: "Scenes", summary: "The terminal scenes, the build monitor and the shell follow mode." },
  { id: "games", title: "Games", summary: "The terminal games and how each one is played." },
  { id: "themes", title: "Themes", summary: "The high contrast code themes and the palette behind them." },
];

/**
 * @typedef {object} Page
 * @property {string} slug the address under /docs/, without slashes at either end
 * @property {string} section one of SECTIONS
 * @property {string} source one of SOURCES
 * @property {string} path the markdown file in that repository
 * @property {string} [heading] pull only this section of the file rather than the whole of it
 * @property {string} [title] the page title, otherwise the file's first heading
 * @property {string} [group] the product group in the Use section
 * @property {boolean} [optional] a file that may not exist yet: skipped with a note rather than failing
 * @property {string} [local] a markdown file in this repository that the page is written in, in place of path
 * @property {string} [checked] for a local page, the release tag of its source that it was checked against
 */

/** @type {Page[]} */
export const PAGES = [
  // Install
  { slug: "install/reader", section: "install", source: "reader", path: "README.md", heading: "## Browser version", title: "Install the reader" },
  { slug: "install/profile", section: "install", source: "profile", path: "", local: "docs-src/profile/install.md", checked: "v0.2.2" },
  { slug: "install/scenes", section: "install", source: "scenes", path: "README.md", heading: "## Install", title: "Install Zacess Scenes" },
  { slug: "install/games", section: "install", source: "games", path: "README.md", heading: "## Install", title: "Install Zacess Games" },
  { slug: "install/themes", section: "install", source: "themes", path: "README.md", heading: "## Install", title: "Install Zacess Themes" },

  // Use: the reader
  ...["browser-version", "document-model", "import", "ocr", "reading-profiles", "speech", "recording", "capture",
    "universal-capture", "library", "export", "braille", "maths", "bilingual", "study", "ask", "assist", "timeline", "sync"]
    .map((name) => ({ slug: `reader/${name}`, section: "use", group: "reader", source: "reader", path: `docs/${name}.md` })),

  // Use: the profile, partly written here since the repository's own docs are its README sections
  { slug: "profile/quick-start", section: "use", group: "profile", source: "profile", path: "README.md", heading: "## Quick start", title: "Quick start" },
  { slug: "profile/writing-a-profile", section: "use", group: "profile", source: "profile", path: "", local: "docs-src/profile/writing-a-profile.md", checked: "v0.2.2" },
  { slug: "profile/what-is-checked", section: "use", group: "profile", source: "profile", path: "README.md", heading: "## What is checked", title: "What is checked" },
  { slug: "profile/colour-vision", section: "use", group: "profile", source: "profile", path: "", local: "docs-src/profile/colour-vision.md", checked: "v0.2.2" },
  { slug: "profile/targets", section: "use", group: "profile", source: "profile", path: "README.md", heading: "## Targets", title: "Targets" },
  { slug: "profile/load-in-each-app", section: "use", group: "profile", source: "profile", path: "", local: "docs-src/profile/load-in-each-app.md", checked: "v0.2.2" },
  { slug: "profile/starter-profiles", section: "use", group: "profile", source: "profile", path: "", local: "docs-src/profile/starter-profiles.md", checked: "v0.2.2" },
  { slug: "profile/browser-extension", section: "use", group: "profile", source: "profile", path: "extension/README.md", title: "Browser extension" },
  { slug: "profile/os-settings", section: "use", group: "profile", source: "profile", path: "", local: "docs-src/profile/os-settings.md", checked: "v0.2.2" },
  { slug: "profile/accessibility", section: "use", group: "profile", source: "profile", path: "ACCESSIBILITY.md", title: "Accessibility of Zacess Profile" },
  { slug: "profile/troubleshooting", section: "use", group: "profile", source: "profile", path: "", local: "docs-src/profile/troubleshooting.md", checked: "v0.2.2" },

  // Use: the scenes
  ...["watch-mode", "follow-mode", "sounds", "themes", "snapshots", "scenes"]
    .map((name) => ({ slug: `scenes/${name}`, section: "use", group: "scenes", source: "scenes", path: `docs/${name}.md` })),

  // Use: the games
  { slug: "games/how-to-play", section: "use", group: "games", source: "games", path: "docs/how-to-play.md" },

  // Use: the themes
  ...["how-it-works", "contrast", "palette", "recommended-settings", "shell-colours"]
    .map((name) => ({ slug: `themes/${name}`, section: "use", group: "themes", source: "themes", path: `docs/${name}.md` })),

  // Extend
  { slug: "extend/lua-scenes", section: "extend", source: "scenes", path: "docs/lua.md", title: "Lua scenes" },
  { slug: "extend/lua-levels", section: "extend", source: "games", path: "README.md", heading: "## Levels in Lua", title: "Lua levels" },

  // Contribute: the community files, shown in full
  { slug: "contribute/contributing", section: "contribute", source: "community", path: "CONTRIBUTING.md" },
  { slug: "contribute/code-of-conduct", section: "contribute", source: "community", path: "CODE_OF_CONDUCT.md" },
  { slug: "contribute/ai-policy", section: "contribute", source: "community", path: "AI_POLICY.md" },
  { slug: "contribute/security", section: "contribute", source: "community", path: "SECURITY.md" },
  { slug: "contribute/support", section: "contribute", source: "community", path: "SUPPORT.md" },
  { slug: "contribute/accessibility", section: "contribute", source: "community", path: "ACCESSIBILITY.md" },
  { slug: "contribute/privacy", section: "contribute", source: "community", path: "PRIVACY.md", optional: true },

  // Reference
  { slug: "reference/profile-cli", section: "reference", source: "profile", path: "README.md", heading: "## Commands", title: "Profile command line" },
  { slug: "reference/profile-check", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/check.md", checked: "v0.2.2" },
  { slug: "reference/profile-derive", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/derive.md", checked: "v0.2.2" },
  { slug: "reference/profile-render", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/render.md", checked: "v0.2.2" },
  { slug: "reference/profile-apply", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/apply.md", checked: "v0.2.2" },
  { slug: "reference/profile-watch", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/watch.md", checked: "v0.2.2" },
  { slug: "reference/profile-os", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/os.md", checked: "v0.2.2" },
  { slug: "reference/profile-list-targets", section: "reference", source: "profile", path: "", local: "docs-src/profile/reference/list-targets.md", checked: "v0.2.2" },
  { slug: "reference/profile-format", section: "reference", source: "profile", path: "spec/SPEC.md", title: "Profile format" },
  { slug: "reference/scenes-cli", section: "reference", source: "scenes", path: "docs/usage.md", title: "Scenes command line" },
  { slug: "reference/scenes-config", section: "reference", source: "scenes", path: "docs/configuration.md", title: "Scenes configuration" },
  { slug: "reference/games-controls", section: "reference", source: "games", path: "docs/controls.md", title: "Games controls" },
  { slug: "reference/scores-file", section: "reference", source: "games", path: "docs/scores.md", title: "Scores file", optional: true },
];
