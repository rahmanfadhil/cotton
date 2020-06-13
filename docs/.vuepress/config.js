module.exports = {
  title: "Cotton",
  description: "SQL Database Toolkit for Deno",
  base: "https://rahmanfadhil.github.io/cotton/",
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guides", link: "/guide/" },
      { text: "GitHub", link: "https://github.com/rahmanfadhil/cotton" },
    ],
    sidebar: {
      "/guide/": ["query-builder", "model"],
    },
  },
};
