import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orderInquiries } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  type BasketItem,
} from "@/lib/constants";

export async function GET() {
  try {
    const authed = await isAdminAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const inquiries = await db
      .select()
      .from(orderInquiries)
      .orderBy(desc(orderInquiries.createdAt), desc(orderInquiries.id))
      .limit(100);

    return NextResponse.json({ inquiries });
  } catch (err) {
    console.error("Error fetching inquiries:", err);
    return NextResponse.json(
      { error: "Failed to load inquiries." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: BasketItem[];
      buyerName?: string;
      buyerNote?: string;
    };

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    const sanitized: BasketItem[] = rawItems
      .filter(
        (i) =>
          i &&
          typeof i.name === "string" &&
          Number(i.quantity) > 0 &&
          Number.isFinite(Number(i.price))
      )
      .map((i) => ({
        cardId: Number(i.cardId) || 0,
        name: String(i.name).slice(0, 120),
        cardNumber: String(i.cardNumber || "").slice(0, 30),
        setTotal: i.setTotal ? String(i.setTotal).slice(0, 30) : null,
        setName: String(i.setName || "Pokémon TCG").slice(0, 120),
        condition: String(i.condition || "Near Mint").slice(0, 40),
        variant: String(i.variant || "Holofoil").slice(0, 40),
        price: Math.max(0, Number(i.price)),
        quantity: Math.max(1, Math.min(99, Math.floor(Number(i.quantity)))),
        maxQuantity: Math.max(1, Math.floor(Number(i.maxQuantity || i.quantity))),
        imageUrl: String(i.imageUrl || "").slice(0, 400),
      }));

    if (sanitized.length === 0) {
      return NextResponse.json(
        { error: "No valid cards in basket." },
        { status: 400 }
      );
    }

    const totalCards = sanitized.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = sanitized.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const buyerName =
      typeof body.buyerName === "string" && body.buyerName.trim()
        ? body.buyerName.trim().slice(0, 80)
        : null;
    const buyerNote =
      typeof body.buyerNote === "string" && body.buyerNote.trim()
        ? body.buyerNote.trim().slice(0, 300)
        : null;

    const [created] = await db
      .insert(orderInquiries)
      .values({
        buyerName,
        buyerNote,
        itemsJson: JSON.stringify(sanitized),
        totalAmount: totalAmount.toFixed(2),
        totalCards,
        status: "pending",
      })
      .returning();

    const message = buildWhatsAppMessage(
      sanitized,
      buyerName ?? undefined,
      buyerNote ?? undefined
    );
    const whatsappUrl = buildWhatsAppUrl(message);

    return NextResponse.json(
      {
        inquiry: created,
        whatsappUrl,
        message,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating WhatsApp inquiry:", err);
    return NextResponse.json(
      { error: "Failed to record order inquiry." },
      { status: 500 }
    );
  }
}
