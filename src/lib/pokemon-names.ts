import { POKEMON_SPECIES } from "./pokemon-species-data";

// Popular Japanese Trainer, Supporter, Item, and Stadium cards: [englishName, japaneseName]
export const JAPANESE_TRAINERS: ReadonlyArray<readonly [string, string]> = [
  ["Iono", "ナンジャモ"],
  ["Lillie", "リーリエ"],
  ["Lillie's Determination", "リーリエの決心"],
  ["Acerola", "アセロラ"],
  ["Acerola's Premonition", "アセロラの予感"],
  ["Marnie", "マリィ"],
  ["Marnie's Pride", "マリィのプライド"],
  ["Cynthia", "シロナ"],
  ["Cynthia's Ambition", "シロナの覇気"],
  ["Erika's Invitation", "エリカの招待"],
  ["Erika's Hospitality", "エリカのおもてなし"],
  ["Giovanni's Charisma", "サカキのカリスマ"],
  ["Boss's Orders", "ボスの指令"],
  ["Professor's Research", "博士の研究"],
  ["Irida", "カイ"],
  ["Adaman", "セキ"],
  ["Miriam", "ミモザ"],
  ["Dendra", "キハダ"],
  ["Carmine", "ゼイユ"],
  ["Kieran", "スグリ"],
  ["Lisia", "ルチア"],
  ["Lisia's Appeal", "ルチアのアピール"],
  ["Lacey", "タロ"],
  ["Penny", "ボタン"],
  ["Nemona", "ネモ"],
  ["Arven", "ペパー"],
  ["Serena", "セレナ"],
  ["Rosa", "メイ"],
  ["Sightseer", "かんこうきゃく"],
  ["Misty", "カスミ"],
  ["Misty's Favor", "カスミのおねがい"],
  ["Brock", "タケシ"],
  ["Sabrina", "ナツメ"],
  ["Red's Challenge", "レッドの挑戦"],
  ["Green's Exploration", "ブルーの探索"],
  ["Blue's Tactics", "グリーンの戦略"],
  ["Crispin", "アカマツ"],
  ["Briar", "ブライア"],
  ["Perrin", "サザレ"],
  ["Lana's Aid", "スイレンのお世話"],
  ["Morty's Conviction", "マツバの確信"],
  ["Bianca's Devotion", "ベルのまごころ"],
  ["Rika", "チリ"],
  ["Parasol Lady", "パラソルおねえさん"],
  ["Grusha", "グルーシャ"],
  ["Klara", "クララ"],
  ["Sonia", "ソニア"],
  ["N", "N"],
  ["Hilda", "トウコ"],
  ["Dawn", "ヒカリ"],
  ["May", "ハルカ"],
  ["Friends in Galar", "ガラルの仲間たち"],
  ["Friends in Hisui", "ヒスイの仲間たち"],
  ["Friends in Sinnoh", "シンオウの仲間たち"],
  ["Friends in Alola", "アローラの仲間たち"],
  ["Friends in VMAX", "VMAXクライマックス"],
  ["Buddy-Buddy Poffin", "なかよしポフィン"],
  ["Master Ball", "マスターボール"],
  ["Ultra Ball", "ハイパーボール"],
  ["Nest Ball", "ネストボール"],
  ["Rare Candy", "ふしぎなアメ"],
  ["Night Stretcher", "夜のタンカ"],
  ["Earthen Vessel", "大地の器"],
  ["Counter Catcher", "カウンターキャッチャー"],
  ["Prime Catcher", "プライムキャッチャー"],
  ["Unfair Stamp", "アンフェアスタンプ"],
  ["Area Zero Underdepths", "ゼロの大空洞"],
];

// Official Japanese TCG set IDs (canonical casing) -> English collector set name
export const JAPANESE_SET_MAP: Record<string, string> = {
  // Mega Evolution era (2025-2026)
  M1L: "Mega Brave",
  M1S: "Mega Symphonia",
  M2: "Inferno X",
  M2a: "MEGA Dream ex",
  M3: "Munikis Zero",
  M4: "Ninja Spinner",
  M5: "Abyss Eye",
  M6: "Storm Emeralda",
  M6a: "30th Celebration",
  MC: "Start Deck 100 Battle Collection",
  MF: "30th Celebration Espeon & Umbreon",
  "M-P": "Mega Promo",
  // Scarlet & Violet era (2023-2025)
  SV1S: "Scarlet ex",
  SV1V: "Violet ex",
  SV1a: "Triplet Beat",
  SV2P: "Snow Hazard",
  SV2D: "Clay Burst",
  SV2a: "Pokémon Card 151",
  SV3: "Ruler of the Black Flame",
  SV3a: "Raging Surf",
  SV4K: "Ancient Roar",
  SV4M: "Future Flash",
  SV4a: "Shiny Treasure ex",
  SV5K: "Wild Force",
  SV5M: "Cyber Judge",
  SV5a: "Crimson Haze",
  SV6: "Mask of Change",
  SV6a: "Night Wanderer",
  SV7: "Stellar Miracle",
  SV7a: "Paradise Dragona",
  SV8: "Super Electric Breaker",
  SV8a: "Terastal Fest ex",
  SV9: "Battle Partners",
  SV9a: "Heat Wave Arena",
  SV10: "Glory of Team Rocket",
  SV11B: "Black Bolt",
  SV11W: "White Flare",
  "SV-P": "SV Promo",
  SVK: "Stellar Miracle Deck",
  SVLN: "Stellar Sylveon ex",
  SVLS: "Stellar Ceruledge ex",
  WCS23: "Yokohama Deck Pikachu",
  // Sword & Shield era (2019-2022)
  S1H: "Shield",
  S1W: "Sword",
  S1a: "VMAX Rising",
  S2: "Rebellion Crash",
  S2a: "Explosive Walker",
  S3: "Infinity Zone",
  S3a: "Legendary Heartbeat",
  S4: "Astonishing Volt Tackle",
  S4a: "Shiny Star V",
  S5I: "Single Strike Master",
  S5R: "Rapid Strike Master",
  S5a: "Matchless Fighters",
  S6H: "Silver Lance",
  S6K: "Jet-Black Spirit",
  S6a: "Eevee Heroes",
  S7D: "Towering Perfection",
  S7R: "Blue Sky Stream",
  S8: "Fusion Arts",
  S8a: "25th Anniversary Collection",
  S8b: "VMAX Climax",
  S9: "Star Birth",
  S9a: "Battle Region",
  S10D: "Time Gazer",
  S10P: "Space Juggler",
  S10a: "Dark Phantasma",
  S10b: "Pokémon GO",
  S11: "Lost Abyss",
  S11a: "Incandescent Arcana",
  S12: "Paradigm Trigger",
  S12a: "VSTAR Universe",
  // Sun & Moon highlights (2016-2019)
  SM1M: "Collection Moon",
  SM1S: "Collection Sun",
  SM2K: "Islands Await You",
  SM2L: "Alolan Moonlight",
  SM3H: "To Have Seen the Battle Rainbow",
  SM3N: "Darkness that Consumes Light",
  SM4A: "Ultridimensional Beasts",
  SM4S: "Awakened Heroes",
  SM5M: "Ultra Moon",
  SM5S: "Ultra Sun",
  SM6: "Forbidden Light",
  SM6a: "Dragon Storm",
  SM6b: "Champion Road",
  SM7: "Sky-Splitting Charisma",
  SM7a: "Thunderclap Spark",
  SM7b: "Fairy Rise",
  SM8: "Super-Burst Impact",
  SM8a: "Dark Order",
  SM8b: "GX Ultra Shiny",
  SM9: "Tag Bolt",
  SM9a: "Night Unison",
  SM9b: "Full Metal Wall",
  SM10: "Double Blaze",
  SM10a: "GG End",
  SM10b: "Sky Legend",
  SM11: "Miracle Twin",
  SM11a: "Remix Bout",
  SM11b: "Dream League",
  SM12: "Alter Genesis",
  SM12a: "TAG TEAM GX All Stars",
  SMP2: "Great Detective Pikachu",
  // XY / Classic highlights
  CP6: "20th Anniversary",
  CP5: "Mythical & Legendary Dream Shine",
  CP4: "Premium Champion Pack",
  CP3: "PokéKyun Collection",
  CP2: "Legendary Shine Collection",
  CP1: "Double Crisis",
  // Vintage Japanese (1996-2002)
  PMCG1: "Expansion Pack (1996 Base)",
  PMCG2: "Pokémon Jungle (JP)",
  PMCG3: "Mystery of the Fossils (JP)",
  PMCG4: "Team Rocket (JP)",
  PMCG5: "Leaders' Stadium (Gym 1)",
  PMCG6: "Challenge from the Darkness (Gym 2)",
  neo1: "Gold, Silver, to a New World...",
  neo2: "Crossing the Ruins...",
  neo3: "Awakening Legends...",
  neo4: "Darkness, and to Light...",
  VS1: "Pokémon Card ★ VS",
  web1: "Pokémon Card ★ web",
  E1: "Base Expansion Pack (e-Card)",
  E2: "The Town on No Map",
  E3: "Wind from the Sea",
  E4: "Split Earth",
  E5: "Mysterious Mountains",
};

const CANONICAL_JA_SET_LOOKUP = new Map<string, string>(
  Object.keys(JAPANESE_SET_MAP).map((id) => [id.toLowerCase(), id])
);

const JA_PREFIX_TO_EN: ReadonlyArray<readonly [string, string]> = [
  ["ロケット団の", "Team Rocket's "],
  ["ナンジャモの", "Iono's "],
  ["リーリエの", "Lillie's "],
  ["シロナの", "Cynthia's "],
  ["マリィの", "Marnie's "],
  ["ホップの", "Hop's "],
  ["ダイゴの", "Steven's "],
  ["ペパーの", "Arven's "],
  ["カスミの", "Misty's "],
  ["ヒビキの", "Ethan's "],
  ["Nの", "N's "],
  ["かがやく", "Radiant "],
  ["アローラ", "Alolan "],
  ["ガラル", "Galarian "],
  ["ヒスイ", "Hisuian "],
  ["パルデア", "Paldean "],
  ["オリジン", "Origin Forme "],
  ["れんげき", "Rapid Strike "],
  ["いちげき", "Single Strike "],
  ["フュージョン", "Fusion Strike "],
  ["わるい", "Dark "],
  ["ひかる", "Shining "],
  ["やさしい", "Light "],
  ["メガ", "Mega "],
  ["M", "Mega "],
];

const EN_PREFIX_TO_JA: ReadonlyArray<readonly [RegExp, string]> = [
  [/^team\s+rocket'?s\s+/i, "ロケット団の"],
  [/^iono'?s\s+/i, "ナンジャモの"],
  [/^lillie'?s\s+/i, "リーリエの"],
  [/^cynthia'?s\s+/i, "シロナの"],
  [/^marnie'?s\s+/i, "マリィの"],
  [/^hop'?s\s+/i, "ホップの"],
  [/^steven'?s\s+/i, "ダイゴの"],
  [/^ethan'?s\s+/i, "ヒビキの"],
  [/^misty'?s\s+/i, "カスミの"],
  [/^n'?s\s+/i, "Nの"],
  [/^radiant\s+/i, "かがやく"],
  [/^alolan\s+/i, "アローラ"],
  [/^galarian\s+/i, "ガラル"],
  [/^hisuian\s+/i, "ヒスイ"],
  [/^paldean\s+/i, "パルデア"],
  [/^dark\s+/i, "わるい"],
  [/^shining\s+/i, "ひかる"],
  [/^mega\s+/i, "メガ"],
];

export const JAPANESE_RARITY_LABELS: Record<string, string> = {
  SAR: "Special Art Rare (SAR)",
  AR: "Art Rare (AR)",
  SR: "Super Rare (SR)",
  UR: "Ultra Rare (UR)",
  HR: "Hyper Rare (HR)",
  RRR: "Triple Rare (RRR)",
  RR: "Double Rare (RR)",
  CSR: "Character Super Rare (CSR)",
  CHR: "Character Rare (CHR)",
  SSR: "Shiny Super Rare (SSR)",
  BWR: "Black White Rare (BWR)",
  MUR: "Mega Ultra Rare (MUR)",
  MA: "Mega Attack Rare (MA)",
  PR: "Prism Star (PR)",
  TR: "Trainer Rare (TR)",
  A: "Amazing Rare (A)",
  K: "Radiant Rare (K)",
  S: "Shiny Rare (S)",
  R: "Rare (R)",
  U: "Uncommon (U)",
  C: "Common (C)",
};

// Fast lookup maps
const dexToEn = new Map<number, string>();
const jaToEn = new Map<string, string>();
const enToJa = new Map<string, string>();

for (const [dex, en, ja] of POKEMON_SPECIES) {
  dexToEn.set(dex, en);
  jaToEn.set(ja, en);
  enToJa.set(en.toLowerCase(), ja);
}

for (const [en, ja] of JAPANESE_TRAINERS) {
  if (!jaToEn.has(ja)) jaToEn.set(ja, en);
  if (!enToJa.has(en.toLowerCase())) enToJa.set(en.toLowerCase(), ja);
}

export function hasJapaneseText(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF66-\uFF9F]/.test(text);
}

export function resolveCanonicalJaSetId(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+/g, "");
  return CANONICAL_JA_SET_LOOKUP.get(cleaned.toLowerCase()) || null;
}

export function formatJaSetName(setId: string, jaName?: string): string {
  const canonical = resolveCanonicalJaSetId(setId) || setId;
  const en = JAPANESE_SET_MAP[canonical];
  if (en && jaName && en !== jaName) {
    return `${en} (${canonical} · ${jaName})`;
  }
  if (en) {
    return `${en} (${canonical})`;
  }
  if (jaName) {
    return `${jaName} (${canonical})`;
  }
  return `Pokémon TCG JP (${canonical})`;
}

/**
 * Translate a Japanese card name (e.g. "リザードンex", "ロケット団のミュウツーex")
 * into its English equivalent (e.g. "Charizard ex", "Team Rocket's Mewtwo ex").
 */
export function translateJaToEnName(
  jaCardName: string,
  dexId?: number | null
): string | null {
  if (!jaCardName) return null;
  let core = jaCardName.trim();

  // Extract trailing TCG suffix (Xex, Yex, ex, EX, VMAX, VSTAR, V-UNION, GX, V, LV.X, BREAK)
  let suffix = "";
  const suffixMatch = core.match(
    /\s*([XY]\s*ex|VMAX|VSTAR|V-UNION|GX|EX|ex|LV\.?\s*X|BREAK|V|δ|☆)$/
  );
  if (suffixMatch) {
    const rawSuf = suffixMatch[1].replace(/\s+/g, "");
    if (rawSuf === "Xex") suffix = " X ex";
    else if (rawSuf === "Yex") suffix = " Y ex";
    else suffix = ` ${rawSuf}`;
    core = core.slice(0, core.length - suffixMatch[0].length).trim();
  }

  // Direct full match (handles Trainers like エリカの招待, ナンジャモ, etc.)
  const directFull = jaToEn.get(core);
  if (directFull) {
    return `${directFull}${suffix}`;
  }

  // Handle TAG TEAM cards like "レシラム&リザードン"
  if (core.includes("&") || core.includes("＆")) {
    const parts = core.split(/[&＆]/).map((p) => p.trim());
    const translated = parts.map((p) => jaToEn.get(p));
    if (translated.every(Boolean)) {
      return `${translated.join(" & ")}${suffix}`;
    }
  }

  // Strip known Japanese prefixes (メガ, ロケット団の, ナンジャモの, かがやく, etc.)
  let enPrefix = "";
  for (const [jpPre, enPre] of JA_PREFIX_TO_EN) {
    if (core.startsWith(jpPre) && core.length > jpPre.length) {
      enPrefix = enPre;
      core = core.slice(jpPre.length).trim();
      break;
    }
  }

  const coreEn = jaToEn.get(core) || (dexId ? dexToEn.get(dexId) : undefined);
  if (coreEn) {
    return `${enPrefix}${coreEn}${suffix}`;
  }

  // Check if any species name appears inside core + we have dexId
  if (dexId && dexToEn.has(dexId)) {
    return `${enPrefix}${dexToEn.get(dexId)}${suffix}`;
  }

  return null;
}

/**
 * Format a Japanese card name cleanly for display: e.g. "Charizard ex (リザードンex)"
 */
export function formatBilingualJaCardName(
  jaName: string,
  dexId?: number | null
): string {
  const en = translateJaToEnName(jaName, dexId);
  if (en && en.toLowerCase() !== jaName.toLowerCase()) {
    return `${en} (${jaName})`;
  }
  return jaName;
}

/**
 * Translate an English Pokémon or Trainer query (e.g. "Charizard ex", "Umbreon", "Iono")
 * into Japanese base name (e.g. "リザードン", "ブラッキー", "ナンジャモ") for TCGdex /v2/ja search.
 */
export function translateEnToJaQuery(rawEn: string): string | null {
  if (!rawEn) return null;
  let cleaned = rawEn
    .trim()
    .replace(/\([^)]*\)/g, " ") // remove parenthetical like "(リザードンex)"
    .replace(
      /\b(vmax|vstar|v-union|ex|gx|lv\.?\s*x|break|prime|legend|v|star|sar|ar|sr|ur|hr|rr|rrr|chr|csr|ssr|jp|japanese)\b/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;

  // Handle Mega Charizard X / Y trailing letter
  cleaned = cleaned.replace(/\s+[XY]$/i, "").trim();

  const direct = enToJa.get(cleaned.toLowerCase());
  if (direct) return direct;

  // Strip known English prefixes (Team Rocket's, Mega, Radiant, Dark, Iono's...)
  for (const [rx] of EN_PREFIX_TO_JA) {
    if (rx.test(cleaned)) {
      const rest = cleaned.replace(rx, "").trim();
      const baseJa = enToJa.get(rest.toLowerCase());
      if (baseJa) {
        // Returning the core Japanese Pokemon name yields broadest recall on TCGdex /v2/ja?name=
        return baseJa;
      }
    }
  }

  // Check individual words (e.g. "Shiny Bubble Mew" -> "ミュウ")
  const tokens = cleaned.split(/\s+/);
  for (const tok of tokens) {
    const hit = enToJa.get(tok.toLowerCase());
    if (hit) return hit;
  }

  return null;
}

/**
 * Strip Japanese suffixes so TCGdex /v2/ja/cards?name=... matches cleanly.
 */
export function cleanJapaneseBaseName(raw: string): string {
  // If string contains bilingual format "Charizard ex (リザードンex)", pull the Japanese part
  const parenJa = raw.match(/\(([^)]*[\u3040-\u30FF\u4E00-\u9FAF][^)]*)\)/);
  const target = parenJa ? parenJa[1] : raw;

  return target
    .replace(/\s*(VMAX|VSTAR|V-UNION|GX|EX|ex|LV\.?\s*X|BREAK|V|SAR|AR|SR|UR|HR|RR|RRR)\s*$/gi, "")
    .replace(/[「」『』【】()（）]/g, "")
    .trim();
}

// ============================================================================
// KATAKANA OCR NORMALIZATION & FUZZY MATCHING
// ============================================================================

const DAKUTEN_MAP: Record<string, string> = {
  ガ: "カ", ギ: "キ", グ: "ク", ゲ: "ケ", ゴ: "コ",
  ザ: "サ", ジ: "シ", ズ: "ス", ゼ: "セ", ゾ: "ソ",
  ダ: "タ", ヂ: "チ", ヅ: "ツ", デ: "テ", ド: "ト",
  バ: "ハ", ビ: "ヒ", ブ: "フ", ベ: "ヘ", ボ: "ホ",
  パ: "ハ", ピ: "ヒ", プ: "フ", ペ: "ヘ", ポ: "ホ",
  ヴ: "ウ",
  // Small katakana -> full size (OCR very commonly confuses ッ/ツ, ュ/ユ, ョ/ヨ, ャ/ヤ)
  ァ: "ア", ィ: "イ", ゥ: "ウ", ェ: "エ", ォ: "オ",
  ャ: "ヤ", ュ: "ユ", ョ: "ヨ", ッ: "ツ", ヮ: "ワ",
  ヶ: "ケ", ヵ: "カ",
  // Common kanji misreads of katakana by Tesseract jpn
  口: "ロ", 力: "カ", 工: "エ", 二: "ニ", 一: "ー", 十: "ナ",
  八: "ハ", 夕: "タ", ト: "ト", へ: "ヘ", り: "リ",
};

/**
 * Convert hiragana to katakana, remove inter-character OCR whitespace,
 * normalize choonpu dashes, and strip dakuten/handakuten/small-kana differences
 * so OCR outputs like "リ サ ー ド ン", "フラツキー", "ピカチョウ" match
 * "リザードン", "ブラッキー", "ピカチュウ" accurately.
 */
export function normalizeJaSkeleton(str: string): string {
  let out = "";
  for (const ch of str) {
    if (/\s/.test(ch)) continue;
    const code = ch.charCodeAt(0);
    let k = ch;
    // Hiragana -> Katakana
    if (code >= 0x3041 && code <= 0x3096) {
      k = String.fromCharCode(code + 0x60);
    } else if (ch === "ー" || ch === "一" || ch === "—" || ch === "–" || ch === "ｰ" || ch === "-") {
      k = "ー";
    }
    k = DAKUTEN_MAP[k] || k;
    out += k;
  }
  // Collapse repeated long-vowel marks (OCR often turns artwork lines into ーーー)
  return out.replace(/ー{2,}/g, "ー");
}

function toCompactKatakana(str: string): string {
  return str
    .replace(/\s+/g, "")
    .replace(/一/g, "ー")
    .replace(/口/g, "ロ")
    .replace(/力/g, "カ")
    .replace(/工/g, "エ")
    .replace(/二/g, "ニ");
}

// Precompute normalized skeletons for all 1,025 Pokemon + Japanese Trainers, sorted longest-first
interface JaDictEntry {
  ja: string;
  en: string;
  compact: string;
  skeleton: string;
}

const JA_OCR_DICT: JaDictEntry[] = [
  ...POKEMON_SPECIES.map(([, en, ja]) => ({
    ja,
    en,
    compact: toCompactKatakana(ja),
    skeleton: normalizeJaSkeleton(ja),
  })),
  ...JAPANESE_TRAINERS.filter(([, ja]) => ja.length >= 2).map(([en, ja]) => ({
    ja,
    en,
    compact: toCompactKatakana(ja),
    skeleton: normalizeJaSkeleton(ja),
  })),
].sort((a, b) => b.skeleton.length - a.skeleton.length);

// Japanese rule/stage boilerplate phrases to strip BEFORE matching Pokemon names
// (e.g. "イーブイから進化" contains "イーブイ" on an Umbreon card! Stripping "〇〇から進化" prevents matching the pre-evolution!)
const JA_EVOLUTION_NOISE = [
  /[ァ-ヶー]{2,9}\s*[かが]\s*ら\s*(?:進\s*化|[^\s]{1,4})/g,
  /このポケモン/g,
  /ポケモンexルール/gi,
  /VSTARパワー/gi,
  /テラスタル/g,
  /ベンチにいるかぎり/g,
  /ワザのダメージ/g,
  /サイドを\d枚とる/g,
  /きぜつしたとき/g,
  /たねポケモン/g,
  /1進化|2進化/g,
  /サポート|グッズ|スタジアム|ポケモンのどうぐ|トレーナーズ/g,
];

function jaCharCost(a: string, b: string): number {
  if (a === b) return 0;
  // Visually nearly identical katakana pairs in OCR
  const closePairs = [
    ["ソ", "ン"],
    ["シ", "ツ"],
    ["ユ", "ヨ"],
    ["ウ", "ワ"],
    ["ク", "ケ"],
    ["ク", "タ"],
    ["コ", "ユ"],
    ["フ", "ワ"],
    ["フ", "ラ"],
    ["チ", "テ"],
    ["ナ", "メ"],
    ["ヌ", "ス"],
    ["ネ", "ホ"],
    ["マ", "ム"],
    ["ル", "レ"],
    ["ロ", "コ"],
    ["ア", "マ"],
  ];
  for (const [x, y] of closePairs) {
    if ((a === x && b === y) || (a === y && b === x)) return 0.45;
  }
  return 1;
}

function weightedLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = dp[i - 1][j - 1] + jaCharCost(a[i - 1], b[j - 1]);
      const del = dp[i - 1][j] + 0.85; // OCR sometimes inserts a stray duplicate kana (e.g. フララツキー)
      const ins = dp[i][j - 1] + 1.0;
      dp[i][j] = Math.min(sub, del, ins);
    }
  }
  return dp[m][n];
}

function detectTcgSuffixFromText(rawText: string): string {
  if (/\bV[MN]AX\b/i.test(rawText)) return "VMAX";
  if (/\bVSTAR\b/i.test(rawText)) return "VSTAR";
  if (/\bGX\b/i.test(rawText)) return "GX";
  if (/(?:\bex\b|@x\b|②\s*[<くZ@]|ex\s*[ルク]ー)/i.test(rawText)) return "ex";
  if (/\bLV\.?\s*X\b/i.test(rawText)) return "LV.X";
  return "";
}

/**
 * Match a Japanese Pokémon or Trainer name from noisy Tesseract `jpn` output.
 */
export function extractJapaneseCardNameFromOcr(
  rawJpnText: string,
  extraSuffixHintText = ""
): { jaName: string; enName: string; confidence: number } | null {
  if (!rawJpnText) return null;

  let cleaned = rawJpnText;
  for (const rx of JA_EVOLUTION_NOISE) {
    cleaned = cleaned.replace(rx, " ");
  }

  const suffix = detectTcgSuffixFromText(`${rawJpnText} ${extraSuffixHintText}`);
  const compact = toCompactKatakana(cleaned);
  const skeleton = normalizeJaSkeleton(cleaned);

  if (skeleton.length < 2) return null;

  // 1. Exact compact katakana/kanji substring match (prefer >= 3 chars first, then 2-char like ミュウ/カイ/メイ)
  for (const entry of JA_OCR_DICT) {
    if (entry.compact.length >= 3 && compact.includes(entry.compact)) {
      const jaFull = suffix ? `${entry.ja}${suffix}` : entry.ja;
      const enFull = suffix ? `${entry.en} ${suffix}` : entry.en;
      return { jaName: jaFull, enName: enFull, confidence: 98 };
    }
  }

  // 2. Dakuten-normalized skeleton substring match for names >= 4 chars
  // (catches リサードン -> リザードン, フラツキー -> ブラッキー, ゲンカー -> ゲンガー, コイキンク -> コイキング!)
  for (const entry of JA_OCR_DICT) {
    if (entry.skeleton.length >= 4 && skeleton.includes(entry.skeleton)) {
      const jaFull = suffix ? `${entry.ja}${suffix}` : entry.ja;
      const enFull = suffix ? `${entry.en} ${suffix}` : entry.en;
      return { jaName: jaFull, enName: enFull, confidence: 93 };
    }
  }

  // 3. Exact 3-char skeleton match for famous short names like ミュウ (ミユウ), ルギア (ルキア), ピチュー, イーブイ
  for (const entry of JA_OCR_DICT) {
    if (entry.skeleton.length === 3 && compact.includes(entry.compact)) {
      const jaFull = suffix ? `${entry.ja}${suffix}` : entry.ja;
      const enFull = suffix ? `${entry.en} ${suffix}` : entry.en;
      return { jaName: jaFull, enName: enFull, confidence: 92 };
    }
  }

  // 4. Extract contiguous katakana runs from skeleton and run weighted fuzzy match
  // (catches ピカチョウ -> ピカチュウ, フララツキー -> ブラッキー, コキジグ -> コイキング!)
  const katakanaRuns = skeleton.match(/[ァ-ヶー]{3,14}/g) || [];
  let bestEntry: JaDictEntry | null = null;
  let bestRatio = 0.34; // strict threshold to avoid false positives

  for (const run of katakanaRuns) {
    for (const entry of JA_OCR_DICT) {
      const len = entry.skeleton.length;
      if (len < 4) continue;
      // Check windows of length len-1 .. len+1 inside the katakana run
      const minW = Math.max(3, len - 1);
      const maxW = Math.min(run.length, len + 1);
      if (run.length < minW) continue;

      for (let w = minW; w <= maxW; w++) {
        for (let start = 0; start <= run.length - w; start++) {
          const slice = run.slice(start, start + w);
                // Require tight similarity (ratio < 0.25 for 4-char names, < 0.30 for 5+ char names)
          if (
            jaCharCost(slice[0], entry.skeleton[0]) > 0.5 &&
            jaCharCost(slice[slice.length - 1], entry.skeleton[len - 1]) > 0.5
          ) {
            continue;
          }
          const maxRatio = len >= 5 ? 0.3 : 0.22;
          const dist = weightedLevenshtein(slice, entry.skeleton);
          const ratio = dist / len;
          if (ratio < maxRatio && ratio < bestRatio) {
            bestRatio = ratio;
            bestEntry = entry;
          }
        }
      }
    }
  }

  if (bestEntry) {
    const jaFull = suffix ? `${bestEntry.ja}${suffix}` : bestEntry.ja;
    const enFull = suffix ? `${bestEntry.en} ${suffix}` : bestEntry.en;
    return {
      jaName: jaFull,
      enName: enFull,
      confidence: Math.round((1 - bestRatio) * 95),
    };
  }

  return null;
}

// ============================================================================
// ENGLISH OCR MATCHING (All 1,025 Species + Popular Trainers)
// ============================================================================

const EN_IGNORE_WORDS = new Set([
  "basic", "stage", "evolves", "from", "put", "on", "the", "pokemon", "pokémon",
  "hp", "trainer", "item", "supporter", "stadium", "tool", "ability", "illus",
  "weakness", "resistance", "retreat", "rule", "when", "your", "knocked", "out",
  "opponent", "takes", "prize", "cards", "card", "tera", "single", "strike",
  "rapid", "fusion", "nintendo", "creatures", "game", "freak", "vstar", "vmax",
  "ex", "gx", "tag", "team", "length", "weight", "planeta", "akira", "egawa",
  "mitsuhiro", "arita", "kudo", "yamamoto", "nanaco", "gidora", "usgmen",
]);

function simpleLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

const SORTED_EN_NAMES = [
  ...POKEMON_SPECIES.map(([, en]) => en),
  ...JAPANESE_TRAINERS.map(([en]) => en),
].sort((a, b) => b.length - a.length);

export function extractEnglishCardNameFromOcr(rawText: string): string {
  if (!rawText) return "";

  const normalized = rawText
    .replace(/[|[\]{}()_~`]/g, " ")
    .replace(/\bSTAGE\s*[12I]\b/gi, " ")
    .replace(/\bBASIC\b/gi, " ")
    .replace(/\bHP\s*\d{2,3}\b/gi, " ")
    .replace(/\b\d{2,3}\s*HP\b/gi, " ")
    .replace(/\bEvolves\s+from\s+[A-Za-z'-.]+/gi, " ")
    .replace(/\bIllus\.?\s+[A-Za-z]+\s*[A-Za-z]*/gi, " ");

  const suffixRaw = detectTcgSuffixFromText(rawText);
  const suffix = suffixRaw ? ` ${suffixRaw}` : "";

  const lower = normalized.toLowerCase();
  for (const name of SORTED_EN_NAMES) {
    if (name.length < 3) continue;
    const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(lower)) {
      return `${name}${suffix}`;
    }
  }

  const tokens = normalized
    .split(/\s+/)
    .map((t) =>
      t
        .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9']+$/g, "")
        .replace(/0/g, "o")
        .replace(/1/g, "i")
        .replace(/5/g, "s")
    )
    .filter(
      (t) =>
        t.length >= 4 &&
        !EN_IGNORE_WORDS.has(t.toLowerCase()) &&
        !/^\d+$/.test(t)
    );

  let bestName = "";
  let bestRatio = 0.26;
  for (const tok of tokens) {
    const lt = tok.toLowerCase();
    for (const [, en] of POKEMON_SPECIES) {
      if (en.includes(" ")) continue;
      const le = en.toLowerCase();
      if (Math.abs(lt.length - le.length) > 2) continue;
      if (lt[0] !== le[0] && lt[lt.length - 1] !== le[le.length - 1]) continue;
      const dist = simpleLevenshtein(lt, le);
      const maxAllowed = le.length >= 7 ? 2 : 1;
      const ratio = dist / le.length;
      if (dist <= maxAllowed && ratio < bestRatio) {
        bestRatio = ratio;
        bestName = en;
      }
    }
  }

  return bestName ? `${bestName}${suffix}` : "";
}

// ============================================================================
// BOTTOM-OF-CARD NUMBER, JAPANESE SET CODE, RARITY, HP & ILLUSTRATOR PARSERS
// ============================================================================

function fixDigitChunk(raw: string): string {
  const prefix = raw.match(/^(TG|GG|SV|RC|SH|SVP|SWSH|SM|XY|BW)(.+)$/i);
  const fix = (s: string) =>
    s
      .replace(/[OoQD]/g, "0")
      .replace(/[Il|!]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/[Bb]/g, "8");
  if (prefix) {
    return `${prefix[1].toUpperCase()}${fix(prefix[2])}`;
  }
  return fix(raw);
}

/**
 * Fix common Pokémon TCG bold-italic font confusion where leading "1" in
 * a 3-digit set total (like 165, 187, 190, 172, 106, 102, 193) is read by OCR as "7"
 * (e.g. 006/765 -> 006/165, 347/790 -> 347/190, 132/706 -> 132/106).
 */
export function normalizeSetTotalOcr(rawTotal: string): string {
  if (/^7\d{2}$/.test(rawTotal)) {
    const n = parseInt(rawTotal, 10);
    // Only MC deck has 742; every regular JP/EN expansion has <= 360 official cards
    if (n !== 742) {
      return `1${rawTotal.slice(1)}`;
    }
  }
  return rawTotal;
}

export interface ParsedBottomMeta {
  cardNumber: string;
  setTotal: string;
  setCode: string;
  rarityCode: string;
  illustrator: string;
  dexNumber: number | null;
}

export function extractJapaneseSetCode(text: string): string {
  if (!text) return "";

  // Fix frequent OCR misreads of Japanese set code boxes:
  // "svda" -> "sv4a", "$12a"/"$120" -> "s12a", "svBa" -> "sv8a", "sv2o" -> "sv2a"
  const normalized = text
    .replace(/\b[sS$][vV][dD][aA]\b/g, "SV4a")
    .replace(/(?:^|[\s([{|])\$12[aA0oO]\b/g, " S12a")
    .replace(/\b[sS]120\b/g, "S12a")
    .replace(/\b[sS][vV][B8][aA0oO]\b/g, "SV8a")
    .replace(/\b[sS][vV]2[0oO]\b/g, "SV2a")
    .replace(/\b[sS][vV]1[0oO]\b/g, "SV10");

  // Match explicit Japanese expansion codes: SV1a..SV11W, S1H..S12a, SM1M..SM12a, M1L..M6a, SV-P, M-P
  const patterns = [
    /\b(SV1[01][A-Za-z]?|SV[1-9][a-zA-Z]?|SV-P)\b/gi,
    /\b(S1[0-2][a-zA-Z]?|S[1-9][a-zA-Z])\b/gi,
    /\b(SM1[0-2][a-zA-Z]?|SM[1-9][a-zA-Z+])\b/gi,
    /\b(M[1-6][a-zA-Z]?|M-P|CP[1-6]|WCS23)\b/gi,
  ];

  for (const rx of patterns) {
    let m: RegExpExecArray | null;
    while ((m = rx.exec(normalized)) !== null) {
      const canonical = resolveCanonicalJaSetId(m[1]);
      if (canonical) return canonical;
    }
  }

  // Partial bracketed code like "(v2a)" -> SV2a or "(v8)" -> SV8
  const partialSv = normalized.match(/[([{|]\s*v(\d{1,2}[a-zA-Z]?)\s*[)\]}|]/i);
  if (partialSv) {
    const canonical = resolveCanonicalJaSetId(`SV${partialSv[1]}`);
    if (canonical) return canonical;
  }

  return "";
}

export function extractJapaneseRarity(text: string): string {
  if (!text) return "";
  // Look right after a card number fraction or clear standalone Japanese rarity marker
  const match = text.match(
    /(?:\/\s*\d{2,3}\s*[^A-Za-z0-9]{0,2}|\s)(SAR|BWR|MUR|CSR|CHR|SSR|RRR|AR|SR|UR|HR|RR|MA)(?:\b|[^A-Za-z])/
  );
  if (match) {
    return match[1].toUpperCase();
  }
  return "";
}

export function extractIllustratorFromOcr(text: string): string {
  if (!text) return "";
  const m = text.match(
    /(?:Illus|lllus|Hllus|Hus|lus)[.,:;»\s]+([A-Za-z][A-Za-z0-9.\-']{2,18}(?:\s+[A-Za-z][A-Za-z0-9.\-']{1,18})?)/i
  );
  if (!m) return "";
  return m[1]
    .replace(/\b(SV\d+[a-z]?|SAR|AR|SR|RR|UR)\b.*$/i, "")
    .trim();
}

export function extractHpFromOcr(text: string): number | null {
  if (!text) return null;
  // Standard Pokemon TCG HP is a multiple of 10 between 30 and 380
  const explicit =
    text.match(/\bHP\s*([3-9]0|[1-3][0-9]0)\b/i) ||
    text.match(/\b([3-9]0|[1-3][0-9]0)\s*HP\b/i) ||
    text.match(/(?:^|\D)([5-9]0|[1-3][0-8]0)(?:\D|$)/);
  if (!explicit) return null;
  const val = parseInt(explicit[1], 10);
  if (val >= 30 && val <= 380 && val % 10 === 0) return val;
  return null;
}

export function extractBottomCardMetadata(text: string): ParsedBottomMeta {
  const result: ParsedBottomMeta = {
    cardNumber: "",
    setTotal: "",
    setCode: extractJapaneseSetCode(text),
    rarityCode: extractJapaneseRarity(text),
    illustrator: extractIllustratorFromOcr(text),
    dexNumber: null,
  };

  if (!text) return result;

  const cleaned = text
    .replace(/\b(199\d|20[0-2]\d)\b/g, " ")
    .replace(/©/g, " ");

  // 1. Standard fraction: 201/165, 006/165, 347/190, 217/187, 4/102, 080/073, TG17/TG30
  // Also handles minor punctuation noise next to slash like "173/,165" or "201/ 165"
  const fracRx =
    /\b((?:TG|GG|SV|RC|SH)?[0-9OoIlSs]{1,3}[a-zA-Z]?)\s*[/|\\][.,\s]*((?:TG|GG|SV|RC|SH)?[0-9OoIlSs]{2,4})/g;

  let m: RegExpExecArray | null;
  while ((m = fracRx.exec(cleaned)) !== null) {
    const left = fixDigitChunk(m[1]);
    let right = fixDigitChunk(m[2]);

    if (!/\d/.test(left) || !/\d/.test(right)) continue;

    // Trim trailing rarity star read as 4th digit (e.g. 1658 -> 165, 1874 -> 187)
    const rDigitsOnly = right.replace(/\D/g, "");
    if (rDigitsOnly.length === 4) {
      right = right.slice(0, -1);
    }

    right = normalizeSetTotalOcr(right);
    const rNum = parseInt(right.replace(/\D/g, ""), 10);
    let fixedLeft = left;
    let lNum = parseInt(fixedLeft.replace(/\D/g, ""), 10);

    // Ignore OCR artifact "111" from "Illus" or vertical borders "|||"
    if (right === "111" || m[2] === "Ill" || m[2] === "lll") continue;
    // A zero-padded 3-digit card number (e.g. 006/165, 080/073) ALWAYS pairs with a 3-digit setTotal, never 2-digit
    if (/^0\d{2}$/.test(left) && /^\d{2}$/.test(right)) continue;

    // Fix Pokémon TCG italic font "1" read as "7" in 3-digit cardNumber (e.g. 732/106 -> 132/106, 773/165 -> 173/165)
    if (/^7\d{2}$/.test(fixedLeft) && rNum <= 360 && lNum > rNum + 200) {
      fixedLeft = `1${fixedLeft.slice(1)}`;
      lNum = parseInt(fixedLeft, 10);
    }

    if (lNum >= 1 && lNum <= 800 && ((rNum >= 15 && rNum <= 380) || rNum === 742)) {
      result.cardNumber = fixedLeft;
      result.setTotal = right;
      break;
    }
  }

  // 2. Slash misread as "7" in 7-digit string: e.g. "1737165" -> 173 / 165, "0807073" -> 080 / 073
  if (!result.cardNumber) {
    const sevenDigit = cleaned.match(/\b(\d{3})7([0-37]\d{2})\b/);
    if (sevenDigit) {
      const left = sevenDigit[1];
      const right = normalizeSetTotalOcr(sevenDigit[2]);
      const lNum = parseInt(left, 10);
      const rNum = parseInt(right, 10);
      if (lNum >= 1 && lNum <= 400 && rNum >= 20 && rNum <= 360) {
        result.cardNumber = left;
        result.setTotal = right;
      }
    }
  }

  // 3. Adjacent 3-digit numbers where thin "/" vanished: "201 165" or "217 187"
  if (!result.cardNumber) {
    const adj = cleaned.match(/\b(\d{3})\s+([0-37]\d{2})\b/);
    if (adj) {
      const left = adj[1];
      const right = normalizeSetTotalOcr(adj[2]);
      const rNum = parseInt(right, 10);
      if (rNum >= 20 && rNum <= 360) {
        result.cardNumber = left;
        result.setTotal = right;
      }
    }
  }

  // 4. Japanese & English Promo numbers: e.g. "123/SV-P", "067/SV-P", "SWSH260", "SVP 074"
  if (!result.cardNumber) {
    const jpPromo = cleaned.match(/\b(\d{3})\s*[/|\\]\s*(SV-P|S-P|SM-P|XY-P|M-P)\b/i);
    if (jpPromo) {
      result.cardNumber = jpPromo[1];
      result.setCode = jpPromo[2].toUpperCase();
    } else {
      const enPromo = cleaned.match(/\b(SWSH|SVP|SM|XY|BW)\s*([0-9OoIl]{2,3})\b/i);
      if (enPromo) {
        result.cardNumber = fixDigitChunk(enPromo[2]);
      }
    }
  }

  // 5. Vintage 1996-2000 Japanese Old Back "No.006" / "No.025" / "No.150"
  const dexMatch = cleaned.match(/\bNo\.?\s*0*(\d{1,3})\b/i);
  if (dexMatch) {
    const dex = parseInt(dexMatch[1], 10);
    if (dex >= 1 && dex <= 251) {
      result.dexNumber = dex;
    }
  }

  return result;
}
