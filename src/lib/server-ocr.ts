import path from "path";
import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";
import type { ScanLanguageMode } from "./constants";
import {
  extractBottomCardMetadata,
  extractEnglishCardNameFromOcr,
  extractHpFromOcr,
  extractJapaneseCardNameFromOcr,
  hasJapaneseText,
  type ParsedBottomMeta,
} from "./pokemon-names";

export interface ServerScanExtraction {
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
}

interface WorkerSlot {
  workerPromise: Promise<Worker> | null;
  queue: Promise<unknown>;
}

const globalOcr = globalThis as typeof globalThis & {
  __chazmasterOcrSlots?: Record<"eng" | "jpn", WorkerSlot>;
};

function getSlot(lang: "eng" | "jpn"): WorkerSlot {
  if (!globalOcr.__chazmasterOcrSlots) {
    globalOcr.__chazmasterOcrSlots = {
      eng: { workerPromise: null, queue: Promise.resolve() },
      jpn: { workerPromise: null, queue: Promise.resolve() },
    };
  }
  return globalOcr.__chazmasterOcrSlots[lang];
}

async function recognizeWithLang(
  lang: "eng" | "jpn",
  imageBuffer: Buffer
): Promise<string> {
  const slot = getSlot(lang);

  const spawnWorker = () =>
    createWorker(lang, 1, {
      workerPath: path.join(
        process.cwd(),
        "node_modules/tesseract.js/src/worker-script/node/index.js"
      ),
      cachePath: process.cwd(),
    });

  const run = async (): Promise<string> => {
    if (!slot.workerPromise) {
      slot.workerPromise = spawnWorker().catch((err) => {
        slot.workerPromise = null;
        throw err;
      });
    }
    try {
      const worker = await slot.workerPromise;
      const res = await worker.recognize(imageBuffer);
      return (res.data?.text || "").trim();
    } catch {
      slot.workerPromise = null;
      const fresh = await spawnWorker();
      slot.workerPromise = Promise.resolve(fresh);
      const res = await fresh.recognize(imageBuffer);
      return (res.data?.text || "").trim();
    }
  };

  const next = slot.queue.then(run, run);
  slot.queue = next.catch(() => undefined);
  return next;
}

function clampRect(
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
) {
  const left = Math.max(0, Math.min(w - 8, Math.round(w * rx)));
  const top = Math.max(0, Math.min(h - 8, Math.round(h * ry)));
  const width = Math.max(8, Math.min(w - left, Math.round(w * rw)));
  const height = Math.max(8, Math.min(h - top, Math.round(h * rh)));
  return { left, top, width, height };
}

/**
 * Isolate pure dark/black card ink (Pokémon names, HP, Illustrator, & bottom card numbers
 * on JP & EN regular, holo, AR, and SAR cards) while stripping out colorful holo artwork.
 */
async function cropBlackInk(
  normalizedCardBuf: Buffer,
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  targetWidth: number,
  maxChannel = 82,
  maxSat = 52
): Promise<Buffer> {
  const rect = clampRect(w, h, rx, ry, rw, rh);
  const { data, info } = await sharp(normalizedCardBuf)
    .extract(rect)
    .resize({ width: targetWidth, kernel: "lanczos3" })
    .normalize()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(info.width * info.height);
  const channels = info.channels;
  for (let i = 0, p = 0; p < out.length; i += channels, p++) {
    const r = data[i];
    const g = channels >= 3 ? data[i + 1] : r;
    const b = channels >= 3 ? data[i + 2] : r;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    out[p] = mx < maxChannel && mx - mn < maxSat ? 0 : 255;
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .median(3)
    .extend({
      top: 12,
      bottom: 12,
      left: 12,
      right: 12,
      background: { r: 255, g: 255, b: 255 },
    })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
}

/**
 * Isolate pure bright/white ink (Japanese black set-code badges like [sv2a] / [sv8a],
 * and silver/white text on Pokémon V, VMAX, VSTAR, GX & dark secret rares).
 */
async function cropWhiteInk(
  normalizedCardBuf: Buffer,
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  targetWidth: number,
  minChannel = 198,
  maxSat = 48
): Promise<Buffer> {
  const rect = clampRect(w, h, rx, ry, rw, rh);
  const { data, info } = await sharp(normalizedCardBuf)
    .extract(rect)
    .resize({ width: targetWidth, kernel: "lanczos3" })
    .normalize()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(info.width * info.height);
  const channels = info.channels;
  for (let i = 0, p = 0; p < out.length; i += channels, p++) {
    const r = data[i];
    const g = channels >= 3 ? data[i + 1] : r;
    const b = channels >= 3 ? data[i + 2] : r;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    out[p] = mn > minChannel && mx - mn < maxSat ? 0 : 255;
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .extend({
      top: 12,
      bottom: 12,
      left: 12,
      right: 12,
      background: { r: 255, g: 255, b: 255 },
    })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
}

/**
 * Standard high-contrast normalized grayscale crop (great for soft-focus smartphone photos
 * and vintage 1996-2002 Japanese/English cards).
 */
async function cropGrayscale(
  normalizedCardBuf: Buffer,
  w: number,
  h: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  targetWidth: number
): Promise<Buffer> {
  const rect = clampRect(w, h, rx, ry, rw, rh);
  return sharp(normalizedCardBuf)
    .extract(rect)
    .resize({ width: targetWidth, kernel: "lanczos3" })
    .grayscale()
    .normalize()
    .linear(1.3, -24)
    .extend({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
      background: { r: 255, g: 255, b: 255 },
    })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
}

function mergeBottomMeta(
  primary: ParsedBottomMeta,
  secondary: ParsedBottomMeta
): ParsedBottomMeta {
  return {
    cardNumber: primary.cardNumber || secondary.cardNumber,
    setTotal: primary.cardNumber
      ? primary.setTotal || secondary.setTotal
      : secondary.setTotal,
    setCode: primary.setCode || secondary.setCode,
    rarityCode: primary.rarityCode || secondary.rarityCode,
    illustrator: primary.illustrator || secondary.illustrator,
    dexNumber: primary.dexNumber ?? secondary.dexNumber,
  };
}

export async function analyzeCardPhotoBuffer(
  rawImageBuffer: Buffer,
  mode: ScanLanguageMode = "auto"
): Promise<ServerScanExtraction> {
  // Auto-fix EXIF rotation (critical for phone cameras) and standardize optimal OCR resolution
  const baseBuf = await sharp(rawImageBuffer)
    .rotate()
    .resize({ width: 1050, height: 1470, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const meta = await sharp(baseBuf).metadata();
  const w = meta.width || 800;
  const h = meta.height || 1120;

  // Prepare Pass 1 crops (top name band + bottom-left number/set/rarity band)
  const [topBlack, topGray, botLeftBlack, botLeftWhite] = await Promise.all([
    cropBlackInk(baseBuf, w, h, 0.1, 0.022, 0.8, 0.095, 1050, 82, 52),
    cropGrayscale(baseBuf, w, h, 0.06, 0.015, 0.84, 0.13, 1000),
    cropBlackInk(baseBuf, w, h, 0.025, 0.885, 0.5, 0.095, 1150, 86, 55),
    cropWhiteInk(baseBuf, w, h, 0.025, 0.895, 0.45, 0.08, 1000, 196, 48),
  ]);

  const scanJa = mode === "ja" || mode === "auto";
  const scanEn = mode === "en" || mode === "auto";

  // Run Japanese & English OCR workers in parallel!
  const [jpnTopBlackText, engTopGrayText, botBlkText, botWhtText] =
    await Promise.all([
      scanJa ? recognizeWithLang("jpn", topBlack) : Promise.resolve(""),
      scanEn ? recognizeWithLang("eng", topGray) : Promise.resolve(""),
      recognizeWithLang("eng", botLeftBlack),
      recognizeWithLang("eng", botLeftWhite),
    ]);

  let bottom = mergeBottomMeta(
    extractBottomCardMetadata(botBlkText),
    extractBottomCardMetadata(botWhtText)
  );

  // Pass 2 for Bottom Number: wider bottom band (catches vintage bottom-right 4/102 & No.006,
  // soft smartphone lighting, AND cards photographed sitting on a desk with bottom margin!)
  let extraBottomText = "";
  if (!bottom.cardNumber || (!bottom.setCode && scanJa)) {
    const [botFullGray, botWideBlack] = await Promise.all([
      cropGrayscale(baseBuf, w, h, 0.02, 0.76, 0.96, 0.22, 1250),
      !bottom.cardNumber
        ? cropBlackInk(baseBuf, w, h, 0.03, 0.74, 0.94, 0.23, 1250, 78, 50)
        : Promise.resolve(null),
    ]);

    const [fullGrayTxt, wideBlkTxt] = await Promise.all([
      recognizeWithLang("eng", botFullGray),
      botWideBlack ? recognizeWithLang("eng", botWideBlack) : Promise.resolve(""),
    ]);

    extraBottomText = `${fullGrayTxt}\n${wideBlkTxt}`;
    bottom = mergeBottomMeta(bottom, extractBottomCardMetadata(fullGrayTxt));
    if (wideBlkTxt) {
      bottom = mergeBottomMeta(bottom, extractBottomCardMetadata(wideBlkTxt));
    }
  }

  const suffixHints = `${botBlkText} ${extraBottomText} ${engTopGrayText}`;
  let jaMatch = scanJa
    ? extractJapaneseCardNameFromOcr(jpnTopBlackText, suffixHints)
    : null;
  let enName = scanEn ? extractEnglishCardNameFromOcr(engTopGrayText) : "";

  let allJpnText = jpnTopBlackText;
  let allEngTopText = engTopGrayText;

  // Pass 2 for Japanese Name: try grayscale top, white-ink top (for V/VMAX/VSTAR/GX/UR),
  // and wider upper-card zone (for smartphone photos with desk margin above the card!)
  if (scanJa && (!jaMatch || jaMatch.confidence < 88)) {
    const [topWhite, upperDeskGray] = await Promise.all([
      cropWhiteInk(baseBuf, w, h, 0.08, 0.02, 0.82, 0.12, 1000, 195, 50),
      cropGrayscale(baseBuf, w, h, 0.05, 0.04, 0.9, 0.28, 1050),
    ]);

    const [jpnGrayTxt, jpnWhiteTxt] = await Promise.all([
      recognizeWithLang("jpn", topGray),
      recognizeWithLang("jpn", topWhite),
    ]);
    allJpnText += `\n${jpnGrayTxt}\n${jpnWhiteTxt}`;

    const candidates = [
      jaMatch,
      extractJapaneseCardNameFromOcr(jpnGrayTxt, suffixHints),
      extractJapaneseCardNameFromOcr(jpnWhiteTxt, suffixHints),
    ].filter((x): x is NonNullable<typeof x> => Boolean(x));

    candidates.sort((a, b) => b.confidence - a.confidence);
    jaMatch = candidates[0] || null;

    if (!jaMatch) {
      const jpnDeskTxt = await recognizeWithLang("jpn", upperDeskGray);
      allJpnText += `\n${jpnDeskTxt}`;
      jaMatch = extractJapaneseCardNameFromOcr(jpnDeskTxt, suffixHints);
    }
  }

  // Pass 2 for English Name: desk-framed fallback + white-ink V/VMAX fallback
  if (scanEn && !enName && !jaMatch) {
    const [topWhite, upperDeskGray] = await Promise.all([
      cropWhiteInk(baseBuf, w, h, 0.06, 0.02, 0.82, 0.13, 1000, 195, 50),
      cropGrayscale(baseBuf, w, h, 0.04, 0.04, 0.92, 0.3, 1050),
    ]);
    const [engWhiteTxt, engDeskTxt] = await Promise.all([
      recognizeWithLang("eng", topWhite),
      recognizeWithLang("eng", upperDeskGray),
    ]);
    allEngTopText += `\n${engWhiteTxt}\n${engDeskTxt}`;
    enName =
      extractEnglishCardNameFromOcr(engWhiteTxt) ||
      extractEnglishCardNameFromOcr(engDeskTxt);
  }

  // Decide card language accurately
  const explicitEnglishHeader = /\b(BASIC|STAGE\s*[12]|Evolves\s+from|Trainer|Supporter|Weakness|Resistance)\b/i.test(
    `${allEngTopText} ${extraBottomText}`
  );
  const explicitJapaneseCard =
    Boolean(bottom.setCode) ||
    Boolean(bottom.rarityCode) ||
    (bottom.dexNumber !== null && !bottom.cardNumber) ||
    Boolean(jaMatch && (!enName || !explicitEnglishHeader));

  let detectedLanguage: "ja" | "en";
  if (mode === "ja") {
    detectedLanguage = "ja";
  } else if (mode === "en") {
    detectedLanguage = "en";
  } else if (explicitEnglishHeader && enName && !bottom.setCode) {
    detectedLanguage = "en";
  } else if (explicitJapaneseCard || (jaMatch && hasJapaneseText(allJpnText))) {
    detectedLanguage = "ja";
  } else {
    detectedLanguage = "en";
  }

  const hp =
    extractHpFromOcr(jpnTopBlackText) ??
    extractHpFromOcr(allEngTopText) ??
    extractHpFromOcr(allJpnText);

  const japaneseName = detectedLanguage === "ja" && jaMatch ? jaMatch.jaName : "";
  const englishName =
    detectedLanguage === "ja" && jaMatch ? jaMatch.enName : enName;
  const pokemonName =
    detectedLanguage === "ja"
      ? japaneseName || enName
      : enName || japaneseName;

  // Format user-friendly bottom card # display (e.g. "SV2a 201/165 SAR" or "199/165" or "No.006")
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
  };
}
