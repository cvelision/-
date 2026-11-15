import { Store, StoreItem } from '../types';
import { INITIAL_STORES } from '../data/initialStores';

const STORES_STORAGE_KEY = 'sapphirely_stores_v2_custom';
const OWNER_MODE_KEY = 'sapphirely_owner_mode_v1';
const SENDER_NAME_KEY = 'sapphirely_sender_name_v1';

export function getStoredStores(): Store[] {
  if (typeof window === 'undefined') return INITIAL_STORES;
  try {
    const raw = localStorage.getItem(STORES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(INITIAL_STORES));
      // Also clear old cart if it had mock items
      localStorage.removeItem('sapphirely_cart_v1');
      return INITIAL_STORES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_STORES;
  } catch {
    return INITIAL_STORES;
  }
}

export function saveStoredStores(stores: Store[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
  } catch (err) {
    console.error('Failed to save stores', err);
  }
}

export function resetStoresToDefault(): Store[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(INITIAL_STORES));
  }
  return INITIAL_STORES;
}

export function getStoredOwnerMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(OWNER_MODE_KEY) === 'true';
}

export function setStoredOwnerMode(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OWNER_MODE_KEY, enabled ? 'true' : 'false');
}

export function getStoredSenderName(): string {
  if (typeof window === 'undefined') return 'Эрхэм язгууртан';
  return localStorage.getItem(SENDER_NAME_KEY) || 'Эрхэм худалдан авагч';
}

export function setStoredSenderName(name: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SENDER_NAME_KEY, name);
}

export function addItemToStore(
  stores: Store[],
  storeId: string,
  newItem: Omit<StoreItem, 'id' | 'storeId'>
): { updatedStores: Store[]; createdItem: StoreItem } {
  const itemId = `${storeId}-${Date.now()}`;
  const item: StoreItem = {
    ...newItem,
    id: itemId,
    storeId,
  };

  const updatedStores = stores.map((store) => {
    if (store.id === storeId) {
      return {
        ...store,
        items: [item, ...store.items],
      };
    }
    return store;
  });

  saveStoredStores(updatedStores);
  return { updatedStores, createdItem: item };
}

export function updateItemInStore(
  stores: Store[],
  storeId: string,
  itemId: string,
  updatedData: Partial<StoreItem>
): Store[] {
  const updatedStores = stores.map((store) => {
    if (store.id === storeId) {
      return {
        ...store,
        items: store.items.map((it) => (it.id === itemId ? { ...it, ...updatedData } : it)),
      };
    }
    return store;
  });

  saveStoredStores(updatedStores);
  return updatedStores;
}

export function deleteItemFromStore(stores: Store[], storeId: string, itemId: string): Store[] {
  const updatedStores = stores.map((store) => {
    if (store.id === storeId) {
      return {
        ...store,
        items: store.items.filter((it) => it.id !== itemId),
      };
    }
    return store;
  });

  saveStoredStores(updatedStores);
  return updatedStores;
}
