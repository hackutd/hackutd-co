"use client";

import { useId, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { THEME_TOGGLE_ICON } from "../theme/sceneConfig";
import type { SiteTheme } from "../theme/siteTheme";

/** The eight dots ringing the sun, drawn as one path. */
const RAYS_PATH =
  "M18.3 3.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3S14.7.9 16 .9s2.3 1 2.3 2.3zm-4.6 25.6c0-1.3 1-2.3 2.3-2.3s2.3 1 2.3 2.3-1 2.3-2.3 2.3-2.3-1-2.3-2.3zm15.1-10.5c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zM3.2 13.7c1.3 0 2.3 1 2.3 2.3s-1 2.3-2.3 2.3S.9 17.3.9 16s1-2.3 2.3-2.3zm5.8-7C9 7.9 7.9 9 6.7 9S4.4 8 4.4 6.7s1-2.3 2.3-2.3S9 5.4 9 6.7zm16.3 21c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3zm2.4-21c0 1.3-1 2.3-2.3 2.3S23 7.9 23 6.7s1-2.3 2.3-2.3 2.4 1 2.4 2.3zM6.7 23C8 23 9 24 9 25.3s-1 2.3-2.3 2.3-2.3-1-2.3-2.3 1-2.3 2.3-2.3z";

/** Cut-out that slides across the disc to leave a crescent behind. */
const MASK_PATH = "M0-11h25a1 1 0 0017 13v30H0Z";

/**
 * Site-wide light/dark toggle button. The chosen theme swaps the semantic
 * color variables (see globals.css) and persists across visits; an inline
 * script in the root layout applies it before first paint.
 *
 * It goes inert over the pinned sponsor panel — see `isDisabled`.
 *
 * The icon morphs between a dotted sun and a crescent moon: the disc grows,
 * the ring of dots shrinks away, and a masking shape slides in to bite the
 * crescent out.
 *
 * Which of the two it settles on is set by the backdrop rather than by the
 * theme — sun over a dark one, moon over a light one — so the same morph plays
 * for a scroll that carries the bar onto the lit surface as for a click.
 *
 * The navbar resolves that backdrop against the *target* theme, not the applied
 * one. The curtain doesn't flip the page until it has covered it, and the
 * button stays visible above the curtain the whole time — driving the morph off
 * the applied theme would leave the button sitting dead for the length of the
 * drop before it reacted.
 */
export default function ThemeToggle({
  theme,
  onToggle,
  isLightNavbar,
  isLightBackground,
  isDisabled,
  colorTransition,
}: {
  theme: SiteTheme;
  onToggle: () => void;
  isLightNavbar: boolean;
  /**
   * Whether the color actually behind the bar is a light one. The navbar phase
   * alone doesn't answer that: its light phase rides the surface color, and the
   * surface is dark under the light site theme.
   */
  isLightBackground: boolean;
  /**
   * Set where a swap would change nothing the reader can see — over the pinned
   * sponsor panel. The button stays in place and keeps its contrast, it just
   * stops offering the click.
   */
  isDisabled: boolean;
  /** Supplied by the navbar so the button snaps and cross-fades with the bar. */
  colorTransition: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const maskRef = useRef<SVGPathElement>(null);
  const discRef = useRef<SVGCircleElement>(null);
  const raysRef = useRef<SVGGElement>(null);
  const hasRendered = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const next: SiteTheme = theme === "dark" ? "light" : "dark";
  const isDark = theme === "dark";
  // The two agree at the top of the page — the dark hero shows a sun — but the
  // background crosses to the lit surface and on to the sponsor wall further
  // down, and the icon follows the background rather than the theme.
  const showMoon = isLightBackground;

  // useId can contain characters that aren't valid in a url(#…) reference, so
  // keep only the part that is. Two toggles are mounted at once on mobile, and
  // a shared id would point both masks at the same node.
  const maskId = `theme-toggle-mask-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useGSAP(
    () => {
      // The markup renders the sun, so the first pass just snaps to whichever
      // icon the backdrop calls for instead of animating into it.
      const duration =
        hasRendered.current && !prefersReducedMotion
          ? THEME_TOGGLE_ICON.duration
          : 0;
      hasRendered.current = true;

      const ease = THEME_TOGGLE_ICON.ease;
      // A click can't arrive mid-morph — the theme request is dropped until the
      // curtain settles — but a scroll can: the reader only has to hover the
      // edge where the background crosses over. Each new morph takes sole
      // ownership of its target so a reversal picks up from wherever the last
      // one had got to, instead of two tweens writing the same property.
      const overwrite = true;

      gsap.to(maskRef.current, {
        x: showMoon ? THEME_TOGGLE_ICON.maskOffset.x : 0,
        y: showMoon ? THEME_TOGGLE_ICON.maskOffset.y : 0,
        duration,
        ease,
        overwrite,
      });
      gsap.to(discRef.current, {
        scale: showMoon ? THEME_TOGGLE_ICON.discScale : 1,
        duration,
        ease,
        overwrite,
      });
      gsap.to(raysRef.current, {
        scale: showMoon ? THEME_TOGGLE_ICON.rayScale : 1,
        opacity: showMoon ? 0 : 1,
        duration,
        ease,
        overwrite,
      });
    },
    { dependencies: [showMoon, prefersReducedMotion], scope: buttonRef },
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={`Switch to ${next} mode`}
      aria-pressed={isDark}
      disabled={isDisabled}
      onClick={onToggle}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full active:scale-95 disabled:cursor-default disabled:hover:bg-transparent ${colorTransition} ${
        isLightNavbar
          ? "text-(--theme-surface-foreground) hover:bg-(--theme-surface-foreground)/10"
          : "text-(--theme-foreground) hover:bg-(--theme-foreground)/10"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="h-5 w-5"
        fill="currentColor"
        strokeLinecap="round"
      >
        <clipPath id={maskId}>
          <path ref={maskRef} d={MASK_PATH} />
        </clipPath>
        <g clipPath={`url(#${maskId})`}>
          <circle ref={discRef} cx="16" cy="16" r="8" />
          <g ref={raysRef} stroke="currentColor" strokeWidth="1.5">
            <path d={RAYS_PATH} />
          </g>
        </g>
      </svg>
    </button>
  );
}
