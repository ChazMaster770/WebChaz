import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ChazMaster Album — Pokémon TCG Collector Binder & Shop",
  description:
    "Explore the official ChazMaster Album Pokémon TCG card collection. Browse authentic graded-quality holos, illustration rares, and vintage classics, build your basket, and order directly via WhatsApp.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#FAF8F4] font-sans text-[#161B2E] antialiased selection:bg-[#E3350D]/15 selection:text-[#E3350D]">
        {children}
      </body>
    </html>
  );
}
