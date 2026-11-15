import React, { useLayoutEffect, useRef, useState } from 'react';
import { CartItem } from '../types';
import { X, Printer, Copy, CheckCircle } from 'lucide-react';
import { playRoyalStampSound, playCoinSound } from '../utils/audio';

interface ChequeModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  senderName: string;
  onSenderNameChange: (name: string) => void;
  onCompletePurchase: () => void;
}

export const ChequeModal: React.FC<ChequeModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  senderName,
  onSenderNameChange,
  onCompletePurchase,
}) => {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const resetTop = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    };
    resetTop();
    const rafId = window.requestAnimationFrame(resetTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen]);

  if (!isOpen) return null;

  // Group items by store to generate dedicated cheques per store
  const storeMap: Record<
    string,
    {
      storeId: string;
      storeName: string;
      category: string;
      items: CartItem[];
      totalCoins: number;
    }
  > = {};

  cartItems.forEach((c) => {
    if (!storeMap[c.store.id]) {
      storeMap[c.store.id] = {
        storeId: c.store.id,
        storeName: c.store.name,
        category: c.store.category,
        items: [],
        totalCoins: 0,
      };
    }
    storeMap[c.store.id].items.push(c);
    storeMap[c.store.id].totalCoins += c.item.priceCoins * c.quantity;
  });

  const cheques = Object.values(storeMap);
  const grandTotal = cheques.reduce((sum, ch) => sum + ch.totalCoins, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = cheques
      .map(
        (ch, idx) => `
ХУДАЛДАН АВАЛТЫН ЧЕК #${idx + 1}
Илгээгч: ${senderName || 'Эрхэм худалдан авагч'}
Хүлээн авагч: ${ch.storeName} (${ch.category})
Дүн: 🪙 ${ch.totalCoins.toLocaleString()} Зоос
Утга: Худалдан авалт

Либертиа хатан хааны төр засаглал`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const handleFinalize = () => {
    playCoinSound();
    playRoyalStampSound();
    setPurchaseSuccess(true);
    setTimeout(() => {
      onCompletePurchase();
      setPurchaseSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-hidden print:static print:p-0 print:bg-white print:overflow-visible">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm print:hidden"
      />

      <div className="relative w-full max-w-3xl bg-[#070e24] border-0 sm:border border-slate-800 rounded-none sm:rounded-xl shadow-2xl z-10 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden print:h-auto print:max-h-none print:overflow-visible print:border-none print:bg-white print:text-black">
        {/* Header Controls - Compact */}
        <div className="px-3 py-2.5 sm:px-5 sm:pt-4 sm:pb-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-cinzel text-base font-bold text-slate-100">
              Худалдан авалтын чек
            </h3>
            <span className="text-xs text-slate-400">({cheques.length})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded bg-[#0b142c] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>Хэвлэх</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1 rounded bg-[#0b142c] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              {copiedNotice ? (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedNotice ? 'Хуулагдлаа' : 'Хуулах'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body starting cleanly at the top */}
        <div
          ref={scrollContainerRef}
          className="px-3 py-3 sm:px-5 sm:py-4 overflow-y-auto flex-1 overscroll-contain modal-scroll-top print:overflow-visible print:p-0"
        >
        {/* Sender Name Inline Input - Compact and close */}
        <div className="mb-3 flex items-center justify-between gap-2 text-xs print:hidden">
          <label className="font-semibold text-slate-300 whitespace-nowrap">
            Илгээгч (Нэрээ бичнэ):
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => onSenderNameChange(e.target.value)}
            placeholder="Нэрээ энд бичнэ үү..."
            className="flex-1 max-w-xs px-2.5 py-1 bg-[#091228] border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* CHEQUE CARDS - 2000x1149 ASPECT RATIO & COMPACT TIGHT SPACING */}
        <div className="space-y-3">
          {cheques.map((ch, idx) => (
            <div
              key={ch.storeId}
              className="w-full aspect-[2000/1149] bg-[#050a18] border border-amber-500/50 rounded-lg p-3 sm:p-5 shadow flex flex-col justify-between print:border-black print:bg-white print:text-black"
            >
              {/* Cheque Header Line */}
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/30 text-xs">
                <span className="font-cinzel font-bold text-amber-300 print:text-black tracking-wider uppercase text-[11px] sm:text-xs">
                  Худалдан авалтын чек
                </span>
                <span className="font-mono text-slate-400 print:text-black text-[10px]">
                  № 00{idx + 1}-SAP
                </span>
              </div>

              {/* Main Fields & Amount - Tightly grouped so 1 item looks cohesive */}
              <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center my-auto">
                {/* Left 8 cols: Parties and Purpose */}
                <div className="col-span-8 space-y-1.5 text-xs">
                  {/* 1. Илгээгч */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-amber-400 font-bold uppercase text-[11px] min-w-[70px] print:text-black">
                      Илгээгч:
                    </span>
                    <span className="font-semibold text-slate-100 print:text-black border-b border-dashed border-slate-700 pb-0.5 flex-1 truncate">
                      {senderName.trim() || 'Эрхэм худалдан авагч'}
                    </span>
                  </div>

                  {/* 2. Хүлээн авагч */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-amber-400 font-bold uppercase text-[11px] min-w-[70px] print:text-black">
                      Хүлээн авагч:
                    </span>
                    <span className="font-semibold text-slate-100 print:text-black border-b border-dashed border-slate-700 pb-0.5 flex-1 truncate">
                      {ch.storeName} ({ch.category})
                    </span>
                  </div>

                  {/* 4. Утга: Худалдан авалт */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-amber-400 font-bold uppercase text-[11px] min-w-[70px] print:text-black">
                      Утга:
                    </span>
                    <span className="font-bold text-slate-100 print:text-black border-b border-dashed border-slate-700 pb-0.5 flex-1">
                      Худалдан авалт
                    </span>
                  </div>
                </div>

                {/* Right 4 cols: 3. Дүн (Хэд болж буйг бодож өгсөн байна) */}
                <div className="col-span-4 bg-[#081126] border border-amber-500/40 rounded p-2 text-center print:border-black print:bg-white">
                  <span className="text-[10px] uppercase font-bold text-amber-300 print:text-black block">
                    Дүн:
                  </span>
                  <span className="font-cinzel text-base sm:text-lg font-black text-amber-300 print:text-black block truncate">
                    🪙 {ch.totalCoins.toLocaleString()} Зоос
                  </span>
                </div>
              </div>

              {/* Items List - Tight and compact right next to the info */}
              <div className="text-[11px] text-slate-300 print:text-black bg-[#081126] px-2 py-1 rounded border border-slate-800 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="text-slate-400 text-[10px]">Бараа:</span>
                {ch.items.map((it) => (
                  <span key={it.item.id} className="font-medium">
                    {it.item.name} ({it.quantity}ш) - 🪙{' '}
                    {(it.item.priceCoins * it.quantity).toLocaleString()}
                  </span>
                ))}
              </div>

              {/* Cheque Footer: "Либертиа хатан хааны төр засаглал" */}
              <div className="pt-1.5 border-t border-amber-500/30 flex items-center justify-between text-[10px]">
                <span className="text-amber-300/80 font-cinzel print:text-black">
                  Либертиа хатан хааны төр засаглал
                </span>
                <span className="text-slate-400 print:text-black">
                  Баталгаажсан чек
                </span>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Footer: Нийт дүн ба Баталгаажуулах товч - Tightly connected */}
        <div className="px-3 py-2.5 sm:px-5 sm:py-3 border-t border-slate-800 bg-[#050a18] shrink-0 print:hidden flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-400">Нийт дүн:</span>
            <span className="font-cinzel text-base sm:text-lg font-bold text-amber-300">
              🪙 {grandTotal.toLocaleString()} Зоос
            </span>
          </div>

          {purchaseSuccess ? (
            <div className="px-3 py-1 rounded bg-emerald-950 border border-emerald-500 text-xs text-emerald-200">
              Худалдан авалт хийгдлээ.
            </div>
          ) : (
            <button
              onClick={handleFinalize}
              className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors"
            >
              Худалдан авалтыг баталгаажуулах
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
