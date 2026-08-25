import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let isConfigured = false;

/**
 * Milliseconds of quiet after the last resize event before we re-measure.
 * Longer than ScrollTrigger's own 0.2s resize delay so we run after it rather
 * than against it, and long enough for a breakpoint-driven React re-render to
 * have committed its new layout.
 */
const RESIZE_REFRESH_DELAY = 250;

/**
 * Fraction of the viewport height a touch device may change by without counting
 * as a real resize — matches the threshold ScrollTrigger's own
 * `ignoreMobileResize` uses to ignore the address bar showing and hiding.
 */
const MOBILE_RESIZE_TOLERANCE = 0.25;

/**
 * Re-measures every trigger after a resize.
 *
 * ScrollTrigger defers its own resize refresh whenever it believes a scroll is
 * in progress, and the flag it tests for that is only ever cleared from inside
 * a scroll-driven update — so once the reader has scrolled at all, it stays set
 * and the deferral never lifts on its own. Left alone, every resize leaves every
 * trigger measured against the old viewport until the next scroll: the page's
 * section heights are all viewport-relative, so the hero strands in its whiteout
 * and the screen stays blank until a scroll finally releases the queued refresh.
 *
 * `ScrollTrigger.refresh()` with no argument skips that deferral. Passing `true`
 * does not — it routes back through the resize path and gets deferred again.
 */
function refreshOnResize() {
  let pending = 0;
  let baseWidth = window.innerWidth;
  let baseHeight = window.innerHeight;

  window.addEventListener("resize", () => {
    // Honour ignoreMobileResize: on touch-only devices the address bar sliding
    // in and out must not force a re-measure mid-scroll.
    if (
      ScrollTrigger.isTouch === 1 &&
      window.innerWidth === baseWidth &&
      Math.abs(window.innerHeight - baseHeight) <=
        window.innerHeight * MOBILE_RESIZE_TOLERANCE
    ) {
      return;
    }

    window.clearTimeout(pending);
    pending = window.setTimeout(() => {
      baseWidth = window.innerWidth;
      baseHeight = window.innerHeight;
      ScrollTrigger.refresh();
    }, RESIZE_REFRESH_DELAY);
  });
}

export function configureScrollTrigger() {
  if (isConfigured) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, CustomEase);
  ScrollTrigger.config({
    ignoreMobileResize: true,
  });

  if (typeof window !== "undefined") {
    refreshOnResize();
  }

  isConfigured = true;
}
