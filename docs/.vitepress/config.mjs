import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'parse-connection-url',
  description: 'Parse connection strings and objects in a consistent way. Zero dependencies.',
  base: '/parse-connection-url/',
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/connection' },
      { text: 'Changelog', link: 'https://github.com/jdziat/parse-connection-url/blob/master/CHANGELOG.md' },
      { text: 'npm', link: 'https://www.npmjs.com/package/parse-connection-url' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Parsing Connections', link: '/guide/parsing' },
            { text: 'Driver & ORM Exporters', link: '/guide/exporters' },
            { text: 'Building & Modifying', link: '/guide/building' },
            { text: 'Security & Logging', link: '/guide/security' },
            { text: 'Error Handling', link: '/guide/errors' },
            { text: 'Migrating to v2', link: '/guide/migration-v2' }
          ]
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Connection', link: '/api/connection' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Connection', link: '/api/connection' },
            { text: 'ConnectionBuilder', link: '/api/connection-builder' },
            { text: 'Errors', link: '/api/errors' },
            { text: 'Types & Schemas', link: '/api/types' }
          ]
        },
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jdziat/parse-connection-url' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/parse-connection-url' }
    ],

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/jdziat/parse-connection-url/edit/master/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Jordan Dziat'
    }
  }
})
