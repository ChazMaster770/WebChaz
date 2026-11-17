"use client";

import { Camera, Check, Minus, Plus, ShoppingBag, Sparkles } from "lucide-react";
import {
  CONDITION_SHORT,
  formatCardNumber,
  formatPrice,
  getTypeStyle,
  type AlbumCard,
} from "@/lib/constants";
import { CardArtImage } from "./BrandLogo";

interface PokemonCardTileProps {
  card: AlbumCard;
  basketQuantity: number;
  onAddToBasket: (card: AlbumCard) => void;
  onUpdateQuantity: (cardId: number, nextQty: number) => void;
  onInspect: (card: AlbumCard) => void;
  eager?: boolean;
}

export function PokemonCardTile({
  card,
  basketQuantity,
  onAddToBasket,
  onUpdateQuantity,
  onInspect,
  eager = false,
}: PokemonCardTileProps) {
  const numDisplay = formatCardNumber(card.cardNumber, card.setTotal);
  const typeStyle = getTypeStyle(card.pokemonType);
  const condMeta = CONDITION_SHORT[card.condition] || {
    code: card.condition.slice(0, 3).toUpperCase(),
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const canBuy = card.forSale && card.quantity > 0;
  const atMax = basketQuantity >= card.quantity;
  const priceNum = parseFloat(card.price);
  const marketNum = card.marketPrice ? parseFloat(card.marketPrice) : null;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-[#E8E2D6] bg-white p-3 shadow-[0_1px_3px_rgba(22,27,46,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D5CCBC] hover:shadow-[0_14px_30px_-10px_rgba(22,27,46,0.14)]">
      {/* Card Binder Pocket */}
      <button
        type="button"
        onClick={() => onInspect(card)}
        className="relative block w-full cursor-pointer rounded-xl bg-gradient-to-b from-[#F5F2EB] to-[#ECE7DC] p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E3350D]"
        aria-label={`Inspect ${card.name} ${numDisplay}`}
      >
        <div className="holo-pocket mx-auto aspect-[63/88] w-full shadow-[0_6px_16px_rgba(15,23,42,0.16)] transition-transform duration-300 group-hover:scale-[1.025]">
          <CardArtImage
            src={card.imageUrl}
            fallbackSrc={card.capturedPhotoUrl}
            alt={card.name}
            cardNumber={numDisplay}
            setName={card.setName}
            eager={eager}
            className="h-full w-full rounded-[12px] object-contain"
          />
        </div>

        {/* Captured Real Photo Indicator */}
        {card.capturedPhotoUrl && (
          <span
            title="Includes real camera photo"
            className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#161B2E]/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
          >
            <Camera className="h-3 w-3 text-amber-300" />
            Scanned
          </span>
        )}

        {/* Stock / Vault Status Pill (only when sold out or vault display) */}
        {!canBuy && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-[#161B2E]/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-300 uppercase backdrop-blur-sm">
            {card.quantity <= 0 ? "Sold Out" : "Vault Only"}
          </span>
        )}

        {basketQuantity > 0 && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-[#E3350D] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
            <Check className="h-3 w-3" />
            {basketQuantity} in basket
          </span>
        )}
      </button>

      {/* Card Metadata */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onInspect(card)}
              className="cursor-pointer text-left font-display text-[16px] font-bold leading-snug text-[#161B2E] transition-colors hover:text-[#E3350D] line-clamp-1"
            >
              {card.name}
            </button>
            <span className="font-mono-num shrink-0 rounded-md bg-[#F4F1EA] px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
              {numDisplay}
            </span>
          </div>

          <p className="mt-0.5 text-xs font-medium text-slate-500 line-clamp-1">
            {card.setName}
          </p>

          {/* Compact Secondary Metadata Row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${condMeta.className}`}
            >
              {condMeta.code}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />
              {card.pokemonType}
            </span>
            {card.rarity &&
              (card.rarity.toLowerCase().includes("illustration") ||
                card.rarity.toLowerCase().includes("secret") ||
                card.rarity.toLowerCase().includes("hyper")) && (
                <span
                  title={card.rarity}
                  className="inline-flex items-center gap-0.5 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
                >
                  <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                  SIR/Alt
                </span>
              )}
          </div>
        </div>

        {/* Price + Action Row */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-[#F1ECE2] pt-3">
          <div className="min-w-0">
            <div className="font-mono-num text-base font-bold text-[#161B2E]">
              {formatPrice(priceNum)}
            </div>
            {marketNum !== null && marketNum > priceNum ? (
              <div className="font-mono-num text-[11px] text-slate-400 line-through">
                {formatPrice(marketNum)}
              </div>
            ) : (
              <div className="text-[11px] font-medium text-slate-400">
                {canBuy ? `${card.quantity} in stock` : "Display piece"}
              </div>
            )}
          </div>

          {canBuy ? (
            basketQuantity === 0 ? (
              <button
                type="button"
                onClick={() => onAddToBasket(card)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-[#161B2E] px-3 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#E3350D] active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add
              </button>
            ) : (
              <div className="inline-flex shrink-0 items-center rounded-xl border border-[#E3350D]/30 bg-[#FFF5F3] p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(card.id, basketQuantity - 1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#E3350D] transition-colors hover:bg-[#E3350D] hover:text-white"
                  aria-label={`Remove one ${card.name}`}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono-num min-w-[1.6rem] text-center text-xs font-bold text-[#161B2E]">
                  {basketQuantity}
                </span>
                <button
                  type="button"
                  disabled={atMax}
                  onClick={() => onUpdateQuantity(card.id, basketQuantity + 1)}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#E3350D] transition-colors hover:bg-[#E3350D] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#E3350D]"
                  aria-label={`Add another ${card.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => onInspect(card)}
              className="shrink-0 cursor-pointer rounded-xl border border-[#E6DFD3] bg-[#FAF8F4] px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
