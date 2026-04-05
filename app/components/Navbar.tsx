import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4">
      <Link href="/" className="text-lg font-bold text-foreground">
        HackUTD
      </Link>
      <div className="flex items-center gap-8">
        <Link
          href="#hackathons"
          className="text-sm  hover:text-foreground transition-colors"
        >
          Our Hackathons
        </Link>
        <Link
          href="#sponsors"
          className="text-sm  hover:text-foreground transition-colors"
        >
          Sponsors
        </Link>
        <a
          href="#apply"
          className="rounded-full bg-pink px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Apply
        </a>
      </div>
    </nav>
  );
}
