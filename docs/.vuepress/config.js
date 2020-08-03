module.exports = {
  title: "Cotton",
  description: "SQL Database Toolkit for Deno",
  base: "/cotton/",
  themeConfig: {
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
        "serializer",
      ],
    },
    docsRepo: "rahmanfadhil/cotton",
    docsDir: "docs",
    docsBranch: "master",
    editLinks: true,
    editLinkText: "Help us improve this page!",
  },
};
