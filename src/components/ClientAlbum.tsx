"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Lock,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import {
  formatPrice,
  getTypeStyle,
  SITE_NAME,
  WHATSAPP_PHONE_DISPLAY,
  WHATSAPP_PHONE_RAW,
  type AlbumCard,
  type BasketItem,
} from "@/lib/constants";
import { BrandLogo, PokeballMark, WhatsAppIcon } from "./BrandLogo";
import { PokemonCardTile } from "./PokemonCardTile";
import { CardDetailModal } from "./CardDetailModal";
import { BasketDrawer } from "./BasketDrawer";

const BASKET_STORAGE_KEY = "chazmaster_album_basket_v1";

type SortOption = "newest" | "price-desc" | "price-asc" | "name-asc" | "number-asc";

export function ClientAlbum({ initialCards }: { initialCards: AlbumCard[] }) {
  const [cards, setCards] = useState<AlbumCard[]>(initialCards);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [onlyForSale, setOnlyForSale] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [inspectedCard, setInspectedCard] = useState<AlbumCard | null>(null);
  const [basketOpen, setBasketOpen] = useState(false);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync fresh cards on focus and hydrate basket from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BASKET_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BasketItem[];
        if (Array.isArray(parsed)) {
          // Reconcile against live collection stock & prices
          const cardMap = new Map(initialCards.map((c) => [c.id, c]));
          const valid: BasketItem[] = [];
          for (const item of parsed) {
            const live = cardMap.get(item.cardId);
            if (live && live.forSale && live.quantity > 0) {
              valid.push({
                cardId: live.id,
                name: live.name,
                cardNumber: live.cardNumber,
                setTotal: live.setTotal,
                setName: live.setName,
                condition: live.condition,
                variant: live.variant,
                price: parseFloat(live.price),
                quantity: Math.min(Math.max(1, item.quantity), live.quantity),
                maxQuantity: live.quantity,
                imageUrl: live.imageUrl,
              });
            }
          }
          setBasket(valid);
        }
      }
    } catch {
      // Ignore storage errors
    }
    setHydrated(true);
  }, [initialCards]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket));
    } catch {
      // Ignore storage quota errors
    }
  }, [basket, hydrated]);

  // Refresh collection when returning to tab
  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch("/api/cards", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { cards?: AlbumCard[] };
        if (Array.isArray(data.cards)) {
          setCards(data.cards);
        }
      } catch {
        // Ignore transient network errors
      }
    };
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const handleAddToBasket = useCallback(
    (card: AlbumCard) => {
      if (!card.forSale || card.quantity <= 0) return;
      setBasket((prev) => {
        const existing = prev.find((i) => i.cardId === card.id);
        if (existing) {
          if (existing.quantity >= card.quantity) return prev;
          return prev.map((i) =>
            i.cardId === card.id
              ? {
                  ...i,
                  quantity: Math.min(card.quantity, i.quantity + 1),
                  maxQuantity: card.quantity,
                  price: parseFloat(card.price),
                }
              : i
          );
        }
        return [
          ...prev,
          {
            cardId: card.id,
            name: card.name,
            cardNumber: card.cardNumber,
            setTotal: card.setTotal,
            setName: card.setName,
            condition: card.condition,
            variant: card.variant,
            price: parseFloat(card.price),
            quantity: 1,
            maxQuantity: card.quantity,
            imageUrl: card.imageUrl,
          },
        ];
      });
      showToast(`Added ${card.name} to basket`);
    },
    [showToast]
  );

  const handleUpdateQuantity = useCallback((cardId: number, nextQty: number) => {
    if (nextQty <= 0) {
      setBasket((prev) => prev.filter((i) => i.cardId !== cardId));
      return;
    }
    setBasket((prev) =>
      prev.map((i) =>
        i.cardId === cardId
          ? { ...i, quantity: Math.min(i.maxQuantity, nextQty) }
          : i
      )
    );
  }, []);

  const handleRemoveItem = useCallback((cardId: number) => {
    setBasket((prev) => prev.filter((i) => i.cardId !== cardId));
  }, []);

  const handleClearBasket = useCallback(() => {
    setBasket([]);
  }, []);

  const basketQtyMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const item of basket) m.set(item.cardId, item.quantity);
    return m;
  }, [basket]);

  const totalBasketCards = useMemo(
    () => basket.reduce((sum, i) => sum + i.quantity, 0),
    [basket]
  );

  const totalBasketPrice = useMemo(
    () => basket.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [basket]
  );

  // Dynamically list types present in the album
  const availableTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of cards) {
      const t = c.pokemonType || "Colorless";
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }));
  }, [cards]);

  const totalAlbumCopies = useMemo(
    () => cards.reduce((sum, c) => sum + Math.max(0, c.quantity), 0),
    [cards]
  );

  const availableForSaleCount = useMemo(
    () => cards.filter((c) => c.forSale && c.quantity > 0).length,
    [cards]
  );

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = cards.filter((card) => {
      if (onlyForSale && (!card.forSale || card.quantity <= 0)) return false;
      if (selectedType !== "All" && card.pokemonType !== selectedType) {
        return false;
      }
      if (!q) return true;
      const numCombined = card.setTotal
        ? `${card.cardNumber}/${card.setTotal}`.toLowerCase()
        : card.cardNumber.toLowerCase();
      return (
        card.name.toLowerCase().includes(q) ||
        card.setName.toLowerCase().includes(q) ||
        card.cardNumber.toLowerCase().includes(q) ||
        numCombined.includes(q) ||
        card.rarity.toLowerCase().includes(q) ||
        card.pokemonType.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-desc":
          return parseFloat(b.price) - parseFloat(a.price);
        case "price-asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "number-asc":
          return (
            (parseInt(a.cardNumber.replace(/\D/g, ""), 10) || 0) -
            (parseInt(b.cardNumber.replace(/\D/g, ""), 10) || 0)
          );
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    return result;
  }, [cards, search, selectedType, onlyForSale, sortBy]);

  return (
    <div className="binder-surface flex min-h-screen flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8E2D6] bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="focus:outline-none">
            <BrandLogo subtitle="Pokémon TCG Collection" />
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5DFD2] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-[#161B2E]"
            >
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <span>Admin</span>
            </Link>

            <button
              type="button"
              onClick={() => setBasketOpen(true)}
              className="relative inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E3350D] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#C62B07] active:scale-95 sm:px-4"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Basket</span>
              {totalBasketCards > 0 && (
                <span className="font-mono-num inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-300 px-1.5 text-[11px] font-extrabold text-[#161B2E]">
                  {totalBasketCards}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-20 sm:px-6 lg:px-8">
        {/* Compact Collector Showcase Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-[#1E2540] bg-[#111629] shadow-lg">
          <img
            src="/images/hero-binder.jpg"
            alt="ChazMaster Album Pokémon TCG binder and Pokéball"
            className="absolute inset-0 h-full w-full object-cover object-right opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E1324] via-[#0E1324]/88 to-[#0E1324]/20" />

          <div className="relative z-10 flex flex-col justify-between gap-5 px-6 py-7 sm:px-9 sm:py-9 lg:max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/12 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Personal Pokémon TCG Binder
              </div>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {SITE_NAME}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-200/90">
                Explore authentic holos, illustration rares, and vintage classics
                straight from my collection. Add the cards you want to your basket
                and send your order directly on WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-200">
              <span className="font-mono-num">
                <strong className="text-amber-300">{cards.length}</strong> Unique
                Prints ({totalAlbumCopies} cards)
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-mono-num">
                <strong className="text-emerald-400">{availableForSaleCount}</strong>{" "}
                Available to Buy
              </span>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <WhatsAppIcon className="h-3.5 w-3.5" />
                Direct WhatsApp Checkout
              </span>
            </div>
          </div>
        </section>

        {/* Search, Sort & Type Filter Controls */}
        <section className="mt-6 space-y-3" aria-label="Filter collection">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Pokémon name, card # (199/165), or set..."
                className="w-full rounded-xl border border-[#E4DDD0] bg-white py-2.5 pr-9 pl-10 text-sm text-[#161B2E] shadow-2xs placeholder:text-slate-400 focus:border-[#E3350D] focus:ring-2 focus:ring-[#E3350D]/15 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Right Controls: For Sale filter + Sort */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setOnlyForSale((v) => !v)}
                className={`cursor-pointer rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                  onlyForSale
                    ? "border-[#161B2E] bg-[#161B2E] text-white"
                    : "border-[#E4DDD0] bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                In Stock Only
              </button>

              <div className="relative flex items-center">
                <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort cards"
                  className="cursor-pointer appearance-none rounded-xl border border-[#E4DDD0] bg-white py-2.5 pr-8 pl-8 text-xs font-semibold text-[#161B2E] shadow-2xs focus:border-[#E3350D] focus:outline-none"
                >
                  <option value="newest">Newest Added</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="number-asc">Card Number</option>
                </select>
              </div>
            </div>
          </div>

          {/* Elemental Energy Type Pills */}
          {availableTypes.length > 0 && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedType("All")}
                className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  selectedType === "All"
                    ? "border-[#E3350D] bg-[#E3350D] text-white shadow-2xs"
                    : "border-[#E4DDD0] bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Types ({cards.length})
              </button>
              {availableTypes.map(({ type, count }) => {
                const style = getTypeStyle(type);
                const active = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(active ? "All" : type)}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? style.activeBg
                        : "border-[#E4DDD0] bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        active ? "bg-current opacity-85" : style.dot
                      }`}
                    />
                    {type}
                    <span className="font-mono-num opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Binder Card Grid */}
        <section className="mt-6" aria-label="Pokémon card album">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#DDD5C5] bg-white/80 px-6 py-16 text-center">
              <PokeballMark className="h-12 w-12 opacity-45" />
              <h2 className="mt-4 font-display text-lg font-bold text-[#161B2E]">
                {cards.length === 0
                  ? "The album is currently empty"
                  : "No matching Pokémon cards found"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {cards.length === 0
                  ? "Check back soon or log in to Admin to scan new cards into ChazMaster Album."
                  : "Try clearing your search or choosing a different Pokémon type."}
              </p>
              {(search || selectedType !== "All" || onlyForSale) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedType("All");
                    setOnlyForSale(false);
                  }}
                  className="mt-5 cursor-pointer rounded-xl bg-[#161B2E] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#E3350D]"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {filteredCards.map((card, index) => (
                <PokemonCardTile
                  key={card.id}
                  card={card}
                  basketQuantity={basketQtyMap.get(card.id) || 0}
                  onAddToBasket={handleAddToBasket}
                  onUpdateQuantity={handleUpdateQuantity}
                  onInspect={setInspectedCard}
                  eager={index < 4}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Quick-Checkout Bar when items are in basket */}
      {totalBasketCards > 0 && !basketOpen && (
        <div className="fixed right-4 bottom-5 left-4 z-30 mx-auto max-w-md sm:right-6 sm:left-auto sm:mx-0">
          <button
            type="button"
            onClick={() => setBasketOpen(true)}
            className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161B2E] px-4 py-3 text-white shadow-[0_14px_34px_-6px_rgba(15,23,42,0.5)] transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-mono-num flex h-7 min-w-[1.75rem] items-center justify-center rounded-xl bg-[#E3350D] px-2 text-xs font-extrabold text-white">
                {totalBasketCards}
              </span>
              <div className="text-left">
                <div className="text-xs font-bold">Checkout on WhatsApp</div>
                <div className="font-mono-num text-[11px] text-amber-300">
                  {formatPrice(totalBasketPrice)} total
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#1FA855] px-3 py-1.5 text-xs font-bold text-white">
              <WhatsAppIcon className="h-3.5 w-3.5" />
              Open Basket
            </span>
          </button>
        </div>
      )}

      {/* Subtle Add Toast */}
      {toast && totalBasketCards === 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#161B2E] px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Collector Footer */}
      <footer className="border-t border-[#E8E2D6] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <PokeballMark className="h-5 w-5" />
            <span>
              <strong className="font-semibold text-[#161B2E]">{SITE_NAME}</strong>{" "}
              — Authentic Pokémon TCG Collection
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <a
              href={`https://wa.me/${WHATSAPP_PHONE_RAW}?text=${encodeURIComponent(
                `Hi ChazMaster! I have a question about your ${SITE_NAME} Pokémon cards.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#1FA855] transition-colors hover:text-[#168141]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>WhatsApp {WHATSAPP_PHONE_DISPLAY}</span>
            </a>
            <Link
              href="/admin"
              className="font-medium text-slate-500 transition-colors hover:text-[#161B2E]"
            >
              Admin Vault
            </Link>
          </div>
        </div>
      </footer>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={inspectedCard}
        basketQuantity={
          inspectedCard ? basketQtyMap.get(inspectedCard.id) || 0 : 0
        }
        onClose={() => setInspectedCard(null)}
        onAddToBasket={handleAddToBasket}
        onUpdateQuantity={handleUpdateQuantity}
        onOpenBasket={() => setBasketOpen(true)}
      />

      {/* Slide-over Basket Drawer */}
      <BasketDrawer
        open={basketOpen}
        items={basket}
        onClose={() => setBasketOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearBasket={handleClearBasket}
      />
    </div>
  );
}
