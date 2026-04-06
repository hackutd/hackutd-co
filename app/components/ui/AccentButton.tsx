import type { ReactNode } from "react";
import Link from "next/link";

type AccentButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "pill" | "panel";
  size?: "sm" | "lg";
  className?: string;
  disabled?: boolean;
};

const variantClasses = {
  pill: "rounded-full",
  panel: "rounded-[12px]",
};

const sizeClasses = {
  sm: "min-h-7 px-3 text-[0.65rem] tracking-[0.04em] md:min-h-8 md:px-5 md:text-sm",
  lg: "min-h-9 px-4 text-xs tracking-[0.05em] md:min-h-10 md:px-7 md:text-base",
};

function joinClasses(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function AccentButton({
  children,
  href,
  variant = "pill",
  size = "sm",
  className,
  disabled = false,
}: AccentButtonProps) {
  const classes = joinClasses(
    "inline-flex items-center justify-center border-1 border-pink bg-transparent font-medium uppercase leading-none text-pink transition-colors duration-200 hover:bg-pink/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-default disabled:opacity-100 disabled:hover:bg-transparent cursor-pointer",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} disabled={disabled}>
      {children}
    </button>
  );
}
