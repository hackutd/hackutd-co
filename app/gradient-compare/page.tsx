"use client";

/**
 * TEMPORARY dev-only A/B page — http://localhost:3000/gradient-compare
 *
 * Renders the old three.js sphere next to the 2D replacement so the two can be
 * compared at the sizes they actually ship at. Delete this route (and
 * `BrandShaderBackground.tsx`) once the 2D tuning is signed off.
 */

import { useEffect, useState } from "react";
import BrandGradientBackground from "@/app/components/background/BrandGradientBackground";
import BrandShaderBackground from "@/app/components/background/BrandShaderBackground";
import Footer from "@/app/components/footer/Footer";
import { BRAND_GRADIENT_DEFAULTS } from "@/app/components/background/brandGradientShader";
import { FOOTER_GRADIENT } from "@/app/components/footer/sceneConfig";

function Fps() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames += 1;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span className="rounded bg-black/60 px-2 py-1 font-mono text-xs text-white">
      page {fps} fps
    </span>
  );
}

export default function GradientComparePage() {
  const [showOld, setShowOld] = useState(true);
  const [showNew, setShowNew] = useState(true);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-light">Footer gradient — 3D vs 2D</h1>
          <Fps />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showOld}
              onChange={(event) => setShowOld(event.target.checked)}
            />
            mount 3D
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showNew}
              onChange={(event) => setShowNew(event.target.checked)}
            />
            mount 2D
          </label>
          <p className="w-full text-sm text-white/60">
            Toggle one off at a time and watch the fps counter — that is the
            cost difference. Both panels are footer-sized.
          </p>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm uppercase tracking-widest text-white/50">
            Old — three.js sphere
          </h2>
          <div className="relative h-[400px] w-full overflow-hidden rounded-lg [container-type:size]">
            {showOld && (
              <BrandShaderBackground
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5]"
                style={{
                  width: "max(100cqw, 100cqh)",
                  height: "max(100cqw, 100cqh)",
                }}
                lazyLoad={false}
                shaderProps={{
                  cDistance: 5.4,
                  cameraZoom: 15,
                  positionX: 0.08,
                  positionY: -0.02,
                }}
              />
            )}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm uppercase tracking-widest text-white/50">
            New — 2D fragment shader
          </h2>
          <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
            {showNew && (
              <BrandGradientBackground
                className="absolute inset-0"
                lazyLoad={false}
                tuning={FOOTER_GRADIENT}
              />
            )}
          </div>
          <h2 className="mt-6 text-sm uppercase tracking-widest text-white/50">
            The real footer
          </h2>
          <Footer shaderMount="on" />
          <pre className="overflow-x-auto rounded bg-black/50 p-3 text-xs text-white/70">
            {JSON.stringify(
              { ...BRAND_GRADIENT_DEFAULTS, ...FOOTER_GRADIENT },
              null,
              2,
            )}
          </pre>
        </section>
      </div>
    </main>
  );
}
