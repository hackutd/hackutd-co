/**
 * Marks the element whose in-flow children are the page's scroll sections.
 * Read by the anchor below and declared once, on the page wrapper.
 */
export const SCROLL_ROOT_ATTR = "data-scroll-root";

type Anchor = {
  /** Index into the section list, in document order. */
  index: number;
  /** How far through that section the reader was, 0–1. */
  progress: number;
};

export type ScrollAnchor = {
  /** Record where the reader is. Cheap enough to call once per frame. */
  capture: () => void;
  /** Put the reader back where `capture` last saw them, in the new layout. */
  restore: () => void;
};

function documentTop(element: HTMLElement) {
  return element.getBoundingClientRect().top + window.scrollY;
}

/**
 * The page's scroll sections, in document order.
 *
 * The in-flow children of the scroll root are exactly those sections. Fixed
 * children — the navbar, the theme curtain, the revealed footer — sit outside
 * the scroll story, and their rects are viewport-relative, so they would not
 * yield a meaningful document offset.
 */
function readSections(): HTMLElement[] {
  const root = document.querySelector<HTMLElement>(`[${SCROLL_ROOT_ATTR}]`);

  if (!root) {
    return [];
  }

  return Array.from(root.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement &&
      window.getComputedStyle(child).position !== "fixed",
  );
}

/**
 * Keeps the reader's place in the page across a re-layout.
 *
 * Every section here is sized in viewport units — the hero alone is 250vh on
 * phones and 400vh from `md` up — so the scroll position, which the browser
 * keeps in pixels, points at a different part of the page after any resize. A
 * window drag can carry the reader several viewport-heights through the story
 * without them touching the scrollbar. Recording the position as a section plus
 * a fraction of that section, and restoring it once the new layout has been
 * measured, puts them back where they were.
 *
 * The anchor has to be recorded *before* the resize. By the time a `resize`
 * event fires the browser has already re-laid the page out, so reading the
 * position there would measure the new geometry against the old scroll offset —
 * which is the very mismatch this exists to undo.
 */
export function createScrollAnchor(): ScrollAnchor {
  let sections = readSections();
  let anchor: Anchor = { index: 0, progress: 0 };

  const capture = () => {
    const scrollY = window.scrollY;

    // Last section that starts at or above the reader is the one they are in.
    for (let index = sections.length - 1; index >= 0; index -= 1) {
      const section = sections[index];
      const top = documentTop(section);

      if (scrollY >= top || index === 0) {
        const height = Math.max(section.offsetHeight, 1);
        const progress = (scrollY - top) / height;

        anchor = { index, progress: Math.min(Math.max(progress, 0), 1) };
        return;
      }
    }
  };

  const restore = () => {
    // A breakpoint cross can replace a section's element outright, so the list
    // is re-read against the new layout before the recorded index is used.
    sections = readSections();

    const section = sections[anchor.index];

    if (!section) {
      return;
    }

    const height = Math.max(section.offsetHeight, 1);

    // Two-argument form: always instant, no dependence on `scroll-behavior`.
    window.scrollTo(0, documentTop(section) + anchor.progress * height);
  };

  capture();

  return { capture, restore };
}
