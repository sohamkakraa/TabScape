import "./globals.css";
import type { Metadata } from "next";
import { Sora, Playfair_Display } from "next/font/google";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "TabScape Prototype",
  description: "Unified tabs & monthly obligations dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sora.variable} ${playfair.variable}`}
    >
      <body
        className="min-h-screen text-slate-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
