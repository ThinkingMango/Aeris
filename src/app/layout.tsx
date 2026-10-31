import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { HelpFooter } from "@/components/aeris-primitives";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aeris",
  description: "A private, no-typing reset before a difficult work conversation.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#14161C" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} bg-background`}>
      <body className="font-sans">
        <div className="app-shell">
          {children}
          <HelpFooter />
        </div>
      </body>
    </html>
  );
}
