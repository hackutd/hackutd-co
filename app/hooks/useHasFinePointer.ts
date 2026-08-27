"use client";

import { useSyncExternalStore } from "react";

/**
 * A pointing device that can hover and land on a precise point — i.e. a mouse
 * or trackpad, not a finger. This is the right gate for anything that replaces
 * the native cursor: `useIsMobile` also reports true for a narrow desktop
 * window, and hiding the cursor there without drawing a replacement would
 * leave the reader with nothing to aim.
 */
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia(FINE_POINTER_QUERY);
  mediaQuery.addEventListener("change", callback);

  return () => {
    mediaQuery.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function useHasFinePointer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
