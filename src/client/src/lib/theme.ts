export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "forenotes-theme";

export function resolveTheme(storedTheme: string | null, prefersDark: boolean): Theme {
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return prefersDark ? "dark" : "light";
}

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  let storedTheme: string | null = null;
  try {
    storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in hardened or private browser contexts.
  }

  return resolveTheme(storedTheme, window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function storeTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The active theme still applies when persistence is unavailable.
  }
}
