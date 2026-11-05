import type { APIRoute } from "astro";
import data from "../../data/profile.json";

// the profile release this build was made from; the deploy workflow compares it with the live site so
// the daily deploy also goes out when only a new profile release has come out
export const GET: APIRoute = () =>
  new Response(`${data.version}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
