import { NextResponse } from "next/server";
import type { ScanLanguageMode } from "@/lib/constants";
import { searchOnlineTcgCards } from "@/lib/tcg";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") || "";
    const number =
      searchParams.get("number") || searchParams.get("cardNumber") || "";
    const setTotal = searchParams.get("setTotal") || "";
    const setCode = searchParams.get("setCode") || "";
    const rarityCode = searchParams.get("rarity") || "";
    const langParam = searchParams.get("language") || "auto";
    const language: ScanLanguageMode =
      langParam === "ja" || langParam === "en" ? langParam : "auto";
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);

    if (!name.trim() && !number.trim() && !setCode.trim()) {
      return NextResponse.json(
        { error: "Please provide a Pokémon name, set code, or card number to search." },
        { status: 400 }
      );
    }

    const results = await searchOnlineTcgCards({
      name,
      cardNumber: number,
      setTotal,
      setCode,
      rarityCode,
      language,
      limit: Number.isFinite(limitParam) ? limitParam : 10,
    });

    return NextResponse.json({
      results,
      query: { name, number, setTotal, setCode, language },
    });
  } catch (err) {
    console.error("TCG lookup error:", err);
    return NextResponse.json(
      { error: "Failed to reach online Pokémon TCG database." },
      { status: 502 }
    );
  }
}
