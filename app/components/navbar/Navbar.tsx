"use client";

import {
  useState,
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
import FlowButton from "../ui/FlowButton";
import useNavbarTheme from "./useNavbarTheme";
import ThemeToggle from "./ThemeToggle";
import { NAVBAR_COLOR_TRANSITION } from "./sceneConfig";
import {
  getServerSiteTheme,
  readSiteTheme,
  readTargetSiteTheme,
  requestSiteTheme,
  subscribeSiteTheme,
  type SiteTheme,
} from "../theme/siteTheme";

/**
 * The sponsor wall's palette, for the bar to wear while it is over the wall.
 *
 * Declared inline on the <nav> rather than as a rule in globals.css: this is
 * one element's palette, switched by component state, and setting it here puts
 * it beyond any question of which selector wins on a bar that is simultaneously
 * wearing `data-theme`. Every color under the bar's light phase comes from
 * these two tokens, so the pair flips the whole thing at once.
 *
 * The ink matches the value the wall pins for itself (see the sponsor block in
 * globals.css) — near-black, the palette the sponsor artwork was drawn for.
 */
const PANEL_PALETTE = {
  "--theme-surface": "var(--sponsor-panel)",
  "--theme-surface-foreground": "#1a1a1a",
} as CSSProperties;

const NAV_LINKS = [
  { href: "#about", label: "ABOUT" },
  { href: "#team", label: "COMMUNITY" },
  { href: "#sponsors", label: "SPONSORS" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const siteTheme = useSyncExternalStore(
    subscribeSiteTheme,
    readSiteTheme,
    getServerSiteTheme,
  );
  // The navbar runs a full swap ahead of the page. It sits above the curtain,
  // and the curtain starts out already covering the bar — so from the click
  // onward the backdrop behind the navbar is the incoming color, and the bar
  // has to be wearing that palette to stay readable. `data-theme` on the <nav>
  // re-declares the theme variables for the whole subtree (see globals.css),
  // which flips every color under it in one frame.
  const targetTheme = useSyncExternalStore(
    subscribeSiteTheme,
    readTargetSiteTheme,
    getServerSiteTheme,
  );
  const theme = useNavbarTheme();
  // The panel phase is the light phase with its color pinned: both draw the
  // bar from the surface tokens, and PANEL_PALETTE is what pins those tokens
  // to the wall's white. The bar is fixed above the page, so it never sits
  // inside the wall's subtree and can't inherit the pin the way the wall's own
  // children do.
  const isPanelTheme = theme === "panel";
  const isLightTheme = theme !== "dark";
  // The white/black logo assets track the actual underlying color: the
  // "light" navbar phase sits on the surface color, which is dark when the
  // user picks the light site theme. Over the pinned panel the color behind
  // the bar is white in both themes, so the black logo is the only right one.
  const showBlackLogo =
    isPanelTheme || isLightTheme !== (targetTheme === "light");

  // Cross-fading mid-swap would put the bar through a washed-out blend right
  // as the curtain arrives behind it, so the swap snaps. Scrolling between
  // light and dark sections still gets the cross-fade.
  const isSwapping = targetTheme !== siteTheme;
  const colorTransition = isSwapping
    ? ""
    : `transition-colors ${NAVBAR_COLOR_TRANSITION}`;
  const opacityTransition = isSwapping
    ? ""
    : `transition-opacity ${NAVBAR_COLOR_TRANSITION}`;

  const toggleSiteTheme = () => {
    const next: SiteTheme = targetTheme === "dark" ? "light" : "dark";
    requestSiteTheme(next);
  };

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav
      data-theme={targetTheme}
      style={isPanelTheme ? PANEL_PALETTE : undefined}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:px-8 md:py-4"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 backdrop-blur-[2px] backdrop-saturate-150 ${colorTransition} ${
          isLightTheme
            ? "bg-(--theme-surface)/60"
            : "bg-(--theme-background)/60"
        }`}
      />
      <Link href="/" className="flex items-center">
        <span className="relative block h-6 w-33.5 md:h-8 md:w-44.5">
          <Image
            src="/white-hackutd-logo.svg"
            alt="HackUTD"
            width={2048}
            height={585}
            className={`absolute inset-0 h-6 w-auto md:h-8 ${opacityTransition} ${
              showBlackLogo ? "opacity-0" : "opacity-100"
            }`}
            priority
          />
          <Image
            src="/black-hackutd-logo.svg"
            alt="HackUTD"
            width={2048}
            height={585}
            className={`absolute inset-0 h-6 w-auto md:h-8 ${opacityTransition} ${
              showBlackLogo ? "opacity-100" : "opacity-0"
            }`}
            priority
          />
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`group relative pb-1 text-sm ${colorTransition} ${
              isLightTheme
                ? "text-(--theme-surface-foreground) hover:opacity-70"
                : "text-(--theme-foreground) hover:opacity-70"
            }`}
          >
            <span>{link.label}</span>
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-pink transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        ))}
        <ThemeToggle
          theme={targetTheme}
          onToggle={toggleSiteTheme}
          isLightNavbar={isLightTheme}
          colorTransition={colorTransition}
        />
        <FlowButton text="2026 Soon" href="https://zeroday.hackutd.co" newTab />
      </div>

      {/* Mobile controls */}
      <div className="relative z-50 flex items-center gap-2 md:hidden">
        <ThemeToggle
          theme={targetTheme}
          onToggle={toggleSiteTheme}
          isLightNavbar={isLightTheme}
          colorTransition={colorTransition}
        />
        <button
          type="button"
          className="flex h-8 w-8 flex-col items-end justify-center gap-1 overflow-visible"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span
            className={`block h-0.5 w-4 transition-transform duration-200 ${
              isLightTheme
                ? "bg-(--theme-surface-foreground)"
                : "bg-(--theme-foreground)"
            } ${isOpen ? "translate-y-1.5 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-4 transition-opacity duration-200 ${
              isLightTheme
                ? "bg-(--theme-surface-foreground)"
                : "bg-(--theme-foreground)"
            } ${isOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-4 transition-transform duration-200 ${
              isLightTheme
                ? "bg-(--theme-surface-foreground)"
                : "bg-(--theme-foreground)"
            } ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-13 z-40 flex flex-col items-center gap-8 bg-background/95 pt-16 text-foreground backdrop-blur-sm md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-xl hover:opacity-70 ${colorTransition}`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <FlowButton
            text="2026 Soon"
            href="https://zeroday.hackutd.co"
            newTab
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </nav>
  );
}
