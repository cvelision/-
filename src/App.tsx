/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { Store, StoreItem, CartItem, DistrictId } from './types';
import { DISTRICTS, INITIAL_STORES } from './data/initialStores';
import {
  getStoredAdminCode,
  setStoredAdminCode,
  getStoredSenderName,
  setStoredSenderName,
} from './utils/storeStorage';
import {
  ADMIN_ACCESS_CODE,
  subscribeToItems,
  createStoreItemInFirestore,
  updateStoreItemInFirestore,
  deleteStoreItemInFirestore,
} from './firebase';
import { Header } from './components/Header';
import { WelcomeHero } from './components/WelcomeHero';
import { MansionCard } from './components/MansionCard';
import { StoreModal } from './components/StoreModal';
import { ItemEditModal } from './components/ItemEditModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CartDrawer } from './components/CartDrawer';
import { ChequeModal } from './components/ChequeModal';
import { DiamondLogo } from './components/DiamondLogo';
import { Sparkles, ArrowUp } from 'lucide-react';

const CART_STORAGE_KEY = 'sapphirely_cart_v1';

export default function App() {
  const [cloudItems, setCloudItems] = useState<StoreItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [adminCode, setAdminCode] = useState<string | null>(null);
  const [senderName, setSenderName] = useState<string>('Эрхэм худалдан авагч');

  // Active filters & navigation
  const [activeDistrict, setActiveDistrict] = useState<DistrictId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isChequeOpen, setIsChequeOpen] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Admin Item Edit modal state
  const [isItemEditOpen, setIsItemEditOpen] = useState<boolean>(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);

  // Toast / notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mansionsRef = useRef<HTMLDivElement>(null);

  const ownerMode = adminCode === ADMIN_ACCESS_CODE;

  // Combine static store directory with live Firestore items
  const stores = useMemo<Store[]>(() => {
    const itemsByStore: Record<string, StoreItem[]> = {};
    cloudItems.forEach((it) => {
      if (!itemsByStore[it.storeId]) {
        itemsByStore[it.storeId] = [];
      }
      itemsByStore[it.storeId].push(it);
    });

    return INITIAL_STORES.map((baseStore) => ({
      ...baseStore,
      items: itemsByStore[baseStore.id] || [],
    }));
  }, [cloudItems]);

  const activeStore = useMemo<Store | null>(() => {
    if (!activeStoreId) return null;
    return stores.find((s) => s.id === activeStoreId) || null;
  }, [stores, activeStoreId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Subscribe to real-time Firestore items & restore local session preferences
  useEffect(() => {
    const savedCode = getStoredAdminCode();
    if (savedCode === ADMIN_ACCESS_CODE) {
      setAdminCode(savedCode);
    } else if (savedCode) {
      setStoredAdminCode(null);
    }

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
      // Ignore corrupt local cart
    }

    const unsubscribe = subscribeToItems(
      (items) => {
        setCloudItems(items);
        setIsLoadingItems(false);
      },
      () => {
        setIsLoadingItems(false);
        showToast('Өгөгдлийн сантай холбогдоход алдаа гарлаа.');
      }
    );

    return () => unsubscribe();
  }, []);

  // Save cart changes locally
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  const handleToggleOwnerMode = () => {
    if (ownerMode) {
      setAdminCode(null);
      setStoredAdminCode(null);
      showToast('Админ эрхээс гарлаа');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = (verifiedCode: string) => {
    setAdminCode(verifiedCode);
    setStoredAdminCode(verifiedCode);
    showToast('Админ эрх амжилттай идэвхжлээ! Оруулсан бараа шууд хадгалагдана.');
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

  // Admin item manipulations persisted globally in Firestore
  const handleOpenAddNewItem = (store: Store) => {
    if (!ownerMode) {
      setIsAdminLoginOpen(true);
      return;
    }
    setEditingStore(store);
    setEditingItem(null);
    setIsItemEditOpen(true);
  };

  const handleOpenEditItem = (store: Store, item: StoreItem) => {
    if (!ownerMode) {
      setIsAdminLoginOpen(true);
      return;
    }
    setEditingStore(store);
    setEditingItem(item);
    setIsItemEditOpen(true);
  };

  const handleSaveItem = async (
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
    if (!adminCode || adminCode !== ADMIN_ACCESS_CODE) {
      setIsAdminLoginOpen(true);
      throw new Error('Админ эрхийн код шаардлагатай');
    }

    if (itemId) {
      await updateStoreItemInFirestore(itemId, itemData, adminCode);
      showToast('Барааны мэдээлэл амжилттай шинэчлэгдлээ');
    } else {
      await createStoreItemInFirestore(storeId, itemData, adminCode);
      showToast('Шинэ бараа өгөгдлийн санд бүрэн хадгалагдлаа');
    }
  };

  const handleDeleteItem = async (_store: Store, itemId: string) => {
    if (!adminCode || adminCode !== ADMIN_ACCESS_CODE) {
      setIsAdminLoginOpen(true);
      return;
    }
    if (window.confirm('Энэ барааг өргөөнөөс хасахдаа итгэлтэй байна уу?')) {
      try {
        await deleteStoreItemInFirestore(itemId, adminCode);
        setCart((prev) => prev.filter((c) => c.item.id !== itemId));
        showToast('Бараа амжилттай устгагдлаа');
      } catch {
        showToast('Бараа устгах үед алдаа гарлаа');
      }
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
        <div className="fixed top-24 right-5 z-50 max-w-sm px-4 py-3 rounded-2xl bg-[#09153a] border border-amber-400 text-white text-xs font-semibold shadow-2xl shadow-blue-900/60 flex items-center gap-2.5">
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
          {isLoadingItems && (
            <span className="text-xs text-slate-400">Бараа ачаалж байна...</span>
          )}
        </div>

        {/* Grouped by District */}
        {DISTRICTS.map((district) => {
          const districtStores = filteredStores.filter((s) => s.districtId === district.id);
          if (districtStores.length === 0) return null;

          return (
            <section key={district.id} className="space-y-3">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {districtStores.map((store, sIdx) => (
                  <MansionCard
                    key={store.id}
                    store={store}
                    index={sIdx}
                    onOpenStore={(st) => setActiveStoreId(st.id)}
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
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

      {/* Store Interior Modal */}
      <StoreModal
        store={activeStore}
        onClose={() => setActiveStoreId(null)}
        onAddToCart={handleAddToCart}
        ownerMode={ownerMode}
        onAddNewItem={handleOpenAddNewItem}
        onEditItem={handleOpenEditItem}
        onDeleteItem={handleDeleteItem}
        onRequestAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Admin Login Modal (Code: 54PPH1R3) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Admin Item Add/Edit Modal */}
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

      {/* Cheques Modal */}
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
              {ownerMode ? 'Админ эрх (Гарах)' : 'Админ нэвтрэх'}
            </button>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
