# Epilykos Wiki

Guides for installing, connecting and running [Epilykos](https://github.com/ashipaek0/Epilykos) and
[EpilykosOS](https://github.com/ashipaek0/epilykos-os), built with [Fumapress](https://press.fumadocs.dev).

Published at <https://epilykos.ashipaek0.com.ng/>.

## Run it locally

Needs Node.js 22 or newer (CI builds with 24, which Fumapress asks for).

```bash
npm install
npm run dev                    # http://localhost:1337
```

## Write a page

- Pages are MDX files under `content/docs/`. Frontmatter needs `title`; `description` and `icon` (a
  [Lucide](https://lucide.dev/icons) name) are optional.
- Sidebar order comes from the `meta.json` next to the pages.
- Images go in `public/images/` and are linked from the site root: `![What it shows](/images/name.webp)`.
- Link pages from the site root too (`/settings/security`), never with a site prefix in front.
- Describe what the Epilykos code on `main` does, with the names the app shows (**Settings → Network**).

## Supported hardware page

`content/docs/data-sources/supported-hardware.mdx` is generated from the profile files of an
Epilykos checkout. Regenerate it when profiles change:

```bash
npm run gen:hardware -- ../Epilykos
```

## Checks

```bash
npm run types:check
npm run lint
npm run build                                   # fails on broken internal links
BASE_PATH=/ npm run build
BASE_PATH=/ npm run check:site    # serves the build like GitHub Pages and crawls it
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy-pages.yml`: it checks, builds with
`BASE_PATH=/<repo name>/` and deploys to GitHub Pages. Pull requests run the same checks without
deploying. In the repository's **Settings → Pages**, set **Source** to **GitHub Actions** once.
