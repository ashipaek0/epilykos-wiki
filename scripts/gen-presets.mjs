#!/usr/bin/env node
// Copies the dashboard presets of an Epilykos checkout into the wiki: the JSON files (public/presets/),
// the preview pictures (public/images/preset-<id>.webp) and the table on the Dashboard presets page.
// The app is the source of truth, so the in-app gallery and this site can't disagree.
//   npm run gen:presets -- /path/to/Epilykos
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repo = resolve(process.argv[2] ?? "../Epilykos");
const index = JSON.parse(readFileSync(join(repo, "presets", "index.json"), "utf8"));

const rows = [];
for (const p of index) {
  const json = join(repo, "presets", `${p.id}.json`);
  const preview = join(repo, "presets", "previews", `${p.id}.webp`);
  if (!existsSync(json)) throw new Error(`presets/${p.id}.json is listed but missing`);
  JSON.parse(readFileSync(json, "utf8"));
  copyFileSync(json, join("public", "presets", `${p.id}.json`));
  if (existsSync(preview)) copyFileSync(preview, join("public", "images", `preset-${p.id}.webp`));
  if (!existsSync(join("content", "docs", "presets", `${p.id}.mdx`))) {
    console.warn(`No page yet for "${p.id}": add content/docs/presets/${p.id}.mdx`);
  }
  const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  rows.push(`| [${cell(p.name)}](/presets/${p.id}) | ${cell(p.description)} |`);
}

const page = join("content", "docs", "presets", "index.mdx");
const START = "{/* presets:start */}";
const END = "{/* presets:end */}";
let text = readFileSync(page, "utf8");
const a = text.indexOf(START), b = text.indexOf(END);
if (a < 0 || b < 0) throw new Error(`${page} needs the ${START} and ${END} markers around the table`);
const table = ["| Preset | Good for |", "| --- | --- |", ...rows].join("\n");
text = text.slice(0, a + START.length) + "\n" + table + "\n" + text.slice(b);
writeFileSync(page, text);
console.log(`Copied ${index.length} presets from ${repo}.`);
