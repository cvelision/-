import React, { useLayoutEffect, useRef, useState } from 'react';
import { Store, StoreItem } from '../types';
import { X, Plus, Edit2, CheckCircle, ShoppingBag, Lock } from 'lucide-react';
import { playCoinSound } from '../utils/audio';

interface StoreModalProps {
  store: Store | null;
  onClose: () => void;
  onAddToCart: (item: StoreItem, store: Store, quantity: number) => void;
  ownerMode: boolean;
  maxItemsPerStore: number;
  onAddNewItem: (store: Store) => void;
  onEditItem: (store: Store, item: StoreItem) => void;
  onRequestAdminLogin: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  store,
  onClose,
  onAddToCart,
  ownerMode,
  maxItemsPerStore,
  onAddNewItem,
  onEditItem,
  onRequestAdminLogin,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!store) return;
    const resetTop = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    };
    resetTop();
    const rafId = window.requestAnimationFrame(resetTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [store?.id]);

  if (!store) return null;

  const isStoreFull = store.items.length >= maxItemsPerStore;

  const getItemQty = (itemId: string): number => {
    return quantities[itemId] ?? 1;
  };

  const handleQtyChange = (itemId: string, val: number) => {
    const validQty = Math.max(1, isNaN(val) ? 1 : Math.floor(val));
    setQuantities((prev) => ({ ...prev, [itemId]: validQty }));
  };

  const handleAddToCart = (item: StoreItem) => {
    const qty = getItemQty(item.id);
    onAddToCart(item, store, qty);
    playCoinSound();

    setAddedItemNotice(item.id);
    setTimeout(() => {
      setAddedItemNotice(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Main Container: Fullscreen top-to-bottom on mobile, centered modal on larger screens */}
      <div className="relative w-full max-w-4xl bg-[#070e20] rounded-none sm:rounded-xl border-0 sm:border border-slate-800 shadow-2xl z-10 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden">
        {/* Compact Clean Header */}
        <div className="px-3 py-2.5 sm:p-4 bg-[#091228] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-cinzel text-base sm:text-xl font-bold text-slate-100 truncate">
              {store.name}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 shrink-0">
              {store.items.length} / {maxItemsPerStore} бараа
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ownerMode ? (
              <button
                onClick={() => onAddNewItem(store)}
                disabled={isStoreFull}
                title={
                  isStoreFull
                    ? `Энэ дэлгүүрийн ${maxItemsPerStore} барааны багтаамж дүүрсэн байна`
                    : 'Бараа нэмэх'
                }
                className="px-2.5 sm:px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isStoreFull ? 'Багтаамж дүүрсэн' : 'Бараа нэмэх'}</span>
              </button>
            ) : (
              <button
                onClick={onRequestAdminLogin}
                className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Админ нэвтрэх</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List — starts right at the top and scrolls straight down */}
        <div
          ref={scrollContainerRef}
          className="p-3 sm:p-6 overflow-y-auto flex-1 overscroll-contain modal-scroll-top"
        >
          {store.items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-3">
              <p>Одоогоор бараа ороогүй байна.</p>
              {ownerMode ? (
                <button
                  onClick={() => onAddNewItem(store)}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Бараа нэмэх</span>
                </button>
              ) : (
                <button
                  onClick={onRequestAdminLogin}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Админаар нэвтэрч бараа нэмэх</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.items.map((item) => {
                const qty = getItemQty(item.id);
                const totalPrice = item.priceCoins * qty;
                const isJustAdded = addedItemNotice === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-[#050a18] rounded-lg border border-slate-800 p-3 flex flex-col justify-between space-y-3"
                  >
                    {/* Full Uncropped Item Image */}
                    <div className="relative aspect-square w-full rounded overflow-hidden bg-[#020611] border border-slate-800/70">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                      {ownerMode && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => onEditItem(store, item)}
                            className="p-1.5 rounded bg-black/75 hover:bg-slate-800 text-white cursor-pointer"
                            title="Засах"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100 line-clamp-1">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Quantity & Live Calc */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Үлдэгдэл:</span>
                        <span className="text-slate-200 font-semibold">
                          {(item.stock ?? 30).toLocaleString()} ш
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Нэгжийн үнэ:</span>
                        <span className="text-amber-300 font-bold">
                          🪙 {item.priceCoins.toLocaleString()} Зоос
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-[#081126] p-1.5 rounded border border-slate-800">
                        <span className="text-xs text-slate-300 font-medium">
                          Тоо ширхэг:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, qty - 1)}
                            className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={qty}
                            onChange={(e) =>
                              handleQtyChange(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-12 h-6 text-center bg-slate-950 border border-slate-700 rounded text-xs font-bold text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, qty + 1)}
                            className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Дүн ({qty}ш):</span>
                        <span className="text-amber-300 font-bold">
                          🪙 {totalPrice.toLocaleString()} Зоос
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-700 text-white'
                            : 'bg-blue-700 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Нэмэгдлээ</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Худалдан авах</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-3 py-2.5 sm:p-3 bg-[#050a18] border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};
