"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Minus,
  Paintbrush,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import {
  CONDITION_SHORT,
  formatCardNumber,
  formatPrice,
  getTypeStyle,
  type AlbumCard,
  type CardAttack,
} from "@/lib/constants";
import { CardArtImage } from "./BrandLogo";

interface CardDetailModalProps {
  card: AlbumCard | null;
  basketQuantity: number;
  onClose: () => void;
  onAddToBasket: (card: AlbumCard) => void;
  onUpdateQuantity: (cardId: number, nextQty: number) => void;
  onOpenBasket: () => void;
}

export function CardDetailModal({
  card,
  basketQuantity,
  onClose,
  onAddToBasket,
  onUpdateQuantity,
  onOpenBasket,
}: CardDetailModalProps) {
  const [showCaptured, setShowCaptured] = useState(false);

  useEffect(() => {
    setShowCaptured(false);
  }, [card?.id]);

  useEffect(() => {
    if (!card) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [card, onClose]);

  if (!card) return null;

  const numDisplay = formatCardNumber(card.cardNumber, card.setTotal);
  const typeStyle = getTypeStyle(card.pokemonType);
  const condMeta = CONDITION_SHORT[card.condition] || {
    code: card.condition,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  let attacks: CardAttack[] = [];
  if (card.attacksJson) {
    try {
      const parsed = JSON.parse(card.attacksJson);
      if (Array.isArray(parsed)) attacks = parsed;
    } catch {
      attacks = [];
    }
  }

  const canBuy = card.forSale && card.quantity > 0;
  const activeImg =
    showCaptured && card.capturedPhotoUrl ? card.capturedPhotoUrl : card.imageUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1424]/70 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={card.name}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#E5DFD2] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close card details"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left: High-res Card Showcase */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-[#F7F4EC] via-[#EFECE2] to-[#E6E0D2] p-6 md:col-span-5 md:p-8">
            <div className="group w-full max-w-[260px]">
              <div className="holo-pocket aspect-[63/88] w-full shadow-[0_18px_38px_-10px_rgba(22,27,46,0.32)]">
                <CardArtImage
                  src={activeImg}
                  fallbackSrc={card.capturedPhotoUrl}
                  alt={card.name}
                  cardNumber={numDisplay}
                  setName={card.setName}
                  eager
                  className="h-full w-full rounded-[14px] object-contain"
                />
              </div>
            </div>

            {card.capturedPhotoUrl && card.capturedPhotoUrl !== card.imageUrl && (
              <div className="mt-4 inline-flex rounded-xl border border-[#DDD6C6] bg-white p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowCaptured(false)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    !showCaptured
                      ? "bg-[#161B2E] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Official TCG
                </button>
                <button
                  type="button"
                  onClick={() => setShowCaptured(true)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    showCaptured
                      ? "bg-[#E3350D] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Card Photo
                </button>
              </div>
            )}
          </div>

          {/* Right: Collector Specs & Basket CTA */}
          <div className="flex flex-col justify-between p-6 md:col-span-7 md:p-7">
            <div>
              {/* Top Type + HP + Card Number */}
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                >
                  <span className={`h-2 w-2 rounded-full ${typeStyle.dot}`} />
                  {card.pokemonType}
                </span>
                {card.hp && (
                  <span className="font-mono-num rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-[#E3350D]">
                    HP {card.hp}
                  </span>
                )}
                <span className="font-mono-num rounded-full bg-[#F4F1EA] px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {numDisplay}
                </span>
              </div>

              <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-[#161B2E] sm:text-3xl">
                {card.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {card.setName}
                {card.stage ? ` · ${card.stage}` : ""}
              </p>

              {/* Specs Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-[#EFEAE0] bg-[#FAF8F4] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Condition
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-[#161B2E]">
                      {card.condition}
                    </span>
                    <span
                      className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${condMeta.className}`}
                    >
                      {condMeta.code}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#EFEAE0] bg-[#FAF8F4] p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Rarity & Finish
                  </div>
                  <div className="mt-1 text-sm font-bold text-[#161B2E] line-clamp-1">
                    {card.rarity}
                  </div>
                  <div className="text-[11px] text-slate-500">{card.variant}</div>
                </div>
              </div>

              {card.illustrator && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Paintbrush className="h-3.5 w-3.5 text-slate-400" />
                  Illustrated by{" "}
                  <span className="font-semibold text-slate-700">
                    {card.illustrator}
                  </span>
                </div>
              )}

              {/* Attacks */}
              {attacks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    <Swords className="h-3.5 w-3.5" />
                    Card Attacks
                  </div>
                  {attacks.slice(0, 2).map((atk, idx) => (
                    <div
                      key={`${atk.name}-${idx}`}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#161B2E]">
                          {atk.name}
                        </span>
                        {atk.damage && (
                          <span className="font-mono-num text-xs font-extrabold text-[#E3350D]">
                            {atk.damage}
                          </span>
                        )}
                      </div>
                      {atk.effect && (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">
                          {atk.effect}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Collector Note */}
              {card.notes && (
                <div className="mt-4 rounded-xl border border-amber-200/70 bg-amber-50/50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                  <span className="font-bold text-[#161B2E]">Collector Note: </span>
                  {card.notes}
                </div>
              )}
            </div>

            {/* Bottom Pricing & Basket Bar */}
            <div className="mt-6 border-t border-[#EFEAE0] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    Album Price
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-num text-2xl font-extrabold text-[#161B2E]">
                      {formatPrice(card.price)}
                    </span>
                    {card.marketPrice && (
                      <span className="font-mono-num text-xs text-slate-400">
                        TCG Market: {formatPrice(card.marketPrice)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-emerald-700">
                    {canBuy
                      ? `${card.quantity} available in ChazMaster Album`
                      : card.quantity <= 0
                        ? "Currently sold out"
                        : "Personal Vault — Display Only"}
                  </div>
                </div>

                {canBuy && (
                  <div className="flex items-center gap-2">
                    {basketQuantity === 0 ? (
                      <button
                        type="button"
                        onClick={() => onAddToBasket(card)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#E3350D] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#C62B07] active:scale-[0.98]"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Add to Basket
                      </button>
                    ) : (
                      <>
                        <div className="inline-flex items-center rounded-xl border border-[#E3350D]/30 bg-[#FFF5F3] p-1">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(card.id, basketQuantity - 1)
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#E3350D] hover:bg-[#E3350D] hover:text-white"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="font-mono-num min-w-[2rem] text-center text-sm font-bold text-[#161B2E]">
                            {basketQuantity}
                          </span>
                          <button
                            type="button"
                            disabled={basketQuantity >= card.quantity}
                            onClick={() =>
                              onUpdateQuantity(card.id, basketQuantity + 1)
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#E3350D] hover:bg-[#E3350D] hover:text-white disabled:opacity-35"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenBasket();
                          }}
                          className="cursor-pointer rounded-xl bg-[#161B2E] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                        >
                          View Basket
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
