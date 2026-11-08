import type { APIRoute } from "astro";
import data from "../../data/themes.json";

// each theme's colours as custom properties on one class, so the studio's screen, editor and
// terminal take every colour from the chosen theme by swapping a class; the CSP allows no inline styles
const UI = {
  bg: "background", fg: "foreground", surface: "surface", "surface-alt": "surfaceAlt", muted: "muted", border: "border",
  "border-active": "borderActive", accent: "accent", "accent-fg": "accentForeground", link: "link", sel: "selection",
  "sel-strong": "selectionStrong", "sel-fg": "selectionForeground", line: "lineHighlight", cursor: "cursor", gutter: "gutter",
  lnum: "lineNumber", "lnum-active": "lineNumberActive", error: "error", warning: "warning", info: "info",
} as const;
const SYNTAX = ["keyword", "function", "type", "string", "number", "comment", "property", "attribute", "added", "removed"] as const;

export const GET: APIRoute = () => {
  const body = data.themes.map((t) => {
    const ui = t.ui as unknown as Record<string, string>;
    const syntax = t.syntax as unknown as Record<string, string>;
    const props = [
      ...Object.entries(UI).map(([name, key]) => `--st-${name}:${ui[key]}`),
      ...SYNTAX.map((key) => `--st-s-${key}:${syntax[key]}`),
    ];
    return `.st-t-${t.id}{${props.join(";")}}`;
  }).join("\n");
  return new Response(body + "\n", { headers: { "Content-Type": "text/css; charset=utf-8" } });
};
