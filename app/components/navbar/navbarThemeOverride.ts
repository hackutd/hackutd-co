"use client";

/**
 * Which palette the navbar wears.
 *
 * - `dark` — over the page background.
 * - `light` — over the surface color, wherever the site theme points it.
 * - `panel` — over the sponsor wall, whose color is pinned in both themes
 *   (see the sponsor block in globals.css). The bar has to ignore the site
 *   theme there for the same reason the wall does.
 */
export type NavbarTheme = "light" | "dark" | "panel";
export type NavbarThemeOverride = NavbarTheme | null;

export const NAVBAR_THEME_OVERRIDE_EVENT = "navbar-theme-override";

let currentOverride: NavbarThemeOverride = null;

/** Last dispatched override, so late subscribers can sync on mount. */
export function getNavbarThemeOverride(): NavbarThemeOverride {
  return currentOverride;
}

export function dispatchNavbarThemeOverride(theme: NavbarThemeOverride) {
  currentOverride = theme;
  window.dispatchEvent(
    new CustomEvent(NAVBAR_THEME_OVERRIDE_EVENT, {
      detail: { theme },
    }),
  );
}
