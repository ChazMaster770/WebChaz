import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChazMaster Album — Pokémon TCG Collector Binder & Shop",
  description:
    "Explore the official ChazMaster Album Pokémon TCG card collection. Browse authentic Japanese and English holos, illustration rares, and vintage classics, build your basket, and order directly via WhatsApp.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F4] font-sans text-[#161B2E] antialiased selection:bg-[#E3350D]/15 selection:text-[#E3350D]">
        {children}
      </body>
    </html>
  );
}
