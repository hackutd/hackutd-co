"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ColorChangeCard from "@/components/ui/color-change-card";
import { projects } from "@/app/data/projects";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import {
  PROJECT_ART,
  PROJECTS_LAYOUT,
  PROJECTS_REVEAL,
} from "./sceneConfig";

gsap.registerPlugin(useGSAP);
configureScrollTrigger();

export default function Projects() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion) {
        return;
      }

      const revealItems = gsap.utils.toArray<HTMLElement>(
        "[data-project-reveal]",
      );

      gsap.from(revealItems, {
        ...PROJECTS_REVEAL.from,
        duration: PROJECTS_REVEAL.duration,
        stagger: PROJECTS_REVEAL.stagger,
        ease: PROJECTS_REVEAL.ease,
        scrollTrigger: {
          trigger: section,
          start: PROJECTS_REVEAL.start,
          once: true,
        },
      });
    },
    {
      scope: sectionRef,
      dependencies: [prefersReducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      aria-labelledby="projects-heading"
      data-section-gradient="projects"
      className={PROJECTS_LAYOUT.section}
    >
      <h2
        id="projects-heading"
        data-project-reveal
        className="pointer-events-none absolute left-8 top-20 font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-normal leading-[0.9] tracking-[-0.045em] text-foreground sm:left-10 md:top-24 lg:left-12"
      >
        Projects
      </h2>

      <div className={PROJECTS_LAYOUT.container}>
        <div className={PROJECTS_LAYOUT.grid}>
          {projects.map((project, index) => {
            const art = PROJECT_ART[project.name as keyof typeof PROJECT_ART];

            return (
              <ColorChangeCard
                key={project.name}
                eyebrow={project.label}
                heading={project.name}
                description={project.description}
                href={project.link}
                imageSrc={project.image}
                imageAlt={`${project.name} logo`}
                imageWidth={project.imageWidth}
                imageHeight={project.imageHeight}
                imageClassName={art.imageClassName}
                imageTreatmentClassName={art.imageTreatmentClassName}
                accent={art.accent}
                index={index + 1}
                prefersReducedMotion={prefersReducedMotion}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
