import type Lenis from "lenis";

let instance: Lenis | null = null;

/** Set the active Lenis instance. */
export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

/** Read the active Lenis instance. */
export function getLenis() {
  return instance;
}

/** Jump immediately while keeping Lenis synchronized when it is active. */
export function scrollToImmediate(y: number) {
  if (instance) {
    instance.scrollTo(y, { immediate: true, force: true });
    return;
  }

  window.scrollTo(0, y);
}
