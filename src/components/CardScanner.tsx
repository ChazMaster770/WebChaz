"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Languages,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  Sparkles,
  Trash2,
  Upload,
  VideoOff,
} from "lucide-react";
import {
  CARD_CONDITIONS,
  CARD_VARIANTS,
  formatCardNumber,
  formatPrice,
  POKEMON_TYPES,
  type AlbumCard,
  type ScanLanguageMode,
  type TcgCardCandidate,
} from "@/lib/constants";
import { scanPokemonCardImage } from "@/lib/pokemon-ocr";
import { CardArtImage } from "./BrandLogo";

interface CardScannerProps {
  onCardAdded: (card: AlbumCard) => void;
  onCardUpdated: (card: AlbumCard) => void;
  onCardRemoved: (cardId: number) => void;
}

interface DetectedBannerInfo {
  detectedLanguage: "ja" | "en";
  japaneseName: string;
  englishName: string;
  setCode: string;
  cardNumber: string;
  setTotal: string;
  rarityCode: string;
  hp: number | null;
  illustrator: string;
}

export function CardScanner({
  onCardAdded,
  onCardUpdated,
  onCardRemoved,
}: CardScannerProps) {
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCamInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Language mode: Auto (EN + JP), Japanese only, or English only
  const [languageMode, setLanguageMode] = useState<ScanLanguageMode>("auto");

  // Scanned image & OCR state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState("");
  const [scanPercent, setScanPercent] = useState(0);
  const [autoAdd, setAutoAdd] = useState(true);
  const [detectedInfo, setDetectedInfo] = useState<DetectedBannerInfo | null>(
    null
  );

  // Search fields (populated by EN/JP OCR or typed manually in English or 日本語)
  const [pokemonName, setPokemonName] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [defaultCondition, setDefaultCondition] = useState<string>("Near Mint");
  const [defaultForSale, setDefaultForSale] = useState<boolean>(true);

  // TCG Online Database matches (JP + EN)
  const [searchingDb, setSearchingDb] = useState(false);
  const [candidates, setCandidates] = useState<TcgCardCandidate[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [addingTcgId, setAddingTcgId] = useState<string | null>(null);

  // Recently auto-added / saved card confirmation banner
  const [recentlyAdded, setRecentlyAdded] = useState<AlbumCard | null>(null);
  const [quickPrice, setQuickPrice] = useState("");
  const [quickCondition, setQuickCondition] = useState("Near Mint");
  const [quickQty, setQuickQty] = useState(1);
  const [savingQuickEdit, setSavingQuickEdit] = useState(false);
  const [quickSavedMsg, setQuickSavedMsg] = useState(false);

  // Manual custom fallback form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSet, setManualSet] = useState("Pokémon TCG");
  const [manualLanguage, setManualLanguage] = useState<"Japanese" | "English">(
    "Japanese"
  );
  const [manualType, setManualType] = useState("Fire");
  const [manualRarity, setManualRarity] = useState("Special Art Rare (SAR)");
  const [manualVariant, setManualVariant] = useState("Special Art Foil");
  const [manualPrice, setManualPrice] = useState("15.00");
  const [savingManual, setSavingManual] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(
    async (mode: "environment" | "user" = facingMode) => {
      setCameraError(null);
      stopCamera();

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          "Live camera requires HTTPS or mobile camera upload. Use 'Phone Snap' or 'Upload Image' below."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setCameraActive(true);
        requestAnimationFrame(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            void videoRef.current.play().catch(() => undefined);
          }
        });
      } catch {
        setCameraError(
          "Could not access live camera (permission denied or no webcam found). Use 'Phone Snap' or 'Upload Image' to scan a card picture."
        );
      }
    },
    [facingMode, stopCamera]
  );

  const saveCandidateToDatabase = useCallback(
    async (
      candidate: TcgCardCandidate,
      photoDataUrl: string | null,
      overridePrice?: string
    ): Promise<AlbumCard | null> => {
      if (!candidate.imageUrl && !photoDataUrl) {
        setSearchMessage(
          "This vintage Japanese print has no stock scan online — snap or upload a card photo first so it displays with your real card picture."
        );
        return null;
      }

      setAddingTcgId(candidate.tcgId);
      try {
        const chosenPrice =
          overridePrice !== undefined && overridePrice !== ""
            ? parseFloat(overridePrice)
            : candidate.marketPrice ?? 12.0;

        const res = await fetch("/api/cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tcgId: candidate.tcgId,
            language: candidate.language,
            name: candidate.name,
            cardNumber: candidate.cardNumber,
            setTotal: candidate.setTotal,
            setName: candidate.setName,
            setId: candidate.setId,
            setSymbolUrl: candidate.setSymbolUrl,
            rarity: candidate.rarity,
            pokemonType: candidate.pokemonType,
            hp: candidate.hp,
            stage: candidate.stage,
            illustrator: candidate.illustrator,
            attacks: candidate.attacks,
            imageUrl: candidate.imageUrl || "",
            capturedPhotoDataUrl: photoDataUrl || undefined,
            variant: candidate.suggestedVariant,
            condition: defaultCondition,
            price: Number.isFinite(chosenPrice) ? chosenPrice : 12.0,
            marketPrice: candidate.marketPrice,
            quantity: 1,
            forSale: defaultForSale,
          }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setSearchMessage(err.error || "Could not add card to collection.");
          return null;
        }

        const data = (await res.json()) as { card: AlbumCard };
        onCardAdded(data.card);
        setRecentlyAdded(data.card);
        setQuickPrice(data.card.price);
        setQuickCondition(data.card.condition);
        setQuickQty(data.card.quantity);
        setQuickSavedMsg(false);
        return data.card;
      } catch {
        setSearchMessage("Network error while saving card.");
        return null;
      } finally {
        setAddingTcgId(null);
      }
    },
    [defaultCondition, defaultForSale, onCardAdded]
  );

  const hydrateCandidatePrices = (list: TcgCardCandidate[]) => {
    const initial: Record<string, string> = {};
    for (const r of list) {
      initial[r.tcgId] =
        r.marketPrice !== null ? r.marketPrice.toFixed(2) : "12.00";
    }
    setCustomPrices(initial);
    return initial;
  };

  const runTcgLookup = useCallback(
    async (
      nameQuery: string,
      numberQuery: string,
      overrideLang?: ScanLanguageMode
    ) => {
      const cleanName = nameQuery.trim();
      const cleanNum = numberQuery.trim();
      const activeLang = overrideLang ?? languageMode;

      if (!cleanName && !cleanNum) {
        setSearchMessage(
          "Enter a Pokémon name (English or 日本語) or bottom set code + card # (e.g. SV2a 201/165 or 199/165)."
        );
        setCandidates([]);
        return;
      }

      setSearchingDb(true);
      setSearchMessage(null);

      try {
        const params = new URLSearchParams();
        if (cleanName) params.set("name", cleanName);
        if (cleanNum) params.set("number", cleanNum);
        params.set("language", activeLang);
        params.set("limit", "10");

        const res = await fetch(`/api/tcg/search?${params.toString()}`);
        const data = (await res.json()) as {
          results?: TcgCardCandidate[];
          error?: string;
        };

        if (!res.ok) {
          setSearchMessage(data.error || "Lookup failed.");
          setCandidates([]);
          return;
        }

        const results = Array.isArray(data.results) ? data.results : [];
        setCandidates(results);
        hydrateCandidatePrices(results);

        if (results.length === 0) {
          setSearchMessage(
            `No online match found for "${[cleanName, cleanNum]
              .filter(Boolean)
              .join(" ")}". For Japanese cards, you can also type the English Pokémon name + bottom code (e.g. Charizard + sv2a 201/165) or save with your photo.`
          );
        }
      } catch {
        setSearchMessage(
          "Could not connect to the online Pokémon TCG database."
        );
      } finally {
        setSearchingDb(false);
      }
    },
    [languageMode]
  );

  const processCardImage = useCallback(
    async (sourceUrl: string, overrideLang?: ScanLanguageMode) => {
      const scanLang = overrideLang ?? languageMode;
      setPreviewUrl(sourceUrl);
      setScanning(true);
      setScanStage("Enhancing image for Japanese (日本語) + English OCR...");
      setScanPercent(15);
      setSearchMessage(null);
      setRecentlyAdded(null);
      setDetectedInfo(null);
      setCandidates([]);

      // Safety: if scan takes > 28s, stop and let user enter manually
      const safetyTimer = setTimeout(() => {
        if (scanning) {
          setScanning(false);
          setSearchMessage(
            "Scan took too long (photo may be too large or blurry). Enter the Pokémon name + bottom card # manually on the right, or tap 'Save custom card with my photo'."
          );
          setShowManualForm(true);
        }
      }, 28000);

      try {
        const scanned = await scanPokemonCardImage(
          sourceUrl,
          scanLang,
          (stage: string, pct: number) => {
            setScanStage(stage);
            setScanPercent(pct);
          }
        );

        clearTimeout(safetyTimer);

        setCapturedDataUrl(scanned.capturedDataUrl);
        setPokemonName(scanned.pokemonName);
        setCardNumberInput(scanned.displayNumber);
        setManualLanguage(
          scanned.detectedLanguage === "ja" ? "Japanese" : "English"
        );
        if (scanned.setCode) {
          setManualSet(`Pokémon TCG JP (${scanned.setCode})`);
        }
        setDetectedInfo({
          detectedLanguage: scanned.detectedLanguage,
          japaneseName: scanned.japaneseName,
          englishName: scanned.englishName,
          setCode: scanned.setCode,
          cardNumber: scanned.cardNumber,
          setTotal: scanned.setTotal,
          rarityCode: scanned.rarityCode,
          hp: scanned.hp,
          illustrator: scanned.illustrator,
        });

        setCandidates(scanned.results);
        const prices = hydrateCandidatePrices(scanned.results);
        setScanning(false);

        if (scanned.results.length === 0) {
          if (!scanned.pokemonName && !scanned.displayNumber) {
            setSearchMessage(
              "Photo captured! Heavy foil glare hid the text — type the bottom code & number (e.g. sv2a 201/165 or 4/102) or the Pokémon name in English or 日本語 on the right."
            );
          } else {
            setSearchMessage(
              `Read "${[scanned.pokemonName, scanned.displayNumber]
                .filter(Boolean)
                .join(" ")}" from your card — adjust the bottom card # or set code (e.g. sv2a 201/165) and click Find, or save with your photo.`
            );
          }
          return;
        }

        // Automatically save top match to collection database when autoAdd is enabled
        if (autoAdd && scanned.results[0]) {
          const top = scanned.results[0];
          if (top.imageUrl || scanned.capturedDataUrl) {
            await saveCandidateToDatabase(
              top,
              scanned.capturedDataUrl,
              prices[top.tcgId]
            );
          }
        }
      } catch (err) {
        clearTimeout(safetyTimer);
        setScanning(false);
        setSearchMessage(
          err instanceof Error
            ? `${err.message}. You can also search by Pokémon name (EN / 日本語) or Japanese set code + card # (e.g. sv2a 201/165) on the right.`
            : "Photo captured — enter the Pokémon name (EN / 日本語) or bottom card number to fetch online card details."
        );
      }
    },
    [autoAdd, languageMode, saveCandidateToDatabase]
  );

  const handleCaptureFromVideo = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
    stopCamera();
    void processCardImage(dataUrl);
  };

  const handleFileSelected = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    stopCamera();
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        void processCardImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLanguageChange = (nextLang: ScanLanguageMode) => {
    setLanguageMode(nextLang);
    if (nextLang === "ja") setManualLanguage("Japanese");
    if (nextLang === "en") setManualLanguage("English");

    // If a photo is loaded and user explicitly switches language, offer immediate re-scan
    if (previewUrl && !scanning) {
      void processCardImage(previewUrl, nextLang);
    } else if ((pokemonName.trim() || cardNumberInput.trim()) && !searchingDb) {
      void runTcgLookup(pokemonName, cardNumberInput, nextLang);
    }
  };

  const handleQuickUpdateAddedCard = async () => {
    if (!recentlyAdded) return;
    setSavingQuickEdit(true);
    try {
      const res = await fetch(`/api/cards/${recentlyAdded.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseFloat(quickPrice) || 0,
          condition: quickCondition,
          quantity: Math.max(1, quickQty),
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { card: AlbumCard };
        setRecentlyAdded(data.card);
        onCardUpdated(data.card);
        setQuickSavedMsg(true);
        setTimeout(() => setQuickSavedMsg(false), 2000);
      }
    } finally {
      setSavingQuickEdit(false);
    }
  };

  const handleUndoRemoveAddedCard = async () => {
    if (!recentlyAdded) return;
    const targetId = recentlyAdded.id;
    const res = await fetch(`/api/cards/${targetId}`, { method: "DELETE" });
    if (res.ok) {
      onCardRemoved(targetId);
      setRecentlyAdded(null);
    }
  };

  const handleResetScanner = () => {
    stopCamera();
    setPreviewUrl(null);
    setCapturedDataUrl(null);
    setDetectedInfo(null);
    setPokemonName("");
    setCardNumberInput("");
    setCandidates([]);
    setRecentlyAdded(null);
    setSearchMessage(null);
    setShowManualForm(false);
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pokemonName.trim() || !cardNumberInput.trim()) {
      setSearchMessage("Please enter both a Pokémon name and card number.");
      return;
    }
    if (!capturedDataUrl) {
      setSearchMessage(
        "Take or upload a picture of the card first, or pick an online TCG match."
      );
      return;
    }

    setSavingManual(true);
    try {
      const frac = cardNumberInput.match(/(\d{1,3}[A-Za-z]?)\s*\/\s*(\d{2,3})/);
      const num = frac ? frac[1] : cardNumberInput.trim();
      const total = frac ? frac[2] : null;

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pokemonName.trim(),
          language: manualLanguage,
          cardNumber: num,
          setTotal: total,
          setName: manualSet.trim() || "Pokémon TCG",
          rarity: manualRarity,
          pokemonType: manualType,
          variant: manualVariant,
          condition: defaultCondition,
          price: parseFloat(manualPrice) || 10,
          quantity: 1,
          forSale: defaultForSale,
          capturedPhotoDataUrl: capturedDataUrl,
          imageUrl: capturedDataUrl,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { card: AlbumCard };
        onCardAdded(data.card);
        setRecentlyAdded(data.card);
        setQuickPrice(data.card.price);
        setQuickCondition(data.card.condition);
        setQuickQty(data.card.quantity);
        setShowManualForm(false);
      }
    } finally {
      setSavingManual(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Card Language Switcher Bar (Auto EN+JP / Japanese 日本語 / English) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6DFD2] bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <Languages className="h-4 w-4 text-[#E3350D]" />
          <span className="font-bold text-[#161B2E]">Card Scanner Language:</span>
          <span className="hidden text-slate-500 sm:inline">
            Reads Japanese writing (日本語), JP set codes (SV2a, SV8a, S12a) & English
          </span>
        </div>

        <div className="inline-flex rounded-xl border border-[#E2DBD0] bg-[#FAF8F4] p-1">
          {(
            [
              { id: "auto", label: "Auto (EN + 日本語)" },
              { id: "ja", label: "日本語 Japanese" },
              { id: "en", label: "English" },
            ] as const
          ).map((opt) => {
            const active = languageMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={scanning}
                onClick={() => handleLanguageChange(opt.id)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                  active
                    ? opt.id === "ja"
                      ? "bg-[#E3350D] text-white shadow-2xs"
                      : "bg-[#161B2E] text-white shadow-2xs"
                    : "text-slate-600 hover:text-[#161B2E]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently Added Confirmation Banner with Instant Edit & Remove Controls */}
      {recentlyAdded && (
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 p-5 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-24 w-17 shrink-0 overflow-hidden rounded-xl bg-white shadow-md">
                <CardArtImage
                  src={recentlyAdded.imageUrl}
                  fallbackSrc={recentlyAdded.capturedPhotoUrl}
                  alt={recentlyAdded.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Added to ChazMaster Album
                  </span>
                  {recentlyAdded.language === "Japanese" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#E3350D]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E3350D]" />
                      JP 日本語
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 font-display text-lg font-extrabold text-[#161B2E] sm:text-xl">
                  {recentlyAdded.name}{" "}
                  <span className="font-mono-num text-sm font-semibold text-slate-500">
                    (
                    {formatCardNumber(
                      recentlyAdded.cardNumber,
                      recentlyAdded.setTotal
                    )}
                    )
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  {recentlyAdded.setName} · {recentlyAdded.rarity} ·{" "}
                  {recentlyAdded.pokemonType}
                  {recentlyAdded.marketPrice
                    ? ` · Market ${formatPrice(recentlyAdded.marketPrice)}`
                    : ""}
                </p>
              </div>
            </div>

            {/* Quick Adjust Price / Condition / Qty or Remove from Collection */}
            <div className="flex flex-wrap items-end gap-2.5">
              <div>
                <label className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickPrice}
                  onChange={(e) => setQuickPrice(e.target.value)}
                  className="font-mono-num mt-1 w-24 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#161B2E]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                  Condition
                </label>
                <select
                  value={quickCondition}
                  onChange={(e) => setQuickCondition(e.target.value)}
                  className="mt-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#161B2E]"
                >
                  {CARD_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quickQty}
                  onChange={(e) =>
                    setQuickQty(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="font-mono-num mt-1 w-16 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#161B2E]"
                />
              </div>

              <button
                type="button"
                disabled={savingQuickEdit}
                onClick={handleQuickUpdateAddedCard}
                className="cursor-pointer rounded-xl bg-[#161B2E] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              >
                {quickSavedMsg ? "Saved!" : savingQuickEdit ? "Saving..." : "Update"}
              </button>

              <button
                type="button"
                onClick={handleUndoRemoveAddedCard}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-[#E3350D] transition-colors hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>

              <button
                type="button"
                onClick={handleResetScanner}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <Camera className="h-3.5 w-3.5" />
                Scan Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Scanner Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Camera & Image Capture */}
        <div className="rounded-3xl border border-[#E6DFD2] bg-white p-5 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#161B2E]">
                1. Take a Card Picture
              </h2>
              <p className="text-xs text-slate-500">
                Fill the frame with your English or Japanese (日本語) card
              </p>
            </div>
            {(previewUrl || cameraActive) && (
              <button
                type="button"
                onClick={handleResetScanner}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* Camera Viewfinder / Preview Frame */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFileSelected(e.dataTransfer.files?.[0]);
            }}
            className="relative mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-[#DDD5C5] bg-[#13182B]"
          >
            {cameraActive ? (
              <div className="relative aspect-[3/4] w-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                {/* Bilingual Card Alignment Overlay */}
                <div className="pointer-events-none absolute inset-4 flex flex-col justify-between rounded-2xl border-2 border-amber-300/80 p-2.5 shadow-[0_0_0_9999px_rgba(10,14,26,0.45)]">
                  <div className="rounded-lg border border-dashed border-amber-300/90 bg-black/45 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-amber-200 uppercase">
                    Name Zone · ポケモン名 (EN / 日本語)
                  </div>
                  <div className="rounded-lg border border-dashed border-amber-300/90 bg-black/45 px-2.5 py-1 text-center text-[10px] font-bold tracking-wider text-amber-200 uppercase">
                    Bottom Set & # (e.g. sv2a 201/165 SAR · 4/102)
                  </div>
                </div>
                <div className="scan-beam" />

                {/* Live Shutter Controls */}
                <div className="absolute right-0 bottom-3 left-0 flex items-center justify-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={() => {
                      const next =
                        facingMode === "environment" ? "user" : "environment";
                      setFacingMode(next);
                      void startCamera(next);
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
                    title="Flip camera"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCaptureFromVideo}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-white bg-[#E3350D] px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition-transform hover:bg-[#C62B07] active:scale-95"
                  >
                    <Camera className="h-4 w-4" />
                    Snap Card
                  </button>

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
                    title="Stop camera"
                  >
                    <VideoOff className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-[#0F1424] p-4">
                <img
                  src={previewUrl}
                  alt="Captured Pokémon card"
                  className="max-h-full max-w-full rounded-xl object-contain shadow-lg"
                />
                {scanning && (
                  <>
                    <div className="scan-beam" />
                    <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[#161B2E]/92 p-3.5 text-white backdrop-blur-md">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                        <span>{scanStage}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#E3350D] to-amber-300 transition-all duration-300"
                          style={{ width: `${scanPercent}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScanning(false);
                          setSearchMessage(
                            "Skipped OCR. Enter Pokémon name + bottom card # manually, or save with your photo."
                          );
                          setShowManualForm(true);
                        }}
                        className="mt-2 w-full cursor-pointer rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/30"
                      >
                        Skip OCR & Enter Manually
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex aspect-[3/4] flex-col items-center justify-center bg-gradient-to-b from-[#FAF8F4] to-[#F2EDE3] p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E3350D]/10 text-[#E3350D]">
                  <ScanLine className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-[#161B2E]">
                  Scan English & Japanese Cards
                </h3>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Snap or upload a clear card photo. Reads{" "}
                  <strong>Japanese writing (リザードンex)</strong>,{" "}
                  <strong>English names</strong>, Japanese set codes (
                  <span className="font-mono-num">sv2a, sv8a</span>), and bottom
                  card numbers automatically.
                </p>

                <div className="mt-5 flex w-full max-w-xs flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E3350D] px-4 py-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#C62B07] active:scale-[0.99]"
                  >
                    <Camera className="h-4 w-4" />
                    Open Live Camera
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => mobileCamInputRef.current?.click()}
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#161B2E] px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      <Camera className="h-3.5 w-3.5 text-amber-300" />
                      Phone Snap
                    </button>
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#DDD5C5] bg-white px-3 py-2.5 text-xs font-semibold text-[#161B2E] transition-colors hover:bg-slate-50"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      Upload Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={mobileCamInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {/* Quick Re-Take / Re-Scan in Japanese buttons */}
          {previewUrl && !scanning && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] px-2.5 py-2 text-xs font-semibold text-[#161B2E] hover:bg-slate-100"
              >
                <Camera className="h-3.5 w-3.5" />
                Retake
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] px-2.5 py-2 text-xs font-semibold text-[#161B2E] hover:bg-slate-100"
              >
                <Upload className="h-3.5 w-3.5" />
                New Photo
              </button>
              {detectedInfo?.detectedLanguage !== "ja" && (
                <button
                  type="button"
                  onClick={() => {
                    setLanguageMode("ja");
                    void processCardImage(previewUrl, "ja");
                  }}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-bold text-[#E3350D] hover:bg-rose-100"
                >
                  Re-Scan 日本語
                </button>
              )}
            </div>
          )}

          {cameraError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Auto-Save Toggle & Default Card Settings */}
          <div className="mt-4 space-y-3 rounded-2xl border border-[#EFEAE0] bg-[#FAF8F4] p-3.5">
            <label className="flex cursor-pointer items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#161B2E]">
                  Auto-add scanned card to collection
                </div>
                <div className="text-[11px] text-slate-500">
                  Immediately saves best JP/EN database match after snapping photo
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoAdd}
                onChange={(e) => setAutoAdd(e.target.checked)}
                className="h-4 w-4 accent-[#E3350D]"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5 border-t border-[#E8E2D6] pt-3">
              <div>
                <label className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                  Default Condition
                </label>
                <select
                  value={defaultCondition}
                  onChange={(e) => setDefaultCondition(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E2DBD0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#161B2E]"
                >
                  {CARD_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wide text-slate-500 uppercase">
                  Client Status
                </label>
                <select
                  value={defaultForSale ? "sale" : "vault"}
                  onChange={(e) => setDefaultForSale(e.target.value === "sale")}
                  className="mt-1 w-full rounded-lg border border-[#E2DBD0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#161B2E]"
                >
                  <option value="sale">For Sale in Album</option>
                  <option value="vault">Vault (Display Only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Online Pokémon TCG Database Lookup & Matches (JP + EN) */}
        <div className="rounded-3xl border border-[#E6DFD2] bg-white p-5 shadow-xs lg:col-span-7">
          <div>
            <h2 className="font-display text-lg font-extrabold text-[#161B2E]">
              2. Online Pokémon TCG Database (日本語 + English)
            </h2>
            <p className="text-xs text-slate-500">
              Auto-filled from your photo, or type a name in English / 日本語 +
              bottom set code & card number
            </p>
          </div>

          {/* OCR Extraction Summary Pills */}
          {detectedInfo && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#ECE6DA] bg-[#FAF8F4] px-3 py-2 text-[11px]">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-extrabold ${
                  detectedInfo.detectedLanguage === "ja"
                    ? "bg-[#E3350D] text-white"
                    : "bg-[#161B2E] text-white"
                }`}
              >
                {detectedInfo.detectedLanguage === "ja"
                  ? "JP 日本語 Detected"
                  : "EN Detected"}
              </span>

              {detectedInfo.japaneseName && (
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-[#161B2E]">
                  {detectedInfo.japaneseName}
                  {detectedInfo.englishName
                    ? ` → ${detectedInfo.englishName}`
                    : ""}
                </span>
              )}

              {!detectedInfo.japaneseName && detectedInfo.englishName && (
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-[#161B2E]">
                  {detectedInfo.englishName}
                </span>
              )}

              {detectedInfo.setCode && (
                <span className="font-mono-num rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-bold text-amber-900">
                  Set: {detectedInfo.setCode}
                </span>
              )}

              {detectedInfo.cardNumber && (
                <span className="font-mono-num rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-700">
                  #
                  {detectedInfo.setTotal
                    ? `${detectedInfo.cardNumber}/${detectedInfo.setTotal}`
                    : detectedInfo.cardNumber}
                </span>
              )}

              {detectedInfo.rarityCode && (
                <span className="font-mono-num rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 font-bold text-purple-800">
                  {detectedInfo.rarityCode}
                </span>
              )}

              {detectedInfo.hp && (
                <span className="font-mono-num rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600">
                  HP {detectedInfo.hp}
                </span>
              )}
            </div>
          )}

          {/* Name + Bottom Set/Card Number Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runTcgLookup(pokemonName, cardNumberInput);
            }}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12"
          >
            <div className="sm:col-span-5">
              <label
                htmlFor="scanner-pokemon-name"
                className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
              >
                Pokémon Name (EN or 日本語)
              </label>
              <input
                id="scanner-pokemon-name"
                type="text"
                value={pokemonName}
                onChange={(e) => setPokemonName(e.target.value)}
                placeholder="Charizard or リザードンex"
                className="mt-1 w-full rounded-xl border border-[#E2DBD0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm font-medium text-[#161B2E] placeholder:text-slate-400 focus:border-[#E3350D] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="scanner-card-number"
                className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
              >
                Bottom Set & Card #
              </label>
              <input
                id="scanner-card-number"
                type="text"
                value={cardNumberInput}
                onChange={(e) => setCardNumberInput(e.target.value)}
                placeholder="sv2a 201/165, 199/165, No.006"
                className="font-mono-num mt-1 w-full rounded-xl border border-[#E2DBD0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm font-semibold text-[#161B2E] placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:border-[#E3350D] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-end sm:col-span-2">
              <button
                type="submit"
                disabled={searchingDb || scanning}
                className="inline-flex h-[42px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#161B2E] px-3 text-xs font-bold text-white transition-colors hover:bg-[#E3350D] disabled:opacity-50"
              >
                {searchingDb ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    Find
                  </>
                )}
              </button>
            </div>
          </form>

          {searchMessage && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-950">
              <span>{searchMessage}</span>
              {capturedDataUrl && (
                <button
                  type="button"
                  onClick={() => setShowManualForm((v) => !v)}
                  className="cursor-pointer font-bold text-[#E3350D] underline"
                >
                  Save custom card with my photo
                </button>
              )}
            </div>
          )}

          {/* Optional Custom Manual Card Form */}
          {showManualForm && (
            <form
              onSubmit={handleManualSave}
              className="mt-4 space-y-3 rounded-2xl border border-[#E4DDD0] bg-[#FAF8F4] p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#161B2E]">
                  Add Custom Card Using Captured Photo
                </span>
                <select
                  value={manualLanguage}
                  onChange={(e) =>
                    setManualLanguage(
                      e.target.value === "Japanese" ? "Japanese" : "English"
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#161B2E]"
                >
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="English">English</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Set Name
                  </label>
                  <input
                    type="text"
                    value={manualSet}
                    onChange={(e) => setManualSet(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Type
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    {POKEMON_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Variant
                  </label>
                  <select
                    value={manualVariant}
                    onChange={(e) => setManualVariant(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                  >
                    {CARD_VARIANTS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="font-mono-num mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={manualRarity}
                  onChange={(e) => setManualRarity(e.target.value)}
                  placeholder="Rarity (e.g. Special Art Rare SAR)"
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  disabled={savingManual}
                  className="cursor-pointer rounded-xl bg-[#E3350D] px-4 py-2 text-xs font-bold text-white hover:bg-[#C62B07]"
                >
                  {savingManual ? "Saving..." : "Save Custom Card"}
                </button>
              </div>
            </form>
          )}

          {/* Results Area */}
          <div className="mt-5">
            {searchingDb || scanning ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFEAE0] bg-[#FAF8F4] py-16 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#E3350D]" />
                <p className="mt-3 text-sm font-bold text-[#161B2E]">
                  {scanning
                    ? scanStage || "Reading Japanese & English card text..."
                    : "Searching Japanese & English Pokémon TCG Databases..."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Matching Pokémon name (日本語 / EN), set code, bottom card #,
                  artwork & market price
                </p>
              </div>
            ) : candidates.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {candidates.map((cand, index) => {
                  const numLabel = formatCardNumber(
                    cand.cardNumber,
                    cand.setTotal
                  );
                  const isJustAdded = recentlyAdded?.tcgId === cand.tcgId;
                  const isJp = cand.language === "Japanese";
                  const priceInput =
                    customPrices[cand.tcgId] ??
                    (cand.marketPrice !== null
                      ? cand.marketPrice.toFixed(2)
                      : "12.00");

                  return (
                    <div
                      key={`${cand.language}-${cand.tcgId}`}
                      className={`flex gap-3.5 rounded-2xl border p-3.5 transition-all ${
                        isJustAdded
                          ? "border-emerald-300 bg-emerald-50/40"
                          : index === 0
                            ? "border-[#E3350D]/35 bg-[#FFF9F7]"
                            : "border-[#EAE4D8] bg-[#FAF8F4]/70"
                      }`}
                    >
                      <div className="relative h-32 w-23 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-xs">
                        <CardArtImage
                          src={cand.imageUrl || capturedDataUrl || ""}
                          fallbackSrc={capturedDataUrl}
                          alt={cand.name}
                          cardNumber={numLabel}
                          setName={cand.setId}
                          className="h-full w-full rounded-lg object-contain"
                        />
                        <span
                          className={`absolute top-1.5 left-1.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold shadow-xs ${
                            isJp
                              ? "bg-[#E3350D] text-white"
                              : "bg-[#161B2E] text-white"
                          }`}
                        >
                          {isJp ? "JP" : "EN"}
                        </span>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                index === 0
                                  ? "bg-[#E3350D] text-white"
                                  : "bg-slate-200/80 text-slate-600"
                              }`}
                            >
                              {index === 0
                                ? `Best · ${cand.confidence}%`
                                : `${cand.confidence}%`}
                            </span>
                            <span className="font-mono-num text-[11px] font-bold text-slate-700">
                              {numLabel}
                            </span>
                          </div>

                          <h4
                            title={cand.name}
                            className="mt-1.5 line-clamp-1 font-display text-sm font-extrabold text-[#161B2E]"
                          >
                            {cand.name}
                          </h4>
                          <p
                            title={cand.setName}
                            className="truncate text-[11px] font-medium text-slate-500"
                          >
                            {cand.setName}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {cand.rarity} · {cand.pokemonType}
                            {cand.hp ? ` · HP ${cand.hp}` : ""}
                          </p>
                          {cand.marketPrice !== null && (
                            <p className="font-mono-num mt-1 text-[11px] font-semibold text-emerald-700">
                              Market: {formatPrice(cand.marketPrice)}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <div className="relative w-22">
                            <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              aria-label={`Selling price for ${cand.name}`}
                              value={priceInput}
                              onChange={(e) =>
                                setCustomPrices((prev) => ({
                                  ...prev,
                                  [cand.tcgId]: e.target.value,
                                }))
                              }
                              className="font-mono-num w-full rounded-lg border border-[#DFD8CA] bg-white py-1.5 pr-2 pl-5 text-xs font-bold text-[#161B2E]"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={addingTcgId === cand.tcgId}
                            onClick={() =>
                              void saveCandidateToDatabase(
                                cand,
                                capturedDataUrl,
                                priceInput
                              )
                            }
                            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                              isJustAdded
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-[#E3350D] hover:bg-[#C62B07]"
                            }`}
                          >
                            {addingTcgId === cand.tcgId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                {isJustAdded ? "Add Copy" : "Add Card"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFEAE0] bg-[#FAF8F4] px-6 py-11 text-center">
                <Sparkles className="h-7 w-7 text-amber-500" />
                <h3 className="mt-3 font-display text-sm font-bold text-[#161B2E]">
                  Supports Japanese (日本語) & English Pokémon Cards (1996–2026)
                </h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  Take a photo on the left to automatically read Japanese
                  writing, set codes (<span className="font-mono-num">sv2a</span>,{" "}
                  <span className="font-mono-num">sv8a</span>,{" "}
                  <span className="font-mono-num">sv4a</span>,{" "}
                  <span className="font-mono-num">s12a</span>) & card numbers, or
                  try a quick database lookup:
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[
                    {
                      label: "🇯🇵 リザードンex SV2a 201/165",
                      name: "リザードンex",
                      num: "SV2a 201/165 SAR",
                      lang: "ja" as const,
                    },
                    {
                      label: "🇯🇵 ブラッキーex SV8a 217/187",
                      name: "ブラッキーex",
                      num: "SV8a 217/187 SAR",
                      lang: "ja" as const,
                    },
                    {
                      label: "🇯🇵 ピカチュウex SV8 132/106",
                      name: "ピカチュウex",
                      num: "SV8 132/106 SAR",
                      lang: "ja" as const,
                    },
                    {
                      label: "Lugia V 186/195",
                      name: "Lugia V",
                      num: "186/195",
                      lang: "en" as const,
                    },
                    {
                      label: "Charizard 4/102",
                      name: "Charizard",
                      num: "4/102",
                      lang: "en" as const,
                    },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setPokemonName(sample.name);
                        setCardNumberInput(sample.num);
                        void runTcgLookup(sample.name, sample.num, sample.lang);
                      }}
                      className="cursor-pointer rounded-full border border-[#E2DBD0] bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:border-[#E3350D] hover:text-[#E3350D]"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
