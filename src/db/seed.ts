import { eq } from "drizzle-orm";
import { db } from "./index";
import { collectionCards, seedMeta, type NewCollectionCard } from "./schema";

const SEED_KEY = "chazmaster_initial_album_v1";

const INITIAL_CARDS: NewCollectionCard[] = [
  {
    tcgId: "sv03.5-199",
    name: "Charizard ex",
    cardNumber: "199",
    setTotal: "165",
    setName: "Scarlet & Violet — 151",
    setId: "sv03.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv03.5/symbol.webp",
    rarity: "Special Illustration Rare",
    pokemonType: "Fire",
    hp: 330,
    stage: "Stage 2",
    illustrator: "miki kudo",
    attacksJson: JSON.stringify([
      {
        name: "Brave Wing",
        damage: "60+",
        cost: ["Fire"],
        effect:
          "If this Pokémon has any damage counters on it, this attack does 100 more damage.",
      },
      {
        name: "Explosive Vortex",
        damage: "330",
        cost: ["Fire", "Fire", "Fire", "Fire"],
        effect: "Discard 3 Energy from this Pokémon.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv03.5/199/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "279.00",
    marketPrice: "285.96",
    quantity: 2,
    forSale: true,
    notes: "Pack fresh centerpiece from 151. Clean corners, double-sleeved in top loader.",
  },
  {
    tcgId: "base1-4",
    name: "Charizard",
    cardNumber: "4",
    setTotal: "102",
    setName: "Base Set (1999)",
    setId: "base1",
    setSymbolUrl: "https://assets.tcgdex.net/univ/base/base1/symbol.webp",
    rarity: "Rare Holo",
    pokemonType: "Fire",
    hp: 120,
    stage: "Stage 2",
    illustrator: "Mitsuhiro Arita",
    attacksJson: JSON.stringify([
      {
        name: "Fire Spin",
        damage: "100",
        cost: ["Fire", "Fire", "Fire", "Fire"],
        effect:
          "Discard 2 Energy cards attached to Charizard in order to use this attack.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/base/base1/4/high.webp",
    variant: "Holofoil",
    condition: "Lightly Played",
    price: "345.00",
    marketPrice: "369.50",
    quantity: 1,
    forSale: true,
    notes: "Original 1999 WOTC Unlimited Holo. Vibrant starlight foil with minimal edge wear.",
  },
  {
    tcgId: "sv04.5-234",
    name: "Charizard ex",
    cardNumber: "234",
    setTotal: "091",
    setName: "Paldean Fates",
    setId: "sv04.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv04.5/symbol.webp",
    rarity: "Special Illustration Rare",
    pokemonType: "Darkness",
    hp: 330,
    stage: "Stage 2",
    illustrator: "AKIRA EGAWA",
    attacksJson: JSON.stringify([
      {
        name: "Burning Darkness",
        damage: "180+",
        cost: ["Fire", "Fire"],
        effect:
          "This attack does 30 more damage for each Prize card your opponent has taken.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv04.5/234/high.webp",
    variant: "Special Art Foil",
    condition: "Mint",
    price: "189.00",
    marketPrice: "196.40",
    quantity: 1,
    forSale: true,
    notes: "Shiny Tera Darkness Charizard illustrated by Akira Egawa. 50/50 centering.",
  },
  {
    tcgId: "swsh7-215",
    name: "Umbreon VMAX",
    cardNumber: "215",
    setTotal: "203",
    setName: "Evolving Skies",
    setId: "swsh7",
    setSymbolUrl: "https://assets.tcgdex.net/univ/swsh/swsh7/symbol.webp",
    rarity: "Secret Rare",
    pokemonType: "Darkness",
    hp: 310,
    stage: "VMAX",
    illustrator: "KEIICHIRO ITO",
    attacksJson: JSON.stringify([
      {
        name: "Max Darkness",
        damage: "160",
        cost: ["Darkness", "Colorless", "Colorless"],
        effect: "",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp",
    variant: "Special Art Foil",
    condition: "Mint",
    price: "940.00",
    marketPrice: "985.00",
    quantity: 1,
    forSale: true,
    notes: "Alternate Art Moonbreon grail. Crisp glittering texture, stored in magnetic One-Touch.",
  },
  {
    tcgId: "sv08-238",
    name: "Pikachu ex",
    cardNumber: "238",
    setTotal: "191",
    setName: "Surging Sparks",
    setId: "sv08",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv08/symbol.webp",
    rarity: "Special Illustration Rare",
    pokemonType: "Lightning",
    hp: 200,
    stage: "Basic",
    illustrator: "GIDORA",
    attacksJson: JSON.stringify([
      {
        name: "Topaz Bolt",
        damage: "300",
        cost: ["Grass", "Lightning", "Metal"],
        effect: "Discard 3 Energy from this Pokémon.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv08/238/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "295.00",
    marketPrice: "312.00",
    quantity: 1,
    forSale: true,
    notes: "Stellar Tera Pikachu ex rainbow prism foil, freshly pulled.",
  },
  {
    tcgId: "sv04.5-232",
    name: "Mew ex",
    cardNumber: "232",
    setTotal: "091",
    setName: "Paldean Fates",
    setId: "sv04.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv04.5/symbol.webp",
    rarity: "Special Illustration Rare",
    pokemonType: "Psychic",
    hp: 180,
    stage: "Basic",
    illustrator: "USGMEN",
    attacksJson: JSON.stringify([
      {
        name: "Genome Hacking",
        damage: "",
        cost: ["Colorless", "Colorless", "Colorless"],
        effect:
          "Choose 1 of your opponent's Active Pokémon's attacks and use it as this attack.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv04.5/232/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "265.00",
    marketPrice: "278.50",
    quantity: 1,
    forSale: true,
    notes: "Fan-favorite Shiny 'Bubble Mew' Special Illustration Rare.",
  },
  {
    tcgId: "swsh8-271",
    name: "Gengar VMAX",
    cardNumber: "271",
    setTotal: "264",
    setName: "Fusion Strike",
    setId: "swsh8",
    setSymbolUrl: "https://assets.tcgdex.net/univ/swsh/swsh8/symbol.webp",
    rarity: "Secret Rare",
    pokemonType: "Darkness",
    hp: 320,
    stage: "VMAX",
    illustrator: "sowsow",
    attacksJson: JSON.stringify([
      {
        name: "Fear and Panic",
        damage: "60×",
        cost: ["Darkness", "Darkness"],
        effect:
          "This attack does 60 damage for each of your opponent's Pokémon V and Pokémon-GX in play.",
      },
      {
        name: "G-Max Swallow Up",
        damage: "250",
        cost: ["Darkness", "Darkness", "Darkness"],
        effect: "During your next turn, this Pokémon can't attack.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/swsh/swsh8/271/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "410.00",
    marketPrice: "429.00",
    quantity: 1,
    forSale: true,
    notes: "Iconic sowsow Alternate Art Gengar VMAX. Zero whitening on back.",
  },
  {
    tcgId: "swsh7-218",
    name: "Rayquaza VMAX",
    cardNumber: "218",
    setTotal: "203",
    setName: "Evolving Skies",
    setId: "swsh7",
    setSymbolUrl: "https://assets.tcgdex.net/univ/swsh/swsh7/symbol.webp",
    rarity: "Secret Rare",
    pokemonType: "Dragon",
    hp: 320,
    stage: "VMAX",
    illustrator: "Anesaki Dynamic",
    attacksJson: JSON.stringify([
      {
        name: "Max Burst",
        damage: "20+",
        cost: ["Fire", "Lightning"],
        effect:
          "You may discard any amount of basic Fire or basic Lightning Energy from this Pokémon. This attack does 80 more damage for each card you discarded.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/swsh/swsh7/218/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "465.00",
    marketPrice: "488.00",
    quantity: 1,
    forSale: true,
    notes: "Soaring over lush treetops — Evolving Skies Alternate Art.",
  },
  {
    tcgId: "sv03.5-200",
    name: "Blastoise ex",
    cardNumber: "200",
    setTotal: "165",
    setName: "Scarlet & Violet — 151",
    setId: "sv03.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv03.5/symbol.webp",
    rarity: "Special Illustration Rare",
    pokemonType: "Water",
    hp: 330,
    stage: "Stage 2",
    illustrator: "Mitsuhiro Arita",
    attacksJson: JSON.stringify([
      {
        name: "Twin Cannons",
        damage: "140×",
        cost: ["Water", "Water"],
        effect:
          "Discard up to 2 Basic Water Energy cards from your hand. This attack does 140 damage for each card discarded.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv03.5/200/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "74.00",
    marketPrice: "78.90",
    quantity: 2,
    forSale: true,
    notes: "Deep-sea artwork by legendary Base Set artist Mitsuhiro Arita.",
  },
  {
    tcgId: "sv03.5-198",
    name: "Venusaur ex",
    cardNumber: "198",
    setTotal: "165",
    setName: "Scarlet & Violet — 151",
    setId: "sv03.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv03.5/symbol.webp",
    rarity: "Special Illustration Rare",
    pokemonType: "Grass",
    hp: 340,
    stage: "Stage 2",
    illustrator: "Yoriyuki Ikegami",
    attacksJson: JSON.stringify([
      {
        name: "Dangerous Toxwhip",
        damage: "150",
        cost: ["Grass", "Grass", "Colorless"],
        effect: "Your opponent's Active Pokémon is now Confused and Poisoned.",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv03.5/198/high.webp",
    variant: "Special Art Foil",
    condition: "Near Mint",
    price: "68.00",
    marketPrice: "72.40",
    quantity: 2,
    forSale: true,
    notes: "Botanical full-art foil, completes the Kanto starter trio.",
  },
  {
    tcgId: "sv03.5-173",
    name: "Pikachu",
    cardNumber: "173",
    setTotal: "165",
    setName: "Scarlet & Violet — 151",
    setId: "sv03.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv03.5/symbol.webp",
    rarity: "Illustration Rare",
    pokemonType: "Lightning",
    hp: 60,
    stage: "Basic",
    illustrator: "Hiroyuki Yamamoto",
    attacksJson: JSON.stringify([
      {
        name: "Charge",
        damage: "",
        cost: ["Lightning"],
        effect: "Search your deck for a Basic Lightning Energy card and attach it to this Pokémon.",
      },
      {
        name: "Pika Punch",
        damage: "50",
        cost: ["Lightning", "Lightning", "Colorless"],
        effect: "",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv03.5/173/high.webp",
    variant: "Holofoil",
    condition: "Near Mint",
    price: "29.00",
    marketPrice: "31.50",
    quantity: 3,
    forSale: true,
    notes: "Vibrant bustling city street illustration featuring Pikachu, Growlithe & Psyduck.",
  },
  {
    tcgId: "sv03.5-168",
    name: "Charmander",
    cardNumber: "168",
    setTotal: "165",
    setName: "Scarlet & Violet — 151",
    setId: "sv03.5",
    setSymbolUrl: "https://assets.tcgdex.net/univ/sv/sv03.5/symbol.webp",
    rarity: "Illustration Rare",
    pokemonType: "Fire",
    hp: 70,
    stage: "Basic",
    illustrator: "miki kudo",
    attacksJson: JSON.stringify([
      {
        name: "Blazing Destruction",
        damage: "",
        cost: ["Fire"],
        effect: "Discard a Stadium in play.",
      },
      {
        name: "Steady Firebreathing",
        damage: "30",
        cost: ["Fire", "Fire"],
        effect: "",
      },
    ]),
    imageUrl: "https://assets.tcgdex.net/en/sv/sv03.5/168/high.webp",
    variant: "Holofoil",
    condition: "Near Mint",
    price: "44.00",
    marketPrice: "47.20",
    quantity: 2,
    forSale: true,
    notes: "Canyon evolution storyline pair with Charizard ex #199/165.",
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      const existing = await db
        .select()
        .from(seedMeta)
        .where(eq(seedMeta.key, SEED_KEY))
        .limit(1);

      if (existing.length > 0) {
        return;
      }

      const cardRows = await db.select({ id: collectionCards.id }).from(collectionCards).limit(1);
      if (cardRows.length === 0) {
        // Insert in reverse so newest-first ordering showcases the flagship Charizards in row 1
        await db.insert(collectionCards).values([...INITIAL_CARDS].reverse());
      }

      await db
        .insert(seedMeta)
        .values({ key: SEED_KEY })
        .onConflictDoNothing();
    } catch (err) {
      seedPromise = null;
      throw err;
    }
  })();

  return seedPromise;
}
