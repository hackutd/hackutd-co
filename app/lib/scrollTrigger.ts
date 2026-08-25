import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { createScrollAnchor } from "./scrollAnchor";

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
  const anchor = createScrollAnchor();

  let pending = 0;
  let captureFrame = 0;
  let baseWidth = window.innerWidth;
  let baseHeight = window.innerHeight;
  // Set the moment a resize arrives and held until the reader has been put
  // back. Shrinking the document makes the browser clamp the scroll position,
  // which fires a scroll event — tracking that would overwrite the anchor with
  // a reading taken from the new geometry, which is exactly what it exists to
  // survive.
  let isResizing = false;

  window.addEventListener(
    "scroll",
    () => {
      if (isResizing || captureFrame) {
        return;
      }

      captureFrame = window.requestAnimationFrame(() => {
        captureFrame = 0;

        if (!isResizing) {
          anchor.capture();
        }
      });
    },
    { passive: true },
  );

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

    isResizing = true;
    window.clearTimeout(pending);

    pending = window.setTimeout(() => {
      baseWidth = window.innerWidth;
      baseHeight = window.innerHeight;

      // Order matters: re-measure against the new layout, put the reader back
      // where they were in it, then push that position through every trigger.
      // The last step is not optional — ScrollTrigger's update pass runs off
      // scroll events rather than the ticker, so without it the triggers would
      // stay on the pre-restore position until the reader scrolled.
      ScrollTrigger.refresh();
      anchor.restore();
      ScrollTrigger.update();

      // Let the scroll events from restore() land before tracking resumes.
      window.requestAnimationFrame(() => {
        isResizing = false;
      });
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
