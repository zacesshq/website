// @ts-check
import { cpSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { satteri } from "@astrojs/markdown-satteri";
import { styleToClass } from "./src/lib/shiki-classes.ts";

// the documentation's code blocks are drawn in the two high contrast themes, light and dark, from
// the same VS Code theme files the code themes page uses; the site's colour mode picks one
/** @param {string} id */
const theme = (id) => ({
  ...JSON.parse(readFileSync(new URL(`./src/data/themes/zacess-${id}-color-theme.json`, import.meta.url), "utf8")),
  name: `zacess-${id}`,
  type: id.endsWith("dark") ? "dark" : "light",
});

// a markdown table scrolls inside a named region on a narrow screen, as the hand-written pages do,
// so the page itself never moves sideways
/** @type {import("satteri").HastPluginDefinition} */
const scrollTables = {
  name: "zacess:scroll-tables",
  element: [
    {
      filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
      visit(node, ctx) { ctx.data.lastHeading = ctx.textContent(node); },
    },
    {
      filter: ["table"],
      visit(node, ctx) {
        const under = ctx.data.lastHeading ? ` under ${ctx.data.lastHeading}` : "";
        ctx.wrapNode(node, {
          type: "element",
          tagName: "div",
          properties: { className: ["table-scroll"], tabindex: "0", role: "region", ariaLabel: `Table${under}` },
          children: [],
        });
      },
    },
  ],
};

// every code block carries a Copy button beside it, in the page itself so a build can be checked
// for it; the style sheet shows the button only once public/docs-copy.js can make it work, so a
// page without script shows the block alone
/**
 * @param {string} tagName
 * @param {import("hast").Properties} properties
 * @param {import("hast").ElementContent[]} [children]
 * @returns {import("hast").Element}
 */
const el = (tagName, properties, children = []) => ({ type: "element", tagName, properties, children });
/** @type {import("satteri").HastPluginDefinition} */
const copyButtons = {
  name: "zacess:copy-buttons",
  element: {
    filter: ["pre"],
    visit(node, ctx) {
      ctx.wrapNode(node, el("div", { className: ["docs-code"] }, [
        el("button", { type: "button", className: ["code-copy"], ariaLabel: "Copy this code" }, [
          el("svg", { viewBox: "0 0 24 24", ariaHidden: "true", focusable: "false", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" }, [
            el("rect", { x: "9", y: "9", width: "11", height: "11", rx: "2" }),
            el("path", { d: "M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" }),
          ]),
          el("span", { className: ["code-copy-label"] }, [{ type: "text", value: "Copy" }]),
        ]),
      ]));
    },
  },
};

// public/studio-assets is the studio's development base, about 1.4 GB generated locally and served
// from the zacess-media bucket in production, so a build must never copy it into dist/ where
// wrangler would upload it; Vite's public copy has no filter, so the build turns it off and copies
// public/ itself without that folder, while astro dev still serves it from public/
const LOCAL_ONLY = ["studio-assets"];
/** @type {import("astro").AstroIntegration} */
const publicWithoutLocalAssets = {
  name: "zacess:public-without-local-assets",
  hooks: {
    "astro:config:setup": ({ command, updateConfig }) => {
      if (command !== "build") return;
      updateConfig({
        vite: {
          plugins: [{
            name: "zacess:no-public-copy",
            configEnvironment: (name) => (name === "client" ? { build: { copyPublicDir: false } } : undefined),
          }],
        },
      });
    },
    "astro:build:done": ({ dir }) => {
      const from = fileURLToPath(new URL("./public/", import.meta.url));
      cpSync(from, fileURLToPath(dir), {
        recursive: true,
        filter: (src) => !LOCAL_ONLY.some((name) => src === `${from}${name}` || src.startsWith(`${from}${name}/`)),
      });
    },
  },
};

export default defineConfig({
  site: "https://zacess.com",
  trailingSlash: "always",
  build: {
    format: "directory",
    // the CSP allows style sheets from 'self' only, so styles must never be inlined
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  integrations: [publicWithoutLocalAssets, sitemap({ filter: (page) => !page.includes("/404") })],
  markdown: {
    // the documentation is written in plain punctuation and must stay that way: no curly quotes
    // and no dash a page would be failed for
    processor: satteri({ features: { smartPunctuation: false }, hastPlugins: [scrollTables, copyButtons] }),
    shikiConfig: {
      themes: { light: theme("high-contrast-light"), dark: theme("high-contrast-dark") },
      defaultColor: false,
      transformers: [styleToClass],
    },
  },
});
