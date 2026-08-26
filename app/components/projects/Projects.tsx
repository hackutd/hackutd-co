"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { projects } from "@/app/data/projects";
import { usePrefersReducedMotion } from "@/app/hooks/usePrefersReducedMotion";
import { configureScrollTrigger } from "@/app/lib/scrollTrigger";
import { PROJECT_IMAGE, PROJECTS_LAYOUT, PROJECTS_REVEAL } from "./sceneConfig";

configureScrollTrigger();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ProjectNumber({ n, small }: { n: number; small?: boolean }) {
  const [a, b] = pad(n);
  const size = small ? PROJECTS_LAYOUT.compactNumeral : PROJECTS_LAYOUT.featuredNumeral;
  const offset = small ? "mt-1" : "mt-2";
  return (
    <div className="absolute right-10 top-0 flex items-start select-none leading-none text-foreground/[0.07] font-serif">
      <span className={`${size} font-light`}>{a}</span>
      <span className={`${offset} ${size} font-light`}>{b}</span>
    </div>
  );
}

function LearnMoreLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent"
    >
      <span className="relative pb-0.5">
        Learn More
        <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
      </span>
      <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
    </a>
  );
}

export default function Projects() {
  const [featured, ...rest] = projects;
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion) {
        return;
      }

      const cards = gsap.utils.toArray<HTMLElement>("[data-project-card]");

      gsap.from(cards, {
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
    { scope: sectionRef, dependencies: [prefersReducedMotion] },
  );

  return (
    <section
      id="projects"
      ref={sectionRef}
      data-section-gradient="projects"
      className="px-8 py-32"
    >
      <div className={PROJECTS_LAYOUT.grid}>
        <div
          data-project-card
          className="relative flex flex-col rounded-3xl border border-foreground/10 bg-(--color-card) px-8 pb-8 pt-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
        >
          <ProjectNumber n={1} />
          <div className="flex flex-1 items-center justify-center py-12">
            <Image
              src={featured.image}
              alt={featured.name}
              width={featured.imageWidth}
              height={featured.imageHeight}
              className={PROJECT_IMAGE.featured}
            />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase text-muted/60">{featured.label}</p>
            <h3 className="text-3xl font-medium">{featured.name}</h3>
            <p className="mt-3 text-sm text-muted/60">{featured.description}</p>
            <LearnMoreLink href={featured.link} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {rest.map((project, i) => (
            <div
              key={project.name}
              data-project-card
              className={`relative flex flex-1 flex-row items-end justify-between rounded-3xl border border-foreground/10 bg-(--color-card) shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] ${PROJECTS_LAYOUT.compactCardPadding}`}
            >
              <ProjectNumber n={i + 2} small />
              <div className="min-w-0">
                <p className="mb-1 text-xs uppercase text-muted/60">{project.label}</p>
                <h3 className="text-3xl font-light">{project.name}</h3>
                <p className="mt-3 text-sm text-muted/60">{project.description}</p>
                <LearnMoreLink href={project.link} />
              </div>
              <Image
                src={project.image}
                alt={project.name}
                width={project.imageWidth}
                height={project.imageHeight}
                className={`-mr-4 shrink-0 self-center ${PROJECT_IMAGE.sizeOverrides[project.name] ?? PROJECT_IMAGE.compact} ${PROJECT_IMAGE.treatments[project.name] ?? ""}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
