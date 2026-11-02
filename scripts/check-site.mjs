#!/usr/bin/env node
// Serves dist/public under BASE_PATH the way GitHub Pages does and crawls every internal link,
// script, stylesheet and image reachable from the home page. Exits 1 on any non-200.
// Usage: BASE_PATH=/epilykos-wiki/ npm run build && BASE_PATH=/epilykos-wiki/ npm run check:site
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist/public");
const base = process.env.BASE_PATH ?? "/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".xml": "application/xml",
};

async function resolveFile(pathname) {
  if (!pathname.startsWith(base)) return null;
  const rel = decodeURIComponent(pathname.slice(base.length));
  for (const candidate of [rel, `${rel}.html`, join(rel, "index.html")]) {
    const file = normalize(join(root, candidate));
    if (!file.startsWith(root)) return null;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(new URL(req.url, "http://localhost").pathname);
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const referrer = new Map([[base, "(start)"]]);
const queue = [base];
const seen = new Set();
const failures = [];
const anchors = []; // [page path, fragment, linked from]
const ids = new Map(); // page path -> Set of element ids
let pages = 0;
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await fetch(origin + path);
  if (!res.ok) {
    failures.push(`${res.status} ${path}  (linked from ${referrer.get(path)})`);
    continue;
  }
  if (!(res.headers.get("content-type") ?? "").startsWith("text/html")) continue;
  pages++;
  const html = await res.text();
  ids.set(path, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const [beforeHash, fragment] = raw.replaceAll("&amp;", "&").split("#");
    const url = beforeHash.split("?")[0] || path;
    if (!url.startsWith("/") || url.startsWith("//")) continue;
    if (fragment) anchors.push([url, decodeURIComponent(fragment), path]);
    if (!referrer.has(url)) referrer.set(url, path);
    queue.push(url);
  }
}
server.close();

// Links to a section of a page need an element with that id on the page.
for (const [url, fragment, from] of anchors) {
  const pageIds = ids.get(url) ?? ids.get(url.replace(/\/$/, "")) ?? ids.get(`${url}/`);
  if (pageIds && !pageIds.has(fragment)) failures.push(`missing #${fragment} on ${url}  (linked from ${from})`);
}
console.log(`Checked ${seen.size} URLs (${pages} pages) and ${anchors.length} section links.`);
if (failures.length) {
  console.error(`${failures.length} broken:\n${failures.join("\n")}`);
  process.exit(1);
}
