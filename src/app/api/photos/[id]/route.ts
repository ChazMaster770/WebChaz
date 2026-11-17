import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cardPhotos } from "@/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const photoId = parseInt(id, 10);
    if (!Number.isFinite(photoId) || photoId <= 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const rows = await db
      .select()
      .from(cardPhotos)
      .where(eq(cardPhotos.id, photoId))
      .limit(1);

    if (rows.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const photo = rows[0];
    const buffer = Buffer.from(photo.dataBase64, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType || "image/jpeg",
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Error loading photo", { status: 500 });
  }
}
