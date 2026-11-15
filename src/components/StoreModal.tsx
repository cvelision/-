import React, { useState } from 'react';
import { Store, StoreItem } from '../types';
import { X, Plus, Edit2, Trash2, CheckCircle, ShoppingBag } from 'lucide-react';
import { playCoinSound } from '../utils/audio';

interface StoreModalProps {
  store: Store | null;
  onClose: () => void;
  onAddToCart: (item: StoreItem, store: Store, quantity: number) => void;
  ownerMode: boolean;
  onAddNewItem: (store: Store) => void;
  onEditItem: (store: Store, item: StoreItem) => void;
  onDeleteItem: (store: Store, itemId: string) => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  store,
  onClose,
  onAddToCart,
  ownerMode,
  onAddNewItem,
  onEditItem,
  onDeleteItem,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  if (!store) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl bg-[#070e20] rounded-xl border border-slate-800 shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Simple Clean Header without store photo or store description */}
        <div className="p-4 bg-[#091228] border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-cinzel text-xl font-bold text-slate-100">
            {store.name}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddNewItem(store)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Бараа нэмэх</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {store.items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-3">
              <p>Одоогоор бараа ороогүй байна.</p>
              <button
                onClick={() => onAddNewItem(store)}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Бараа нэмэх</span>
              </button>
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
                    className="bg-[#050a18] rounded-lg border border-slate-800 p-3.5 flex flex-col justify-between space-y-3"
                  >
                    {/* Item Image */}
                    <div className="relative h-36 rounded overflow-hidden bg-slate-950">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {ownerMode && (
                        <div className="absolute top-2 right-2 flex gap-1">
                          <button
                            onClick={() => onEditItem(store, item)}
                            className="p-1 rounded bg-black/70 hover:bg-slate-800 text-white"
                            title="Засах"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(store, item.id)}
                            className="p-1 rounded bg-black/70 hover:bg-red-800 text-white"
                            title="Устгах"
                          >
                            <Trash2 className="w-3 h-3" />
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
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Quantity & Live Calc */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      {/* Price in coins */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Нэгжийн үнэ:</span>
                        <span className="text-amber-300 font-bold">
                          🪙 {item.priceCoins.toLocaleString()} Зоос
                        </span>
                      </div>

                      {/* Quantity input: "тоо ширхэг гэсэн бичиг байна" */}
                      <div className="flex items-center justify-between bg-[#081126] p-1.5 rounded border border-slate-800">
                        <span className="text-xs text-slate-300 font-medium">
                          Тоо ширхэг:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, qty - 1)}
                            className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-bold"
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
                            className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Auto-calculated Total: "тоо ширхэг дээр тоогоо оруулахад үнэ нь яг түүгээрээ автоматаар бодогдоно" */}
                      <div className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Дүн ({qty}ш):</span>
                        <span className="text-amber-300 font-bold">
                          🪙 {totalPrice.toLocaleString()} Зоос
                        </span>
                      </div>

                      {/* "Худалдан авах" button */}
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
        <div className="p-3 bg-[#050a18] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};
