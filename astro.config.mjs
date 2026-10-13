// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://zacess.com",
  trailingSlash: "always",
  build: {
    format: "directory",
    // the CSP allows style sheets from 'self' only, so styles must never be inlined
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })],
});
