import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import type { ScanLanguageMode } from "@/lib/constants";
import { analyzeCardPhotoBuffer } from "@/lib/server-ocr";
import { searchOnlineTcgCards } from "@/lib/tcg";

export async function POST(request: Request) {
  try {
    const authed = await isAdminAuthenticated();
    if (!authed) {
      return NextResponse.json(
        { error: "Unauthorized. Admin login required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      imageDataUrl?: string;
      language?: ScanLanguageMode;
    };

    const dataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";
    const match = dataUrl.match(
      /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/
    );
    if (!match) {
      return NextResponse.json(
        { error: "Please provide a valid card photo (JPG, PNG, or WebP)." },
        { status: 400 }
      );
    }

    // Cap incoming image payload at ~8MB
    if (match[1].length > 11_000_000) {
      return NextResponse.json(
        { error: "Card image is too large. Please try a smaller photo." },
        { status: 413 }
      );
    }

    const requestedMode: ScanLanguageMode =
      body.language === "ja" || body.language === "en" ? body.language : "auto";

    const buffer = Buffer.from(match[1], "base64");
    const extracted = await analyzeCardPhotoBuffer(buffer, requestedMode);

    const hasLookupSignal = Boolean(
      extracted.pokemonName ||
        extracted.cardNumber ||
        extracted.setCode ||
        extracted.dexNumber !== null
    );

    const lookupLanguage: ScanLanguageMode =
      requestedMode !== "auto" ? requestedMode : extracted.detectedLanguage;

    let results = hasLookupSignal
      ? await searchOnlineTcgCards({
          name: extracted.pokemonName,
          cardNumber: extracted.cardNumber,
          setTotal: extracted.setTotal,
          setCode: extracted.setCode,
          rarityCode: extracted.rarityCode,
          hp: extracted.hp,
          illustrator: extracted.illustrator,
          dexNumber: extracted.dexNumber,
          language: lookupLanguage,
          limit: 8,
        })
      : [];

    // Fallback: if detected "ja" had 0 results in auto mode, also check both EN + JA broadly
    if (results.length === 0 && hasLookupSignal && requestedMode === "auto") {
      results = await searchOnlineTcgCards({
        name: extracted.englishName || extracted.pokemonName,
        cardNumber: extracted.cardNumber,
        setTotal: extracted.setTotal,
        hp: extracted.hp,
        illustrator: extracted.illustrator,
        language: "auto",
        limit: 8,
      });
    }

    return NextResponse.json({
      extracted,
      results,
    });
  } catch (err) {
    console.error("Card photo OCR scan error:", err);
    return NextResponse.json(
      { error: "Failed to analyze card photo. You can search by name or card # manually." },
      { status: 500 }
    );
  }
}
