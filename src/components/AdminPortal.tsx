"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Delete,
  DollarSign,
  ExternalLink,
  Layers,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  Minus,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import {
  CARD_CONDITIONS,
  CARD_VARIANTS,
  CONDITION_SHORT,
  formatCardNumber,
  formatPrice,
  getTypeStyle,
  SITE_NAME,
  WHATSAPP_PHONE_DISPLAY,
  type AlbumCard,
  type BasketItem,
} from "@/lib/constants";
import { BrandLogo, CardArtImage, PokeballMark, WhatsAppIcon } from "./BrandLogo";
import { CardScanner } from "./CardScanner";

interface InquiryRecord {
  id: number;
  buyerName: string | null;
  buyerNote: string | null;
  itemsJson: string;
  totalAmount: string;
  totalCards: number;
  status: string;
  createdAt: string;
}

type AdminTab = "scanner" | "collection" | "orders";

export function AdminPortal({ initialAuthed }: { initialAuthed: boolean }) {
  const [authenticated, setAuthenticated] = useState(initialAuthed);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>("scanner");
  const [cards, setCards] = useState<AlbumCard[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Collection manager state
  const [collectionSearch, setCollectionSearch] = useState("");
  const [editingCard, setEditingCard] = useState<AlbumCard | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editCondition, setEditCondition] = useState("Near Mint");
  const [editVariant, setEditVariant] = useState("Holofoil");
  const [editQty, setEditQty] = useState(1);
  const [editForSale, setEditForSale] = useState(true);
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyCardId, setBusyCardId] = useState<number | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    tablesReady: boolean;
    error?: string;
    hint?: string;
  } | null>(null);
  const [dbFixing, setDbFixing] = useState(false);

  const notify = useCallback((msg: string) => {
    setStatusToast(msg);
  }, []);

  useEffect(() => {
    if (!statusToast) return;
    const timer = setTimeout(() => setStatusToast(null), 2600);
    return () => clearTimeout(timer);
  }, [statusToast]);

  const refreshDbStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/db/status", { cache: "no-store" });
      const data = (await res.json()) as {
        configured: boolean;
        connected: boolean;
        tablesReady: boolean;
        error?: string;
        hint?: string;
      };
      setDbStatus(data);
      return data;
    } catch {
      setDbStatus({
        configured: false,
        connected: false,
        tablesReady: false,
        error: "Could not reach the database status endpoint.",
      });
      return null;
    }
  }, []);

  const runDbSetup = useCallback(async () => {
    setDbFixing(true);
    try {
      const res = await fetch("/api/db/status", { method: "POST" });
      const data = (await res.json()) as { success?: boolean; hint?: string };
      if (data.success) {
        notify("Database tables are ready");
        await refreshDbStatus();
        await fetchAdminData();
      } else {
        notify(data.hint || "Database setup failed");
        await refreshDbStatus();
      }
    } finally {
      setDbFixing(false);
    }
  }, [notify, refreshDbStatus]);

  const fetchAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [cardsRes, inqRes] = await Promise.all([
        fetch("/api/cards", { cache: "no-store" }),
        fetch("/api/inquiries", { cache: "no-store" }),
      ]);

      if (cardsRes.ok) {
        const cData = (await cardsRes.json()) as { cards?: AlbumCard[] };
        if (Array.isArray(cData.cards)) setCards(cData.cards);
      }
      if (inqRes.ok) {
        const iData = (await inqRes.json()) as { inquiries?: InquiryRecord[] };
        if (Array.isArray(iData.inquiries)) setInquiries(iData.inquiries);
      } else if (inqRes.status === 401) {
        setAuthenticated(false);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void fetchAdminData();
      void refreshDbStatus();
    }
  }, [authenticated, fetchAdminData, refreshDbStatus]);

  const handleLogin = async (e?: React.FormEvent, overridePin?: string) => {
    if (e) e.preventDefault();
    const candidate = (overridePin ?? password).trim();
    if (!candidate) {
      setLoginError("Please enter the admin password.");
      return;
    }

    setLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: candidate }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setLoginError(data.error || "Incorrect admin password.");
        setPassword("");
        return;
      }

      setPassword("");
      setAuthenticated(true);
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setAuthenticated(false);
    setPassword("");
  };

  const handlePinDigit = (digit: string) => {
    if (password.length >= 8) return;
    setLoginError(null);
    setPassword((prev) => prev + digit);
  };

  // Collection card handlers
  const handleCardAdded = useCallback(
    (card: AlbumCard) => {
      setCards((prev) => [card, ...prev.filter((c) => c.id !== card.id)]);
      notify(`Added ${card.name} to collection`);
    },
    [notify]
  );

  const handleCardUpdated = useCallback(
    (updated: AlbumCard) => {
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      notify(`Updated ${updated.name}`);
    },
    [notify]
  );

  const handleCardRemoved = useCallback(
    (cardId: number) => {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      notify("Removed card from collection");
    },
    [notify]
  );

  const handleAdjustQuantity = async (card: AlbumCard, delta: number) => {
    const nextQty = card.quantity + delta;
    if (nextQty < 0) return;
    setBusyCardId(card.id);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: nextQty }),
      });
      if (res.ok) {
        const data = (await res.json()) as { card: AlbumCard };
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? data.card : c))
        );
      }
    } finally {
      setBusyCardId(null);
    }
  };

  const handleToggleForSale = async (card: AlbumCard) => {
    setBusyCardId(card.id);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forSale: !card.forSale }),
      });
      if (res.ok) {
        const data = (await res.json()) as { card: AlbumCard };
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? data.card : c))
        );
        notify(
          data.card.forSale
            ? `${card.name} listed for sale`
            : `${card.name} moved to Vault`
        );
      }
    } finally {
      setBusyCardId(null);
    }
  };

  const handleDeleteCard = async (card: AlbumCard) => {
    setBusyCardId(card.id);
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== card.id));
        notify(`Removed ${card.name} from collection`);
      }
    } finally {
      setBusyCardId(null);
    }
  };

  const openEditModal = (card: AlbumCard) => {
    setEditingCard(card);
    setEditPrice(card.price);
    setEditCondition(card.condition);
    setEditVariant(card.variant);
    setEditQty(card.quantity);
    setEditForSale(card.forSale);
    setEditNotes(card.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseFloat(editPrice) || 0,
          condition: editCondition,
          variant: editVariant,
          quantity: Math.max(0, editQty),
          forSale: editForSale,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { card: AlbumCard };
        handleCardUpdated(data.card);
        setEditingCard(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCompleteInquiry = async (inq: InquiryRecord) => {
    const res = await fetch(`/api/inquiries/${inq.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", deductStock: true }),
    });
    if (res.ok) {
      notify("Order marked sold & stock updated");
      void fetchAdminData();
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      notify("Inquiry removed");
    }
  };

  // KPI metrics
  const metrics = useMemo(() => {
    const totalCopies = cards.reduce((s, c) => s + Math.max(0, c.quantity), 0);
    const totalValue = cards.reduce(
      (s, c) => s + parseFloat(c.price || "0") * Math.max(0, c.quantity),
      0
    );
    const forSaleCount = cards.filter((c) => c.forSale && c.quantity > 0).length;
    const pendingOrders = inquiries.filter((i) => i.status === "pending").length;
    return { totalCopies, totalValue, forSaleCount, pendingOrders };
  }, [cards, inquiries]);

  const filteredCollection = useMemo(() => {
    const q = collectionSearch.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => {
      const numLabel = c.setTotal
        ? `${c.cardNumber}/${c.setTotal}`.toLowerCase()
        : c.cardNumber.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.setName.toLowerCase().includes(q) ||
        numLabel.includes(q) ||
        c.pokemonType.toLowerCase().includes(q)
      );
    });
  }, [cards, collectionSearch]);

  // ---------------- LOCKED ADMIN LOGIN SCREEN ----------------
  if (!authenticated) {
    return (
      <div className="binder-surface flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#161B2E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {SITE_NAME}
          </Link>

          <div className="overflow-hidden rounded-3xl border border-[#E6DFD2] bg-white shadow-xl">
            <div className="bg-[#161B2E] px-6 py-6 text-center text-white">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner">
                <PokeballMark className="h-10 w-10" />
              </div>
              <h1 className="mt-3 font-display text-xl font-extrabold">
                ChazMaster Admin Vault
              </h1>
              <p className="mt-1 text-xs text-slate-300">
                Enter your admin password to scan, add, or remove cards
              </p>
            </div>

            <form onSubmit={(e) => void handleLogin(e)} className="p-6">
              <div>
                <label
                  htmlFor="admin-password-input"
                  className="block text-[11px] font-bold tracking-wider text-slate-500 uppercase"
                >
                  Admin Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="admin-password-input"
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    value={password}
                    onChange={(e) => {
                      setLoginError(null);
                      setPassword(e.target.value);
                    }}
                    placeholder="••••"
                    className="font-mono-num w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] py-3 pr-4 pl-10 text-center text-lg font-bold tracking-[0.35em] text-[#161B2E] focus:border-[#E3350D] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {loginError && (
                <p className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-[#E3350D]">
                  {loginError}
                </p>
              )}

              {/* Quick Tactile PIN Pad */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handlePinDigit(d)}
                    className="font-mono-num h-11 cursor-pointer rounded-xl border border-[#ECE6DA] bg-[#FAF8F4] text-sm font-bold text-[#161B2E] transition-colors hover:bg-[#F0EAE0] active:scale-95"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setPassword("");
                    setLoginError(null);
                  }}
                  className="h-11 cursor-pointer rounded-xl border border-[#ECE6DA] bg-[#FAF8F4] text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handlePinDigit("0")}
                  className="font-mono-num h-11 cursor-pointer rounded-xl border border-[#ECE6DA] bg-[#FAF8F4] text-sm font-bold text-[#161B2E] transition-colors hover:bg-[#F0EAE0] active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPassword((p) => p.slice(0, -1))}
                  className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#ECE6DA] bg-[#FAF8F4] text-slate-500 hover:bg-slate-100"
                  aria-label="Backspace"
                >
                  <Delete className="h-4 w-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={loggingIn || !password}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E3350D] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#C62B07] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unlock Admin Studio"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- UNLOCKED ADMIN DASHBOARD ----------------
  return (
    <div className="binder-surface flex min-h-screen flex-col">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D6] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <BrandLogo subtitle="Admin Studio" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] px-3.5 py-2 text-xs font-semibold text-[#161B2E] transition-colors hover:bg-slate-100"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Client Album</span>
              <span className="sm:hidden">Album</span>
            </Link>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#161B2E] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#E3350D]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {dbStatus && !dbStatus.tablesReady && (
          <section className="mb-5 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50">
            <div className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-extrabold text-[#7F1D1D]">
                    ⚠️ Database not ready — cards cannot be saved yet
                  </h2>
                  <p className="mt-1 text-xs text-rose-900">
                    {dbStatus.error || "The database tables are missing."}
                  </p>
                  {dbStatus.hint && (
                    <p className="mt-1.5 rounded-lg bg-white/70 px-3 py-2 font-mono-num text-[11px] leading-relaxed text-rose-900">
                      {dbStatus.hint}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void runDbSetup()}
                    disabled={dbFixing}
                    className="cursor-pointer rounded-xl bg-[#E3350D] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#C62B07] disabled:opacity-60"
                  >
                    {dbFixing ? "Setting up..." : "Set up database tables"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void refreshDbStatus()}
                    className="cursor-pointer rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100"
                  >
                    Recheck
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-rose-800/80">
                On Vercel: add <span className="font-mono-num font-bold">DATABASE_URL</span> in
                Project → Settings → Environment Variables, redeploy, then press
                &ldquo;Set up database tables&rdquo;.
              </p>
            </div>
          </section>
        )}

        {dbStatus?.tablesReady && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-[11px] font-semibold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Database connected · tables ready · {cards.length} cards stored
          </div>
        )}

        {/* KPI Row */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E8E2D6] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Total Collection</span>
              <Layers className="h-4 w-4 text-[#E3350D]" />
            </div>
            <div className="font-mono-num mt-2 text-2xl font-extrabold text-[#161B2E]">
              {metrics.totalCopies}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {cards.length} unique card prints
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D6] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Album Value</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="font-mono-num mt-2 text-2xl font-extrabold text-[#161B2E]">
              {formatPrice(metrics.totalValue)}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Based on listed card prices
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D6] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Ready to Buy</span>
              <ShoppingBag className="h-4 w-4 text-amber-500" />
            </div>
            <div className="font-mono-num mt-2 text-2xl font-extrabold text-[#161B2E]">
              {metrics.forSaleCount}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Active in client album
            </p>
          </div>

          <div className="rounded-2xl border border-[#E8E2D6] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>WhatsApp Baskets</span>
              <MessageCircle className="h-4 w-4 text-[#1FA855]" />
            </div>
            <div className="font-mono-num mt-2 text-2xl font-extrabold text-[#161B2E]">
              {metrics.pendingOrders}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Sent to {WHATSAPP_PHONE_DISPLAY}
            </p>
          </div>
        </section>

        {/* Admin Workspace Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-[#E6DFD2] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("scanner")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "scanner"
                ? "bg-[#E3350D] text-white shadow-xs"
                : "border border-[#E4DDD0] bg-white text-slate-600 hover:bg-slate-50 hover:text-[#161B2E]"
            }`}
          >
            <Camera className="h-4 w-4" />
            Scan & Add Card
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("collection")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "collection"
                ? "bg-[#161B2E] text-white shadow-xs"
                : "border border-[#E4DDD0] bg-white text-slate-600 hover:bg-slate-50 hover:text-[#161B2E]"
            }`}
          >
            <Layers className="h-4 w-4" />
            Manage Collection
            <span
              className={`font-mono-num rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "collection"
                  ? "bg-white/15 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {cards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "orders"
                ? "bg-[#1FA855] text-white shadow-xs"
                : "border border-[#E4DDD0] bg-white text-slate-600 hover:bg-slate-50 hover:text-[#161B2E]"
            }`}
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp Orders
            {metrics.pendingOrders > 0 && (
              <span
                className={`font-mono-num rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                  activeTab === "orders"
                    ? "bg-white text-[#1FA855]"
                    : "bg-[#1FA855] text-white"
                }`}
              >
                {metrics.pendingOrders}
              </span>
            )}
          </button>
        </div>

        {/* Tab Panels */}
        <div className="mt-6">
          {activeTab === "scanner" && (
            <CardScanner
              onCardAdded={handleCardAdded}
              onCardUpdated={handleCardUpdated}
              onCardRemoved={handleCardRemoved}
            />
          )}

          {activeTab === "collection" && (
            <div className="rounded-3xl border border-[#E6DFD2] bg-white p-5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#161B2E]">
                    My Pokémon Card Collection
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update stock, edit prices & condition, or remove cards from
                    ChazMaster Album
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      placeholder="Filter my collection..."
                      className="w-full rounded-xl border border-[#E2DBD0] bg-[#FAF8F4] py-2 pr-3 pl-8.5 text-xs text-[#161B2E] focus:border-[#E3350D] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scanner")}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#E3350D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#C62B07]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Card
                  </button>
                </div>
              </div>

              {loadingData && cards.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E3350D]" />
                </div>
              ) : filteredCollection.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#DDD5C5] bg-[#FAF8F4] py-14 text-center">
                  <p className="text-sm font-bold text-[#161B2E]">
                    No cards match your filter
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("scanner")}
                    className="mt-3 cursor-pointer rounded-xl bg-[#E3350D] px-4 py-2 text-xs font-bold text-white"
                  >
                    Scan a Card to Add
                  </button>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-[#EFEAE0] text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        <th className="pb-3 pl-1">Pokémon Card</th>
                        <th className="pb-3">Card #</th>
                        <th className="pb-3">Condition</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Quantity</th>
                        <th className="pb-3">Album Status</th>
                        <th className="pb-3 pr-1 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EFE6] text-xs">
                      {filteredCollection.map((card) => {
                        const numLabel = formatCardNumber(
                          card.cardNumber,
                          card.setTotal
                        );
                        const tStyle = getTypeStyle(card.pokemonType);
                        const cMeta = CONDITION_SHORT[card.condition] || {
                          code: card.condition,
                          className: "bg-slate-100 text-slate-700 border-slate-200",
                        };
                        const isBusy = busyCardId === card.id;

                        return (
                          <tr
                            key={card.id}
                            className="transition-colors hover:bg-[#FAF8F4]/80"
                          >
                            <td className="py-3 pl-1">
                              <div className="flex items-center gap-3">
                                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F4F1EA] p-0.5 shadow-2xs">
                                  <CardArtImage
                                    src={card.imageUrl}
                                    fallbackSrc={card.capturedPhotoUrl}
                                    alt={card.name}
                                    className="h-full w-full rounded object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {card.language === "Japanese" && (
                                      <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-extrabold text-[#E3350D] ring-1 ring-rose-200">
                                        JP
                                      </span>
                                    )}
                                    <span className="font-display text-sm font-bold text-[#161B2E]">
                                      {card.name}
                                    </span>
                                    <span
                                      className={`h-2 w-2 rounded-full ${tStyle.dot}`}
                                      title={card.pokemonType}
                                    />
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {card.setName} · {card.rarity}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3">
                              <span className="font-mono-num rounded-md bg-[#F4F1EA] px-2 py-1 text-[11px] font-bold text-slate-700">
                                {numLabel}
                              </span>
                            </td>

                            <td className="py-3">
                              <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${cMeta.className}`}
                              >
                                {card.condition}
                              </span>
                            </td>

                            <td className="py-3">
                              <div className="font-mono-num text-sm font-bold text-[#161B2E]">
                                {formatPrice(card.price)}
                              </div>
                              {card.marketPrice && (
                                <div className="font-mono-num text-[10px] text-slate-400">
                                  Mkt {formatPrice(card.marketPrice)}
                                </div>
                              )}
                            </td>

                            <td className="py-3">
                              <div className="inline-flex items-center rounded-lg border border-[#E2DBD0] bg-white p-0.5">
                                <button
                                  type="button"
                                  disabled={isBusy || card.quantity <= 0}
                                  onClick={() => void handleAdjustQuantity(card, -1)}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                  aria-label={`Decrease quantity for ${card.name}`}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="font-mono-num min-w-[1.6rem] text-center text-xs font-bold text-[#161B2E]">
                                  {card.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleAdjustQuantity(card, 1)}
                                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                                  aria-label={`Increase quantity for ${card.name}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleToggleForSale(card)}
                                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                  card.forSale && card.quantity > 0
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {card.quantity <= 0
                                  ? "Sold Out"
                                  : card.forSale
                                    ? "For Sale"
                                    : "Vault Only"}
                              </button>
                            </td>

                            <td className="py-3 pr-1 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(card)}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#E2DBD0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                                >
                                  <Pencil className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleDeleteCard(card)}
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-[#E3350D] transition-colors hover:bg-[#E3350D] hover:text-white disabled:opacity-40"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="rounded-3xl border border-[#E6DFD2] bg-white p-5 shadow-xs">
              <div>
                <h2 className="font-display text-lg font-extrabold text-[#161B2E]">
                  Client WhatsApp Basket Inquiries
                </h2>
                <p className="text-xs text-slate-500">
                  Baskets sent by shoppers to {WHATSAPP_PHONE_DISPLAY}. Mark an
                  order sold to automatically deduct stock from your album.
                </p>
              </div>

              {inquiries.length === 0 ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDD5C5] bg-[#FAF8F4] py-14 text-center">
                  <WhatsAppIcon className="h-8 w-8 text-[#1FA855] opacity-70" />
                  <h3 className="mt-3 font-display text-sm font-bold text-[#161B2E]">
                    No WhatsApp basket inquiries yet
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    When clients choose cards from ChazMaster Album and tap
                    &ldquo;Send Order via WhatsApp&rdquo;, their selected cards
                    appear here too.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3.5">
                  {inquiries.map((inq) => {
                    let parsedItems: BasketItem[] = [];
                    try {
                      parsedItems = JSON.parse(inq.itemsJson) as BasketItem[];
                    } catch {
                      parsedItems = [];
                    }
                    const isCompleted = inq.status === "completed";

                    return (
                      <div
                        key={inq.id}
                        className={`rounded-2xl border p-4 ${
                          isCompleted
                            ? "border-slate-200 bg-slate-50/70"
                            : "border-emerald-200 bg-emerald-50/30"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display text-sm font-bold text-[#161B2E]">
                                {inq.buyerName || `Collector Inquiry #${inq.id}`}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  isCompleted
                                    ? "bg-slate-200 text-slate-700"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                {inq.status}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {new Date(inq.createdAt).toLocaleString()} ·{" "}
                              {inq.totalCards} cards ·{" "}
                              <strong className="font-mono-num text-[#161B2E]">
                                {formatPrice(inq.totalAmount)}
                              </strong>
                            </p>
                            {inq.buyerNote && (
                              <p className="mt-1 text-xs text-slate-600">
                                Note: &ldquo;{inq.buyerNote}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => void handleCompleteInquiry(inq)}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#1FA855] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#188B45]"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark Sold & Deduct Stock
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleDeleteInquiry(inq.id)}
                              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-[#E3350D]"
                              aria-label="Delete inquiry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {parsedItems.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/5 pt-3">
                            {parsedItems.map((it, idx) => (
                              <span
                                key={`${it.cardId}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                              >
                                <strong className="font-mono-num text-[#E3350D]">
                                  {it.quantity}×
                                </strong>
                                <span className="font-semibold text-[#161B2E]">
                                  {it.name}
                                </span>
                                <span className="font-mono-num text-slate-400">
                                  ({formatCardNumber(it.cardNumber, it.setTotal)})
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Card Modal */}
      {editingCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1424]/65 p-4 backdrop-blur-xs"
          onClick={() => setEditingCard(null)}
        >
          <form
            onSubmit={handleSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-[#E6DFD2] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-extrabold text-[#161B2E]">
                  Edit {editingCard.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCard.setName} ·{" "}
                  {formatCardNumber(editingCard.cardNumber, editingCard.setTotal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Selling Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="font-mono-num mt-1 w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] px-3 py-2 text-sm font-bold text-[#161B2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={editQty}
                  onChange={(e) =>
                    setEditQty(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="font-mono-num mt-1 w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] px-3 py-2 text-sm font-bold text-[#161B2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Condition
                </label>
                <select
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#161B2E]"
                >
                  {CARD_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Variant / Foil
                </label>
                <select
                  value={editVariant}
                  onChange={(e) => setEditVariant(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-[#161B2E]"
                >
                  {CARD_VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                Collector Note
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. Pack fresh, sleeved immediately"
                className="mt-1 w-full rounded-xl border border-[#DFD8CA] bg-[#FAF8F4] px-3 py-2 text-xs text-[#161B2E]"
              />
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#161B2E]">
              <input
                type="checkbox"
                checked={editForSale}
                onChange={(e) => setEditForSale(e.target.checked)}
                className="h-4 w-4 accent-[#E3350D]"
              />
              Available for clients to buy in basket
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="cursor-pointer rounded-xl border border-[#E2DBD0] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="cursor-pointer rounded-xl bg-[#E3350D] px-5 py-2 text-xs font-bold text-white hover:bg-[#C62B07] disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Toast */}
      {statusToast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#161B2E] px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {statusToast}
        </div>
      )}
    </div>
  );
}
