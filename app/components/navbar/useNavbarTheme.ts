"use client";

import { useEffect, useState } from "react";
import {
  NAVBAR_THEME_OVERRIDE_EVENT,
  type NavbarTheme,
  type NavbarThemeOverride,
} from "./navbarThemeOverride";

export default function useNavbarTheme(): NavbarTheme {
  const [sectionTheme, setSectionTheme] = useState<NavbarTheme>("dark");
  const [overrideTheme, setOverrideTheme] = useState<NavbarThemeOverride>(null);

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

  useEffect(() => {
    const handleOverride = (event: Event) => {
      const { detail } = event as CustomEvent<{ theme: NavbarThemeOverride }>;
      setOverrideTheme(detail.theme);
    };

    window.addEventListener(
      NAVBAR_THEME_OVERRIDE_EVENT,
      handleOverride as EventListener,
    );

    return () => {
      window.removeEventListener(
        NAVBAR_THEME_OVERRIDE_EVENT,
        handleOverride as EventListener,
      );
    };
  }, []);

  return overrideTheme ?? sectionTheme;
}
