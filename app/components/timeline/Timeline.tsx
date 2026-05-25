"use client";

import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import RocketTrailAnimation from "./RocketTrailAnimation";
import { TIMELINE_LAYOUT } from "./sceneConfig";

configureScrollTrigger();

export default function Timeline() {
  return (
    <section
      id="hackathons"
      className={`relative ${TIMELINE_LAYOUT.minHeight}`}
    >
      <div
        className={`sticky top-0 overflow-hidden ${TIMELINE_LAYOUT.stickyViewportHeight}`}
      >
        <RocketTrailAnimation />
      </div>
    </section>
  );
}
