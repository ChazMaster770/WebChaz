import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collectionCards, orderInquiries } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import type { BasketItem } from "@/lib/constants";

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
    const inquiryId = parseInt(id, 10);
    if (!Number.isFinite(inquiryId) || inquiryId <= 0) {
      return NextResponse.json({ error: "Invalid inquiry ID." }, { status: 400 });
    }

    const body = (await request.json()) as {
      status?: string;
      deductStock?: boolean;
    };

    const allowed = new Set(["pending", "completed", "cancelled"]);
    const nextStatus =
      typeof body.status === "string" && allowed.has(body.status)
        ? body.status
        : "completed";

    const rows = await db
      .select()
      .from(orderInquiries)
      .where(eq(orderInquiries.id, inquiryId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    const existing = rows[0];

    if (body.deductStock && existing.status !== "completed") {
      try {
        const items = JSON.parse(existing.itemsJson) as BasketItem[];
        for (const item of items) {
          if (!item.cardId) continue;
          const cardRows = await db
            .select()
            .from(collectionCards)
            .where(eq(collectionCards.id, item.cardId))
            .limit(1);
          if (cardRows.length > 0) {
            const current = cardRows[0];
            const remaining = Math.max(0, current.quantity - item.quantity);
            await db
              .update(collectionCards)
              .set({
                quantity: remaining,
                forSale: remaining > 0 ? current.forSale : false,
                updatedAt: new Date(),
              })
              .where(eq(collectionCards.id, current.id));
          }
        }
      } catch {
        // Ignore malformed historical item JSON
      }
    }

    const [updated] = await db
      .update(orderInquiries)
      .set({ status: nextStatus })
      .where(eq(orderInquiries.id, inquiryId))
      .returning();

    return NextResponse.json({ inquiry: updated });
  } catch (err) {
    console.error("Error updating inquiry:", err);
    return NextResponse.json(
      { error: "Failed to update inquiry." },
      { status: 500 }
    );
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
    const inquiryId = parseInt(id, 10);
    if (!Number.isFinite(inquiryId) || inquiryId <= 0) {
      return NextResponse.json({ error: "Invalid inquiry ID." }, { status: 400 });
    }

    await db.delete(orderInquiries).where(eq(orderInquiries.id, inquiryId));
    return NextResponse.json({ deletedId: inquiryId });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete inquiry." },
      { status: 500 }
    );
  }
}
