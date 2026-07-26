"use client";

export type SiteTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "site-theme";

const THEME_CHANGE_EVENT = "site-theme-change";
const THEME_REQUEST_EVENT = "site-theme-request";

export function subscribeSiteTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

export function readSiteTheme(): SiteTheme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Set from the moment a swap is asked for until its transition finishes. */
let pendingTheme: SiteTheme | null = null;

/**
 * The theme the controls should present: the one being transitioned to while a
 * swap is in flight, otherwise the one actually applied. Controls read this so
 * they answer the click immediately instead of waiting out the transition;
 * anything painting against the page itself wants `readSiteTheme()`.
 */
export function readTargetSiteTheme(): SiteTheme {
  return pendingTheme ?? readSiteTheme();
}

export function getServerSiteTheme(): SiteTheme {
  return "dark";
}

/**
 * Swaps the theme immediately. Callers that want the curtain transition go
 * through `requestSiteTheme()` instead — the curtain calls this at the moment
 * it has the page fully covered.
 */
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
 * Asks whoever owns the transition (ThemeCurtain) to run it and flip the
 * theme partway through. The listener claims the request with
 * `preventDefault()`; with no curtain mounted nothing claims it and the theme
 * changes on the spot.
 *
 * Requests arriving mid-transition are dropped here rather than in the curtain,
 * so the pending theme can never disagree with what is actually going to be
 * applied — the controls read it the instant it is set.
 */
export function requestSiteTheme(theme: SiteTheme) {
  if (pendingTheme) {
    return;
  }

  pendingTheme = theme;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));

  const request = new CustomEvent<SiteTheme>(THEME_REQUEST_EVENT, {
    detail: theme,
    cancelable: true,
  });

  if (window.dispatchEvent(request)) {
    applySiteTheme(theme);
    settleSiteThemeRequest();
  }
}

/** Called by the transition owner once its animation has finished. */
export function settleSiteThemeRequest() {
  if (!pendingTheme) {
    return;
  }

  pendingTheme = null;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeSiteThemeRequest(
  onRequest: (theme: SiteTheme) => void,
) {
  const handler = (event: Event) => {
    event.preventDefault();
    onRequest((event as CustomEvent<SiteTheme>).detail);
  };

  window.addEventListener(THEME_REQUEST_EVENT, handler);
  return () => window.removeEventListener(THEME_REQUEST_EVENT, handler);
}
