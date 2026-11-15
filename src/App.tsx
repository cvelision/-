/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Store, StoreItem, CartItem, DistrictId } from './types';
import { DISTRICTS } from './data/initialStores';
import {
  getStoredStores,
  saveStoredStores,
  getStoredOwnerMode,
  setStoredOwnerMode,
  getStoredSenderName,
  setStoredSenderName,
  addItemToStore,
  updateItemInStore,
  deleteItemFromStore,
  resetStoresToDefault,
} from './utils/storeStorage';
import { Header } from './components/Header';
import { WelcomeHero } from './components/WelcomeHero';
import { MansionCard } from './components/MansionCard';
import { StoreModal } from './components/StoreModal';
import { ItemEditModal } from './components/ItemEditModal';
import { CartDrawer } from './components/CartDrawer';
import { ChequeModal } from './components/ChequeModal';
import { DiamondLogo } from './components/DiamondLogo';
import { Crown, Sparkles, RotateCcw, ArrowUp, ChevronDown } from 'lucide-react';

const CART_STORAGE_KEY = 'sapphirely_cart_v1';

export default function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ownerMode, setOwnerMode] = useState<boolean>(false);
  const [senderName, setSenderName] = useState<string>('Эрхэм худалдан авагч');

  // Active filters & navigation
  const [activeDistrict, setActiveDistrict] = useState<DistrictId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isChequeOpen, setIsChequeOpen] = useState<boolean>(false);

  // Owner Item Edit modal state
  const [isItemEditOpen, setIsItemEditOpen] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

  // Toast / notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mansionsRef = useRef<HTMLDivElement>(null);

  // Initialize from localStorage
  useEffect(() => {
    setStores(getStoredStores());
    setOwnerMode(getStoredOwnerMode());
    setSenderName(getStoredSenderName());

    try {
      const rawCart = localStorage.getItem(CART_STORAGE_KEY);
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleOwnerMode = () => {
    const next = !ownerMode;
    setOwnerMode(next);
    setStoredOwnerMode(next);
    showToast(
      next
        ? '👑 Эзэмшигчийн горим идэвхжлээ: Та бараа нэмэх, засах, устгах эрхтэй боллоо'
        : 'Эзэмшигчийн горим унтарлаа'
    );
  };

  const handleSenderNameChange = (name: string) => {
    setSenderName(name);
    setStoredSenderName(name);
  };

  const handleScrollToMansions = () => {
    mansionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const handleAddToCart = (item: StoreItem, store: Store, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [...prev, { item, store, quantity }];
    });
    showToast(`🛒 "${item.name}" (${quantity}ш) сагсанд нэмэгдлээ!`);
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.item.id === itemId ? { ...c, quantity: newQty } : c))
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
    showToast('Бараа сагснаас хасагдлаа');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Сагс цэвэрлэгдлээ');
  };

  const handleCompletePurchase = () => {
    setCart([]);
    showToast('🎉 Худалдан авалт амжилттай хийгдлээ! Баярлалаа.');
  };

  // Owner item manipulations
  const handleOpenAddNewItem = (store: Store) => {
    setEditingStore(store);
    setEditingItem(null);
    setIsItemEditOpen(true);
  };

  const handleOpenEditItem = (store: Store, item: StoreItem) => {
    setEditingStore(store);
    setEditingItem(item);
    setIsItemEditOpen(true);
  };

  const handleSaveItem = (
    storeId: string,
    itemData: {
      name: string;
      description: string;
      priceCoins: number;
      imageUrl: string;
      stock?: number;
      featured?: boolean;
    },
    itemId?: string
  ) => {
    if (itemId) {
      // Edit existing
      const updated = updateItemInStore(stores, storeId, itemId, itemData);
      setStores(updated);
      if (activeStore && activeStore.id === storeId) {
        const refreshedStore = updated.find((s) => s.id === storeId) || null;
        setActiveStore(refreshedStore);
      }
      showToast('Барааны мэдээлэл амжилттай шинэчлэгдлээ');
    } else {
      // Add new
      const { updatedStores } = addItemToStore(stores, storeId, itemData);
      setStores(updatedStores);
      if (activeStore && activeStore.id === storeId) {
        const refreshedStore = updatedStores.find((s) => s.id === storeId) || null;
        setActiveStore(refreshedStore);
      }
      showToast('Шинэ бараа амжилттай өргөөнд нэмэгдлээ');
    }
  };

  const handleDeleteItem = (store: Store, itemId: string) => {
    if (window.confirm('Энэ барааг өргөөнөөс хасахдаа итгэлтэй байна уу?')) {
      const updated = deleteItemFromStore(stores, store.id, itemId);
      setStores(updated);
      if (activeStore && activeStore.id === store.id) {
        const refreshedStore = updated.find((s) => s.id === store.id) || null;
        setActiveStore(refreshedStore);
      }
      // Also remove from cart if present
      setCart((prev) => prev.filter((c) => c.item.id !== itemId));
      showToast('Бараа хасагдлаа');
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm('Та бүх өргөөний барааг анхны хэвэнд нь буцааж сэргээх үү?')) {
      const def = resetStoresToDefault();
      setStores(def);
      setActiveStore(null);
      showToast('Бүх 30 өргөө анхны хэвэндээ шинэчлэгдлээ');
    }
  };

  // Filtered stores
  const filteredStores = stores.filter((store) => {
    const matchesDistrict = activeDistrict === 'all' || store.districtId === activeDistrict;
    if (!matchesDistrict) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchStoreName = store.name.toLowerCase().includes(q);
    const matchCategory = store.category.toLowerCase().includes(q);
    const matchDescription = store.description.toLowerCase().includes(q);
    const matchItem = store.items.some(
      (item) =>
        item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );

    return matchStoreName || matchCategory || matchDescription || matchItem;
  });

  const totalCartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed top-24 right-5 z-50 max-w-sm px-4 py-3 rounded-2xl bg-[#09153a] border border-amber-400 text-white text-xs font-semibold shadow-2xl shadow-blue-900/60 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        totalCartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        ownerMode={ownerMode}
        onToggleOwnerMode={handleToggleOwnerMode}
        activeDistrict={activeDistrict}
        onSelectDistrict={(id) => {
          setActiveDistrict(id);
          mansionsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onScrollToTop={handleScrollToTop}
      />

      {/* Hero Welcome Section */}
      <WelcomeHero onEnterMall={handleScrollToMansions} />

      {/* Main Shopping Avenue: Mansions Section */}
      <main
        ref={mansionsRef}
        className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12"
      >
        {/* Section Header */}
        <div className="pb-3 border-b border-blue-900/60 flex items-center justify-between">
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white">
            Саффир улсын нийт худалдааны байгууллагууд
          </h2>

          {ownerMode && (
            <button
              onClick={handleResetCatalog}
              className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Каталог сэргээх</span>
            </button>
          )}
        </div>

        {/* Grouped by District */}
        {DISTRICTS.map((district) => {
          const districtStores = filteredStores.filter((s) => s.districtId === district.id);
          if (districtStores.length === 0) return null;

          return (
            <section key={district.id} className="space-y-3">
              {/* Plain District Header - only for named districts */}
              {district.name ? (
                <div className="flex items-baseline justify-between border-b border-blue-900/40 pb-1.5">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-cinzel text-base sm:text-lg font-bold text-white">
                      {district.name}
                    </h3>
                    <span className="text-xs text-slate-400">
                      ({districtStores.length})
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Mansions arranged downwards in responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {districtStores.map((store, sIdx) => (
                  <MansionCard
                    key={store.id}
                    store={store}
                    index={sIdx}
                    onOpenStore={(st) => setActiveStore(st)}
                    ownerMode={ownerMode}
                    onAddNewItem={handleOpenAddNewItem}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filteredStores.length === 0 && (
          <div className="text-center py-20 bg-blue-950/20 rounded-3xl border border-dashed border-blue-900/60 p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-950 mx-auto flex items-center justify-center text-2xl">
              🔍
            </div>
            <h4 className="font-cinzel text-lg font-bold text-white">
              Хайлтад тохирох байгууллага олдсонгүй
            </h4>
            <p className="text-xs text-blue-300 max-w-md mx-auto">
              Та өөр үгээр хайх эсвэл бүх дүүргийн шүүлтүүрийг сонгож үзнэ үү.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveDistrict('all');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              Шүүлтүүрийг арилгах
            </button>
          </div>
        )}
      </main>

      {/* Floating Scroll-to-top & Cart Shortcuts */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {totalCartCount > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="p-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl shadow-blue-500/50 border border-blue-300 relative group cursor-pointer animate-subtle-pulse"
            title="Сагс үзэх"
          >
            <span className="text-xl">🛒</span>
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-amber-400 text-slate-950 text-xs font-black rounded-full flex items-center justify-center shadow-md">
              {totalCartCount}
            </span>
          </button>
        )}

        <button
          onClick={handleScrollToTop}
          className="p-3 rounded-full bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-800 shadow-xl backdrop-blur-sm transition-all cursor-pointer"
          title="Дээш очих"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* Store Interior Modal (opened by clicking a Mansion's door) */}
      <StoreModal
        store={activeStore}
        onClose={() => setActiveStore(null)}
        onAddToCart={handleAddToCart}
        ownerMode={ownerMode}
        onAddNewItem={handleOpenAddNewItem}
        onEditItem={handleOpenEditItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* Owner Item Add/Edit Modal */}
      <ItemEditModal
        isOpen={isItemEditOpen}
        onClose={() => {
          setIsItemEditOpen(false);
          setEditingItem(null);
          setEditingStore(null);
        }}
        store={editingStore}
        editingItem={editingItem}
        onSave={handleSaveItem}
      />

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheque={() => {
          setIsCartOpen(false);
          setIsChequeOpen(true);
        }}
      />

      {/* Royal Cheques Modal (per store, exact required format) */}
      <ChequeModal
        isOpen={isChequeOpen}
        onClose={() => setIsChequeOpen(false)}
        cartItems={cart}
        senderName={senderName}
        onSenderNameChange={handleSenderNameChange}
        onCompletePurchase={handleCompletePurchase}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-blue-900/40 bg-[#040817] py-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DiamondLogo className="w-5 h-5" glow={false} />
            <span className="font-semibold text-white">Sapphirely</span>
            <span className="text-slate-500">•</span>
            <span>Саффир улсын их дэлгүүр</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={handleToggleOwnerMode}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {ownerMode ? 'Бараа удирдах горим (Идэвхтэй)' : 'Бараа удирдах'}
            </button>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
