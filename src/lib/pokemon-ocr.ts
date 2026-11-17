"use client";

export interface ScannedCardInfo {
  pokemonName: string;
  cardNumber: string;
  setTotal: string;
  displayNumber: string;
  rawTopText: string;
  rawBottomText: string;
  capturedDataUrl: string;
}

// Complete Kanto 151 + most popular Gen 2-9 Pokemon for accurate OCR spell-correction
const POKEMON_DICTIONARY = [
  // Gen 1 (Complete 151)
  "Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard",
  "Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree",
  "Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata",
  "Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu",
  "Sandshrew","Sandslash","Nidoran","Nidorina","Nidoqueen","Nidorino",
  "Nidoking","Clefairy","Clefable","Vulpix","Ninetales","Jigglypuff",
  "Wigglytuff","Zubat","Golbat","Oddish","Gloom","Vileplume","Paras",
  "Parasect","Venonat","Venomoth","Diglett","Dugtrio","Meowth","Persian",
  "Psyduck","Golduck","Mankey","Primeape","Growlithe","Arcanine","Poliwag",
  "Poliwhirl","Poliwrath","Abra","Kadabra","Alakazam","Machop","Machoke",
  "Machamp","Bellsprout","Weepinbell","Victreebel","Tentacool","Tentacruel",
  "Geodude","Graveler","Golem","Ponyta","Rapidash","Slowpoke","Slowbro",
  "Magnemite","Magneton","Farfetch'd","Doduo","Dodrio","Seel","Dewgong",
  "Grimer","Muk","Shellder","Cloyster","Gastly","Haunter","Gengar","Onix",
  "Drowzee","Hypno","Krabby","Kingler","Voltorb","Electrode","Exeggcute",
  "Exeggutor","Cubone","Marowak","Hitmonlee","Hitmonchan","Lickitung",
  "Koffing","Weezing","Rhyhorn","Rhydon","Chansey","Tangela","Kangaskhan",
  "Horsea","Seadra","Goldeen","Seaking","Staryu","Starmie","Mr. Mime",
  "Scyther","Jynx","Electabuzz","Magmar","Pinsir","Tauros","Magikarp",
  "Gyarados","Lapras","Ditto","Eevee","Vaporeon","Jolteon","Flareon",
  "Porygon","Omanyte","Omastar","Kabuto","Kabutops","Aerodactyl","Snorlax",
  "Articuno","Zapdos","Moltres","Dratini","Dragonair","Dragonite","Mewtwo","Mew",
  // Gen 2 favorites
  "Chikorita","Bayleef","Meganium","Cyndaquil","Quilava","Typhlosion",
  "Totodile","Croconaw","Feraligatr","Pichu","Togepi","Togetic","Mareep",
  "Flaaffy","Ampharos","Marill","Azumarill","Sudowoodo","Espeon","Umbreon",
  "Murkrow","Slowking","Misdreavus","Unown","Wobbuffet","Steelix","Scizor",
  "Heracross","Sneasel","Teddiursa","Ursaring","Houndour","Houndoom","Kingdra",
  "Phanpy","Donphan","Blissey","Raikou","Entei","Suicune","Larvitar","Pupitar",
  "Tyranitar","Lugia","Ho-Oh","Celebi",
  // Gen 3 favorites
  "Treecko","Grovyle","Sceptile","Torchic","Combusken","Blaziken","Mudkip",
  "Marshtomp","Swampert","Ralts","Kirlia","Gardevoir","Sableye","Mawile",
  "Aron","Aggron","Manectric","Flygon","Altaria","Milotic","Banette","Absol",
  "Salamence","Beldum","Metang","Metagross","Regirock","Regice","Registeel",
  "Latias","Latios","Kyogre","Groudon","Rayquaza","Jirachi","Deoxys",
  // Gen 4 favorites
  "Turtwig","Torterra","Chimchar","Infernape","Piplup","Empoleon","Shinx",
  "Luxray","Roserade","Gible","Gabite","Garchomp","Munchlax","Riolu","Lucario",
  "Weavile","Magnezone","Rhyperior","Electivire","Magmortar","Togekiss",
  "Leafeon","Glaceon","Gliscor","Porygon-Z","Gallade","Dusknoir","Froslass",
  "Rotom","Dialga","Palkia","Heatran","Regigigas","Giratina","Cresselia",
  "Darkrai","Shaymin","Arceus",
  // Gen 5 favorites
  "Victini","Snivy","Serperior","Tepig","Emboar","Oshawott","Samurott",
  "Zorua","Zoroark","Chandelure","Axew","Haxorus","Hydreigon","Volcarona",
  "Cobalion","Terrakion","Virizion","Tornadus","Thundurus","Reshiram",
  "Zekrom","Landorus","Kyurem","Keldeo","Meloetta","Genesect",
  // Gen 6 favorites
  "Chespin","Chesnaught","Fennekin","Delphox","Froakie","Frogadier","Greninja",
  "Talonflame","Pancham","Honedge","Aegislash","Sylveon","Hawlucha","Goodra",
  "Noivern","Xerneas","Yveltal","Zygarde","Diancie","Hoopa","Volcanion",
  // Gen 7 favorites
  "Rowlet","Decidueye","Litten","Incineroar","Popplio","Primarina","Lycanroc",
  "Mimikyu","Kommo-o","Tapu Koko","Tapu Lele","Cosmog","Solgaleo","Lunala",
  "Nihilego","Buzzwole","Kartana","Guzzlord","Necrozma","Magearna","Marshadow",
  "Zeraora","Meltan","Melmetal",
  // Gen 8 favorites
  "Grookey","Rillaboom","Scorbunny","Cinderace","Sobble","Inteleon","Corviknight",
  "Yamper","Toxtricity","Hatterene","Grimmsnarl","Alcremie","Snom","Duraludon",
  "Dreepy","Drakloak","Dragapult","Zacian","Zamazenta","Eternatus","Kubfu",
  "Urshifu","Zarude","Regieleki","Regidrago","Glastrier","Spectrier","Calyrex",
  "Kleavor","Ursaluna","Sneasler","Enamorus",
  // Gen 9 favorites
  "Sprigatito","Floragato","Meowscarada","Fuecoco","Crocalor","Skeledirge",
  "Quaxly","Quaxwell","Quaquaval","Pawmi","Pawmot","Fidough","Ceruledge",
  "Armarouge","Iono","Tinkatink","Tinkaton","Palafin","Baxcalibur","Gimmighoul",
  "Gholdengo","Great Tusk","Scream Tail","Flutter Mane","Iron Treads","Iron Hands",
  "Iron Valiant","Roaring Moon","Walking Wake","Iron Leaves","Wo-Chien",
  "Chien-Pao","Ting-Lu","Chi-Yu","Koraidon","Miraidon","Ogerpon","Terapagos",
  "Pecharunt","Archaludon","Hydrapple","Gouging Fire","Raging Bolt","Iron Crown",
  "Iron Boulder",
];

const IGNORE_WORDS = new Set([
  "basic","stage","evolves","from","put","on","the","pokemon","pokémon",
  "hp","trainer","item","supporter","stadium","tool","ability","poke-power",
  "poke-body","illus","weakness","resistance","retreat","rule","when","your",
  "knocked","out","opponent","takes","prize","cards","card","tera","single",
  "strike","rapid","fusion","nintendo","creatures","game","freak","vstar",
  "vmax","ex","gx","tag","team","length","weight","ht","wt","no","lvl","lv",
]);

function levenshtein(a: string, b: string): number {
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

export function extractPokemonNameFromText(text: string): string {
  if (!text) return "";

  const normalized = text
    .replace(/[|[\]{}()_~`]/g, " ")
    .replace(/\bSTAGE\s*[12I]\b/gi, " ")
    .replace(/\bBASIC\b/gi, " ")
    .replace(/\bHP\s*\d{2,3}\b/gi, " ")
    .replace(/\b\d{2,3}\s*HP\b/gi, " ")
    .replace(/\bEvolves\s+from\s+[A-Za-z'-.]+/gi, " ");

  // Detect TCG suffix like ex (often read as @X on modern SV cards), VMAX, VSTAR, GX, V
  let suffix = "";
  if (/\bV[MN]AX\b/i.test(normalized)) suffix = " VMAX";
  else if (/\bVSTAR\b/i.test(normalized)) suffix = " VSTAR";
  else if (/\bGX\b/i.test(normalized)) suffix = " GX";
  else if (/(?:\bex\b|@x\b)/i.test(text)) suffix = " ex";
  else if (/\sV(?:\s|$)/m.test(normalized)) suffix = " V";

  // 1. Direct case-insensitive substring match against dictionary (prefer longest name)
  const sortedDict = [...POKEMON_DICTIONARY].sort((a, b) => b.length - a.length);
  const lowerText = normalized.toLowerCase();
  for (const poke of sortedDict) {
    const escaped = poke.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(lowerText)) {
      return `${poke}${suffix}`;
    }
  }

  // 2. Token-by-token fuzzy match against dictionary (catches OCR errors like Charlzard, P1kachu, Umbre0n)
  const rawTokens = normalized
    .split(/\s+/)
    .map((t) =>
      t
        .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9']+$/g, "")
        .replace(/0/g, "o")
        .replace(/1/g, "i")
        .replace(/5/g, "s")
    )
    .filter((t) => t.length >= 3 && !IGNORE_WORDS.has(t.toLowerCase()) && !/^\d+$/.test(t));

  let bestMatch = "";
  let bestRatio = 1;

  for (const token of rawTokens) {
    const lowerTok = token.toLowerCase();
    for (const poke of POKEMON_DICTIONARY) {
      const lowerPoke = poke.toLowerCase();
      if (Math.abs(lowerTok.length - lowerPoke.length) > 2) continue;
      const dist = levenshtein(lowerTok, lowerPoke);
      const maxAllowed = lowerPoke.length >= 7 ? 2 : 1;
      const ratio = dist / lowerPoke.length;
      if (dist <= maxAllowed && ratio < bestRatio) {
        bestRatio = ratio;
        bestMatch = poke;
      }
    }
  }

  if (bestMatch) {
    return `${bestMatch}${suffix}`;
  }

  // 3. Fallback: pick first clean alphabetic title word >= 4 chars (e.g. Trainer card name)
  const fallbackWord = rawTokens.find(
    (t) => /^[A-Za-z'-]{4,16}$/.test(t) && !IGNORE_WORDS.has(t.toLowerCase())
  );
  if (fallbackWord) {
    const titled =
      fallbackWord.charAt(0).toUpperCase() + fallbackWord.slice(1).toLowerCase();
    return `${titled}${suffix}`;
  }

  return "";
}

function fixOcrDigits(segment: string): string {
  // Keep valid gallery prefixes like TG, GG, SV, RC, SH, BW, XY, SM, SWSH, SVP
  const prefixMatch = segment.match(/^(TG|GG|SV|RC|SH|SVP|SWSH|SM|XY|BW)(.+)$/i);
  if (prefixMatch) {
    const digits = prefixMatch[2]
      .replace(/[OoQD]/g, "0")
      .replace(/[Il|!]/g, "1")
      .replace(/[Zz]/g, "2")
      .replace(/[Ss]/g, "5")
      .replace(/[Bb]/g, "8");
    return `${prefixMatch[1].toUpperCase()}${digits}`;
  }
  return segment
    .replace(/[OoQD]/g, "0")
    .replace(/[Il|!]/g, "1")
    .replace(/[Ss]/g, "5");
}

export function extractCardNumberFromText(text: string): {
  cardNumber: string;
  setTotal: string;
} {
  if (!text) return { cardNumber: "", setTotal: "" };

  const cleaned = text
    .replace(/\b(199\d|20[0-2]\d)\b/g, " ") // Remove copyright years like 1999, 2023, 2024
    .replace(/©/g, " ");

  // Pattern 1: Standard fraction format e.g. 199/165, 4/102, 025/165, TG17/TG30, GG70/GG70, SV049/SV122
  // Allows an optional 4th trailing digit in case OCR reads the rarity star (★) next to the set total
  const fractionRegex =
    /\b((?:TG|GG|SV|RC|SH)?[0-9OoIlSs]{1,3}[a-zA-Z]?)\s*[/|\\]\s*((?:TG|GG|SV|RC|SH)?[0-9OoIlSs]{2,4})\b/g;

  let match: RegExpExecArray | null;
  while ((match = fractionRegex.exec(cleaned)) !== null) {
    const left = fixOcrDigits(match[1]);
    const right = fixOcrDigits(match[2]);
    if (/\d/.test(left) && /\d/.test(right)) {
      const rDigits = right.replace(/\D/g, "");
      const rNum = parseInt(rDigits, 10);
      if (rNum >= 10 && rNum <= 360) {
        return { cardNumber: left, setTotal: right };
      }
      // Rarity star immediately after 165★ can read as 1658 or 658 — keep valid cardNumber
      if (rDigits.length === 4) {
        const trimmedRight = right.slice(0, -1);
        const trNum = parseInt(trimmedRight.replace(/\D/g, ""), 10);
        if (trNum >= 15 && trNum <= 360) {
          return { cardNumber: left, setTotal: trimmedRight };
        }
      }
      if (rNum > 360 && parseInt(left.replace(/\D/g, ""), 10) >= 1) {
        return { cardNumber: left, setTotal: "" };
      }
    }
  }

  // Pattern 2: Promo codes like SWSH260, SVP 074, SM210, XY124
  const promoMatch = cleaned.match(/\b(SWSH|SVP|SM|XY|BW|DP|HGSS)\s*([0-9OoIl]{2,3})\b/i);
  if (promoMatch) {
    const num = fixOcrDigits(promoMatch[2]);
    return { cardNumber: num, setTotal: "" };
  }

  // Pattern 3: Two adjacent 3-digit numbers where OCR dropped the thin "/" (e.g. "199 165" or "215 203")
  const droppedSlash = cleaned.match(/\b(\d{3})\s+(\d{3})\b/);
  if (droppedSlash) {
    const b = parseInt(droppedSlash[2], 10);
    if (b >= 50 && b <= 350) {
      return { cardNumber: droppedSlash[1], setTotal: droppedSlash[2] };
    }
  }

  return { cardNumber: "", setTotal: "" };
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

function cropEnhancedRegion(
  img: HTMLImageElement,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  scale: number,
  contrast = 1.55,
  invert = false
): HTMLCanvasElement {
  const sx = Math.floor(img.naturalWidth * rx);
  const sy = Math.floor(img.naturalHeight * ry);
  const sw = Math.max(16, Math.floor(img.naturalWidth * rw));
  const sh = Math.max(16, Math.floor(img.naturalHeight * rh));

  const targetW = Math.min(1500, Math.max(360, Math.round(sw * scale)));
  const targetH = Math.round((sh / sw) * targetW);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

  // Convert to crisp high-contrast grayscale to cut through holographic foil glare
  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const d = imgData.data;
  const factor = (259 * (contrast * 90 + 255)) / (255 * (259 - contrast * 90));

  for (let i = 0; i < d.length; i += 4) {
    const rawLum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const lum = invert ? 255 - rawLum : rawLum;
    const adj = Math.max(0, Math.min(255, factor * (lum - 128) + 128));
    d[i] = adj;
    d[i + 1] = adj;
    d[i + 2] = adj;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

export function createCompressedPhotoDataUrl(
  img: HTMLImageElement,
  maxWidth = 720
): string {
  const ratio = Math.min(1, maxWidth / Math.max(1, img.naturalWidth));
  const w = Math.max(1, Math.round(img.naturalWidth * ratio));
  const h = Math.max(1, Math.round(img.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export async function scanPokemonCardImage(
  imageSourceUrl: string,
  onProgress?: (stage: string, pct: number) => void
): Promise<ScannedCardInfo> {
  onProgress?.("Preparing card image...", 12);
  const img = await loadImageElement(imageSourceUrl);
  const capturedDataUrl = createCompressedPhotoDataUrl(img, 720);

  // Prepare top name strip & bottom card-number strip
  const topCanvas = cropEnhancedRegion(img, 0.03, 0.01, 0.78, 0.21, 2.0, 1.45);
  const bottomCanvas = cropEnhancedRegion(img, 0.01, 0.84, 0.98, 0.16, 2.6, 1.65);

  onProgress?.("Starting Pokémon card OCR...", 25);
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng");

  let rawTopText = "";
  let rawBottomText = "";
  let pokemonName = "";
  let cardNumber = "";
  let setTotal = "";

  try {
    onProgress?.("Reading Pokémon name at top...", 45);
    const topRes = await worker.recognize(topCanvas);
    rawTopText = (topRes.data?.text || "").trim();
    pokemonName = extractPokemonNameFromText(rawTopText);

    onProgress?.("Reading card number at bottom...", 68);
    const bottomRes = await worker.recognize(bottomCanvas);
    rawBottomText = (bottomRes.data?.text || "").trim();
    const bottomParsed = extractCardNumberFromText(rawBottomText);
    cardNumber = bottomParsed.cardNumber;
    setTotal = bottomParsed.setTotal;

    // Full-art & Special Illustration Rare cards often print white numbers in bottom-left corner
    if (!cardNumber) {
      onProgress?.("Zooming into bottom card number...", 78);
      const bottomLeftInv = cropEnhancedRegion(
        img,
        0.02,
        0.87,
        0.46,
        0.12,
        3.2,
        1.8,
        true
      );
      const invRes = await worker.recognize(bottomLeftInv);
      const invParsed = extractCardNumberFromText(invRes.data?.text || "");
      if (invParsed.cardNumber) {
        cardNumber = invParsed.cardNumber;
        setTotal = invParsed.setTotal;
        rawBottomText = (invRes.data?.text || "").trim();
      }
    }

    // If card wasn't tightly framed (e.g. sitting on a desk/playmat), run full-card scan fallback
    if (!pokemonName || !cardNumber) {
      onProgress?.("Deep-scanning full card layout...", 86);
      const fullCanvas = cropEnhancedRegion(img, 0, 0, 1, 1, 1.4, 1.35);
      const fullRes = await worker.recognize(fullCanvas);
      const fullText = (fullRes.data?.text || "").trim();

      if (!pokemonName) {
        pokemonName = extractPokemonNameFromText(fullText);
        if (!rawTopText) rawTopText = fullText.slice(0, 120);
      }
      if (!cardNumber) {
        const fullNum = extractCardNumberFromText(fullText);
        cardNumber = fullNum.cardNumber;
        setTotal = fullNum.setTotal;
        if (!rawBottomText) rawBottomText = fullText.slice(-120);
      }
    }
  } finally {
    await worker.terminate();
  }

  onProgress?.("Matching with Pokémon TCG database...", 96);

  const displayNumber = cardNumber
    ? setTotal
      ? `${cardNumber}/${setTotal}`
      : cardNumber
    : "";

  return {
    pokemonName,
    cardNumber,
    setTotal,
    displayNumber,
    rawTopText,
    rawBottomText,
    capturedDataUrl,
  };
}
