import { desc } from "drizzle-orm";
import { db } from "@/db";
import { collectionCards } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { ClientAlbum } from "@/components/ClientAlbum";
import type { AlbumCard } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let cards: AlbumCard[] = [];

  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(collectionCards)
      .orderBy(desc(collectionCards.createdAt), desc(collectionCards.id));

    cards = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to fetch initial album cards:", err);
  }

  return <ClientAlbum initialCards={cards} />;
}
