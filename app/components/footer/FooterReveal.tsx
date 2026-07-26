"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import Footer from "./Footer";

configureScrollTrigger();

function setFooterInteractivity(footer: HTMLElement, isInteractive: boolean) {
  footer.inert = !isInteractive;

  if (isInteractive) {
    footer.removeAttribute("aria-hidden");
  } else {
    footer.setAttribute("aria-hidden", "true");
  }
}

export default function FooterReveal() {
  const revealRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const reveal = revealRef.current;
      const footer = footerRef.current;

      if (!reveal || !footer || prefersReducedMotion) {
        return;
      }

      const syncSpacerHeight = () => {
        reveal.style.height = `${footer.offsetHeight}px`;
      };

      syncSpacerHeight();

      gsap.set(footer, { autoAlpha: 0 });

      let isFooterVisible = false;
      let isFooterInteractive = false;

      const updateFooterState = (isVisible: boolean, isInteractive: boolean) => {
        if (isFooterVisible !== isVisible) {
          isFooterVisible = isVisible;
          gsap.set(footer, { autoAlpha: isVisible ? 1 : 0 });
        }

        if (isFooterInteractive !== isInteractive) {
          isFooterInteractive = isInteractive;
          setFooterInteractivity(footer, isInteractive);
        }
      };

      setFooterInteractivity(footer, false);
      updateFooterState(false, false);

      const trigger = ScrollTrigger.create({
        trigger: reveal,
        start: "top bottom",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          updateFooterState(
            self.isActive || self.progress > 0,
            self.progress > 0.98,
          );
        },
        onRefresh: (self) => {
          updateFooterState(
            self.isActive || self.progress > 0,
            self.progress > 0.98,
          );
        },
        onLeave: () => updateFooterState(true, true),
        onLeaveBack: () => updateFooterState(false, false),
      });

      let lastFooterHeight = footer.offsetHeight;
      const debouncedRefresh = gsap.delayedCall(0.2, () => {
        syncSpacerHeight();
        ScrollTrigger.refresh();
      });
      debouncedRefresh.pause();

      const resizeObserver = new ResizeObserver(() => {
        if (footer.offsetHeight === lastFooterHeight) {
          return;
        }
        lastFooterHeight = footer.offsetHeight;
        debouncedRefresh.restart(true);
      });
      resizeObserver.observe(footer);

      return () => {
        resizeObserver.disconnect();
        debouncedRefresh.kill();
        trigger.kill();
      };
    },
    { dependencies: [prefersReducedMotion], revertOnUpdate: true },
  );

  if (prefersReducedMotion) {
    return <Footer className="relative z-10" />;
  }

  return (
    <>
      <div ref={revealRef} aria-hidden="true" className="pointer-events-none" />
      <Footer
        ref={footerRef}
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-0 opacity-0"
      />
    </>
  );
}
