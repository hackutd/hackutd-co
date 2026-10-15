"use client";

import poster from "@/app/assets/background/brand-gradient-poster.webp";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";

// Captured from the shader props in BrandShaderBackground at commit 916be9c.
export default function BrandGradientVideo() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <video
      aria-hidden
      muted
      loop
      playsInline
      autoPlay={!prefersReducedMotion}
      preload={prefersReducedMotion ? "none" : "auto"}
      poster={poster.src}
      className="pointer-events-none h-full w-full object-cover"
    >
      <source src="/videos/brand-gradient.webm" type="video/webm" />
      <source src="/videos/brand-gradient.mp4" type="video/mp4" />
    </video>
  );
}
