import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        console: "readonly",
        document: "readonly",
        Element: "readonly",
        HTMLImageElement: "readonly",
        IntersectionObserver: "readonly",
        MouseEvent: "readonly",
        SVGSVGElement: "readonly",
        window: "readonly",
      },
    },
  },
);
