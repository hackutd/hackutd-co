import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import SiteCursor from "./components/cursor/SiteCursor";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
} from "./lib/site";
import "./globals.css";

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "HackUTD — North America's Largest 24-Hour University Hackathon",
    template: "%s | HackUTD",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "HackUTD",
    "hackathon",
    "UT Dallas",
    "UTD",
    "university hackathon",
    "Texas hackathon",
    "24-hour hackathon",
    "student hackathon",
    "Dallas",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "HackUTD — North America's Largest 24-Hour University Hackathon",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@hackutd",
    creator: "@hackutd",
    title: "HackUTD — North America's Largest 24-Hour University Hackathon",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

const organizationId = `${SITE_URL}/#organization`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: SOCIAL_LINKS,
      email: "hello@hackutd.co",
      parentOrganization: {
        "@type": "Organization",
        name: "ACM UTD",
        url: "https://acmutd.co/",
      },
      location: {
        "@type": "Place",
        name: "The University of Texas at Dallas",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Richardson",
          addressRegion: "TX",
          addressCountry: "US",
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": organizationId },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Apply the persisted theme before first paint to avoid a flash */}
        <Script
          id="site-theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("site-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Last child of <body> on purpose: the drawn cursor blends against
            the backdrop of its own stacking context, so it has to be painted
            from here to invert the whole page rather than one section of it. */}
        <SiteCursor />
      </body>
    </html>
  );
}
