"use client";

import { RuixenGradientFooter } from "@/app/components/ui/ruixen-gradient-footer";
import { FOOTER_GRADIENT } from "./sceneConfig";

type FooterLink = {
  label: string;
  href: string;
};

const links: FooterLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/hackutd/" },
  { label: "Twitter", href: "https://x.com/hackutd" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/hackutd/" },
  { label: "YouTube", href: "https://www.youtube.com/@realhackutd" },
  { label: "GitHub", href: "https://github.com/hackutd" },
  { label: "Contact", href: "mailto:hello@hackutd.co" },
];

const resourceLinks: FooterLink[] = [
  { label: "HackUTD Guide", href: "https://guide.hackutd.co/" },
  {
    label: "MLH Code of Conduct",
    href: "https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md",
  },
];

const linkClassName =
  "group relative pb-1 text-xs font-light uppercase tracking-[0.08em] text-surface-foreground/60 transition-colors duration-300 hover:text-surface-foreground sm:text-sm";

/**
 * The animated underline every footer link wears — the same purple-to-pink
 * sweep the sponsor wall's links use, so the two sections rhyme.
 */
function LinkUnderline() {
  return (
    <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-linear-to-r from-purple to-pink transition-transform duration-300 group-hover:scale-x-100" />
  );
}

/**
 * The page's last section.
 *
 * The wall of sponsor logos above it is the one section pinned to a single
 * colour in both themes (see the sponsor block in globals.css), and the footer
 * carries that same panel forward — `data-sponsor-panel` re-declares the
 * surface tokens so `bg-surface` and `text-surface-foreground` resolve against
 * the wall's white here too, and the join between the two never reads as a
 * step. `data-navbar-theme` hands the bar the matching palette on the
 * reduced-motion path, where the page background isn't driving it.
 *
 * The rainbow itself is fixed to the foot of the viewport and rises over the
 * last `FOOTER_GRADIENT.height` of scroll, landing at full height exactly as
 * the page bottoms out. The footer reserves that same height under its content
 * so the glow arrives beneath the wordmark rather than across it.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <div
      className="relative bg-surface text-surface-foreground"
      data-section-gradient="footer"
      data-navbar-theme="light"
      data-sponsor-panel
    >
      <RuixenGradientFooter
        gradientHeight={FOOTER_GRADIENT.height}
        minReveal={FOOTER_GRADIENT.minReveal}
        stops={FOOTER_GRADIENT.stops}
        className="w-full max-w-full border-t border-surface-foreground/10 px-2 pt-16 sm:px-8 md:px-10 lg:px-[3.75rem]"
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 sm:gap-6 lg:gap-12">
            <nav
              aria-label="HackUTD social links, first group"
              className="flex min-w-0 flex-col items-center gap-4 sm:gap-5"
            >
              {links.slice(0, 3).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`HackUTD on ${link.label}`}
                  className={linkClassName}
                >
                  <span>{link.label}</span>
                  <LinkUnderline />
                </a>
              ))}
            </nav>

            <p className="translate-y-3 font-sans text-[clamp(2.25rem,12vw,10rem)] font-light leading-[0.82] tracking-[-0.045em] text-surface-foreground">
              hackutd
            </p>

            <nav
              aria-label="HackUTD social and contact links, second group"
              className="flex min-w-0 flex-col items-center gap-4 sm:gap-5"
            >
              {links.slice(3).map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  aria-label={
                    link.label === "Contact"
                      ? "Contact HackUTD by email"
                      : `HackUTD on ${link.label}`
                  }
                  className={linkClassName}
                >
                  <span>{link.label}</span>
                  <LinkUnderline />
                </a>
              ))}
            </nav>
          </div>

          <p className="mt-10 text-[0.6875rem] font-light uppercase tracking-[0.08em] text-surface-foreground/75 sm:text-xs md:mt-12">
            &copy; {year} hackutd by{" "}
            <a
              href="https://acmutd.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-block pb-1 text-surface-foreground/60 transition-colors duration-300 hover:text-surface-foreground"
            >
              <span>ACM UTD</span>
              <LinkUnderline />
            </a>{" "}
            &middot; Made with &lt;3
          </p>

          <nav
            aria-label="HackUTD resources"
            className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
          >
            {resourceLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-block pb-1 text-[0.6875rem] font-light uppercase tracking-[0.08em] text-surface-foreground/60 transition-colors duration-300 hover:text-surface-foreground sm:text-xs"
              >
                <span>{link.label}</span>
                <LinkUnderline />
              </a>
            ))}
          </nav>
        </div>
      </RuixenGradientFooter>
    </div>
  );
}
