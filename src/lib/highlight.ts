import { createHighlighter, type ShikiTransformer, type ThemeRegistration } from "shiki";
import { createHash } from "node:crypto";
import light from "../data/themes/zacess-light-color-theme.json";
import dark from "../data/themes/zacess-dark-color-theme.json";
import yellow from "../data/themes/zacess-yellow-on-black-color-theme.json";
import cream from "../data/themes/zacess-cream-color-theme.json";
import hcDark from "../data/themes/zacess-high-contrast-dark-color-theme.json";
import hcLight from "../data/themes/zacess-high-contrast-light-color-theme.json";
import dcDark from "../data/themes/zacess-deep-contrast-dark-color-theme.json";
import dcLight from "../data/themes/zacess-deep-contrast-light-color-theme.json";
import { SAMPLES } from "../data/samples";

// the generated VS Code theme files, so the page shows exactly the extension's colours; Shiki only
// knows light and dark, so the high and deep contrast types are mapped onto those
const source = [
  { id: "light", json: light },
  { id: "dark", json: dark },
  { id: "yellow-on-black", json: yellow },
  { id: "cream", json: cream },
  { id: "high-contrast-dark", json: hcDark },
  { id: "high-contrast-light", json: hcLight },
  { id: "deep-contrast-dark", json: dcDark },
  { id: "deep-contrast-light", json: dcLight },
];
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
