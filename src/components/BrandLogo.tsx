"use client";

import { useState } from "react";

export function PokeballMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18.5" fill="#FFFFFF" stroke="#161B2E" strokeWidth="2.6" />
      <path
        d="M2.2 19.2C2.6 9.8 10.4 2.2 20 2.2C29.6 2.2 37.4 9.8 37.8 19.2H2.2Z"
        fill="#E3350D"
      />
      <path
        d="M7.5 11.5C9.8 7.5 14 5.2 18.8 5"
        stroke="#FF8A70"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="1.8" y="18.2" width="36.4" height="3.6" fill="#161B2E" />
      <circle cx="20" cy="20" r="6.2" fill="#FFFFFF" stroke="#161B2E" strokeWidth="2.6" />
      <circle cx="20" cy="20" r="2.7" fill="#FACC15" />
    </svg>
  );
}

export function BrandLogo({
  subtitle,
  dark = false,
}: {
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="relative flex items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:rotate-12">
        <PokeballMark className="h-9 w-9" />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`font-display text-lg font-extrabold tracking-tight sm:text-xl ${
            dark ? "text-white" : "text-[#161B2E]"
          }`}
        >
          Chaz<span className="text-[#E3350D]">Master</span>{" "}
          <span className={dark ? "text-amber-300" : "text-[#161B2E]"}>Album</span>
        </span>
        {subtitle && (
          <span
            className={`mt-0.5 text-[11px] font-medium tracking-wide ${
              dark ? "text-slate-300" : "text-slate-500"
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.03 2C6.51 2 2.04 6.47 2.04 11.98c0 1.76.46 3.48 1.33 5L2 22l5.16-1.35a9.95 9.95 0 0 0 4.87 1.27h.01c5.51 0 9.98-4.47 9.98-9.98 0-2.67-1.04-5.17-2.92-7.06A9.92 9.92 0 0 0 12.03 2Zm5.82 14.28c-.24.68-1.42 1.3-1.97 1.38-.51.08-1.15.11-1.85-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.14-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.17 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.84 2.04.91 2.19.08.15.13.32.03.52-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.05 1.13 1.01 2.08 1.32 2.38 1.47.3.15.47.12.64-.08.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.96.3.15.49.22.57.35.07.12.07.72-.17 1.4Z" />
    </svg>
  );
}

export function CardArtImage({
  src,
  fallbackSrc,
  alt,
  cardNumber,
  setName,
  className = "",
  eager = false,
}: {
  src: string;
  fallbackSrc?: string | null;
  alt: string;
  cardNumber?: string;
  setName?: string;
  className?: string;
  eager?: boolean;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  // Sync if src prop changes
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setCurrentSrc(src);
    setFailed(false);
  }

  if (failed || !currentSrc) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center rounded-[12px] border-4 border-amber-300 bg-gradient-to-br from-[#161B2E] via-[#232B47] to-[#E3350D]/80 p-4 text-center text-white ${className}`}
      >
        <PokeballMark className="mb-3 h-12 w-12 opacity-90" />
        <p className="font-display text-sm font-bold leading-snug">{alt}</p>
        {setName && (
          <p className="mt-1 text-[11px] text-slate-300">{setName}</p>
        )}
        {cardNumber && (
          <span className="font-mono-num mt-2 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
            {cardNumber}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => {
        if (fallbackSrc && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        } else {
          setFailed(true);
        }
      }}
      className={className}
    />
  );
}
