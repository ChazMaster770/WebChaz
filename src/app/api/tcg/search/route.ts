import { NextResponse } from "next/server";
import { searchOnlineTcgCards } from "@/lib/tcg";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "";
    const number =
      searchParams.get("number") || searchParams.get("cardNumber") || "";
    const setTotal = searchParams.get("setTotal") || "";
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);

    if (!name.trim() && !number.trim()) {
      return NextResponse.json(
        { error: "Please provide a Pokémon name or card number to search." },
        { status: 400 }
      );
    }

    const results = await searchOnlineTcgCards({
      name,
      cardNumber: number,
      setTotal,
      limit: Number.isFinite(limitParam) ? limitParam : 10,
    });

    return NextResponse.json({
      results,
      query: { name, number, setTotal },
    });
  } catch (err) {
    console.error("TCG lookup error:", err);
    return NextResponse.json(
      { error: "Failed to reach online Pokémon TCG database." },
      { status: 502 }
    );
  }
}
