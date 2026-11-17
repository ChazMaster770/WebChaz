import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cardPhotos, collectionCards } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { describeDbError, ensureDatabaseReady } from "@/lib/db-init";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cardId = parseInt(id, 10);
    if (!Number.isFinite(cardId) || cardId <= 0) {
      return NextResponse.json({ error: "Invalid card ID." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const rows = await db
      .select()
      .from(collectionCards)
      .where(eq(collectionCards.id, cardId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return NextResponse.json({ card: rows[0] });
  } catch {
    return NextResponse.json({ error: "Failed to load card." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAdminAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const cardId = parseInt(id, 10);
    if (!Number.isFinite(cardId) || cardId <= 0) {
      return NextResponse.json({ error: "Invalid card ID." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const body = (await request.json()) as Record<string, unknown>;
    const updates: Partial<typeof collectionCards.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }
    if (typeof body.cardNumber === "string" && body.cardNumber.trim()) {
      updates.cardNumber = body.cardNumber.trim();
    }
    if (body.setTotal !== undefined) {
      updates.setTotal =
        typeof body.setTotal === "string" && body.setTotal.trim()
          ? body.setTotal.trim()
          : null;
    }
    if (typeof body.setName === "string" && body.setName.trim()) {
      updates.setName = body.setName.trim();
    }
    if (typeof body.rarity === "string" && body.rarity.trim()) {
      updates.rarity = body.rarity.trim();
    }
    if (typeof body.pokemonType === "string" && body.pokemonType.trim()) {
      updates.pokemonType = body.pokemonType.trim();
    }
    if (typeof body.condition === "string" && body.condition.trim()) {
      updates.condition = body.condition.trim();
    }
    if (body.language === "Japanese" || body.language === "English") {
      updates.language = body.language;
    }
    if (typeof body.variant === "string" && body.variant.trim()) {
      updates.variant = body.variant.trim();
    }
    if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
      updates.imageUrl = body.imageUrl.trim();
    }
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (!Number.isFinite(p) || p < 0) {
        return NextResponse.json(
          { error: "Price must be a valid non-negative number." },
          { status: 400 }
        );
      }
      updates.price = p.toFixed(2);
    }
    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (!Number.isFinite(q) || q < 0) {
        return NextResponse.json(
          { error: "Quantity must be 0 or greater." },
          { status: 400 }
        );
      }
      updates.quantity = Math.floor(q);
    }
    if (typeof body.forSale === "boolean") {
      updates.forSale = body.forSale;
    }
    if (body.notes !== undefined) {
      updates.notes =
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes.trim()
          : null;
    }

    const [updated] = await db
      .update(collectionCards)
      .set(updates)
      .where(eq(collectionCards.id, cardId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    return NextResponse.json({ card: updated });
  } catch (err) {
    console.error("Error updating card:", err);
    return NextResponse.json(describeDbError(err), { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAdminAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const cardId = parseInt(id, 10);
    if (!Number.isFinite(cardId) || cardId <= 0) {
      return NextResponse.json({ error: "Invalid card ID." }, { status: 400 });
    }

    await ensureDatabaseReady();
    const [deleted] = await db
      .delete(collectionCards)
      .where(eq(collectionCards.id, cardId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    if (deleted.photoId) {
      await db
        .delete(cardPhotos)
        .where(eq(cardPhotos.id, deleted.photoId))
        .catch(() => undefined);
    }

    return NextResponse.json({ deletedId: deleted.id });
  } catch (err) {
    console.error("Error deleting card:", err);
    return NextResponse.json(describeDbError(err), { status: 500 });
  }
}
