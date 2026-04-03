// @ts-check
import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Stellar Docs",
  tagline: "Interplanetary voyage booking — technical and lore documentation",
  favicon: "img/favicon.ico",

  url: "http://localhost:3000",
  baseUrl: "/",

  organizationName: "stellar",
  projectName: "stellar",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          routeBasePath: "/",
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: "Stellar",
        logo: {
          alt: "Stellar logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "technicalSidebar",
            position: "left",
            label: "Technical",
          },
          {
            type: "docSidebar",
            sidebarId: "systemSidebar",
            position: "left",
            label: "The Solara System",
          },
          {
            type: "docSidebar",
            sidebarId: "voyagesSidebar",
            position: "left",
            label: "Voyages",
          },
        ],
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ["go", "python", "bash", "json"],
      },
    }),
};

export default config;
