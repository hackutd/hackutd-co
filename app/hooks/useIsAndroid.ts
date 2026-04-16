"use client";

import { useSyncExternalStore } from "react";

function getSnapshot() {
  return /android/i.test(navigator.userAgent);
}

function getServerSnapshot() {
  return false;
}

// No-op subscribe: UA string never changes after mount.
function subscribe(callback: () => void) {
  return () => {};
}

export function useIsAndroid() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
