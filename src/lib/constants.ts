export const SITE_NAME = "ChazMaster Album";
export const WHATSAPP_PHONE_RAW = "972545920070";
export const WHATSAPP_PHONE_DISPLAY = "+972 54-592-0070";

export interface CardAttack {
  name: string;
  damage?: string;
  cost?: string[];
  effect?: string;
}

export interface AlbumCard {
  id: number;
  tcgId: string | null;
  name: string;
  cardNumber: string;
  setTotal: string | null;
  setName: string;
  setId: string | null;
  setSymbolUrl: string | null;
  rarity: string;
  pokemonType: string;
  hp: number | null;
  stage: string | null;
  illustrator: string | null;
  attacksJson: string | null;
  imageUrl: string;
  capturedPhotoUrl: string | null;
  photoId: number | null;
  language: string;
  variant: string;
  condition: string;
  price: string;
  marketPrice: string | null;
  quantity: number;
  forSale: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ScanLanguageMode = "auto" | "ja" | "en";

export interface TcgCardCandidate {
  tcgId: string;
  language: "Japanese" | "English";
  name: string;
  nativeName?: string;
  cardNumber: string;
  setTotal: string | null;
  setName: string;
  setId: string;
  setSymbolUrl: string | null;
  rarity: string;
  pokemonType: string;
  hp: number | null;
  stage: string | null;
  illustrator: string | null;
  attacks: CardAttack[];
  imageUrl: string;
  suggestedVariant: string;
  marketPrice: number | null;
  confidence: number;
}

export interface BasketItem {
  cardId: number;
  name: string;
  language?: string;
  cardNumber: string;
  setTotal: string | null;
  setName: string;
  condition: string;
  variant: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  imageUrl: string;
}

export const CARD_CONDITIONS = [
  "Mint",
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
] as const;

export const CONDITION_SHORT: Record<string, { code: string; className: string }> = {
  Mint: {
    code: "MINT",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Near Mint": {
    code: "NM",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  "Lightly Played": {
    code: "LP",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "Moderately Played": {
    code: "MP",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  "Heavily Played": {
    code: "HP",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const CARD_VARIANTS = [
  "Special Art Foil",
  "Holofoil",
  "Reverse Holofoil",
  "1st Edition Holo",
  "Normal",
] as const;

export const POKEMON_TYPES = [
  "Fire",
  "Water",
  "Lightning",
  "Grass",
  "Psychic",
  "Darkness",
  "Dragon",
  "Fighting",
  "Metal",
  "Fairy",
  "Colorless",
] as const;

export const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string; activeBg: string }
> = {
  Fire: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    activeBg: "bg-orange-600 text-white border-orange-600",
  },
  Water: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
    activeBg: "bg-sky-600 text-white border-sky-600",
  },
  Lightning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-400",
    activeBg: "bg-amber-500 text-slate-950 border-amber-500",
  },
  Grass: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    activeBg: "bg-emerald-600 text-white border-emerald-600",
  },
  Psychic: {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    border: "border-fuchsia-200",
    dot: "bg-fuchsia-500",
    activeBg: "bg-fuchsia-600 text-white border-fuchsia-600",
  },
  Darkness: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    border: "border-slate-300",
    dot: "bg-slate-700",
    activeBg: "bg-slate-800 text-white border-slate-800",
  },
  Dragon: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    activeBg: "bg-indigo-600 text-white border-indigo-600",
  },
  Fighting: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-300",
    dot: "bg-amber-700",
    activeBg: "bg-amber-700 text-white border-amber-700",
  },
  Metal: {
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-300",
    dot: "bg-zinc-500",
    activeBg: "bg-zinc-700 text-white border-zinc-700",
  },
  Fairy: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    dot: "bg-pink-500",
    activeBg: "bg-pink-600 text-white border-pink-600",
  },
  Colorless: {
    bg: "bg-stone-100",
    text: "text-stone-700",
    border: "border-stone-300",
    dot: "bg-stone-400",
    activeBg: "bg-stone-700 text-white border-stone-700",
  },
};

export function getTypeStyle(type: string) {
  return TYPE_STYLES[type] || TYPE_STYLES.Colorless;
}

export function formatCardNumber(cardNumber: string, setTotal?: string | null): string {
  const num = cardNumber.trim();
  if (!setTotal || !setTotal.trim()) {
    return `#${num}`;
  }
  const total = setTotal.trim();
  // Pad 2-digit Scarlet & Violet set totals like 91 -> 091 when cardNumber is 3 digits
  const formattedTotal =
    /^\d{3}$/.test(num) && /^\d{2}$/.test(total) ? total.padStart(3, "0") : total;
  return `${num}/${formattedTotal}`;
}

export function formatPrice(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : Number(value ?? 0);
  if (!Number.isFinite(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function buildWhatsAppMessage(
  items: BasketItem[],
  buyerName?: string,
  buyerNote?: string
): string {
  const lines: string[] = [];
  lines.push(`Hello ChazMaster! I would like to buy these cards from *${SITE_NAME}*:`);
  lines.push("");

  let totalCards = 0;
  let totalAmount = 0;

  items.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    totalCards += item.quantity;
    totalAmount += lineTotal;
    const numLabel = formatCardNumber(item.cardNumber, item.setTotal);
    const langTag = item.language === "Japanese" ? "[JP] " : "";
    lines.push(
      `${index + 1}. ${langTag}*${item.name}* (${numLabel} · ${item.setName}) — ${item.condition} × ${item.quantity} = *${formatPrice(lineTotal)}*`
    );
  });

  lines.push("");
  lines.push(`*Total Cards:* ${totalCards}`);
  lines.push(`*Order Total:* ${formatPrice(totalAmount)}`);

  if (buyerName && buyerName.trim()) {
    lines.push(`*Name:* ${buyerName.trim()}`);
  }
  if (buyerNote && buyerNote.trim()) {
    lines.push(`*Note:* ${buyerNote.trim()}`);
  }

  lines.push("");
  lines.push("Please let me know if they are available. Thank you!");
  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_PHONE_RAW}?text=${encodeURIComponent(message)}`;
}
