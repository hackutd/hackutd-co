"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AccentButton from "../ui/AccentButton";
import useNavbarTheme from "./useNavbarTheme";

const NAV_LINKS = [
  { href: "#hackathons", label: "WHO WE ARE" },
  { href: "#hackathons", label: "OUR COMMUNITY" },
  { href: "#sponsors", label: "SPONSORS" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useNavbarTheme();
  const isLightTheme = theme === "light";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
      <Link href="/" className="flex items-center">
        <span className="relative block h-6 w-33.5 md:h-8 md:w-44.5">
          <Image
            src="/white-hackutd-logo.svg"
            alt="HackUTD"
            width={2048}
            height={585}
            className={`absolute inset-0 h-6 w-auto transition-opacity duration-300 md:h-8 ${
              isLightTheme ? "opacity-0" : "opacity-100"
            }`}
            priority
          />
          <Image
            src="/black-hackutd-logo.svg"
            alt="HackUTD"
            width={2048}
            height={585}
            className={`absolute inset-0 h-6 w-auto transition-opacity duration-300 md:h-8 ${
              isLightTheme ? "opacity-100" : "opacity-0"
            }`}
            priority
          />
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`group relative pb-1 text-xs transition-colors duration-300 ${
              isLightTheme
                ? "text-[var(--color-surface-foreground)] hover:opacity-70"
                : "text-foreground hover:text-foreground/70"
            }`}
          >
            <span>{link.label}</span>
            <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-pink transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        ))}
        <AccentButton>Gallery</AccentButton>
      </div>

      {/* Hamburger button */}
      <button
        type="button"
        className="md:hidden relative z-50 flex h-8 w-8 flex-col items-end justify-center gap-1 overflow-visible"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        <span
          className={`block h-0.5 w-4 transition-transform duration-200 ${
            isLightTheme ? "bg-[var(--color-surface-foreground)]" : "bg-foreground"
          } ${isOpen ? "translate-y-1.5 rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-4 transition-opacity duration-200 ${
            isLightTheme ? "bg-[var(--color-surface-foreground)]" : "bg-foreground"
          } ${isOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-4 transition-transform duration-200 ${
            isLightTheme ? "bg-[var(--color-surface-foreground)]" : "bg-foreground"
          } ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
        />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 top-13 z-40 flex flex-col items-center gap-8 pt-16 backdrop-blur-sm md:hidden ${
            isLightTheme
              ? "bg-[var(--color-surface)]/95 text-[var(--color-surface-foreground)]"
              : "bg-black/95 text-foreground"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-lg transition-colors ${
                isLightTheme ? "hover:opacity-70" : "hover:text-foreground"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <AccentButton
            className={
              isLightTheme
                ? "focus-visible:ring-offset-[var(--color-surface)]"
                : undefined
            }
          >
            Gallery
          </AccentButton>
        </div>
      )}
    </nav>
  );
}
