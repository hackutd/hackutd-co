"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getNavbarThemeOverride,
  NAVBAR_THEME_OVERRIDE_EVENT,
  type NavbarTheme,
  type NavbarThemeOverride,
} from "./navbarThemeOverride";

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

        setSectionTheme(activeLightSections.size > 0 ? "light" : "dark");
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
