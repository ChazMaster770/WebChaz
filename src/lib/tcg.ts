import type {
  CardAttack,
  ScanLanguageMode,
  TcgCardCandidate,
} from "./constants";
import {
  cleanJapaneseBaseName,
  extractJapaneseRarity,
  extractJapaneseSetCode,
  formatBilingualJaCardName,
  formatJaSetName,
  hasJapaneseText,
  JAPANESE_RARITY_LABELS,
  normalizeSetTotalOcr,
  resolveCanonicalJaSetId,
  translateEnToJaQuery,
  translateJaToEnName,
} from "./pokemon-names";

const TCGDEX_EN = "https://api.tcgdex.net/v2/en";
const TCGDEX_JA = "https://api.tcgdex.net/v2/ja";
const LIMITLESS_JP_CDN = "https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpc";

interface TcgdexBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

interface TcgdexPricingVariant {
  marketPrice?: number | null;
  midPrice?: number | null;
  lowPrice?: number | null;
}

interface TcgdexDetail {
  id: string;
  localId: string;
  name: string;
  image?: string;
  category?: string;
  illustrator?: string;
  rarity?: string;
  hp?: number;
  dexId?: number[];
  types?: string[];
  stage?: string;
  suffix?: string;
  set?: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: {
      official?: number;
      total?: number;
    };
  };
  variants?: {
    firstEdition?: boolean;
    holo?: boolean;
    normal?: boolean;
    reverse?: boolean;
  };
  attacks?: Array<{
    name?: string;
    damage?: string | number;
    cost?: string[];
    effect?: string;
  }>;
  pricing?: {
    tcgplayer?: {
      holofoil?: TcgdexPricingVariant | null;
      normal?: TcgdexPricingVariant | null;
      reverseHolofoil?: TcgdexPricingVariant | null;
      "1stEditionHolofoil"?: TcgdexPricingVariant | null;
      unlimitedHolofoil?: TcgdexPricingVariant | null;
      "1stEditionNormal"?: TcgdexPricingVariant | null;
    } | null;
    cardmarket?: {
      trend?: number | null;
      avg?: number | null;
      avg7?: number | null;
      avg30?: number | null;
      "trend-holo"?: number | null;
      "avg-holo"?: number | null;
    } | null;
  };
}

const SUFFIX_REGEX =
  /\b(vmax|vstar|v-union|ex|gx|lv\.?\s*x|break|prime|legend|v|star)\b/gi;

export interface ParsedCardNumberQuery {
  cardNumber: string;
  setTotal: string;
  setCode: string;
  rarityCode: string;
  dexNumber: number | null;
}

/**
 * Parse flexible English & Japanese card number inputs such as:
 * - "201/165", "sv2a 201/165", "SV8a 217/187 SAR", "SV4a-349", "067/SV-P", "4/102", "No.006"
 */
export function parseCardNumberInput(
  rawNumber?: string | null,
  rawSetTotal?: string | null,
  rawSetCode?: string | null,
  rawRarity?: string | null
): ParsedCardNumberQuery {
  let working = (rawNumber || "").trim();
  let setCode = rawSetCode ? resolveCanonicalJaSetId(rawSetCode) || rawSetCode.trim() : "";
  let rarityCode = (rawRarity || "").trim().toUpperCase();
  let setTotal = (rawSetTotal || "").trim();
  let cardNumber = "";
  let dexNumber: number | null = null;

  if (!working) {
    return {
      cardNumber: "",
      setTotal: normalizeSetTotalOcr(setTotal),
      setCode,
      rarityCode,
      dexNumber: null,
    };
  }

  // Vintage Japanese "No.006" / "No. 25"
  const dexMatch = working.match(/^No\.?\s*0*(\d{1,3})$/i);
  if (dexMatch) {
    dexNumber = parseInt(dexMatch[1], 10);
    return { cardNumber: "", setTotal: "", setCode, rarityCode, dexNumber };
  }

  // Japanese promo like "067/SV-P" or "120/M-P"
  const jpPromo = working.match(/^#?\s*(\d{1,3})\s*[/|\\]\s*(SV-P|M-P|S-P|SM-P|XY-P)$/i);
  if (jpPromo) {
    return {
      cardNumber: jpPromo[1],
      setTotal: "",
      setCode: jpPromo[2].toUpperCase(),
      rarityCode,
      dexNumber: null,
    };
  }

  // Direct hyphenated TCG ID like "SV2a-201" or "sv8a-217" or "S12a-212"
  const hyphenId = working.match(
    /^([A-Za-z]{1,4}\d{1,2}[A-Za-z+]?)\s*-\s*(\d{1,3}[A-Za-z]?)$/
  );
  if (hyphenId) {
    const resolved = resolveCanonicalJaSetId(hyphenId[1]);
    if (resolved) {
      return {
        cardNumber: hyphenId[2],
        setTotal,
        setCode: resolved,
        rarityCode,
        dexNumber: null,
      };
    }
  }

  // Extract trailing Japanese rarity code if present (e.g. "sv2a 201/165 SAR")
  if (!rarityCode) {
    const foundRarity = extractJapaneseRarity(` ${working} `);
    if (foundRarity) {
      rarityCode = foundRarity;
      working = working
        .replace(new RegExp(`\\b${foundRarity}\\b`, "i"), " ")
        .trim();
    }
  }

  // Extract embedded Japanese set code (e.g. "sv2a 201/165" or "201/165 sv2a")
  if (!setCode) {
    const foundSet = extractJapaneseSetCode(working);
    if (foundSet) {
      setCode = foundSet;
      working = working
        .replace(new RegExp(`\\b${foundSet}\\b`, "i"), " ")
        .trim();
    }
  }

  // Fraction format: "201/165", "004 / 102", "TG17/TG30"
  const slashMatch = working.match(
    /#?\s*([A-Za-z]{0,4}\d{1,4}[a-zA-Z]?)\s*[/|\\]\s*([A-Za-z]{0,4}\d{1,4})/
  );
  if (slashMatch) {
    cardNumber = slashMatch[1].toUpperCase();
    setTotal = normalizeSetTotalOcr(slashMatch[2].toUpperCase());
  } else {
    const singleNum = working.match(/#?\s*([A-Za-z]{0,4}\d{1,4}[a-zA-Z]?)/);
    if (singleNum) {
      cardNumber = singleNum[1].toUpperCase();
    }
  }

  return {
    cardNumber,
    setTotal: setTotal ? normalizeSetTotalOcr(setTotal) : "",
    setCode,
    rarityCode,
    dexNumber,
  };
}

function normalizeLocalId(id: string): string {
  const trimmed = id.trim().toUpperCase();
  const alphaNum = trimmed.match(/^([A-Z]*)0*(\d+[A-Z]?)$/);
  if (alphaNum) {
    return `${alphaNum[1]}${alphaNum[2]}`;
  }
  return trimmed;
}

function cleanBaseEnglishName(rawName: string): string {
  return rawName
    .replace(/\([^)]*\)/g, " ")
    .replace(SUFFIX_REGEX, " ")
    .replace(/[^a-zA-Z0-9'♀♂.\-\séÉ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRarity(raw?: string, jaRarityCode?: string): string {
  if (jaRarityCode && JAPANESE_RARITY_LABELS[jaRarityCode]) {
    return JAPANESE_RARITY_LABELS[jaRarityCode];
  }
  if (!raw || raw.toLowerCase() === "none") return "Rare";
  const lower = raw.toLowerCase();
  if (jaRarityCode === "" && lower === "special illustration rare") {
    return "Special Illustration Rare";
  }
  return raw
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatJaCardRarity(raw?: string, hintCode?: string): string {
  const lower = (raw || "").toLowerCase();
  if (lower.includes("special illustration")) return "Special Art Rare (SAR)";
  if (lower === "illustration rare") return "Art Rare (AR)";
  if (lower === "double rare") return "Double Rare (RR)";
  if (lower === "triple rare") return "Triple Rare (RRR)";
  if (lower === "ultra rare") return "Super Rare (SR)";
  if (lower === "hyper rare") return "Ultra Rare (UR)";
  if (lower === "shiny ultra rare") return "Shiny Super Rare (SSR)";
  if (lower === "shiny rare") return "Shiny Rare (S)";
  if (hintCode && JAPANESE_RARITY_LABELS[hintCode]) {
    return JAPANESE_RARITY_LABELS[hintCode];
  }
  return formatRarity(raw);
}

function matchesRarityHint(tcgdexRarity: string | undefined, code: string): boolean {
  if (!tcgdexRarity || !code) return false;
  const r = tcgdexRarity.toLowerCase();
  switch (code.toUpperCase()) {
    case "SAR":
      return r.includes("special illustration") || r.includes("secret");
    case "AR":
      return r === "illustration rare";
    case "SR":
      return r.includes("ultra") || r.includes("holo rare v");
    case "UR":
    case "HR":
      return r.includes("hyper") || r.includes("secret");
    case "RR":
      return r.includes("double rare") || r.includes("holo rare v");
    case "RRR":
      return r.includes("triple rare") || r.includes("vmax") || r.includes("vstar");
    case "SSR":
      return r.includes("shiny");
    case "CHR":
    case "CSR":
      return r.includes("character") || r.includes("secret") || r.includes("illustration");
    default:
      return false;
  }
}

function extractMarketPrice(detail: TcgdexDetail): number | null {
  const tp = detail.pricing?.tcgplayer;
  if (tp) {
    const pools = [
      tp.holofoil,
      tp.normal,
      tp.unlimitedHolofoil,
      tp.reverseHolofoil,
      tp["1stEditionHolofoil"],
      tp["1stEditionNormal"],
    ];
    for (const p of pools) {
      const candidate = p?.marketPrice ?? p?.midPrice ?? p?.lowPrice;
      if (typeof candidate === "number" && candidate > 0 && candidate < 50000) {
        return Math.round(candidate * 100) / 100;
      }
    }
  }

  const cm = detail.pricing?.cardmarket;
  if (cm) {
    const eur =
      cm.trend ?? cm.avg7 ?? cm.avg30 ?? cm.avg ?? cm["trend-holo"] ?? cm["avg-holo"];
    if (typeof eur === "number" && eur > 0 && eur < 50000) {
      return Math.round(eur * 1.09 * 100) / 100;
    }
  }

  return null;
}

function inferVariant(detail: TcgdexDetail, rarityLabel: string): string {
  const r = rarityLabel.toLowerCase();
  if (
    r.includes("special art") ||
    r.includes("art rare") ||
    r.includes("illustration") ||
    r.includes("secret") ||
    r.includes("hyper") ||
    r.includes("super rare") ||
    r.includes("ultra")
  ) {
    return "Special Art Foil";
  }
  if (detail.variants?.holo) return "Holofoil";
  if (detail.variants?.reverse && !detail.variants?.normal) return "Reverse Holofoil";
  if (detail.variants?.firstEdition && !detail.variants?.normal) {
    return "1st Edition Holo";
  }
  return detail.variants?.normal ? "Normal" : "Holofoil";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ChazMasterAlbum/2.0",
      },
      signal: AbortSignal.timeout(6500),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface TcgdexSetSummary {
  id: string;
  name: string;
  cardCount?: { official?: number; total?: number };
}

let cachedJaSets: TcgdexSetSummary[] | null = null;

async function findJapaneseSetIdsByTotal(setTotalNum: number): Promise<string[]> {
  if (!Number.isFinite(setTotalNum) || setTotalNum <= 0) return [];
  if (!cachedJaSets) {
    const list = await fetchJson<TcgdexSetSummary[]>(`${TCGDEX_JA}/sets`);
    if (Array.isArray(list) && list.length > 0) {
      cachedJaSets = list.filter((s) => !/^CS[0-9A]/i.test(s.id));
    }
  }
  if (!cachedJaSets) return [];

  return cachedJaSets
    .filter(
      (s) =>
        s.cardCount?.official === setTotalNum || s.cardCount?.total === setTotalNum
    )
    .map((s) => s.id)
    // Prefer newest expansions (SV, M, S, SM, PMCG) first
    .reverse()
    .slice(0, 6);
}

async function resolveJapaneseCardImage(detail: TcgdexDetail): Promise<string> {
  if (detail.image) {
    return `${detail.image}/high.webp`;
  }
  // Fallback to LimitlessTCG authentic Japanese TPC scan CDN (covers SV8, SV10, M1-M6, S8b, SM8b, etc.)
  const setId = detail.set?.id;
  if (!setId) return "";
  const unpadded = detail.localId.replace(/^0+/, "") || detail.localId;
  const candidateUrl = `${LIMITLESS_JP_CDN}/${encodeURIComponent(setId)}/${encodeURIComponent(setId)}_${encodeURIComponent(unpadded)}_R_JP_LG.png`;

  try {
    const head = await fetch(candidateUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    if (head.ok) return candidateUrl;
  } catch {
    // Ignore CDN timeout
  }
  return "";
}

function isAuthenticJapaneseBrief(card: TcgdexBrief): boolean {
  if (!card?.id) return false;
  if (card.image?.includes("/tcgp/")) return false;
  // Filter out Simplified Chinese CS* sets mixed into TCGdex's ja listing
  const setPrefix = card.id.split("-")[0] || "";
  if (/^CS[0-9A]/i.test(setPrefix)) return false;
  return true;
}

function isPhysicalEnglishBrief(card: TcgdexBrief): boolean {
  if (!card?.id || !card.image) return false;
  if (card.image.includes("/tcgp/")) return false;
  return true;
}

export interface TcgSearchParams {
  name?: string;
  cardNumber?: string;
  setTotal?: string;
  setCode?: string;
  rarityCode?: string;
  hp?: number | null;
  illustrator?: string;
  dexNumber?: number | null;
  language?: ScanLanguageMode;
  limit?: number;
}

async function searchJapaneseDatabase(opts: {
  jaName: string;
  enName: string;
  cardNumber: string;
  setTotal: string;
  setCode: string;
  rarityCode: string;
  hp: number | null;
  illustrator: string;
  dexNumber: number | null;
  boostJapanese: boolean;
}): Promise<TcgCardCandidate[]> {
  const {
    jaName,
    cardNumber,
    setTotal,
    setCode,
    rarityCode,
    hp,
    illustrator,
    dexNumber,
    boostJapanese,
  } = opts;

  const normalizedNum = cardNumber ? normalizeLocalId(cardNumber) : "";
  const paddedNum = /^\d{1,2}$/.test(normalizedNum)
    ? normalizedNum.padStart(3, "0")
    : normalizedNum;
  const normalizedTotal = setTotal ? normalizeLocalId(setTotal) : "";

  const directDetails: TcgdexDetail[] = [];
  const briefMap = new Map<string, TcgdexBrief>();
  const addBriefs = (list: TcgdexBrief[] | null) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (isAuthenticJapaneseBrief(item) && !briefMap.has(item.id)) {
        briefMap.set(item.id, item);
      }
    }
  };

  // Strategy 0: Direct exact Japanese Set Code + Card Number lookup (e.g. SV2a-201, SV8a-217, M2a-223)
  // AND exact setTotal -> Japanese set ID resolution (e.g. 080/073 -> SV1a-080, 125/098 -> SV10-125 & S12-125!)
  if (normalizedNum) {
    const candidateSetIds = new Set<string>();
    if (setCode) candidateSetIds.add(setCode);
    const totalInt = parseInt(normalizedTotal, 10);
    if (Number.isFinite(totalInt) && totalInt >= 15) {
      const matchedSets = await findJapaneseSetIdsByTotal(totalInt);
      for (const sid of matchedSets) candidateSetIds.add(sid);
    }

    if (candidateSetIds.size > 0) {
      const idVariants: string[] = [];
      for (const sid of candidateSetIds) {
        idVariants.push(`${sid}-${paddedNum}`);
        if (normalizedNum !== paddedNum) {
          idVariants.push(`${sid}-${normalizedNum}`);
        }
      }
      const fetched = await Promise.all(
        idVariants
          .slice(0, 10)
          .map((id) =>
            fetchJson<TcgdexDetail>(`${TCGDEX_JA}/cards/${encodeURIComponent(id)}`)
          )
      );
      for (const d of fetched) {
        if (d?.id && !directDetails.some((x) => x.id === d.id)) {
          directDetails.push(d);
        }
      }
    }
  }

  // Strategy 1: Japanese Name + Card Number
  if (jaName && normalizedNum) {
    const urls = [
      `${TCGDEX_JA}/cards?name=${encodeURIComponent(jaName)}&localId=${encodeURIComponent(normalizedNum)}`,
    ];
    if (paddedNum !== normalizedNum) {
      urls.push(
        `${TCGDEX_JA}/cards?name=${encodeURIComponent(jaName)}&localId=${encodeURIComponent(paddedNum)}`
      );
    }
    const res = await Promise.all(urls.map((u) => fetchJson<TcgdexBrief[]>(u)));
    res.forEach(addBriefs);
  }

  // Strategy 2: Card Number exact lookup across all Japanese sets
  // Crucial when OCR nailed "201/165 SAR" or "080/073 AR" even if the Japanese name had foil glare!
  const exactHitsSoFar =
    directDetails.length +
    Array.from(briefMap.values()).filter(
      (b) => normalizeLocalId(b.localId) === normalizedNum
    ).length;

  if (normalizedNum && exactHitsSoFar < 2) {
    // TCGdex JA uses ?localId=217 (not eq: prefix on string localIds with leading zeros)
    const numUrls = [
      `${TCGDEX_JA}/cards?localId=${encodeURIComponent(paddedNum)}`,
    ];
    if (normalizedNum !== paddedNum) {
      numUrls.push(
        `${TCGDEX_JA}/cards?localId=${encodeURIComponent(normalizedNum)}`
      );
    }
    const numRes = await Promise.all(
      numUrls.map((u) => fetchJson<TcgdexBrief[]>(u))
    );
    const pool: TcgdexBrief[] = [];
    for (const list of numRes) {
      if (Array.isArray(list)) {
        pool.push(...list.filter(isAuthenticJapaneseBrief));
      }
    }
    // Sort to prefer exact localId match, matching setCode, matching jaName, and popular Japanese eras
    pool.sort((a, b) => {
      const score = (c: TcgdexBrief) => {
        let s = 0;
        if (normalizeLocalId(c.localId) === normalizedNum) s += 200;
        const cSet = (c.id.split("-")[0] || "").toLowerCase();
        if (setCode && cSet === setCode.toLowerCase()) s += 120;
        if (jaName && c.name.includes(jaName)) s += 70;
        if (c.image) s += 8;
        if (/^(sv|m\d|s1|s8|s6|sm12|sm8|pmcg)/i.test(c.id)) s += 6;
        return s;
      };
      return score(b) - score(a);
    });
    addBriefs(pool.slice(0, 22));
  }

  // Strategy 3: Vintage Japanese Old Back lookup by National Dex No. (e.g. No.006 リザードン)
  if (dexNumber && !normalizedNum) {
    const dexList = await fetchJson<TcgdexBrief[]>(
      `${TCGDEX_JA}/cards?dexId=eq:${dexNumber}`
    );
    if (Array.isArray(dexList)) {
      const vintageFirst = dexList
        .filter(isAuthenticJapaneseBrief)
        .sort((a, b) => {
          const vScore = (c: TcgdexBrief) =>
            /^(PMCG|neo|VS|web|E\d)/i.test(c.id) ? 20 : c.image ? 10 : 1;
          return vScore(b) - vScore(a);
        });
      addBriefs(vintageFirst.slice(0, 14));
    }
  }

  // Strategy 4: Japanese Name lookup (also recovers exact card via setTotal + HP + illustrator when a digit was misread!)
  const hasNameAndNumHit =
    directDetails.length > 0 ||
    Array.from(briefMap.values()).some(
      (b) =>
        (!normalizedNum || normalizeLocalId(b.localId) === normalizedNum) &&
        (!jaName || b.name.includes(jaName))
    );

  if (jaName && !hasNameAndNumHit) {
    const nameList = await fetchJson<TcgdexBrief[]>(
      `${TCGDEX_JA}/cards?name=${encodeURIComponent(jaName)}`
    );
    if (Array.isArray(nameList)) {
      const filtered = nameList.filter(isAuthenticJapaneseBrief);
      filtered.sort((a, b) => {
        const score = (c: TcgdexBrief) => {
          let s = 0;
          if (normalizedNum && normalizeLocalId(c.localId) === normalizedNum) s += 100;
          if (setCode && c.id.toLowerCase().startsWith(`${setCode.toLowerCase()}-`)) s += 90;
          // High localIds in SV/S sets are typically AR/SAR/SR chase cards collectors scan most
          const n = parseInt(c.localId, 10) || 0;
          if (rarityCode && ["SAR", "AR", "SR", "UR", "SSR", "CSR", "CHR"].includes(rarityCode) && n >= 70) {
            s += 15;
          }
          if (c.image) s += 10;
          if (c.id.startsWith("SV")) s += 8;
          else if (c.id.startsWith("M")) s += 7;
          else if (c.id.startsWith("S")) s += 6;
          else if (c.id.startsWith("PMCG")) s += 5;
          return s;
        };
        return score(b) - score(a);
      });
      addBriefs(filtered.slice(0, 16));
    }
  }

  // Strategy 5: Set code only search (if user typed e.g. "SV2a" + "Charizard")
  if (setCode && jaName && directDetails.length === 0 && briefMap.size === 0) {
    const setObj = await fetchJson<{ cards?: TcgdexBrief[] }>(
      `${TCGDEX_JA}/sets/${encodeURIComponent(setCode)}`
    );
    if (Array.isArray(setObj?.cards)) {
      const matching = setObj.cards.filter((c) => c.name.includes(jaName));
      addBriefs(matching.slice(0, 12));
    }
  }

  // Exclude IDs already fetched in directDetails
  const directIds = new Set(directDetails.map((d) => d.id));
  const preRanked = Array.from(briefMap.values())
    .filter((b) => !directIds.has(b.id))
    .map((b) => {
      let s = 0;
      const bNorm = normalizeLocalId(b.localId);
      if (setCode && b.id.toLowerCase().startsWith(`${setCode.toLowerCase()}-`)) s += 130;
      if (normalizedNum && bNorm === normalizedNum) s += 105;
      if (jaName && b.name === jaName) s += 55;
      else if (jaName && b.name.includes(jaName)) s += 45;
      if (b.image) s += 8;
      if (/^(SV|M\d|S12a|S8b|SM12a|SM8b|PMCG1)/.test(b.id)) s += 6;
      return { brief: b, preScore: s };
    })
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, 12);

  const fetchedDetails = await Promise.all(
    preRanked.map(({ brief }) =>
      fetchJson<TcgdexDetail>(`${TCGDEX_JA}/cards/${encodeURIComponent(brief.id)}`)
    )
  );

  const allDetails: TcgdexDetail[] = [
    ...directDetails,
    ...fetchedDetails.filter((d): d is TcgdexDetail => Boolean(d?.id)),
  ];

  const lowerIllus = illustrator.trim().toLowerCase();

  // Score all details first, then resolve fallback CDN images for top candidates
  const scored = allDetails.map((d) => {
    let rawScore = boostJapanese ? 18 : 0;
    const dSetId = d.set?.id || d.id.split("-")[0] || "";
    const dNormNum = normalizeLocalId(d.localId);
    const official = d.set?.cardCount?.official
      ? String(d.set.cardCount.official)
      : null;
    const total = d.set?.cardCount?.total ? String(d.set.cardCount.total) : null;

    const exactSet =
      Boolean(setCode) && dSetId.toLowerCase() === setCode.toLowerCase();
    const exactNum = Boolean(normalizedNum) && dNormNum === normalizedNum;
    const exactTotal =
      Boolean(normalizedTotal) &&
      ((official !== null && normalizeLocalId(official) === normalizedTotal) ||
        (total !== null && normalizeLocalId(total) === normalizedTotal));
    const exactName = Boolean(jaName) && d.name.includes(jaName);
    const exactHp = hp !== null && typeof d.hp === "number" && d.hp === hp;
    const exactIllus =
      lowerIllus.length >= 4 &&
      Boolean(d.illustrator) &&
      d.illustrator!.toLowerCase().includes(lowerIllus.slice(0, 5));
    const exactRarity = Boolean(rarityCode) && matchesRarityHint(d.rarity, rarityCode);

    if (exactSet) rawScore += 140;
    if (exactNum) rawScore += 110;
    if (exactTotal) rawScore += 95;
    if (exactName) rawScore += 65;
    if (exactIllus) rawScore += 55;
    if (exactHp) rawScore += 32;
    if (exactRarity) rawScore += 28;
    if (d.image) rawScore += 6;

    const marketPrice = extractMarketPrice(d);
    if (marketPrice !== null) rawScore += 6;

    let confidence = 56;
    if (exactSet && exactNum) confidence = 99;
    else if (exactNum && exactTotal && exactName) confidence = 99;
    else if (exactNum && exactTotal && (exactIllus || exactHp || exactRarity)) confidence = 98;
    else if (exactNum && exactTotal) confidence = 95;
    else if (exactNum && exactName && (exactIllus || exactHp)) confidence = 96;
    else if (exactNum && exactName) confidence = 93;
    else if (exactName && exactIllus) confidence = 94;
    else if (exactName && exactHp && exactRarity) confidence = 89;
    else if (exactName && !normalizedNum) confidence = 84;
    else if (exactNum) confidence = 72;

    if (boostJapanese && confidence >= 72) {
      confidence = Math.min(99, confidence + 1);
    }

    return { d, dSetId, official, total, marketPrice, confidence, rawScore };
  });

  scored.sort((a, b) => b.rawScore - a.rawScore || b.confidence - a.confidence);
  const topScored = scored.slice(0, 10);

  // Resolve Japanese images in parallel (TCGdex JA first, LimitlessTCG JP second)
  const resolvedImages = await Promise.all(
    topScored.map(({ d }) => resolveJapaneseCardImage(d))
  );

  return topScored.map((item, idx) => {
    const { d, dSetId, official, total, marketPrice, confidence, rawScore } = item;
    const primaryDex = Array.isArray(d.dexId) && d.dexId.length > 0 ? d.dexId[0] : null;
    const displayName = formatBilingualJaCardName(d.name, primaryDex);
    const displaySetName = formatJaSetName(dSetId, d.set?.name);
    const rarityLabel = formatJaCardRarity(d.rarity, rarityCode);

    const attacks: CardAttack[] = (d.attacks || [])
      .filter((a) => a?.name)
      .map((a) => ({
        name: String(a.name),
        damage: a.damage !== undefined ? String(a.damage) : "",
        cost: Array.isArray(a.cost) ? a.cost : [],
        effect: a.effect || "",
      }));

    // Pad 2-digit JP official set counts like 73 -> 073 when cardNumber is 3 digits (e.g. 080/073)
    const rawSetTotal = official && official !== "0" ? official : total;
    const formattedTotal =
      rawSetTotal && /^\d{2}$/.test(rawSetTotal) && /^\d{3}$/.test(d.localId)
        ? rawSetTotal.padStart(3, "0")
        : rawSetTotal;

    return {
      tcgId: d.id,
      language: "Japanese" as const,
      name: displayName,
      nativeName: d.name,
      cardNumber: d.localId,
      setTotal: formattedTotal,
      setName: displaySetName,
      setId: dSetId,
      setSymbolUrl: d.set?.symbol ? `${d.set.symbol}.webp` : null,
      rarity: rarityLabel,
      pokemonType: d.types?.[0] || "Colorless",
      hp: typeof d.hp === "number" ? d.hp : null,
      stage: d.stage || d.category || null,
      illustrator: d.illustrator || null,
      attacks,
      imageUrl: resolvedImages[idx],
      suggestedVariant: inferVariant(d, rarityLabel),
      marketPrice,
      confidence: confidence + Math.min(rawScore / 1000, 0.95),
    };
  });
}

async function searchEnglishDatabase(opts: {
  enName: string;
  rawName: string;
  cardNumber: string;
  setTotal: string;
  hp: number | null;
  illustrator: string;
}): Promise<TcgCardCandidate[]> {
  const { enName, rawName, cardNumber, setTotal, hp, illustrator } = opts;
  if (!enName && !cardNumber) return [];

  const normalizedNum = cardNumber ? normalizeLocalId(cardNumber) : "";
  const paddedNum = /^\d{1,2}$/.test(normalizedNum)
    ? normalizedNum.padStart(3, "0")
    : normalizedNum;
  const normalizedSetTotal = setTotal ? normalizeLocalId(setTotal) : "";

  const briefMap = new Map<string, TcgdexBrief>();
  const addBriefs = (list: TcgdexBrief[] | null) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (isPhysicalEnglishBrief(item) && !briefMap.has(item.id)) {
        briefMap.set(item.id, item);
      }
    }
  };

  if (enName && normalizedNum) {
    const queries = [
      `${TCGDEX_EN}/cards?name=${encodeURIComponent(enName)}&localId=${encodeURIComponent(normalizedNum)}`,
    ];
    if (paddedNum !== normalizedNum) {
      queries.push(
        `${TCGDEX_EN}/cards?name=${encodeURIComponent(enName)}&localId=${encodeURIComponent(paddedNum)}`
      );
    }
    const results = await Promise.all(
      queries.map((u) => fetchJson<TcgdexBrief[]>(u))
    );
    results.forEach(addBriefs);
  }

  const exactNumHits = Array.from(briefMap.values()).filter(
    (b) => normalizeLocalId(b.localId) === normalizedNum
  );

  if (normalizedNum && exactNumHits.length === 0) {
    const idQueries = [
      `${TCGDEX_EN}/cards?localId=eq:${encodeURIComponent(normalizedNum)}`,
    ];
    if (paddedNum !== normalizedNum) {
      idQueries.push(
        `${TCGDEX_EN}/cards?localId=eq:${encodeURIComponent(paddedNum)}`
      );
    }
    const idResults = await Promise.all(
      idQueries.map((u) => fetchJson<TcgdexBrief[]>(u))
    );
    const combined: TcgdexBrief[] = [];
    for (const r of idResults) {
      if (Array.isArray(r)) combined.push(...r.filter(isPhysicalEnglishBrief));
    }
    if (enName) {
      const needle = enName.toLowerCase();
      combined.sort((a, b) => {
        const aM = a.name.toLowerCase().includes(needle) ? 2 : 0;
        const bM = b.name.toLowerCase().includes(needle) ? 2 : 0;
        return bM - aM;
      });
    }
    addBriefs(combined.slice(0, 20));
  }

  if (enName && briefMap.size < 4) {
    const nameList = await fetchJson<TcgdexBrief[]>(
      `${TCGDEX_EN}/cards?name=${encodeURIComponent(enName)}`
    );
    if (Array.isArray(nameList)) {
      const physical = nameList.filter(isPhysicalEnglishBrief);
      physical.sort((a, b) => {
        const aExact =
          normalizedNum && normalizeLocalId(a.localId) === normalizedNum ? 10 : 0;
        const bExact =
          normalizedNum && normalizeLocalId(b.localId) === normalizedNum ? 10 : 0;
        if (aExact !== bExact) return bExact - aExact;
        const pref = (c: TcgdexBrief) =>
          c.id.startsWith("sv")
            ? 4
            : c.id.startsWith("swsh")
              ? 3
              : c.id.startsWith("base1")
                ? 4
                : 1;
        return pref(b) - pref(a);
      });
      addBriefs(physical.slice(0, 14));
    }
  }

  const lowerRaw = rawName.toLowerCase();
  const lowerBase = enName.toLowerCase();
  const lowerIllus = illustrator.trim().toLowerCase();

  const preRanked = Array.from(briefMap.values())
    .map((b) => {
      let s = 0;
      const bNorm = normalizeLocalId(b.localId);
      const bName = b.name.toLowerCase();
      if (normalizedNum && bNorm === normalizedNum) s += 105;
      if (lowerRaw && bName === lowerRaw) s += 60;
      else if (lowerBase && bName.includes(lowerBase)) s += 45;
      if (b.id.startsWith("sv") || b.id.startsWith("swsh") || b.id.startsWith("base1")) {
        s += 6;
      }
      return { brief: b, preScore: s };
    })
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, 10);

  const details = await Promise.all(
    preRanked.map(({ brief }) =>
      fetchJson<TcgdexDetail>(`${TCGDEX_EN}/cards/${encodeURIComponent(brief.id)}`)
    )
  );

  const candidates: TcgCardCandidate[] = [];
  for (let i = 0; i < details.length; i++) {
    const d = details[i];
    if (!d || !d.image) continue;

    let rawScore = preRanked[i].preScore;
    const official = d.set?.cardCount?.official
      ? String(d.set.cardCount.official)
      : null;
    const total = d.set?.cardCount?.total ? String(d.set.cardCount.total) : null;

    const exactNum =
      Boolean(normalizedNum) && normalizeLocalId(d.localId) === normalizedNum;
    const exactTotal =
      Boolean(normalizedSetTotal) &&
      ((official !== null && normalizeLocalId(official) === normalizedSetTotal) ||
        (total !== null && normalizeLocalId(total) === normalizedSetTotal));
    const exactName =
      Boolean(lowerBase) &&
      (d.name.toLowerCase().includes(lowerBase) ||
        lowerBase.includes(cleanBaseEnglishName(d.name).toLowerCase()));
    const exactHp = hp !== null && typeof d.hp === "number" && d.hp === hp;
    const exactIllus =
      lowerIllus.length >= 4 &&
      Boolean(d.illustrator) &&
      d.illustrator!.toLowerCase().includes(lowerIllus.slice(0, 5));

    if (exactTotal) rawScore += 95;
    if (exactIllus) rawScore += 50;
    if (exactHp) rawScore += 28;

    const marketPrice = extractMarketPrice(d);
    if (marketPrice !== null) rawScore += 8;

    const rarityLabel = formatRarity(d.rarity);
    const attacks: CardAttack[] = (d.attacks || [])
      .filter((a) => a?.name)
      .map((a) => ({
        name: String(a.name),
        damage: a.damage !== undefined ? String(a.damage) : "",
        cost: Array.isArray(a.cost) ? a.cost : [],
        effect: a.effect || "",
      }));

    let confidence = 55;
    if (exactNum && exactTotal && exactName) confidence = 99;
    else if (exactNum && exactTotal) confidence = 94;
    else if (exactNum && exactName) confidence = 93;
    else if (exactName && exactIllus) confidence = 92;
    else if (exactName && !normalizedNum) confidence = 82;
    else if (exactNum) confidence = 72;

    candidates.push({
      tcgId: d.id,
      language: "English",
      name: d.name,
      cardNumber: d.localId,
      setTotal: official || total,
      setName: d.set?.name || "Pokémon TCG",
      setId: d.set?.id || "",
      setSymbolUrl: d.set?.symbol ? `${d.set.symbol}.webp` : null,
      rarity: rarityLabel,
      pokemonType: d.types?.[0] || "Colorless",
      hp: typeof d.hp === "number" ? d.hp : null,
      stage: d.stage || d.category || null,
      illustrator: d.illustrator || null,
      attacks,
      imageUrl: `${d.image}/high.webp`,
      suggestedVariant: inferVariant(d, rarityLabel),
      marketPrice,
      confidence: confidence + Math.min(rawScore / 1000, 0.9),
    });
  }

  return candidates;
}

export async function searchOnlineTcgCards(
  params: TcgSearchParams
): Promise<TcgCardCandidate[]> {
  const rawName = (params.name || "").trim();
  const language: ScanLanguageMode = params.language || "auto";
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);

  const parsed = parseCardNumberInput(
    params.cardNumber,
    params.setTotal,
    params.setCode,
    params.rarityCode
  );

  // Also check if user typed a Japanese set code inside the name field (e.g. "リザードン sv2a")
  let setCode = parsed.setCode;
  let cleanedRawName = rawName;
  if (!setCode && rawName) {
    const nameSet = extractJapaneseSetCode(rawName);
    if (nameSet) {
      setCode = nameSet;
      cleanedRawName = rawName.replace(new RegExp(`\\b${nameSet}\\b`, "i"), " ").trim();
    }
  }

  const dexNumber = params.dexNumber ?? parsed.dexNumber;
  const hp = typeof params.hp === "number" && params.hp > 0 ? params.hp : null;
  const illustrator = (params.illustrator || "").trim();

  const nameIsJapanese = hasJapaneseText(cleanedRawName);
  const hasJaSignals =
    language === "ja" ||
    nameIsJapanese ||
    Boolean(setCode) ||
    Boolean(parsed.rarityCode) ||
    dexNumber !== null;

  // Resolve both Japanese and English query names regardless of input script!
  let jaQueryName = "";
  let enQueryName = "";

  if (nameIsJapanese) {
    jaQueryName = cleanJapaneseBaseName(cleanedRawName);
    const translatedEn = translateJaToEnName(jaQueryName);
    enQueryName = translatedEn ? cleanBaseEnglishName(translatedEn) : "";
  } else if (cleanedRawName) {
    enQueryName = cleanBaseEnglishName(cleanedRawName);
    jaQueryName = translateEnToJaQuery(cleanedRawName) || "";
  }

  if (
    !jaQueryName &&
    !enQueryName &&
    !parsed.cardNumber &&
    !setCode &&
    dexNumber === null
  ) {
    return [];
  }

  const shouldSearchJa = language === "ja" || language === "auto";
  const shouldSearchEn =
    language === "en" ||
    (language === "auto" && !setCode && !nameIsJapanese && dexNumber === null);

  const [jaResults, enResults] = await Promise.all([
    shouldSearchJa
      ? searchJapaneseDatabase({
          jaName: jaQueryName,
          enName: enQueryName,
          cardNumber: parsed.cardNumber,
          setTotal: parsed.setTotal,
          setCode,
          rarityCode: parsed.rarityCode,
          hp,
          illustrator,
          dexNumber,
          boostJapanese: hasJaSignals,
        })
      : Promise.resolve([]),
    shouldSearchEn
      ? searchEnglishDatabase({
          enName: enQueryName,
          rawName: cleanedRawName,
          cardNumber: parsed.cardNumber,
          setTotal: parsed.setTotal,
          hp,
          illustrator,
        })
      : Promise.resolve([]),
  ]);

  // If user searched in Japanese script and JA had < 2 results, optionally include EN reference equivalents last
  const combined = [...jaResults, ...enResults].sort(
    (a, b) => b.confidence - a.confidence
  );

  return combined.slice(0, limit).map((c) => ({
    ...c,
    confidence: Math.min(99, Math.round(c.confidence)),
  }));
}
