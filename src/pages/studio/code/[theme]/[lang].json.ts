import type { APIRoute, GetStaticPaths } from "astro";
import { render, THEME_IDS } from "../../../../lib/highlight";
import { SAMPLES } from "../../../../data/samples";

// one small file per theme and language, so the studio fetches only the sample on screen instead of
// carrying all 200 renders in the page the way the themes playground does. The colours are classes
// from /themes/code-themes.css, since the CSP allows no inline styles
export const getStaticPaths: GetStaticPaths = () =>
  THEME_IDS.flatMap((theme) => SAMPLES.map((s) => ({ params: { theme, lang: s.id } })));

export const GET: APIRoute = async ({ params }) => {
  const html = await render(params.theme as string, params.lang as string);
  return new Response(JSON.stringify({ html }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};
