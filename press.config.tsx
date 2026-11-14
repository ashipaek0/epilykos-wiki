import { lucideIconsPlugin } from "fumadocs-core/source/plugins/lucide-icons";
import { defineDocs } from "fumadocs-mdx/macro";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { PageFooter } from "fumadocs-ui/layouts/docs/page";
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { defineConfig } from "fumapress";
import { fumadocsMdx } from "fumapress/adapters/mdx";
import { metaSchema, pageSchema } from "fumapress/adapters/mdx/schema";
import { Image } from "fumapress/image";
import { createDocsLayoutPage } from "fumapress/layouts/docs";
import { linkValidationPlugin } from "fumapress/plugins/link-validation";
import { oramaSearchPlugin } from "fumapress/plugins/orama-search";

// "/" locally and on the wiki domain (set by the deploy workflow).
const basePath = process.env.BASE_PATH ?? "/";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    async: true,
    schema: pageSchema,
    lastModified: true,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
});

// Previous/next links above the page as well as below it (below only on phones, to keep the
// content near the top).
const DocsLayout = createDocsLayoutPage<typeof config.$context>({
  renderBody: ({ props, next }) =>
    next({
      ...props,
      children: (
        <>
          <PageFooter className="not-prose mb-8 max-md:hidden" />
          {props.children}
        </>
      ),
    }),
});

const config = defineConfig({
  mode: "static",
  content: docs.toFumadocsSource(),
  renderPage: (props) => <DocsLayout {...props} />,
  site: {
    name: "Epilykos Wiki",
    baseUrl: process.env.SITE_URL ?? "http://localhost:1337",
    git: { user: "ashipaek0", repo: "epilykos-wiki", branch: "main" },
  },
  meta: {
    root: () => (
      <>
        <link rel="icon" href={`${basePath}favicon.ico`} sizes="any" />
        <link rel="icon" href={`${basePath}icon.svg`} type="image/svg+xml" />
      </>
    ),
  },
  loaderOptions: { plugins: [lucideIconsPlugin()] },
  defaultLayoutProps: {
    nav: {
      title: (
        <>
          <Image
            src={`${basePath}logo-light.svg`}
            width={64}
            height={64}
            alt=""
            className="size-7 dark:hidden"
          />
          <Image
            src={`${basePath}logo-dark.svg`}
            width={64}
            height={64}
            alt=""
            className="hidden size-7 dark:block"
          />
          <span>Epilykos Wiki</span>
        </>
      ),
    },
    links: [
      { text: "Epilykos on GitHub", url: "https://github.com/ashipaek0/Epilykos", external: true },
      {
        text: "EpilykosOS releases",
        url: "https://github.com/ashipaek0/epilykos-os/releases",
        external: true,
      },
      { text: "Docker Hub", url: "https://hub.docker.com/r/irunmole/epilykos", external: true },
    ],
    themeSwitch: { mode: "light-dark-system" },
  },
})
  .adapters(
    fumadocsMdx({
      async getMdxComponents(page) {
        return {
          ...defaultMdxComponents,
          Step,
          Steps,
          Tab,
          Tabs,
          a: createRelativeLink(await this.getLoader(), page),
          img: (props) => <ImageZoom {...(props as any)} />,
        };
      },
    }),
  )
  // The link validator requests app paths without the base path, which throws under BASE_PATH
  // (fumapress 1.6.2). Local builds validate links; base-path builds are crawled by check:site.
  .plugins(
    linkValidationPlugin({ ignored: () => basePath !== "/" }),
    // Replaces the preset's FlexSearch: its static index was 6.6 MB for this site, Orama's 1.4 MB,
    // and every visitor downloads it on their first search.
    oramaSearchPlugin(),
  );

export default config;
