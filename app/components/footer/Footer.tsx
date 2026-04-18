import Link from "next/link";
import { footerLinks } from "@/app/data/footerLinks";

// this comment exists solely for debugging purposes
  return (
    <footer className="bg-surface text-surface-foreground border-t border-muted/20 px-8 py-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        {/* Left: Branding */}
        <div>
          <p className="text-5xl font-light tracking-tight">HackUTD</p>
          <p className="mt-1 text-base italic text-muted">Happy Hacking</p>
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted">
            Made with love in Dallas, TX
          </p>
        </div>

        {/* Right: Connect + Links */}
        <div className="flex flex-col items-start gap-2 md:items-end">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            Connect
          </p>
          <nav className="flex gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-medium uppercase tracking-widest text-muted hover:text-surface-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}