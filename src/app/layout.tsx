import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Aeris",
  description:
    "A self-help tool for anxious moments. It learns your patterns and helps you interrupt them.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f3f5f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
