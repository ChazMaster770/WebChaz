import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { cardPhotos, collectionCards } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    await ensureSeeded();

    const cards = await db
      .select()
      .from(collectionCards)
      .orderBy(desc(collectionCards.createdAt), desc(collectionCards.id));

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("Error fetching collection cards:", err);
    return NextResponse.json(
      { error: "Failed to load collection cards." },
      { status: 500 }
    );
  }
}

function parseDataUrl(
  dataUrl: string
): { mimeType: string; dataBase64: string } | null {
  const match = dataUrl.match(
    /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/
  );
  if (!match) return null;
  // Cap photo size at ~3MB base64 for database safety
  if (match[2].length > 4_000_000) return null;
  return {
    mimeType: match[1] === "image/jpg" ? "image/jpeg" : match[1],
    dataBase64: match[2],
  };
}

export async function POST(request: Request) {
  try {
    const authed = await isAdminAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const cardNumber =
      typeof body.cardNumber === "string" ? body.cardNumber.trim() : "";
    const setName =
      typeof body.setName === "string" && body.setName.trim()
        ? body.setName.trim()
        : "Pokémon TCG";

    if (!name || !cardNumber) {
      return NextResponse.json(
        { error: "Card name and card number are required." },
        { status: 400 }
      );
    }

    let photoId: number | null = null;
    let capturedPhotoUrl: string | null = null;

    if (
      typeof body.capturedPhotoDataUrl === "string" &&
      body.capturedPhotoDataUrl.startsWith("data:image/")
    ) {
      const parsed = parseDataUrl(body.capturedPhotoDataUrl);
      if (parsed) {
        const [savedPhoto] = await db
          .insert(cardPhotos)
          .values({
            mimeType: parsed.mimeType,
            dataBase64: parsed.dataBase64,
          })
          .returning({ id: cardPhotos.id });
        if (savedPhoto) {
          photoId = savedPhoto.id;
          capturedPhotoUrl = `/api/photos/${savedPhoto.id}`;
        }
      }
    }

    const rawImageUrl =
      typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const finalImageUrl = rawImageUrl || capturedPhotoUrl || "";

    if (!finalImageUrl) {
      return NextResponse.json(
        { error: "Card image or captured photo is required." },
        { status: 400 }
      );
    }

    const parsedMarket =
      body.marketPrice !== undefined && body.marketPrice !== null && body.marketPrice !== ""
        ? Number(body.marketPrice)
        : null;
    const marketPriceStr =
      parsedMarket !== null && Number.isFinite(parsedMarket) && parsedMarket >= 0
        ? parsedMarket.toFixed(2)
        : null;

    const parsedPrice =
      body.price !== undefined && body.price !== null && body.price !== ""
        ? Number(body.price)
        : parsedMarket !== null && Number.isFinite(parsedMarket)
          ? parsedMarket
          : 10;
    const priceStr =
      Number.isFinite(parsedPrice) && parsedPrice >= 0
        ? parsedPrice.toFixed(2)
        : "10.00";

    const rawQty = Number(body.quantity ?? 1);
    const quantity =
      Number.isFinite(rawQty) && rawQty >= 0 ? Math.floor(rawQty) : 1;

    const rawHp =
      body.hp !== undefined && body.hp !== null && body.hp !== ""
        ? Number(body.hp)
        : null;
    const hp =
      rawHp !== null && Number.isFinite(rawHp) && rawHp > 0
        ? Math.floor(rawHp)
        : null;

    let attacksJson: string | null = null;
    if (Array.isArray(body.attacks) && body.attacks.length > 0) {
      attacksJson = JSON.stringify(body.attacks);
    } else if (typeof body.attacksJson === "string" && body.attacksJson.trim()) {
      attacksJson = body.attacksJson;
    }

    const [created] = await db
      .insert(collectionCards)
      .values({
        tcgId: typeof body.tcgId === "string" && body.tcgId ? body.tcgId : null,
        name,
        cardNumber,
        setTotal:
          typeof body.setTotal === "string" && body.setTotal.trim()
            ? body.setTotal.trim()
            : null,
        setName,
        setId: typeof body.setId === "string" && body.setId ? body.setId : null,
        setSymbolUrl:
          typeof body.setSymbolUrl === "string" && body.setSymbolUrl
            ? body.setSymbolUrl
            : null,
        rarity:
          typeof body.rarity === "string" && body.rarity.trim()
            ? body.rarity.trim()
            : "Rare",
        pokemonType:
          typeof body.pokemonType === "string" && body.pokemonType.trim()
            ? body.pokemonType.trim()
            : "Colorless",
        hp,
        stage: typeof body.stage === "string" && body.stage ? body.stage : null,
        illustrator:
          typeof body.illustrator === "string" && body.illustrator
            ? body.illustrator
            : null,
        attacksJson,
        imageUrl: finalImageUrl,
        capturedPhotoUrl,
        photoId,
        variant:
          typeof body.variant === "string" && body.variant.trim()
            ? body.variant.trim()
            : "Holofoil",
        condition:
          typeof body.condition === "string" && body.condition.trim()
            ? body.condition.trim()
            : "Near Mint",
        price: priceStr,
        marketPrice: marketPriceStr,
        quantity,
        forSale: typeof body.forSale === "boolean" ? body.forSale : true,
        notes:
          typeof body.notes === "string" && body.notes.trim()
            ? body.notes.trim()
            : null,
      })
      .returning();

    return NextResponse.json({ card: created }, { status: 201 });
  } catch (err) {
    console.error("Error adding card:", err);
    return NextResponse.json(
      { error: "Failed to save card to collection." },
      { status: 500 }
    );
  }
}
