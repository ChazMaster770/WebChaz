"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
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
  type TcgCardCandidate,
} from "@/lib/constants";
import { scanPokemonCardImage } from "@/lib/pokemon-ocr";
import { CardArtImage } from "./BrandLogo";

interface CardScannerProps {
  onCardAdded: (card: AlbumCard) => void;
  onCardUpdated: (card: AlbumCard) => void;
  onCardRemoved: (cardId: number) => void;
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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scanned image & OCR state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStage, setScanStage] = useState("");
  const [scanPercent, setScanPercent] = useState(0);
  const [autoAdd, setAutoAdd] = useState(true);

  // Search fields (populated by OCR or typed manually)
  const [pokemonName, setPokemonName] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");
  const [defaultCondition, setDefaultCondition] = useState<string>("Near Mint");
  const [defaultForSale, setDefaultForSale] = useState<boolean>(true);

  // TCG Online Database matches
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
  const [manualSet, setManualSet] = useState("Pokémon TCG Promo");
  const [manualType, setManualType] = useState("Fire");
  const [manualRarity, setManualRarity] = useState("Rare Holo");
  const [manualVariant, setManualVariant] = useState("Holofoil");
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
          "Live camera requires HTTPS or mobile camera upload. Use 'Take / Upload Photo' below."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1600 },
            height: { ideal: 1200 },
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
          "Could not access live camera (permission denied or no webcam found). Use 'Take / Upload Photo' to snap or pick a card picture."
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
            imageUrl: candidate.imageUrl,
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
          const err = (await res.json().catch(() => ({}))) as { error?: string };
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

  const runTcgLookup = useCallback(
    async (
      nameQuery: string,
      numberQuery: string,
      opts?: { shouldAutoAdd?: boolean; photoDataUrl?: string | null }
    ) => {
      const cleanName = nameQuery.trim();
      const cleanNum = numberQuery.trim();

      if (!cleanName && !cleanNum) {
        setSearchMessage(
          "Could not read text clearly from the image. Type the Pokémon name and bottom card number (e.g. 199/165) below to fetch from the Pokémon TCG database."
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
        params.set("limit", "8");

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

        const initialPrices: Record<string, string> = {};
        for (const r of results) {
          initialPrices[r.tcgId] =
            r.marketPrice !== null ? r.marketPrice.toFixed(2) : "12.00";
        }
        setCustomPrices(initialPrices);

        if (results.length === 0) {
          setSearchMessage(
            `No exact online TCG match for "${[cleanName, cleanNum]
              .filter(Boolean)
              .join(" #")}". Adjust the name or card number and search again, or add as a custom card.`
          );
          return;
        }

        // Automatically add the top match into the database right after scanning the photo
        if (opts?.shouldAutoAdd && results[0]) {
          await saveCandidateToDatabase(
            results[0],
            opts.photoDataUrl ?? capturedDataUrl,
            initialPrices[results[0].tcgId]
          );
        }
      } catch {
        setSearchMessage("Could not connect to the online Pokémon TCG database.");
      } finally {
        setSearchingDb(false);
      }
    },
    [capturedDataUrl, saveCandidateToDatabase]
  );

  const processCardImage = useCallback(
    async (sourceUrl: string) => {
      setPreviewUrl(sourceUrl);
      setScanning(true);
      setScanStage("Analyzing card photo...");
      setScanPercent(10);
      setSearchMessage(null);
      setRecentlyAdded(null);
      setCandidates([]);

      try {
        const scanned = await scanPokemonCardImage(sourceUrl, (stage, pct) => {
          setScanStage(stage);
          setScanPercent(pct);
        });

        setCapturedDataUrl(scanned.capturedDataUrl);
        setPokemonName(scanned.pokemonName);
        setCardNumberInput(scanned.displayNumber);
        setScanning(false);

        if (!scanned.pokemonName && !scanned.displayNumber) {
          setSearchMessage(
            "Photo captured! Holographic glare or angle hid the card text — enter the Pokémon name and bottom number (e.g. Charizard + 199/165) on the right to match the online TCG database."
          );
          return;
        }

        await runTcgLookup(scanned.pokemonName, scanned.displayNumber, {
          shouldAutoAdd: autoAdd,
          photoDataUrl: scanned.capturedDataUrl,
        });
      } catch {
        setScanning(false);
        setSearchMessage(
          "Photo captured, but automatic OCR encountered an issue. Type the Pokémon name and bottom card number on the right to fetch card details."
        );
      }
    },
    [autoAdd, runTcgLookup]
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
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
      const parts = cardNumberInput.split("/");
      const num = parts[0]?.trim() || cardNumberInput.trim();
      const total = parts[1]?.trim() || null;

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pokemonName.trim(),
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
          imageUrl: "",
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
    <div className="space-y-6">
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
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Added to ChazMaster Album Database
                </div>
                <h3 className="mt-1.5 font-display text-xl font-extrabold text-[#161B2E]">
                  {recentlyAdded.name}{" "}
                  <span className="font-mono-num text-sm font-semibold text-slate-500">
                    ({formatCardNumber(recentlyAdded.cardNumber, recentlyAdded.setTotal)})
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  {recentlyAdded.setName} · {recentlyAdded.rarity} ·{" "}
                  {recentlyAdded.pokemonType}
                  {recentlyAdded.marketPrice
                    ? ` · TCG Market ${formatPrice(recentlyAdded.marketPrice)}`
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
                Keep the top Pokémon name & bottom card number clear
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
                {/* Pokémon Card Alignment Overlay */}
                <div className="pointer-events-none absolute inset-4 flex flex-col justify-between rounded-2xl border-2 border-amber-300/80 p-2.5 shadow-[0_0_0_9999px_rgba(10,14,26,0.45)]">
                  <div className="rounded-lg border border-dashed border-amber-300/90 bg-black/35 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-amber-200 uppercase">
                    Pokémon Name Zone
                  </div>
                  <div className="rounded-lg border border-dashed border-amber-300/90 bg-black/35 px-2.5 py-1 text-center text-[10px] font-bold tracking-wider text-amber-200 uppercase">
                    Bottom Card # Zone (e.g. 199/165)
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
                  Scan Your Pokémon Card
                </h3>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Take a photo with your camera or drop a card image here. We
                  automatically read the <strong>Pokémon name</strong> and{" "}
                  <strong>bottom card number</strong> to pull full info from the
                  Pokémon TCG database.
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

          {/* Quick Re-Take buttons when preview shown */}
          {previewUrl && !scanning && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void startCamera()}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] py-2 text-xs font-semibold text-[#161B2E] hover:bg-slate-100"
              >
                <Camera className="h-3.5 w-3.5" />
                Retake Camera
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] py-2 text-xs font-semibold text-[#161B2E] hover:bg-slate-100"
              >
                <Upload className="h-3.5 w-3.5" />
                Another Photo
              </button>
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
                  Immediately saves best TCG database match after taking picture
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

        {/* Right Column: Online Pokémon TCG Database Lookup & Matches */}
        <div className="rounded-3xl border border-[#E6DFD2] bg-white p-5 shadow-xs lg:col-span-7">
          <div>
            <h2 className="font-display text-lg font-extrabold text-[#161B2E]">
              2. Online Pokémon TCG Database Match
            </h2>
            <p className="text-xs text-slate-500">
              Auto-filled from your card photo, or search directly by Pokémon name
              and bottom card number
            </p>
          </div>

          {/* Name + Bottom Card Number Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void runTcgLookup(pokemonName, cardNumberInput, {
                shouldAutoAdd: false,
              });
            }}
            className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12"
          >
            <div className="sm:col-span-6">
              <label
                htmlFor="scanner-pokemon-name"
                className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
              >
                Pokémon Name
              </label>
              <input
                id="scanner-pokemon-name"
                type="text"
                value={pokemonName}
                onChange={(e) => setPokemonName(e.target.value)}
                placeholder="e.g. Charizard, Lugia V, Mewtwo"
                className="mt-1 w-full rounded-xl border border-[#E2DBD0] bg-[#FAF8F4] px-3.5 py-2.5 text-sm font-medium text-[#161B2E] placeholder:text-slate-400 focus:border-[#E3350D] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="scanner-card-number"
                className="block text-[11px] font-bold tracking-wide text-slate-500 uppercase"
              >
                Bottom Card #
              </label>
              <input
                id="scanner-card-number"
                type="text"
                value={cardNumberInput}
                onChange={(e) => setCardNumberInput(e.target.value)}
                placeholder="e.g. 199/165 or 4/102"
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

          {/* Optional Custom Manual Card Form (when photo is of non-English / custom card) */}
          {showManualForm && (
            <form
              onSubmit={handleManualSave}
              className="mt-4 space-y-3 rounded-2xl border border-[#E4DDD0] bg-[#FAF8F4] p-4"
            >
              <div className="text-xs font-bold text-[#161B2E]">
                Add Custom Card Using Captured Photo
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
                  placeholder="Rarity (e.g. Rare Holo)"
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
            {searchingDb ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFEAE0] bg-[#FAF8F4] py-16 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#E3350D]" />
                <p className="mt-3 text-sm font-bold text-[#161B2E]">
                  Searching Online Pokémon TCG Database...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Matching name, bottom card number, official artwork & market price
                </p>
              </div>
            ) : candidates.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {candidates.map((cand, index) => {
                  const numLabel = formatCardNumber(cand.cardNumber, cand.setTotal);
                  const isJustAdded = recentlyAdded?.tcgId === cand.tcgId;
                  const priceInput =
                    customPrices[cand.tcgId] ??
                    (cand.marketPrice !== null
                      ? cand.marketPrice.toFixed(2)
                      : "12.00");

                  return (
                    <div
                      key={cand.tcgId}
                      className={`flex gap-3.5 rounded-2xl border p-3.5 transition-all ${
                        isJustAdded
                          ? "border-emerald-300 bg-emerald-50/40"
                          : index === 0
                            ? "border-[#E3350D]/35 bg-[#FFF9F7]"
                            : "border-[#EAE4D8] bg-[#FAF8F4]/70"
                      }`}
                    >
                      <div className="h-32 w-23 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-xs">
                        <CardArtImage
                          src={cand.imageUrl}
                          alt={cand.name}
                          cardNumber={numLabel}
                          className="h-full w-full rounded-lg object-contain"
                        />
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
                                ? `Best Match · ${cand.confidence}%`
                                : `${cand.confidence}% Match`}
                            </span>
                            <span className="font-mono-num text-[11px] font-bold text-slate-700">
                              {numLabel}
                            </span>
                          </div>

                          <h4 className="mt-1.5 truncate font-display text-sm font-extrabold text-[#161B2E]">
                            {cand.name}
                          </h4>
                          <p className="truncate text-[11px] font-medium text-slate-500">
                            {cand.setName}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {cand.rarity} · {cand.pokemonType}
                            {cand.hp ? ` · HP ${cand.hp}` : ""}
                          </p>
                          {cand.marketPrice !== null && (
                            <p className="font-mono-num mt-1 text-[11px] font-semibold text-emerald-700">
                              TCG Market: {formatPrice(cand.marketPrice)}
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
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#EFEAE0] bg-[#FAF8F4] px-6 py-12 text-center">
                <Sparkles className="h-7 w-7 text-amber-500" />
                <h3 className="mt-3 font-display text-sm font-bold text-[#161B2E]">
                  Ready to Identify Any Pokémon Card (1999–2026)
                </h3>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                  Snap a picture on the left to automatically extract the Pokémon
                  name and bottom card number, or test a quick online database
                  lookup below:
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[
                    { label: "Lugia V 186/195", name: "Lugia V", num: "186/195" },
                    { label: "Magikarp 203/193", name: "Magikarp", num: "203/193" },
                    { label: "Mewtwo 150/165", name: "Mewtwo", num: "150/165" },
                    { label: "Dragonite V 192/203", name: "Dragonite V", num: "192/203" },
                  ].map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setPokemonName(sample.name);
                        setCardNumberInput(sample.num);
                        void runTcgLookup(sample.name, sample.num, {
                          shouldAutoAdd: false,
                        });
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
