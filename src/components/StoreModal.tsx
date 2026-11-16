import React, { useLayoutEffect, useRef, useState } from 'react';
import { Store, StoreItem } from '../types';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  ShoppingBag,
  Lock,
  Search,
  Maximize2,
  Crown,
  Loader2,
} from 'lucide-react';
import { playCoinSound } from '../utils/audio';

interface StoreModalProps {
  store: Store | null;
  onClose: () => void;
  onAddToCart: (item: StoreItem, store: Store, quantity: number) => void;
  ownerMode: boolean;
  lordMode: boolean;
  maxItemsPerStore: number;
  onAddNewItem: (store: Store) => void;
  onEditItem: (store: Store, item: StoreItem) => void;
  onDeleteItem: (store: Store, item: StoreItem) => Promise<void>;
  onRequestAdminLogin: () => void;
  onRequestLordLogin: () => void;
  onExitLordMode: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  store,
  onClose,
  onAddToCart,
  ownerMode,
  lordMode,
  maxItemsPerStore,
  onAddNewItem,
  onEditItem,
  onDeleteItem,
  onRequestAdminLogin,
  onRequestLordLogin,
  onExitLordMode,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState<string>('');
  const [zoomedItem, setZoomedItem] = useState<StoreItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<StoreItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!store) return;
    setStoreSearch('');
    setZoomedItem(null);
    setConfirmDeleteItem(null);
    setDeleteError(null);
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
  const trimmedSearch = storeSearch.trim().toLowerCase();
  const visibleItems = trimmedSearch
    ? store.items.filter(
        (it) =>
          it.name.toLowerCase().includes(trimmedSearch) ||
          it.description.toLowerCase().includes(trimmedSearch)
      )
    : store.items;

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

  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteItem(store, confirmDeleteItem);
      setConfirmDeleteItem(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Бараа устгах үед алдаа гарлаа.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-[#090d17] rounded-none sm:rounded-xl border-0 sm:border border-slate-800 shadow-2xl z-10 flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden">
        {/* Compact Clean Header */}
        <div className="px-3 py-2.5 sm:p-4 bg-[#0d1220] border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-cinzel text-base sm:text-xl font-bold text-slate-100 truncate">
              {store.name}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#070a12] border border-slate-800 text-slate-400 shrink-0">
              {store.items.length} / {maxItemsPerStore} бараа
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {ownerMode ? (
              <>
                <button
                  onClick={lordMode ? onExitLordMode : onRequestLordLogin}
                  className={`px-2 sm:px-2.5 py-1.5 rounded text-xs flex items-center gap-1 cursor-pointer border transition-colors ${
                    lordMode
                      ? 'bg-[#2a241b] hover:bg-[#362e23] text-[#d4c7a5] border-[#6e6246]/70'
                      : 'bg-[#111726] hover:bg-[#192136] text-slate-300 border-slate-700'
                  }`}
                  title={lordMode ? 'Lord горимоос гарах' : 'Lord тохиргооруу нэвтрэх (0625)'}
                >
                  <Crown className="w-3.5 h-3.5 text-[#c8ba96]" />
                  <span className="hidden sm:inline">
                    {lordMode ? 'Lord (Гарах)' : 'Lord тохиргоо'}
                  </span>
                </button>
                <button
                  onClick={() => onAddNewItem(store)}
                  disabled={isStoreFull}
                  title={
                    isStoreFull
                      ? `Энэ дэлгүүрийн ${maxItemsPerStore} барааны багтаамж дүүрсэн байна`
                      : 'Бараа нэмэх'
                  }
                  className="px-2.5 sm:px-3 py-1.5 rounded bg-[#141b2b] hover:bg-[#1c263b] disabled:opacity-40 disabled:cursor-not-allowed text-[#c8ba96] border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isStoreFull ? 'Дүүрсэн' : 'Бараа нэмэх'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onRequestAdminLogin}
                className="px-2.5 py-1.5 rounded bg-[#111726] hover:bg-[#192136] text-slate-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
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

        {/* Lord Mode Indicator Banner */}
        {ownerMode && lordMode && (
          <div className="px-3 py-1.5 sm:px-6 bg-[#1b1812] border-b border-[#594f3a]/50 flex items-center justify-between text-[11px] text-[#d4c7a5] shrink-0">
            <span className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-[#c8ba96]" />
              Lord тохиргоо идэвхтэй — Бараа бүрийн баруун дээд булангаас хасах боломжтой
            </span>
          </div>
        )}

        {/* In-store Search Bar when store has many items */}
        {store.items.length > 6 && (
          <div className="px-3 py-2 sm:px-6 bg-[#0a0f1b] border-b border-slate-800/80 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => {
                  setStoreSearch(e.target.value);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                  }
                }}
                placeholder={`${store.name} дотроос хайх...`}
                className="w-full pl-8 pr-8 py-1.5 bg-[#060911] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
              {storeSearch && (
                <button
                  type="button"
                  onClick={() => setStoreSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Хайлт цэвэрлэх"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

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
                  className="px-4 py-2 rounded bg-[#27344a] hover:bg-[#32425c] border border-slate-600/70 text-slate-100 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Бараа нэмэх</span>
                </button>
              ) : (
                <button
                  onClick={onRequestAdminLogin}
                  className="px-4 py-2 rounded bg-[#141b2b] hover:bg-[#1c263b] text-[#c8ba96] border border-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Админаар нэвтэрч бараа нэмэх</span>
                </button>
              )}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs space-y-2">
              <p>"{storeSearch}" хайлтад тохирох бараа олдсонгүй.</p>
              <button
                type="button"
                onClick={() => setStoreSearch('')}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                Бүх барааг харах
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleItems.map((item) => {
                const qty = getItemQty(item.id);
                const totalPrice = item.priceCoins * qty;
                const isJustAdded = addedItemNotice === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-[#060912] rounded-lg border border-slate-800 p-3 flex flex-col justify-between space-y-3"
                  >
                    {/* Full Uncropped Item Image + Click to zoom */}
                    <div className="relative aspect-square w-full rounded overflow-hidden bg-[#04060c] border border-slate-800/80 group">
                      <button
                        type="button"
                        onClick={() => setZoomedItem(item)}
                        className="w-full h-full flex items-center justify-center cursor-zoom-in"
                        title="Зургийг томруулж бүтэн харах"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomedItem(item)}
                        className="absolute bottom-2 right-2 p-1.5 rounded bg-black/70 hover:bg-black/90 text-slate-200 opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Томруулж харах"
                        aria-label="Томруулж харах"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      {ownerMode && (
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditItem(store, item);
                            }}
                            className="p-1.5 rounded bg-black/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70 cursor-pointer"
                            title="Засах"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {lordMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteError(null);
                                setConfirmDeleteItem(item);
                              }}
                              className="p-1.5 rounded bg-[#3c2329]/95 hover:bg-[#522e36] text-[#dfb3ba] border border-[#6e3e49]/70 cursor-pointer"
                              title="Бараа хасах (Lord)"
                              aria-label={`${item.name} устгах`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Details - Full unclipped title */}
                    <div>
                      <h4 className="font-semibold text-sm text-slate-100 leading-snug break-words">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 break-words">
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
                        <span className="text-[#c8ba96] font-bold">
                          🪙 {item.priceCoins.toLocaleString()} Зоос
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-[#0c111e] p-1.5 rounded border border-slate-800">
                        <span className="text-xs text-slate-300 font-medium">
                          Тоо ширхэг:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, qty - 1)}
                            className="w-7 h-7 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
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
                            className="w-12 h-7 text-center bg-[#060911] border border-slate-700 rounded text-xs font-bold text-slate-100 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, qty + 1)}
                            className="w-7 h-7 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0c111e] border border-slate-800">
                        <span className="text-slate-400">Дүн ({qty}ш):</span>
                        <span className="text-[#c8ba96] font-bold">
                          🪙 {totalPrice.toLocaleString()} Зоос
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className={`w-full py-2.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                          isJustAdded
                            ? 'bg-[#243832] border-[#3d5c53] text-[#a7c4b8]'
                            : 'bg-[#27344a] hover:bg-[#32425c] border-slate-600/70 text-slate-100'
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
        <div className="px-3 py-2.5 sm:p-3 bg-[#070a13] border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 cursor-pointer"
          >
            Хаах
          </button>
        </div>
      </div>

      {/* Lord Delete Confirmation Dialog */}
      {confirmDeleteItem && (
        <div
          className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !isDeleting && setConfirmDeleteItem(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0b101b] border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#3c2329] border border-[#6e3e49]/70 flex items-center justify-center text-[#dfb3ba] shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-cinzel text-sm font-bold text-slate-100">
                  Барааг бүрмөсөн хасах
                </h4>
                <p className="text-[11px] text-slate-400">
                  Lord тохиргооны баталгаажуулалт
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#060911] border border-slate-800">
              <img
                src={confirmDeleteItem.imageUrl}
                alt={confirmDeleteItem.name}
                className="w-12 h-12 rounded object-contain bg-[#04060c] border border-slate-800 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-100 break-words">
                  {confirmDeleteItem.name}
                </p>
                <p className="text-[11px] text-[#c8ba96]">
                  🪙 {confirmDeleteItem.priceCoins.toLocaleString()} Зоос
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded bg-[#2d181c] border border-[#5e343c] text-xs text-[#dfb3ba]">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteItem(null)}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 cursor-pointer disabled:opacity-50"
              >
                Цуцлах
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-[#522831] hover:bg-[#66323d] border border-[#7d424f] text-[#f0d5da] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Хасаж байна...' : 'Барааг хасах'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Zoom Lightbox */}
      {zoomedItem && (
        <div
          className="fixed inset-0 z-[60] bg-black/92 backdrop-blur-sm flex flex-col items-center justify-between p-3 sm:p-6"
          onClick={() => setZoomedItem(null)}
        >
          <div
            className="w-full max-w-3xl flex items-center justify-between gap-3 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              <h4 className="font-semibold text-sm sm:text-base text-slate-100 break-words">
                {zoomedItem.name}
              </h4>
              <p className="text-xs text-[#c8ba96] font-bold">
                🪙 {zoomedItem.priceCoins.toLocaleString()} Зоос
              </p>
            </div>
            <button
              type="button"
              onClick={() => setZoomedItem(null)}
              className="p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white cursor-pointer shrink-0"
              aria-label="Томруулсан зургийг хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="flex-1 w-full max-w-4xl my-3 flex items-center justify-center min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomedItem.imageUrl}
              alt={zoomedItem.name}
              className="max-w-full max-h-full object-contain rounded-lg border border-slate-800 bg-[#04060c]"
            />
          </div>

          <div
            className="w-full max-w-md flex items-center justify-center gap-3 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                handleAddToCart(zoomedItem);
                setZoomedItem(null);
              }}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#27344a] hover:bg-[#32425c] border border-slate-600/70 text-slate-100 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Сагсанд нэмэх ({getItemQty(zoomedItem.id)}ш)</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomedItem(null)}
              className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              Буцах
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
