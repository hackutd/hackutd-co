"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import BrandShaderBackground from "@/app/components/background/BrandShaderBackground";

const links = [
  { label: "Instagram", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Discord", href: "#" },
  { label: "LinkedIn", href: "#" },
];

type FooterProps = ComponentPropsWithoutRef<"footer">;

const footerBaseClassName =
  "min-h-[440px] overflow-hidden border-t border-black/10 bg-surface px-5 py-8 text-surface-foreground sm:min-h-[400px] sm:px-8 md:min-h-[280px] md:px-10 md:py-8 lg:px-[3.75rem]";

const Footer = forwardRef<HTMLElement, FooterProps>(function Footer(
  { className, ...props },
  ref,
) {
  return (
    <footer
      ref={ref}
      {...props}
      className={[
        className ? null : "relative",
        footerBaseClassName,
        className,
      ].filter(Boolean).join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] overflow-hidden opacity-95 md:inset-y-0 md:left-1/2 md:right-0 md:h-auto"
      >
        <BrandShaderBackground
          className="scale-[1.35] md:scale-[1.5]"
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
          <p className="font-serif text-[2.875rem] font-light leading-none tracking-normal text-[#070d1a] sm:text-[3.625rem] md:text-[4.25rem] lg:text-[5.125rem]">
            HackUTD
          </p>
          <p className="mt-4 font-serif text-[1.375rem] font-light italic leading-none text-[#070d1a]/60 sm:mt-5 sm:text-[1.625rem] md:text-[1.875rem] lg:text-[2rem]">
            Happy Hacking
          </p>
          <p className="mt-5 text-[0.6875rem] font-light uppercase tracking-normal text-[#070d1a]/35 sm:mt-7 sm:text-xs">
            MADE WITH &lt;3
          </p>
        </div>

        <div className="flex flex-col gap-7 pb-1 sm:items-end md:max-w-[46vw] md:gap-8">
          <p className="text-[0.6875rem] font-light uppercase tracking-normal text-white/95 sm:text-xs">
            CONNECT
          </p>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-4 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-10 sm:gap-y-3 md:gap-x-8 lg:gap-x-12 xl:gap-x-14">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[0.6875rem] font-light uppercase tracking-normal text-white/85 transition-colors hover:text-white sm:text-xs"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
});

export default Footer;
