"use client";

export type NavbarTheme = "light" | "dark";
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
