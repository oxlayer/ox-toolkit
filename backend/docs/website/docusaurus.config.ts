import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OxLayer Adapters',
  tagline: 'Multi-tenant adapters for modern applications',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://oxlayer.dev',
  baseUrl: '/',

  organizationName: 'oxlayer',
  projectName: 'oxlayer',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/oxlayer/oxlayer/edit/main/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/oxlayer/oxlayer/edit/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/oxlayer-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
      defaultMode: 'dark',
    },
    navbar: {
      title: 'OxLayer Adapters',
      logo: {
        alt: 'OxLayer Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'adaptersSidebar',
          position: 'left',
          label: 'Adapters',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tenancySidebar',
          position: 'left',
          label: 'Tenancy',
        },
        {
          type: 'docSidebar',
          sidebarId: 'eventBusSidebar',
          position: 'left',
          label: 'Event Bus',
        },
        {
          href: 'https://github.com/oxlayer/oxlayer',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Adapters',
              to: '/docs/adapters/intro',
            },
            {
              label: 'Tenancy',
              to: '/docs/tenancy/intro',
            },
            {
              label: 'Event Bus',
              to: '/docs/event-bus/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/oxlayer/oxlayer',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/oxlayer',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'NPM',
              href: 'https://www.npmjs.com/org/oxlayer',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} OxLayer. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'typescript', 'javascript', 'json', 'yaml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
