"use client";

export type NavbarTheme = "light" | "dark";
export type NavbarThemeOverride = NavbarTheme | null;

export const NAVBAR_THEME_OVERRIDE_EVENT = "navbar-theme-override";

export function dispatchNavbarThemeOverride(theme: NavbarThemeOverride) {
  window.dispatchEvent(
    new CustomEvent(NAVBAR_THEME_OVERRIDE_EVENT, {
      detail: { theme },
    }),
  );
}
