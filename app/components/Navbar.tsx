import Image from "next/image";
import Link from "next/link";
import AccentButton from "./ui/AccentButton";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4">
      <Link href="/" className="flex items-center">
        <Image
          src="/white-hackutd-logo.svg"
          alt="HackUTD"
          width={2048}
          height={585}
          className="h-8 w-auto"
          priority
        />
      </Link>
      <div className="flex items-center gap-8">
        <Link
          href="#hackathons"
          className="text-sm  hover:text-foreground transition-colors"
        >
          WHO WE ARE
        </Link>
        <Link
          href="#hackathons"
          className="text-sm  hover:text-foreground transition-colors"
        >
          OUR COMMUNITY
        </Link>
        <Link
          href="#sponsors"
          className="text-sm  hover:text-foreground transition-colors"
        >
          SPONSORS
        </Link>
        <AccentButton>Gallery</AccentButton>
      </div>
    </nav>
  );
}
