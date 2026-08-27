import Link from "next/link";

/**
 * Legal documents: plain black-on-white, deliberately untouched by the site
 * theme. These pages exist to be read, printed, and cited, so they opt out of
 * the palette rather than following it.
 *
 * Element styles are applied here with descendant variants so the pages
 * themselves stay as plain semantic HTML.
 */
export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-white text-black">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-8 sm:py-16">
        <article
          className={[
            "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight",
            "[&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold",
            "[&_p]:mt-3 [&_p]:leading-relaxed",
            "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
            "[&_a]:underline [&_a]:underline-offset-2",
            "[&_strong]:font-semibold",
          ].join(" ")}
        >
          {children}
        </article>

        <hr className="mt-12 border-neutral-300" />

        <footer className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href="/" className="underline underline-offset-2">
            HackUTD
          </Link>
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
        </footer>
      </div>
    </div>
  );
}
