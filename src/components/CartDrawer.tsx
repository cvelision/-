import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { playCoinSound } from '../utils/audio';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onProceedToCheque: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheque,
}) => {
  if (!isOpen) return null;

  const totalCoins = cartItems.reduce(
    (sum, c) => sum + c.item.priceCoins * c.quantity,
    0
  );
  const totalItemCount = cartItems.reduce((sum, c) => sum + c.quantity, 0);

  // Group items by store
  const storeMap: Record<string, { storeName: string; items: CartItem[] }> = {};
  cartItems.forEach((c) => {
    if (!storeMap[c.store.id]) {
      storeMap[c.store.id] = { storeName: c.store.name, items: [] };
    }
    storeMap[c.store.id].items.push(c);
  });
  const storeGroups = Object.values(storeMap);

  const handleProceed = () => {
    playCoinSound();
    onProceedToCheque();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#020510]/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#060c22] border-l border-blue-800/60 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-950 border-b border-blue-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/40 text-amber-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-white">
                  Таны худалдан авалтын сагс
                </h3>
                <p className="text-xs text-blue-300/80">
                  {totalItemCount} ширхэг бараа • {storeGroups.length} дэлгүүр
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-blue-900/40 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
                <div className="w-20 h-20 rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-3xl">
                  🛒
                </div>
                <h4 className="font-cinzel text-base font-bold text-slate-200">
                  Таны сагс хоосон байна
                </h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Саффир улсын худалдааны өргөөнүүдийн хаалгыг нээж бараа сонгон сагсандаа нэмнэ үү.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Дэлгүүрүүд үзэх
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {storeGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-900/50 space-y-3"
                  >
                    {/* Store Title */}
                    <div className="flex items-center justify-between pb-2 border-b border-blue-900/40">
                      <span className="font-cinzel text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {group.storeName} их өргөө
                      </span>
                      <span className="text-[11px] text-blue-300/70">
                        {group.items.length} нэр төрөл
                      </span>
                    </div>

                    {/* Store Items */}
                    <div className="space-y-3">
                      {group.items.map((cartItem) => {
                        const subtotal = cartItem.item.priceCoins * cartItem.quantity;

                        return (
                          <div
                            key={cartItem.item.id}
                            className="flex gap-3 bg-[#081230] p-2.5 rounded-xl border border-blue-900/40"
                          >
                            <img
                              src={cartItem.item.imageUrl}
                              alt={cartItem.item.name}
                              className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-900"
                            />
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-1">
                                <h5 className="text-xs font-semibold text-white line-clamp-1">
                                  {cartItem.item.name}
                                </h5>
                                <button
                                  onClick={() => onRemoveItem(cartItem.item.id)}
                                  className="text-slate-400 hover:text-red-400 p-1"
                                  title="Сагснаас хасах"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center justify-between mt-2">
                                {/* Quantity controls */}
                                <div className="flex items-center gap-1.5 bg-blue-950 px-2 py-0.5 rounded-lg border border-blue-800/60">
                                  <button
                                    onClick={() =>
                                      onUpdateQuantity(cartItem.item.id, cartItem.quantity - 1)
                                    }
                                    className="w-4 h-4 flex items-center justify-center text-xs text-blue-300 hover:text-white"
                                  >
                                    -
                                  </button>
                                  <span className="text-xs font-bold text-white px-1">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      onUpdateQuantity(cartItem.item.id, cartItem.quantity + 1)
                                    }
                                    className="w-4 h-4 flex items-center justify-center text-xs text-blue-300 hover:text-white"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Dynamic Subtotal */}
                                <div className="text-right">
                                  <span className="text-[10px] text-blue-300/60 block">
                                    {cartItem.item.priceCoins} x {cartItem.quantity}
                                  </span>
                                  <span className="text-xs font-bold text-amber-300">
                                    🪙 {subtotal.toLocaleString()} Зоос
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with Grand Total & Checkout to Cheque */}
          {cartItems.length > 0 && (
            <div className="p-5 bg-[#030614] border-t border-blue-900/60 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-blue-300/80">
                  <span>Нийт барааны тоо:</span>
                  <span className="font-semibold text-white">{totalItemCount} ширхэг</span>
                </div>
                <div className="flex items-center justify-between text-xs text-blue-300/80">
                  <span>Чек очих дэлгүүрийн тоо:</span>
                  <span className="font-semibold text-white">{storeGroups.length} байгууллага</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-900/40">
                  <span className="font-cinzel text-sm font-bold text-white">Нийт төлөх дүн:</span>
                  <div className="text-right">
                    <span className="font-cinzel text-xl font-extrabold text-amber-300">
                      🪙 {totalCoins.toLocaleString()} Зоос
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceed}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Худалдан авалтаа дуусгах (Чек бэлтгэх)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-end pt-1 text-[11px] text-slate-400">
                <button
                  onClick={onClearCart}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  Сагсыг цэвэрлэх
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
