module.exports = {
  base: "/cotton/",
  locales: {
    '/': {
      lang: 'en-US',
      title: "Cotton",
      description: "SQL Database Toolkit for Deno"
    },
    '/zh/': {
      lang: 'zh-CN',
      title: 'Cotton',
      description: '用于Deno的SQL数据库工具包'
    }
  },
  themeConfig: {
    locales: {
      '/': {
        selectText: 'Languages',
        label: 'English',
        ariaLabel: 'Languages',
        nav: [
          { text: "Home", link: "/" },
          { text: "Guides", link: "/guide/" },
          { text: "GitHub", link: "https://github.com/rahmanfadhil/cotton" },
        ],
        sidebar: {
          "/guide/": [
            "connection",
            "query-builder",
            "transactions",
            "model",
            "migrations",
            "schema",
          ],
        }
      },
      '/zh/': {
        selectText: '选择语言',
        label: '简体中文',
        nav: [
          { text: "主页", link: "/zh/" },
          { text: "指南", link: "/zh/guide/" },
          { text: "GitHub", link: "https://github.com/rahmanfadhil/cotton" },
        ],
        sidebar: {
          "/zh/guide/": [
            "connection",
            "query-builder",
            "transactions",
            "model",
            "migrations",
            "schema",
          ],
        }
      }
    }
  },
};
