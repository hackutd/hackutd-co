"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getNavbarThemeOverride,
  NAVBAR_THEME_OVERRIDE_EVENT,
  type NavbarTheme,
  type NavbarThemeOverride,
} from "./navbarThemeOverride";

/**
 * Marks a section whose background is pinned to one color in both themes —
 * the sponsor wall (see the sponsor block in globals.css).
 */
const SPONSOR_PANEL_ATTR = "data-sponsor-panel";

function subscribeToOverride(callback: () => void) {
  window.addEventListener(NAVBAR_THEME_OVERRIDE_EVENT, callback);

  return () => {
    window.removeEventListener(NAVBAR_THEME_OVERRIDE_EVENT, callback);
  };
}

function getServerOverride(): NavbarThemeOverride {
  return null;
}

export default function useNavbarTheme(): NavbarTheme {
  const [sectionTheme, setSectionTheme] = useState<NavbarTheme>("dark");
  const overrideTheme = useSyncExternalStore(
    subscribeToOverride,
    getNavbarThemeOverride,
    getServerOverride,
  );

  useEffect(() => {
    const lightSections = document.querySelectorAll<HTMLElement>(
      '[data-navbar-theme="light"]',
    );

    if (lightSections.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const activeLightSections = new Set<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeLightSections.add(entry.target);
            return;
          }

          activeLightSections.delete(entry.target);
        });

        if (activeLightSections.size === 0) {
          setSectionTheme("dark");
          return;
        }

        // A section that pins its own color outranks a plain light one: its
        // panel stays put through a theme swap, so the bar over it has to too.
        const isOverPinnedPanel = [...activeLightSections].some((section) =>
          section.hasAttribute(SPONSOR_PANEL_ATTR),
        );

        setSectionTheme(isOverPinnedPanel ? "panel" : "light");
      },
      {
        root: null,
        rootMargin: "0px 0px -94% 0px",
        threshold: 0,
      },
    );

    lightSections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      activeLightSections.clear();
    };
  }, []);

  return overrideTheme ?? sectionTheme;
}
