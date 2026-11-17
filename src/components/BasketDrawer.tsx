"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  formatCardNumber,
  formatPrice,
  WHATSAPP_PHONE_DISPLAY,
  type BasketItem,
} from "@/lib/constants";
import { CardArtImage, PokeballMark, WhatsAppIcon } from "./BrandLogo";

interface BasketDrawerProps {
  open: boolean;
  items: BasketItem[];
  onClose: () => void;
  onUpdateQuantity: (cardId: number, nextQty: number) => void;
  onRemoveItem: (cardId: number) => void;
  onClearBasket: () => void;
}

export function BasketDrawer({
  open,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearBasket,
}: BasketDrawerProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const totalCards = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const whatsappMessage = useMemo(
    () => buildWhatsAppMessage(items, buyerName, buyerNote),
    [items, buyerName, buyerNote]
  );

  const whatsappHref = useMemo(
    () => buildWhatsAppUrl(whatsappMessage),
    [whatsappMessage]
  );

  if (!open) return null;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback ignored
    }
  };

  const handleWhatsAppClick = () => {
    // Log basket inquiry asynchronously to ChazMaster database without blocking WhatsApp launch
    void fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        buyerName: buyerName.trim() || undefined,
        buyerNote: buyerNote.trim() || undefined,
      }),
    }).catch(() => undefined);

    setSentSuccess(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0F1424]/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Your Card Basket"
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#EFEAE0] bg-[#FAF8F4] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E3350D] text-white shadow-xs">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold text-[#161B2E]">
                Your Card Basket
              </h2>
              <p className="text-xs text-slate-500">
                {totalCards} {totalCards === 1 ? "card" : "cards"} selected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClearBasket();
                  setSentSuccess(false);
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-rose-50 hover:text-[#E3350D]"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
              aria-label="Close basket"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <PokeballMark className="h-14 w-14 opacity-40 grayscale" />
            <h3 className="mt-4 font-display text-lg font-bold text-[#161B2E]">
              Your basket is empty
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-slate-500">
              Browse ChazMaster Album, tap <span className="font-semibold">Add</span> on
              any Pokémon card you want, then send your list straight via WhatsApp.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 cursor-pointer rounded-xl bg-[#161B2E] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E3350D]"
            >
              Explore Album
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {sentSuccess && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      WhatsApp chat opened & order logged!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearBasket();
                        setSentSuccess(false);
                      }}
                      className="cursor-pointer font-bold text-emerald-700 underline hover:text-emerald-900"
                    >
                      Clear basket
                    </button>
                  </div>
                  <p className="mt-1 text-emerald-800/90">
                    Send the pre-filled message to ChazMaster ({WHATSAPP_PHONE_DISPLAY}) to
                    confirm payment & delivery.
                  </p>
                </div>
              )}

              {/* Selected Cards List */}
              <ul className="space-y-3">
                {items.map((item) => {
                  const numLabel = formatCardNumber(
                    item.cardNumber,
                    item.setTotal
                  );
                  return (
                    <li
                      key={item.cardId}
                      className="flex gap-3 rounded-2xl border border-[#ECE6DA] bg-[#FAF8F4]/70 p-3"
                    >
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-white shadow-xs">
                        <CardArtImage
                          src={item.imageUrl}
                          alt={item.name}
                          cardNumber={numLabel}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="truncate font-display text-sm font-bold text-[#161B2E]">
                              {item.name}
                            </h4>
                            <p className="truncate text-[11px] text-slate-500">
                              <span className="font-mono-num font-semibold text-slate-700">
                                {numLabel}
                              </span>{" "}
                              · {item.setName} · {item.condition}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cardId)}
                            className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-[#E3350D]"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-lg border border-[#E2DBD0] bg-white p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateQuantity(item.cardId, item.quantity - 1)
                              }
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono-num min-w-[1.5rem] text-center text-xs font-bold text-[#161B2E]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= item.maxQuantity}
                              onClick={() =>
                                onUpdateQuantity(item.cardId, item.quantity + 1)
                              }
                              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="font-mono-num text-sm font-bold text-[#161B2E]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Optional Buyer Details for WhatsApp Message */}
              <div className="mt-5 space-y-2.5 border-t border-[#EFEAE0] pt-4">
                <p className="text-xs font-bold text-[#161B2E]">
                  Your Details{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </p>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Your name (included in WhatsApp message)"
                  className="w-full rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] px-3.5 py-2 text-xs text-[#161B2E] placeholder:text-slate-400 focus:border-[#161B2E] focus:bg-white focus:outline-none"
                />
                <input
                  type="text"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="Note (e.g. shipping, local pickup, close-up request)"
                  className="w-full rounded-xl border border-[#E4DDD0] bg-[#FAF8F4] px-3.5 py-2 text-xs text-[#161B2E] placeholder:text-slate-400 focus:border-[#161B2E] focus:bg-white focus:outline-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPreview((p) => !p)}
                    className="cursor-pointer text-[11px] font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-[#161B2E]"
                  >
                    {showPreview
                      ? "Hide WhatsApp message preview"
                      : "Preview WhatsApp message"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy list
                      </>
                    )}
                  </button>
                </div>

                {showPreview && (
                  <pre className="max-h-40 overflow-y-auto rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 font-sans text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700">
                    {whatsappMessage}
                  </pre>
                )}
              </div>
            </div>

            {/* Sticky WhatsApp Checkout Footer */}
            <div className="border-t border-[#EFEAE0] bg-[#FAF8F4] px-5 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  Order Total ({totalCards} {totalCards === 1 ? "card" : "cards"})
                </span>
                <span className="font-mono-num text-xl font-extrabold text-[#161B2E]">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1FA855] px-5 py-3.5 text-sm font-bold text-white shadow-[0_6px_20px_-4px_rgba(31,168,85,0.5)] transition-all hover:bg-[#199148] active:scale-[0.99]"
              >
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                <span>Send Order via WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <p className="mt-2 text-center text-[11px] text-slate-500">
                Sends your selected cards directly to{" "}
                <span className="font-mono-num font-semibold text-slate-700">
                  {WHATSAPP_PHONE_DISPLAY}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
