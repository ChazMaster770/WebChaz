"use client";

import type { ScanLanguageMode, TcgCardCandidate } from "./constants";

export interface ScannedCardResponse {
  detectedLanguage: "ja" | "en";
  pokemonName: string;
  japaneseName: string;
  englishName: string;
  cardNumber: string;
  setTotal: string;
  setCode: string;
  rarityCode: string;
  displayNumber: string;
  hp: number | null;
  illustrator: string;
  dexNumber: number | null;
  capturedDataUrl: string;
  results: TcgCardCandidate[];
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for scanning"));
    img.src = src;
  });
}

function renderResizedJpeg(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number
): string {
  const nw = Math.max(1, img.naturalWidth);
  const nh = Math.max(1, img.naturalHeight);
  const scale = Math.min(1, maxDimension / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * scale));
  const h = Math.max(1, Math.round(nh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Prepare a crisp high-resolution scan payload (preserving small Japanese katakana,
 * set-code badges like sv2a/sv8a, and bottom card numbers) and send it to `/api/tcg/scan`
 * for server-side Japanese + English OCR and live Pokémon TCG database matching.
 */
export async function scanPokemonCardImage(
  imageSourceUrl: string,
  language: ScanLanguageMode = "auto",
  onProgress?: (stage: string, pct: number) => void
): Promise<ScannedCardResponse> {
  onProgress?.("Enhancing card image for EN + 日本語 OCR...", 18);
  const img = await loadImageElement(imageSourceUrl);

  // High-detail image (up to 1600px) for accurate Japanese katakana & tiny bottom number OCR
  const ocrDataUrl = renderResizedJpeg(img, 1600, 0.92);
  // Compact thumbnail (up to 760px) saved with the card in PostgreSQL
  const capturedDataUrl = renderResizedJpeg(img, 760, 0.82);

  onProgress?.(
    language === "ja"
      ? "Reading Japanese card text (日本語) & bottom number..."
      : language === "en"
        ? "Reading English card name & bottom number..."
        : "Reading Japanese (日本語) + English name & card #...",
    52
  );

  const res = await fetch("/api/tcg/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageDataUrl: ocrDataUrl,
      language,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Card scan failed");
  }

  onProgress?.("Matching online Pokémon TCG database (JP + EN)...", 92);

  const data = (await res.json()) as {
    extracted: Omit<ScannedCardResponse, "capturedDataUrl" | "results">;
    results: TcgCardCandidate[];
  };

  return {
    ...data.extracted,
    capturedDataUrl,
    results: Array.isArray(data.results) ? data.results : [],
  };
}
