import type { APIRoute } from "astro";
import { css } from "../../lib/highlight";
import data from "../../data/themes.json";

// the CSP allows style sheets from 'self' only, so the colours Shiki would have written inline are
// collected into this file at build time, with the frame colours for each theme beside them
export const GET: APIRoute = async () => {
  const frames = data.themes.map((t) => [
    `.frame-${t.id} { background: ${t.ui.background}; color: ${t.ui.foreground}; border-color: ${t.ui.border}; }`,
    `.frame-${t.id} .frame-bar { background: ${t.ui.surfaceAlt}; color: ${t.ui.foreground}; border-bottom-color: ${t.ui.border}; }`,
    `.frame-${t.id} .code-block::-webkit-scrollbar-thumb { background: ${t.ui.foreground}; }`,
    `.frame-${t.id} .code-block::-webkit-scrollbar-track { background: ${t.ui.surfaceAlt}; }`,
    `.frame-${t.id} .code-block:focus-visible { outline-color: ${t.ui.foreground}; }`,
    `.sw-${t.id}-bg { background: ${t.ui.background}; }`,
    `.sw-${t.id}-fg { background: ${t.ui.foreground}; }`,
  ].join("\n"));
  const body = `${await css()}\n${frames.join("\n")}\n`;
  return new Response(body, { headers: { "Content-Type": "text/css; charset=utf-8" } });
};
