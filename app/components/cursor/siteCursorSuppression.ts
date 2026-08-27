"use client";

/**
 * Lets a section take the pointer over from the site cursor.
 *
 * The mission statement draws its own difference-blended disc while the reader
 * is inside it, and two difference layers stacked do not read as two cursors —
 * the upper one inverts the lower, so the small disc shows up as a hole
 * punched in the large one. Whoever draws a local cursor holds a claim here
 * for as long as it is on screen, and the site cursor fades out behind it.
 *
 * Claims are counted rather than flagged, so overlapping regions can each
 * release their own without cutting the other short.
 */

export const SITE_CURSOR_SUPPRESSION_EVENT = "site-cursor-suppression";

export type SiteCursorSuppressionEvent = CustomEvent<{ suppressed: boolean }>;

let claims = 0;

/** Whether anything is currently holding the pointer, for late subscribers. */
export function isSiteCursorSuppressed() {
  return claims > 0;
}

function publish() {
  window.dispatchEvent(
    new CustomEvent(SITE_CURSOR_SUPPRESSION_EVENT, {
      detail: { suppressed: isSiteCursorSuppressed() },
    }),
  );
}

/** Hides the site cursor until the returned release is called. */
export function suppressSiteCursor(): () => void {
  claims += 1;

  if (claims === 1) {
    publish();
  }

  let isReleased = false;

  return () => {
    if (isReleased) {
      return;
    }

    isReleased = true;
    claims -= 1;

    if (claims === 0) {
      publish();
    }
  };
}
