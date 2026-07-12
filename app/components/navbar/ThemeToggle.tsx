"use client";

export type SiteTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "site-theme";

const THEME_CHANGE_EVENT = "site-theme-change";

export function subscribeSiteTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function readSiteTheme(): SiteTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function getServerSiteTheme(): SiteTheme {
  return "dark";
}

export function applySiteTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode) — theme still applies for the session.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/**
 * Site-wide light/dark toggle button. The chosen theme swaps the semantic
 * color variables (see globals.css) and persists across visits; an inline
 * script in the root layout applies it before first paint.
 */
export default function ThemeToggle({
  theme,
  onToggle,
  isLightNavbar,
}: {
  theme: SiteTheme;
  onToggle: () => void;
  isLightNavbar: boolean;
}) {
  const next: SiteTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={onToggle}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
        isLightNavbar
          ? "text-(--color-surface-foreground) hover:bg-(--color-surface-foreground)/10"
          : "text-foreground hover:bg-foreground/10"
      }`}
    >
      {theme === "dark" ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
