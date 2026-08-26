import type { Metadata } from "next";
import localFont from "next/font/local";
import { Petrona } from "next/font/google";
import Script from "next/script";
import SiteCursor from "./components/cursor/SiteCursor";
import "./globals.css";

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
});

const petrona = Petrona({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-petrona",
});

export const metadata: Metadata = {
  title: "HackUTD",
  description: "HackUTD - Hackathon at UT Dallas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${petrona.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
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
