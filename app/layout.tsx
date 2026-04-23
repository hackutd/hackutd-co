import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: "400",
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
    <html lang="en" className={`${satoshi.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
