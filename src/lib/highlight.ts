import { createHighlighter, type ShikiTransformer, type ThemeRegistration } from "shiki";
import { createHash } from "node:crypto";
import data from "../data/themes.json";
import { SAMPLES } from "../data/samples";

// the generated VS Code theme files, so the page shows exactly the extension's colours; they and
// themes.json are copied from the latest themes release by scripts/sync-themes.mjs; the order
// follows themes.json. Shiki only knows light and dark, so the high and deep contrast types are
// mapped onto those
const files = import.meta.glob<{ name: string; type: string }>("../data/themes/*-color-theme.json", { eager: true, import: "default" });
const source = data.themes.map(({ id }) => {
  const json = files[`../data/themes/zacess-${id}-color-theme.json`];
  if (!json) throw new Error(`no VS Code theme file for ${id} in src/data/themes`);
  return { id, json };
});
const asTheme = (id: string, json: { name: string; type: string }) =>
  ({ ...json, name: `zacess-${id}`, type: json.type.toLowerCase().includes("dark") ? "dark" : "light" }) as unknown as ThemeRegistration;

export const THEME_IDS = source.map((t) => t.id);
export const THEME_NAMES: Record<string, string> = Object.fromEntries(source.map((t) => [t.id, t.json.name]));

// the CSP allows style sheets from 'self' only, so every inline style Shiki writes becomes a class.
// It works on the finished elements because Shiki 4 adds token styles after the tokens hook that
// transformerStyleToClass from @shikijs/transformers relies on, which left every span styled inline
const classes = new Map<string, string>();
function toClass(node: { properties: Record<string, unknown> }) {
  const style = node.properties.style;
  if (typeof style !== "string" || !style) return;
  const name = `sk-${createHash("sha256").update(style).digest("hex").slice(0, 8)}`;
  classes.set(name, style);
  delete node.properties.style;
  const existing = node.properties.class;
  node.properties.class = existing ? `${existing} ${name}` : name;
}
const styleToClass: ShikiTransformer = {
  name: "zacess:style-to-class",
  pre: toClass,
  code: toClass,
  line: toClass,
  span: toClass,
};

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | undefined;
async function getHighlighter() {
  highlighter ??= await createHighlighter({
    themes: source.map((t) => asTheme(t.id, t.json)),
    langs: SAMPLES.map((s) => s.lang),
  });
  return highlighter;
}

const cache = new Map<string, string>();

export async function render(themeId: string, sampleId: string): Promise<string> {
  const key = `${themeId}/${sampleId}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const sample = SAMPLES.find((s) => s.id === sampleId);
  if (!sample) throw new Error(`no sample ${sampleId}`);
  const h = await getHighlighter();
  const html = h.codeToHtml(sample.code, {
    lang: sample.lang,
    theme: `zacess-${themeId}`,
    transformers: [
      styleToClass,
      {
        pre(node) {
          // a long line scrolls inside the block, so the block takes keyboard focus and has a name
          node.properties.tabindex = "0";
          node.properties["aria-label"] = `${sample.name} in ${THEME_NAMES[themeId]}`;
          node.properties.class = `${node.properties.class ?? ""} code-block`.trim();
        },
      },
    ],
  });
  cache.set(key, html);
  return html;
}

export async function renderAll() {
  for (const theme of THEME_IDS) for (const sample of SAMPLES) await render(theme, sample.id);
}

export async function css(): Promise<string> {
  await renderAll();
  return [...classes].map(([name, style]) => `.${name}{${style}}`).join("\n");
}
