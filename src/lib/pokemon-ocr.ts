"use client";

import type { Worker } from "tesseract.js";
import type { ScanLanguageMode, TcgCardCandidate } from "./constants";
import {
  extractBottomCardMetadata,
  extractEnglishCardNameFromOcr,
  extractHpFromOcr,
  extractJapaneseCardNameFromOcr,
  type ParsedBottomMeta,
} from "./pokemon-names";

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

// ---------------------------------------------------------------------------
// Browser OCR workers (works on Vercel / any static or serverless host because
// recognition runs in the visitor's browser, not on the server)
// ---------------------------------------------------------------------------
const workerCache: Partial<Record<"eng" | "jpn", Promise<Worker>>> = {};
const workQueue: { current: Promise<unknown> } = { current: Promise.resolve() };

async function getWorker(lang: "eng" | "jpn"): Promise<Worker> {
  if (!workerCache[lang]) {
    workerCache[lang] = (async () => {
      const Tesseract = await import("tesseract.js");
      const worker = await Tesseract.createWorker(lang, 1, {
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });
      return worker;
    })().catch((err) => {
      delete workerCache[lang];
      throw err;
    });
  }
  return workerCache[lang]!;
}

async function recognize(lang: "eng" | "jpn", source: HTMLCanvasElement): Promise<string> {
  const run = async () => {
    try {
      const worker = await getWorker(lang);
      const res = await worker.recognize(source);
      return (res.data?.text || "").trim();
    } catch {
      delete workerCache[lang];
      const worker = await getWorker(lang);
      const res = await worker.recognize(source);
      return (res.data?.text || "").trim();
    }
  };
  const next = workQueue.current.then(run, run);
  workQueue.current = next.catch(() => undefined);
  return next;
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the card photo"));
    img.src = src;
  });
}

function resizeToDataUrl(img: HTMLImageElement, maxDim: number, quality: number): string {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

type Ink = "black" | "white" | "gray";

/**
 * Crop a region of the card and isolate text ink so holographic foil,
 * gradient backgrounds and sleeves do not drown out the characters.
 */
function cropInk(
  img: HTMLImageElement,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  targetWidth: number,
  ink: Ink
): HTMLCanvasElement {
  const sx = Math.floor(img.naturalWidth * rx);
  const sy = Math.floor(img.naturalHeight * ry);
  const sw = Math.max(24, Math.floor(img.naturalWidth * rw));
  const sh = Math.max(24, Math.floor(img.naturalHeight * rh));

  const width = Math.max(240, Math.min(1600, targetWidth));
  const height = Math.max(24, Math.round((sh / sw) * width));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

  const frame = ctx.getImageData(0, 0, width, height);
  const d = frame.data;
  const channels = 3;

  for (let i = 0, p = 0; p < width * height; i += 4, p++) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = mx - mn;

    let out: number;
    if (ink === "black") {
      // Black card ink: dark and near-neutral
      out = mx < 92 && sat < 58 ? 0 : 255;
    } else if (ink === "white") {
      // White set-code badge text / silver VMAX lettering
      out = mn > 186 && sat < 52 ? 0 : 255;
    } else {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      out = Math.max(0, Math.min(255, (lum - 128) * 1.45 + 128));
    }
    d[i] = out;
    d[i + 1] = out;
    d[i + 2] = out;
  }

  ctx.putImageData(frame, 0, 0);
  return canvas;
}

function mergeMeta(primary: ParsedBottomMeta, secondary: ParsedBottomMeta): ParsedBottomMeta {
  return {
    cardNumber: primary.cardNumber || secondary.cardNumber,
    setTotal: primary.cardNumber ? primary.setTotal || secondary.setTotal : secondary.setTotal,
    setCode: primary.setCode || secondary.setCode,
    rarityCode: primary.rarityCode || secondary.rarityCode,
    illustrator: primary.illustrator || secondary.illustrator,
    dexNumber: primary.dexNumber ?? secondary.dexNumber,
  };
}

/**
 * Full browser-side Japanese + English Pokémon card scan.
 * Reads the card text locally, then looks the card up in the live online TCG database.
 */
export async function scanPokemonCardImage(
  imageSourceUrl: string,
  language: ScanLanguageMode = "auto",
  onProgress?: (stage: string, pct: number) => void
): Promise<ScannedCardResponse> {
  onProgress?.("Preparing card photo...", 10);
  const img = await loadImage(imageSourceUrl);
  const capturedDataUrl = resizeToDataUrl(img, 780, 0.82);

  const wantJa = language === "ja" || language === "auto";
  const wantEn = language === "en" || language === "auto";

  onProgress?.("Reading card text on your device (日本語 + English)...", 30);

  const topBlack = cropInk(img, 0.1, 0.02, 0.8, 0.1, 1050, "black");
  const topGray = cropInk(img, 0.06, 0.015, 0.85, 0.13, 1000, "gray");
  const bottomBlack = cropInk(img, 0.02, 0.88, 0.5, 0.1, 1150, "black");
  const bottomWhite = cropInk(img, 0.02, 0.89, 0.46, 0.085, 1000, "white");

  const [jaTop, enTop, bottomBlk, bottomWht] = await Promise.all([
    wantJa ? recognize("jpn", topBlack) : Promise.resolve(""),
    wantEn ? recognize("eng", topGray) : Promise.resolve(""),
    recognize("eng", bottomBlack),
    recognize("eng", bottomWhite),
  ]);

  let bottom = mergeMeta(
    extractBottomCardMetadata(bottomBlk),
    extractBottomCardMetadata(bottomWht)
  );
  let extraBottomText = "";

  // Second pass: wider bottom band (vintage 4/102, desk-framed photos, faint numbers)
  if (!bottom.cardNumber || (!bottom.setCode && wantJa)) {
    onProgress?.("Re-reading bottom card number...", 58);
    const wideGray = cropInk(img, 0.02, 0.76, 0.96, 0.22, 1250, "gray");
    const wideText = await recognize("eng", wideGray);
    extraBottomText = wideText;
    bottom = mergeMeta(bottom, extractBottomCardMetadata(wideText));
  }

  onProgress?.("Matching Japanese & English names...", 72);

  const suffixHints = `${bottomBlk} ${extraBottomText} ${enTop}`;

  let jaMatch = wantJa ? extractJapaneseCardNameFromOcr(jaTop, suffixHints) : null;
  let enName = wantEn ? extractEnglishCardNameFromOcr(enTop) : "";
  let jaText = jaTop;
  let enText = enTop;

  // Second pass for the name band (white V/VMAX lettering, desk margins, foil glare)
  if ((wantJa && (!jaMatch || jaMatch.confidence < 88)) || (wantEn && !enName)) {
    const topWhite = cropInk(img, 0.06, 0.02, 0.82, 0.13, 1000, "white");
    const [whiteText, grayText] = await Promise.all([
      recognize("eng", topWhite),
      wantJa ? recognize("jpn", topGray) : Promise.resolve(""),
    ]);
    enText = `${enText} ${whiteText}`;

    if (wantEn && !enName) {
      enName = extractEnglishCardNameFromOcr(whiteText);
    }
    if (wantJa) {
      const jaWhite = await recognize("jpn", topWhite);
      jaText = `${jaText} ${grayText} ${jaWhite}`;
      const options = [
        jaMatch,
        extractJapaneseCardNameFromOcr(grayText, suffixHints),
        extractJapaneseCardNameFromOcr(jaWhite, suffixHints),
      ].filter((v): v is NonNullable<typeof v> => Boolean(v));
      options.sort((a, b) => b.confidence - a.confidence);
      jaMatch = options[0] || null;
    }
    if (wantEn && !enName) {
      const deskText = await recognize("eng", cropInk(img, 0.04, 0.05, 0.92, 0.26, 1000, "gray"));
      enText = `${enText} ${deskText}`;
      enName = extractEnglishCardNameFromOcr(deskText);
    }
  }

  const hasEnglishHeader = /\b(BASIC|STAGE\s*[12]|Evolves\s+from|Trainer|Supporter|Weakness|Resistance|Illus\.?)\b/i.test(
    `${enText} ${extraBottomText}`
  );

  let detectedLanguage: "ja" | "en";
  if (language === "ja") detectedLanguage = "ja";
  else if (language === "en") detectedLanguage = "en";
  else if (hasEnglishHeader && enName && !bottom.setCode) detectedLanguage = "en";
  else if (bottom.setCode || bottom.rarityCode || jaMatch || bottom.dexNumber !== null) {
    detectedLanguage = "ja";
  } else detectedLanguage = enName ? "en" : "ja";

  const hp =
    extractHpFromOcr(jaText) ?? extractHpFromOcr(enText) ?? null;

  const japaneseName = jaMatch ? jaMatch.jaName : "";
  const englishName = jaMatch ? jaMatch.enName : enName;
  const pokemonName =
    detectedLanguage === "ja" ? japaneseName || enName : enName || japaneseName;

  const numPart = bottom.cardNumber
    ? bottom.setTotal
      ? `${bottom.cardNumber}/${bottom.setTotal}`
      : bottom.cardNumber
    : bottom.dexNumber
      ? `No.${String(bottom.dexNumber).padStart(3, "0")}`
      : "";

  const displayNumber = [
    detectedLanguage === "ja" ? bottom.setCode : "",
    numPart,
    detectedLanguage === "ja" ? bottom.rarityCode : "",
  ]
    .filter(Boolean)
    .join(" ");

  onProgress?.("Searching the online Pokémon TCG database...", 85);

  // Look up the card online (server route only proxies the public TCG API)
  const query = async (
    name: string,
    number: string,
    lang: ScanLanguageMode
  ): Promise<TcgCardCandidate[]> => {
    if (!name.trim() && !number.trim()) return [];
    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    if (number.trim()) params.set("number", number.trim());
    params.set("language", lang);
    params.set("limit", "8");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`/api/tcg/search?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { results?: TcgCardCandidate[] };
      return Array.isArray(data.results) ? data.results : [];
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  };

  let results = await query(pokemonName, displayNumber, detectedLanguage);

  // Fallbacks: set code + number only, then English name + number
  if (results.length === 0 && (bottom.setCode || bottom.rarityCode) && bottom.cardNumber) {
    results = await query(
      "",
      `${bottom.setCode} ${bottom.cardNumber}/${bottom.setTotal} ${bottom.rarityCode}`,
      "auto"
    );
  }
  if (results.length === 0 && bottom.cardNumber) {
    results = await query(englishName || "", `${bottom.cardNumber}/${bottom.setTotal}`, "auto");
  }
  if (results.length === 0 && englishName) {
    results = await query(englishName, "", "auto");
  }

  onProgress?.("Done", 100);

  return {
    detectedLanguage,
    pokemonName,
    japaneseName,
    englishName,
    cardNumber: bottom.cardNumber,
    setTotal: bottom.setTotal,
    setCode: bottom.setCode,
    rarityCode: bottom.rarityCode,
    displayNumber,
    hp,
    illustrator: bottom.illustrator,
    dexNumber: bottom.dexNumber,
    capturedDataUrl,
    results,
  };
}
