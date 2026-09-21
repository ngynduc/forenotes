import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: "Forenotes",
      description: "Practical documentation for running and using Forenotes.",
      favicon: "/favicon.png",
      customCss: ["./src/styles/docs.css"],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/ngynduc/forenotes",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/ngynduc/forenotes/edit/docs/starlight-rewrite/",
      },
      lastUpdated: true,
      sidebar: [
        { label: "Forenotes home", link: "/" },
        {
          label: "Start Here",
          items: ["docs", "docs/start/quickstart", "docs/start/core-concepts"],
        },
        {
          label: "Investigator Guide",
          items: [
            "docs/investigate/case-to-report",
            "docs/investigate/evidence-and-timeline",
            "docs/investigate/entities-and-graph",
            "docs/investigate/tasks-and-notes",
            "docs/investigate/reports",
          ],
        },
        {
          label: "Administration",
          items: [
            "docs/admin/users-and-permissions",
            "docs/admin/authentication",
            "docs/admin/llm-settings",
          ],
        },
        {
          label: "Operations",
          items: [
            "docs/operations/production-install",
            "docs/operations/configuration",
            "docs/operations/upgrade",
            "docs/operations/backup-and-restore",
            "docs/operations/troubleshooting",
          ],
        },
        {
          label: "Developer Guide",
          items: [
            "docs/develop/local-development",
            "docs/develop/architecture",
            "docs/develop/testing-and-contributing",
          ],
        },
        {
          label: "Reference",
          items: [
            "docs/reference/api",
            "docs/reference/data-model",
            "docs/reference/environment-variables",
            "docs/reference/permission-matrix",
          ],
        },
        { label: "Donate", link: "/donate" },
      ],
      head: [
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#06100d" },
        },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
