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
  { label: "TikTok", href: "https://www.tiktok.com/@hackutd" },
  { label: "GitHub", href: "https://github.com/hackutd" },
];

type FooterProps = ComponentPropsWithoutRef<"footer">;

const footerBaseClassName =
  "min-h-[440px] overflow-hidden border-t border-black/10 bg-surface px-5 py-8 text-surface-foreground sm:min-h-[400px] sm:px-8 md:min-h-[280px] md:px-10 md:py-8 lg:px-[3.75rem]";

const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { className, ...props },
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
        <BrandShaderBackground
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.5]"
          style={{ width: "max(100cqw, 100cqh)", height: "max(100cqw, 100cqh)" }}
          shaderProps={{
            cDistance: 5.4,
            cameraZoom: 15,
            positionX: 0.08,
            positionY: -0.02,
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-[376px] flex-col justify-between gap-10 sm:min-h-[336px] md:min-h-[216px] md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="md:pb-1">
          <p className="font-serif text-[2.875rem] font-light leading-none tracking-normal text-white sm:text-[3.625rem] md:text-[4.25rem] lg:text-[5.125rem] [text-shadow:0_2px_20px_rgba(0,0,0,0.55),0_1px_3px_rgba(0,0,0,0.45)]">
            HackUTD
          </p>
          <p className="mt-4 font-serif text-[1.375rem] font-light italic leading-none text-white sm:mt-5 sm:text-[1.625rem] md:text-[1.875rem] lg:text-[2rem] [text-shadow:0_2px_16px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.45)]">
            Happy Hacking
          </p>
          <p className="mt-5 text-[0.6875rem] font-light uppercase tracking-[0.08em] text-white/90 sm:mt-7 sm:text-xs [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            &copy; {year} HackUTD by{" "}
            <a
              href="https://acmutd.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-white/40 underline-offset-2 transition-colors hover:text-white"
            >
              ACM UTD
            </a>{" "}
            &middot; Made with &lt;3
          </p>
        </div>

        <div className="flex flex-col gap-7 pb-1 sm:items-end md:max-w-[46vw] md:gap-8">
          <p className="text-[0.6875rem] font-light uppercase tracking-[0.08em] text-white sm:text-xs [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            CONNECT
          </p>
          <nav
            aria-label="HackUTD social links"
            className="grid grid-cols-2 gap-x-10 gap-y-4 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-10 sm:gap-y-3 md:gap-x-8 lg:gap-x-12 xl:gap-x-14"
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`HackUTD on ${link.label}`}
                className="text-[0.75rem] font-light uppercase tracking-[0.08em] text-white transition-colors hover:text-white sm:text-xs [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="mailto:hello@hackutd.co"
              className="text-[0.75rem] font-light uppercase tracking-[0.08em] text-white transition-colors hover:text-white sm:text-xs [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
