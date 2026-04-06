"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import AccentButton from "../ui/AccentButton";

const NAV_LINKS = [
  { href: "#hackathons", label: "WHO WE ARE" },
  { href: "#hackathons", label: "OUR COMMUNITY" },
  { href: "#sponsors", label: "SPONSORS" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
      <Link href="/" className="flex items-center">
        <Image
          src="/white-hackutd-logo.svg"
          alt="HackUTD"
          width={2048}
          height={585}
          className="h-6 w-auto md:h-8"
          priority
        />
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-xs hover:text-foreground transition-colors"
          >
            {link.label}
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
          className={`block h-0.5 w-4 bg-foreground transition-transform duration-200 ${isOpen ? "translate-y-1.5 rotate-45" : ""}`}
        />
        <span
          className={`block h-0.5 w-4 bg-foreground transition-opacity duration-200 ${isOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`block h-0.5 w-4 bg-foreground transition-transform duration-200 ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
        />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-13 z-40 flex flex-col items-center gap-8 bg-black/95 pt-16 backdrop-blur-sm md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-lg hover:text-foreground transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <AccentButton>Gallery</AccentButton>
        </div>
      )}
    </nav>
  );
}
