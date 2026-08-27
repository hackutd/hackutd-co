"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type FlowButtonProps = {
  text?: string;
  href?: string;
  /** Opens `href` in a new tab, with the matching `rel` guard. */
  newTab?: boolean;
  onClick?: () => void;
  className?: string;
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

/**
 * Pill button whose label slides right as a white disc floods the pink pill and
 * the corners square off — the arrow entering from the left as its twin exits.
 *
 * Colors come from the brand palette (`--color-pink`) rather than fixed greys,
 * so the button reads the same against either site theme.
 */
export default function FlowButton({
  text = "Modern Button",
  href,
  newTab = false,
  onClick,
  className,
}: FlowButtonProps) {
  const classes = joinClasses(
    "group relative inline-flex cursor-pointer items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-pink bg-pink px-8 py-3 text-sm font-semibold uppercase leading-none tracking-[0.05em] text-white transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-[12px] hover:text-pink active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className,
  );

  const content = (
    <>
      {/* Arrow flying in from the left */}
      <ArrowRight className="absolute left-[-25%] z-[9] h-4 w-4 fill-none stroke-current transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4" />

      <span className="relative z-[1] -translate-x-3 transition-all duration-[800ms] ease-out group-hover:translate-x-3">
        {text}
      </span>

      {/* The disc that floods the pill on hover */}
      <span className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[220px] group-hover:w-[220px] group-hover:opacity-100" />

      {/* Arrow flying out to the right */}
      <ArrowRight className="absolute right-4 z-[9] h-4 w-4 fill-none stroke-current transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%]" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} onClick={onClick}>
      {content}
    </button>
  );
}
