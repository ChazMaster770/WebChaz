import type { CardAttack, TcgCardCandidate } from "./constants";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

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
      "trend-holo"?: number | null;
      "avg-holo"?: number | null;
    } | null;
  };
}

const SUFFIX_REGEX = /\b(vmax|vstar|v-union|ex|gx|lv\.?\s*x|break|prime|legend|v|star)\b/gi;

export function parseCardNumberInput(
  rawNumber?: string | null,
  rawSetTotal?: string | null
): { cardNumber: string; setTotal: string } {
  const cleanNum = (rawNumber || "").trim();
  const cleanTotal = (rawSetTotal || "").trim();

  if (!cleanNum) {
    return { cardNumber: "", setTotal: cleanTotal.replace(/^0+/, "") };
  }

  // Handle combined format like "199/165", "004 / 102", "TG17/TG30", "#215/203"
  const slashMatch = cleanNum.match(
    /^#?\s*([A-Za-z]{0,4}\s*\d{1,4}[a-zA-Z]?)\s*[/|\\]\s*([A-Za-z]{0,4}\s*\d{1,4})\s*$/
  );
  if (slashMatch) {
    return {
      cardNumber: slashMatch[1].replace(/\s+/g, "").toUpperCase(),
      setTotal: slashMatch[2].replace(/\s+/g, "").toUpperCase(),
    };
  }

  return {
    cardNumber: cleanNum.replace(/^#/, "").replace(/\s+/g, "").toUpperCase(),
    setTotal: cleanTotal.replace(/\s+/g, "").toUpperCase(),
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

function cleanBasePokemonName(rawName: string): string {
  return rawName
    .replace(SUFFIX_REGEX, " ")
    .replace(/[^a-zA-Z0-9'♀♂.\-\séÉ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRarity(raw?: string): string {
  if (!raw || raw.toLowerCase() === "none") return "Promo / Rare";
  return raw
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
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
    const eur = cm.trend ?? cm.avg ?? cm["trend-holo"] ?? cm["avg-holo"];
    if (typeof eur === "number" && eur > 0 && eur < 50000) {
      return Math.round(eur * 1.09 * 100) / 100;
    }
  }

  return null;
}

function inferVariant(detail: TcgdexDetail): string {
  const r = (detail.rarity || "").toLowerCase();
  if (
    r.includes("illustration") ||
    r.includes("secret") ||
    r.includes("hyper") ||
    r.includes("special") ||
    r.includes("ultra")
  ) {
    return "Special Art Foil";
  }
  if (detail.variants?.holo) return "Holofoil";
  if (detail.variants?.reverse && !detail.variants?.normal) return "Reverse Holofoil";
  if (detail.variants?.firstEdition && !detail.variants?.normal) return "1st Edition Holo";
  return detail.variants?.normal ? "Normal" : "Holofoil";
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ChazMasterAlbum/1.0",
      },
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function isPhysicalCardWithImage(card: TcgdexBrief): boolean {
  if (!card.image) return false;
  // Exclude digital Pokemon TCG Pocket sets
  if (card.image.includes("/tcgp/")) return false;
  return true;
}

export async function searchOnlineTcgCards(params: {
  name?: string;
  cardNumber?: string;
  setTotal?: string;
  limit?: number;
}): Promise<TcgCardCandidate[]> {
  const rawName = (params.name || "").trim();
  const baseName = cleanBasePokemonName(rawName);
  const { cardNumber, setTotal } = parseCardNumberInput(
    params.cardNumber,
    params.setTotal
  );
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 20);

  if (!baseName && !rawName && !cardNumber) {
    return [];
  }

  const normalizedNum = cardNumber ? normalizeLocalId(cardNumber) : "";
  const paddedNum =
    /^\d{1,2}$/.test(normalizedNum) ? normalizedNum.padStart(3, "0") : normalizedNum;

  const briefMap = new Map<string, TcgdexBrief>();
  const addBriefs = (list: TcgdexBrief[] | null) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (item?.id && isPhysicalCardWithImage(item) && !briefMap.has(item.id)) {
        briefMap.set(item.id, item);
      }
    }
  };

  // Strategy 1: Name + cardNumber simultaneously (fastest & highest precision)
  if (baseName && normalizedNum) {
    const queries = [
      `${TCGDEX_BASE}/cards?name=${encodeURIComponent(baseName)}&localId=${encodeURIComponent(normalizedNum)}`,
    ];
    if (paddedNum !== normalizedNum) {
      queries.push(
        `${TCGDEX_BASE}/cards?name=${encodeURIComponent(baseName)}&localId=${encodeURIComponent(paddedNum)}`
      );
    }
    const results = await Promise.all(queries.map((u) => fetchJson<TcgdexBrief[]>(u)));
    results.forEach(addBriefs);
  }

  // Strategy 2: If cardNumber given and few/no exact localId matches, search by localId directly
  // (catches cases where OCR slightly garbled the Pokemon name or had a prefix like "Dark Charizard")
  const exactNumHits = Array.from(briefMap.values()).filter(
    (b) => normalizeLocalId(b.localId) === normalizedNum
  );

  if (normalizedNum && exactNumHits.length === 0) {
    const idQueries = [
      `${TCGDEX_BASE}/cards?localId=eq:${encodeURIComponent(normalizedNum)}`,
    ];
    if (paddedNum !== normalizedNum) {
      idQueries.push(
        `${TCGDEX_BASE}/cards?localId=eq:${encodeURIComponent(paddedNum)}`
      );
    }
    if (cardNumber !== normalizedNum && cardNumber !== paddedNum) {
      idQueries.push(
        `${TCGDEX_BASE}/cards?localId=eq:${encodeURIComponent(cardNumber)}`
      );
    }
    const idResults = await Promise.all(
      idQueries.map((u) => fetchJson<TcgdexBrief[]>(u))
    );
    const combined: TcgdexBrief[] = [];
    for (const r of idResults) {
      if (Array.isArray(r)) combined.push(...r.filter(isPhysicalCardWithImage));
    }

    if (baseName) {
      const needle = baseName.toLowerCase();
      // Prefer cards sharing letters/words with scanned name, then keep others if setTotal can narrow it
      combined.sort((a, b) => {
        const aMatch = a.name.toLowerCase().includes(needle)
          ? 2
          : needle.length >= 3 && a.name.toLowerCase().includes(needle.slice(0, 4))
            ? 1
            : 0;
        const bMatch = b.name.toLowerCase().includes(needle)
          ? 2
          : needle.length >= 3 && b.name.toLowerCase().includes(needle.slice(0, 4))
            ? 1
            : 0;
        return bMatch - aMatch;
      });
    }
    addBriefs(combined.slice(0, 28));
  }

  // Strategy 3: Name-only search (either no cardNumber provided, or fallback to show prints of that Pokemon)
  if (baseName && briefMap.size < 4) {
    const nameList = await fetchJson<TcgdexBrief[]>(
      `${TCGDEX_BASE}/cards?name=${encodeURIComponent(baseName)}`
    );
    if (Array.isArray(nameList)) {
      const physical = nameList.filter(isPhysicalCardWithImage);
      // Prefer exact number match first, then modern popular sets (sv, swsh, base)
      physical.sort((a, b) => {
        const aExact =
          normalizedNum && normalizeLocalId(a.localId) === normalizedNum ? 10 : 0;
        const bExact =
          normalizedNum && normalizeLocalId(b.localId) === normalizedNum ? 10 : 0;
        if (aExact !== bExact) return bExact - aExact;

        const prefScore = (c: TcgdexBrief) => {
          if (c.id.startsWith("sv")) return 4;
          if (c.id.startsWith("swsh")) return 3;
          if (c.id.startsWith("base1")) return 4;
          if (c.id.startsWith("sm")) return 2;
          return 1;
        };
        return prefScore(b) - prefScore(a);
      });
      addBriefs(physical.slice(0, 18));
    }
  }

  // Pre-rank briefs so we fetch details for the best 14 candidates
  const lowerRaw = rawName.toLowerCase();
  const lowerBase = baseName.toLowerCase();

  const preRanked = Array.from(briefMap.values())
    .map((b) => {
      let s = 0;
      const bNorm = normalizeLocalId(b.localId);
      const bName = b.name.toLowerCase();

      if (normalizedNum && bNorm === normalizedNum) s += 100;
      else if (normalizedNum && bNorm.includes(normalizedNum)) s += 20;

      if (lowerRaw && bName === lowerRaw) s += 60;
      else if (lowerBase && bName === lowerBase) s += 50;
      else if (lowerBase && bName.startsWith(lowerBase)) s += 42;
      else if (lowerBase && bName.includes(lowerBase)) s += 32;
      else if (
        lowerBase.length >= 4 &&
        bName.includes(lowerBase.slice(0, 4))
      ) {
        s += 15;
      }

      if (b.id.startsWith("sv") || b.id.startsWith("swsh") || b.id.startsWith("base1")) {
        s += 6;
      }
      return { brief: b, preScore: s };
    })
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, 14);

  const details = await Promise.all(
    preRanked.map(({ brief }) =>
      fetchJson<TcgdexDetail>(`${TCGDEX_BASE}/cards/${encodeURIComponent(brief.id)}`)
    )
  );

  const normalizedSetTotal = setTotal ? normalizeLocalId(setTotal) : "";
  const candidates: TcgCardCandidate[] = [];

  for (let i = 0; i < details.length; i++) {
    const d = details[i];
    if (!d || !d.image) continue;

    let score = preRanked[i].preScore;
    const officialCount = d.set?.cardCount?.official
      ? String(d.set.cardCount.official)
      : null;
    const totalCount = d.set?.cardCount?.total
      ? String(d.set.cardCount.total)
      : null;

    if (normalizedSetTotal) {
      if (
        (officialCount && normalizeLocalId(officialCount) === normalizedSetTotal) ||
        (totalCount && normalizeLocalId(totalCount) === normalizedSetTotal)
      ) {
        score += 90;
      }
    }

    const marketPrice = extractMarketPrice(d);
    if (marketPrice !== null) score += 8;

    const attacks: CardAttack[] = (d.attacks || [])
      .filter((a) => a?.name)
      .map((a) => ({
        name: String(a.name),
        damage: a.damage !== undefined ? String(a.damage) : "",
        cost: Array.isArray(a.cost) ? a.cost : [],
        effect: a.effect || "",
      }));

    // Confidence normalized 0..99
    let confidence = 55;
    const exactNum = normalizedNum && normalizeLocalId(d.localId) === normalizedNum;
    const exactTotal =
      normalizedSetTotal &&
      ((officialCount && normalizeLocalId(officialCount) === normalizedSetTotal) ||
        (totalCount && normalizeLocalId(totalCount) === normalizedSetTotal));
    const nameHit =
      lowerBase &&
      (d.name.toLowerCase().includes(lowerBase) ||
        lowerBase.includes(cleanBasePokemonName(d.name).toLowerCase()));

    if (exactNum && exactTotal && nameHit) confidence = 99;
    else if (exactNum && nameHit) confidence = 94;
    else if (exactNum && exactTotal) confidence = 92;
    else if (nameHit && !normalizedNum) confidence = 82;
    else if (exactNum) confidence = 74;

    candidates.push({
      tcgId: d.id,
      name: d.name,
      cardNumber: d.localId,
      setTotal: officialCount || totalCount,
      setName: d.set?.name || "Pokémon TCG",
      setId: d.set?.id || "",
      setSymbolUrl: d.set?.symbol ? `${d.set.symbol}.webp` : null,
      rarity: formatRarity(d.rarity),
      pokemonType: d.types?.[0] || (d.category === "Trainer" ? "Colorless" : "Colorless"),
      hp: typeof d.hp === "number" ? d.hp : null,
      stage: d.stage || d.category || null,
      illustrator: d.illustrator || null,
      attacks,
      imageUrl: `${d.image}/high.webp`,
      suggestedVariant: inferVariant(d),
      marketPrice,
      confidence: confidence + Math.min(score / 1000, 0.9),
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);

  // Normalize confidence to clean integers
  return candidates.slice(0, limit).map((c) => ({
    ...c,
    confidence: Math.min(99, Math.round(c.confidence)),
  }));
}
