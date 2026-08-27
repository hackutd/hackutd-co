"use client";

import {
  useState,
  useEffect,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
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
  { href: "#mission", label: "MISSION" },
  { href: "#about", label: "ABOUT" },
  { href: "#team", label: "COMMUNITY" },
  { href: "#sponsors", label: "PAST SPONSORS" },
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
  // Nothing under the bar changes when the theme swaps here: the sponsor wall
  // is pinned to one color in both themes because the artwork on it is, and
  // the footer carries that same panel forward. Offering the click there sends
  // a curtain across a section that ends up exactly as it started, which reads
  // as the control being broken rather than as a theme having changed. The
  // page above still swaps — the reader just has to scroll back to it to ask.
  const isThemeLocked = isPanelTheme;
  const isLightTheme = theme !== "dark";
  // The actual color behind the bar, which the navbar phase alone doesn't give:
  // the "light" phase sits on the surface color, and that is dark when the user
  // picks the light site theme. Over the pinned panel the color behind the bar
  // is white in both themes.
  //
  // Both the logo asset and the sun/moon icon hang off this rather than off the
  // theme — the black logo and the moon are the ones that read on a light
  // backdrop, whichever theme the page happens to be wearing.
  const isLightBackground =
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

  /**
   * Puts the reader back at the hero.
   *
   * The site is a single page, so the logo is a scroll-to-top control wearing
   * a link's clothes — and Next's router will not do that job. Its scroll pass
   * only fires for a navigation that actually changes something: from "/" to
   * "/" the tree is identical, nothing new mounts, and the click is swallowed
   * with the page left wherever it was. The reader only ever sees it work
   * after a section link has put a hash in the URL, which is why it looks
   * intermittent. Worse, on that hash-to-"/" path the router carries the old
   * fragment forward when the new URL has none, so an unconsumed "#mission"
   * can pull the page back down to the mission instead of the top.
   *
   * Driving the scroll here settles both. The href stays for middle-click,
   * cmd-click and crawlers, so only an unmodified left click is intercepted.
   */
  const scrollToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setIsOpen(false);
    // The overlay locks the body while it is open and the effect below does
    // not unlock it until after this commit, so clear it inline — otherwise a
    // tap on the logo with the mobile menu open scrolls a frozen page.
    document.body.style.overflow = "";
    // Instant, to match the plain anchor jumps the section links do.
    window.scrollTo(0, 0);

    // Drop the section hash so a reload starts at the top too, and so the
    // router has no stale fragment to reuse. replaceState rather than a push:
    // the click is a jump within one page, not a place to go back to.
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
    }
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
      <Link href="/" onClick={scrollToTop} className="flex items-center">
        <span className="relative block h-6 w-33.5 md:h-8 md:w-44.5">
          <Image
            src="/brand/white-hackutd-logo.svg"
            alt="HackUTD"
            width={2048}
            height={585}
            className={`absolute inset-0 h-6 w-auto md:h-8 ${opacityTransition} ${
              isLightBackground ? "opacity-0" : "opacity-100"
            }`}
            priority
          />
          <Image
            src="/brand/black-hackutd-logo.svg"
            alt="HackUTD"
            width={2048}
            height={585}
            className={`absolute inset-0 h-6 w-auto md:h-8 ${opacityTransition} ${
              isLightBackground ? "opacity-100" : "opacity-0"
            }`}
            priority
          />
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">
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
          isLightBackground={isLightBackground}
          isDisabled={isThemeLocked}
          colorTransition={colorTransition}
        />
        <FlowButton
          text="HackUTD 2026"
          href="https://zeroday.hackutd.co"
          newTab
        />
      </div>

      {/* Mobile controls */}
      <div className="relative z-50 flex items-center gap-2 md:hidden">
        <ThemeToggle
          theme={targetTheme}
          onToggle={toggleSiteTheme}
          isLightNavbar={isLightTheme}
          isLightBackground={isLightBackground}
          isDisabled={isThemeLocked}
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
            text="HackUTD 2026"
            href="https://zeroday.hackutd.co"
            newTab
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </nav>
  );
}
