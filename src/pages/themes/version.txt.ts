import type { APIRoute } from "astro";
import data from "../../data/themes.json";

// the themes release this build was made from; the deploy workflow reads it from the live site to
// skip the daily deploy when no new release has come out since
export const GET: APIRoute = () =>
  new Response(`${data.version}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
