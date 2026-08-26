"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import BrandShaderBackground from "@/app/components/background/BrandShaderBackground";

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

type FooterProps = ComponentPropsWithoutRef<"footer"> & {
  /**
   * How the WebGL background is mounted. `"lazy"` lets the canvas observe
   * itself; `"on"`/`"off"` hand that decision to the caller so it can pre-mount
   * the canvas before the footer is revealed.
   */
  shaderMount?: "lazy" | "on" | "off";
};

const footerBaseClassName =
  "min-h-[400px] w-full max-w-full overflow-hidden border-t border-black/10 bg-surface px-2 py-8 text-surface-foreground sm:px-8 md:min-h-[360px] md:px-10 lg:px-[3.75rem]";

const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { className, shaderMount = "lazy", ...props },
  ref,
) {
  const year = new Date().getFullYear();

  return (
    <footer
      ref={ref}
      {...props}
      className={[
        className ? null : "relative",
        footerBaseClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-95 [container-type:size]"
      >
        {shaderMount !== "off" && (
          <BrandShaderBackground
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5]"
            style={{
              width: "max(100cqw, 100cqh)",
              height: "max(100cqw, 100cqh)",
            }}
            lazyLoad={shaderMount === "lazy"}
            shaderProps={{
              cDistance: 5.4,
              cameraZoom: 15,
              positionX: 0.08,
              positionY: -0.02,
            }}
          />
        )}
      </div>

      <div className="relative z-10 flex min-h-[336px] flex-col items-center justify-center text-center md:min-h-[296px]">
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
                className="group relative pb-1 text-xs font-light uppercase tracking-[0.08em] text-white/75 transition-colors duration-300 hover:text-white sm:text-sm [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
              >
                <span>{link.label}</span>
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <p className="translate-y-3 font-serif text-[clamp(2.25rem,12vw,10rem)] font-light leading-[0.82] tracking-[-0.045em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55),0_1px_3px_rgba(0,0,0,0.45)]">
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
                className="group relative pb-1 text-xs font-light uppercase tracking-[0.08em] text-white/75 transition-colors duration-300 hover:text-white sm:text-sm [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
              >
                <span>{link.label}</span>
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-10 text-[0.6875rem] font-light uppercase tracking-[0.08em] text-white/90 sm:text-xs md:mt-12 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
          &copy; {year} hackutd by{" "}
          <a
            href="https://acmutd.co/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-block pb-1 text-white/75 transition-colors duration-300 hover:text-white"
          >
            <span>ACM UTD</span>
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
          </a>{" "}
          &middot; Made with &lt;3
        </p>

        <a
          href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative mt-3 inline-block pb-1 text-[0.6875rem] font-light uppercase tracking-[0.08em] text-white/75 transition-colors duration-300 hover:text-white sm:text-xs [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
        >
          <span>MLH Code of Conduct</span>
          <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
        </a>
      </div>
    </footer>
  );
});

export default Footer;
