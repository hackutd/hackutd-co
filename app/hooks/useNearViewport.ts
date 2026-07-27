"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Tracks whether an element has come within `rootMargin` of the viewport.
 *
 * Meant for pre-mounting expensive children (WebGL canvases) so they can
 * initialise and paint their first frame *before* they are seen. Point it at an
 * element that is not clipped by an `overflow-hidden` ancestor — an
 * IntersectionObserver on a clipped target only reports an intersection once
 * the target is already inside the clip box, which is far too late.
 */
export function useNearViewport(
  ref: RefObject<Element | null>,
  rootMargin = "100%",
) {
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsNear(entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return isNear;
}
