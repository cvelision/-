import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  getDocFromServer,
  getDocsFromServer,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { StoreItem } from './types';
import { BUILTIN_INITIAL_ITEMS } from './data/initialStores';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

export const ADMIN_ACCESS_CODE = '54PPH1R3';
export const MAX_ITEMS_PER_STORE = 100;
export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

const VERSION_KEY = 'sapphirely_catalog_version_v2';
const LEGACY_CACHE_KEY = 'sapphirely_items_cache_v1';
const SEED_VERSION_KEY = 'sapphirely_seed_version_v6';
const CURRENT_SEED_VERSION = 6;
const IDB_NAME = 'sapphirely_catalog_idb_v1';
const IDB_STORE = 'catalog';
const IDB_ITEMS_KEY = 'all_items';

const RETIRED_BUILTIN_ITEM_IDS = new Set<string>(['obs-item-09', 'glass-item-01']);
const LEGACY_BROKEN_IMAGE_BY_ID: Record<string, string> = {
  'obs-item-01': '/assets/aistudio/Messenger_creation_09C9A8A9-A7ED-4EC6-B809-7561B9A673B8_4edd9447.jpeg',
  'obs-item-11': '/assets/aistudio/Messenger_creation_7E3CCB93-0A95-410F-9CE0-300735A16455_ea353938.jpeg',
};
const BUILTIN_ITEMS_BY_ID = new Map(BUILTIN_INITIAL_ITEMS.map((it) => [it.id, it]));

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isQuotaExceededError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string })?.code || '';
  return (
    code === 'resource-exhausted' ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily read units')
  );
}

export function isPermissionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string })?.code || '';
  return (
    code === 'permission-denied' ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('PERMISSION_DENIED')
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function openCatalogDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(IDB_STORE)) {
        database.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
  });
}

export async function getCachedItemsAsync(): Promise<StoreItem[]> {
  if (typeof window === 'undefined') return [];
  try {
    const database = await openCatalogDB();
    const items = await new Promise<StoreItem[]>((resolve) => {
      const tx = database.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(IDB_ITEMS_KEY);
      getReq.onsuccess = () => {
        const res = getReq.result;
        resolve(Array.isArray(res) ? res : []);
      };
      getReq.onerror = () => resolve([]);
    });
    database.close();
    if (items.length > 0) return items;
  } catch {
    // Fallback to legacy localStorage
  }
  return getCachedItems();
}

async function saveCachedItemsAsync(items: StoreItem[], version?: number): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const database = await openCatalogDB();
    await new Promise<void>((resolve) => {
      const tx = database.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(items, IDB_ITEMS_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    database.close();
  } catch {
    // Ignore IDB write error
  }

  if (typeof version === 'number') {
    try {
      localStorage.setItem(VERSION_KEY, String(version));
    } catch {
      // Ignore
    }
  }

  try {
    // Keep legacy localStorage cleared if large so it doesn't throw QuotaExceededError
    if (items.length <= 25) {
      localStorage.setItem(LEGACY_CACHE_KEY, JSON.stringify(items));
    } else {
      localStorage.removeItem(LEGACY_CACHE_KEY);
    }
  } catch {
    // Ignore localStorage quota error
  }
}

export function getCachedItems(): StoreItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLocalCatalogVersion(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'meta', 'catalog'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'id';
  const rand = Math.random().toString(36).slice(2, 10);
  return `${cleanPrefix}-${Date.now()}-${rand}`;
}

function sanitizeItemInput(itemData: {
  name: string;
  description: string;
  priceCoins: number;
  imageUrl: string;
  stock?: number;
  featured?: boolean;
}) {
  const name = itemData.name.trim().slice(0, 200);
  const description = itemData.description.trim().slice(0, 1000);
  const priceCoins = Math.min(
    100000000,
    Math.max(1, Math.round(Number(itemData.priceCoins) || 1))
  );
  const imageUrl = itemData.imageUrl.trim().slice(0, 700000);
  const stock = Math.min(1000000, Math.max(0, Math.round(Number(itemData.stock ?? 10))));
  const featured = Boolean(itemData.featured);

  return { name, description, priceCoins, imageUrl, stock, featured };
}

function mapDocToStoreItem(docId: string, data: Record<string, unknown>): StoreItem {
  const createdAtRaw = data.createdAt;
  let createdAtMs: number | undefined;
  if (createdAtRaw instanceof Timestamp) {
    createdAtMs = createdAtRaw.toMillis();
  } else if (
    createdAtRaw &&
    typeof createdAtRaw === 'object' &&
    'toMillis' in createdAtRaw &&
    typeof (createdAtRaw as { toMillis: () => number }).toMillis === 'function'
  ) {
    createdAtMs = (createdAtRaw as { toMillis: () => number }).toMillis();
  }

  return {
    id: typeof data.id === 'string' ? data.id : docId,
    storeId: typeof data.storeId === 'string' ? data.storeId : '',
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
    priceCoins: typeof data.priceCoins === 'number' ? data.priceCoins : 0,
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
    stock: typeof data.stock === 'number' ? data.stock : 10,
    featured: Boolean(data.featured),
    createdAtMs,
  };
}

export function isLibrarySeededLocally(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Number(localStorage.getItem(SEED_VERSION_KEY)) === CURRENT_SEED_VERSION;
  } catch {
    return false;
  }
}

function setLibrarySeededLocally(seeded: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (seeded) {
      localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION));
    } else {
      localStorage.removeItem(SEED_VERSION_KEY);
    }
  } catch {
    // Ignore
  }
}

export function mergeWithFallbackLibraryItems(
  items: StoreItem[],
  _isSeededOnServer?: boolean
): StoreItem[] {
  const cleaned = items
    .filter((it) => !RETIRED_BUILTIN_ITEM_IDS.has(it.id))
    .map((it) => {
      const brokenUrl = LEGACY_BROKEN_IMAGE_BY_ID[it.id];
      const canonical = BUILTIN_ITEMS_BY_ID.get(it.id);
      if (brokenUrl && canonical && it.imageUrl === brokenUrl) {
        return { ...it, imageUrl: canonical.imageUrl };
      }
      return it;
    });
  const existingIds = new Set(cleaned.map((it) => it.id));
  const missing = BUILTIN_INITIAL_ITEMS.filter((it) => !existingIds.has(it.id));
  return missing.length > 0 ? [...cleaned, ...missing] : cleaned;
}

export async function fetchAllItemsFromServer(): Promise<StoreItem[]> {
  const itemsPath = 'items';
  const q = query(collection(db, itemsPath), where('deleted', '==', false));
  const snapshot = await getDocsFromServer(q);
  const loaded: StoreItem[] = [];
  snapshot.forEach((docSnap) => {
    const mapped = mapDocToStoreItem(docSnap.id, docSnap.data() as Record<string, unknown>);
    if (!RETIRED_BUILTIN_ITEM_IDS.has(mapped.id)) {
      loaded.push(mapped);
    }
  });
  loaded.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  return loaded;
}

async function seedBuiltinItemsInFirestore(existingItems: StoreItem[]): Promise<StoreItem[]> {
  const activeExisting = existingItems.filter((it) => !RETIRED_BUILTIN_ITEM_IDS.has(it.id));
  const existingMap = new Map(activeExisting.map((it) => [it.id, it]));
  const missing = BUILTIN_INITIAL_ITEMS.filter((it) => !existingMap.has(it.id));
  const itemsNeedingImageRepair = BUILTIN_INITIAL_ITEMS.filter((canonical) => {
    const current = existingMap.get(canonical.id);
    const brokenUrl = LEGACY_BROKEN_IMAGE_BY_ID[canonical.id];
    return Boolean(current && brokenUrl && current.imageUrl === brokenUrl);
  });

  const nextVersion = Date.now();
  let lastActionId = generateSafeId('seedmeta');

  type SeedOp =
    | { kind: 'create'; item: StoreItem }
    | { kind: 'repair'; canonical: StoreItem; current: StoreItem };

  const ops: SeedOp[] = [
    ...missing.map((item): SeedOp => ({ kind: 'create', item })),
    ...itemsNeedingImageRepair.map((canonical): SeedOp => ({
      kind: 'repair',
      canonical,
      current: existingMap.get(canonical.id)!,
    })),
  ];

  // Firestore writeBatch limit is 500 operations; each item writes 2 docs (adminActions + items)
  const MAX_ITEMS_PER_BATCH = 180;

  if (ops.length === 0) {
    const batch = writeBatch(db);
    batch.set(doc(db, 'adminActions', lastActionId), {
      code: ADMIN_ACCESS_CODE,
      itemId: 'builtin-seed-meta',
      action: 'create',
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'meta', 'catalog'), {
      version: nextVersion,
      lastActionId,
      librarySeeded: true,
      seededVersion: CURRENT_SEED_VERSION,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } else {
    for (let start = 0; start < ops.length; start += MAX_ITEMS_PER_BATCH) {
      const chunk = ops.slice(start, start + MAX_ITEMS_PER_BATCH);
      const isLastChunk = start + MAX_ITEMS_PER_BATCH >= ops.length;
      const batch = writeBatch(db);

      chunk.forEach((op, offset) => {
        const idx = start + offset;
        if (op.kind === 'create') {
          const item = op.item;
          const actionId = generateSafeId(`seed${idx}`);
          lastActionId = actionId;
          batch.set(doc(db, 'adminActions', actionId), {
            code: ADMIN_ACCESS_CODE,
            itemId: item.id,
            action: 'create',
            createdAt: serverTimestamp(),
          });
          batch.set(doc(db, 'items', item.id), {
            id: item.id,
            storeId: item.storeId,
            name: item.name,
            description: item.description,
            priceCoins: item.priceCoins,
            imageUrl: item.imageUrl,
            stock: item.stock ?? 30,
            featured: Boolean(item.featured),
            deleted: false,
            lastActionId: actionId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          const { canonical, current } = op;
          const actionId = generateSafeId(`fix${idx}`);
          lastActionId = actionId;
          batch.set(doc(db, 'adminActions', actionId), {
            code: ADMIN_ACCESS_CODE,
            itemId: canonical.id,
            action: 'update',
            createdAt: serverTimestamp(),
          });
          batch.update(doc(db, 'items', canonical.id), {
            name: current.name,
            description: current.description,
            priceCoins: current.priceCoins,
            imageUrl: canonical.imageUrl,
            stock: current.stock ?? canonical.stock ?? 30,
            featured: Boolean(current.featured),
            lastActionId: actionId,
            updatedAt: serverTimestamp(),
          });
        }
      });

      if (isLastChunk) {
        batch.set(doc(db, 'meta', 'catalog'), {
          version: nextVersion,
          lastActionId,
          librarySeeded: true,
          seededVersion: CURRENT_SEED_VERSION,
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }
  }

  setLibrarySeededLocally(true);

  const repairedExisting = activeExisting.map((it) => {
    const brokenUrl = LEGACY_BROKEN_IMAGE_BY_ID[it.id];
    const canonical = BUILTIN_ITEMS_BY_ID.get(it.id);
    if (brokenUrl && canonical && it.imageUrl === brokenUrl) {
      return { ...it, imageUrl: canonical.imageUrl };
    }
    return it;
  });

  const seededWithTs: StoreItem[] = missing.map((it, idx) => ({
    ...it,
    createdAtMs: nextVersion - idx,
  }));
  const combined = [...repairedExisting, ...seededWithTs];
  await saveCachedItemsAsync(combined, nextVersion);
  return combined;
}

/**
 * Listens ONLY to the tiny `meta/catalog` version document (1 doc instead of reading hundreds of image docs on every reload).
 * Fetches `items` from Firestore ONLY when the remote catalog version changes or local IndexedDB cache is empty.
 */
export function subscribeToItems(
  onItems: (items: StoreItem[]) => void,
  onError?: (err: Error, isQuota: boolean) => void
): () => void {
  let active = true;
  let isFetching = false;
  let hasDeliveredInitialCache = false;
  let hasAttemptedSeed = false;

  const deliverCachedFirst = async (): Promise<StoreItem[]> => {
    const cached = await getCachedItemsAsync();
    const displayItems = mergeWithFallbackLibraryItems(cached);
    if (active && !hasDeliveredInitialCache && displayItems.length > 0) {
      hasDeliveredInitialCache = true;
      onItems(displayItems);
    }
    return cached;
  };

  void deliverCachedFirst();

  const metaRef = doc(db, 'meta', 'catalog');
  const unsubscribe = onSnapshot(
    metaRef,
    async (metaSnap) => {
      if (!active) return;

      const remoteVersion =
        metaSnap.exists() && typeof metaSnap.data()?.version === 'number'
          ? (metaSnap.data().version as number)
          : 0;
      const isSeededRemote =
        metaSnap.exists() && metaSnap.data()?.seededVersion === CURRENT_SEED_VERSION;
      if (isSeededRemote) {
        setLibrarySeededLocally(true);
      }

      const localVersion = getLocalCatalogVersion();
      const cached = await deliverCachedFirst();

      // Skip full collection read when local IndexedDB cache matches the remote catalog version and seeding is already done
      if (isSeededRemote && localVersion !== null && remoteVersion === localVersion) {
        onItems(mergeWithFallbackLibraryItems(cached));
        return;
      }

      if (isFetching) return;
      isFetching = true;

      try {
        const freshItems = await fetchAllItemsFromServer();
        if (!active) return;

        if (!isSeededRemote && !hasAttemptedSeed) {
          hasAttemptedSeed = true;
          try {
            const seededItems = await seedBuiltinItemsInFirestore(freshItems);
            if (!active) return;
            onItems(seededItems);
            return;
          } catch (seedErr) {
            if (!active) return;
            const fallback = mergeWithFallbackLibraryItems(freshItems);
            await saveCachedItemsAsync(fallback, remoteVersion);
            onItems(fallback);
            if (isQuotaExceededError(seedErr) && onError) {
              onError(
                seedErr instanceof Error ? seedErr : new Error('Quota limit exceeded.'),
                true
              );
            }
            return;
          }
        }

        const mergedFresh = mergeWithFallbackLibraryItems(freshItems);
        await saveCachedItemsAsync(mergedFresh, remoteVersion);
        onItems(mergedFresh);
      } catch (error) {
        if (!active) return;
        const fallback = mergeWithFallbackLibraryItems(cached);
        if (fallback.length > 0) {
          onItems(fallback);
        }

        if (isQuotaExceededError(error)) {
          if (onError) {
            onError(
              error instanceof Error ? error : new Error('Quota limit exceeded.'),
              true
            );
          }
          return;
        }

        if (isPermissionError(error)) {
          try {
            handleFirestoreError(error, OperationType.LIST, 'items');
          } catch (wrapped) {
            if (onError && wrapped instanceof Error) {
              onError(wrapped, false);
            }
          }
          return;
        }

        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)), false);
        }
      } finally {
        isFetching = false;
      }
    },
    async (error) => {
      if (!active) return;
      const cached = await getCachedItemsAsync();
      const fallback = mergeWithFallbackLibraryItems(cached, isLibrarySeededLocally());
      if (fallback.length > 0) {
        onItems(fallback);
      }

      if (isQuotaExceededError(error)) {
        if (onError) {
          onError(
            error instanceof Error ? error : new Error('Quota limit exceeded.'),
            true
          );
        }
        return;
      }

      if (isPermissionError(error)) {
        try {
          handleFirestoreError(error, OperationType.GET, 'meta/catalog');
        } catch (wrapped) {
          if (onError && wrapped instanceof Error) {
            onError(wrapped, false);
          }
        }
        return;
      }

      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)), false);
      }
    }
  );

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function createStoreItemInFirestore(
  storeId: string,
  itemData: {
    name: string;
    description: string;
    priceCoins: number;
    imageUrl: string;
    stock?: number;
    featured?: boolean;
  },
  adminCode: string
): Promise<StoreItem> {
  const itemId = generateSafeId(storeId);
  const actionId = generateSafeId('act');
  const clean = sanitizeItemInput(itemData);
  const itemPath = `items/${itemId}`;
  const nextVersion = Date.now();

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'adminActions', actionId), {
      code: adminCode,
      itemId,
      action: 'create',
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, 'items', itemId), {
      id: itemId,
      storeId,
      ...clean,
      deleted: false,
      lastActionId: actionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'meta', 'catalog'), {
      version: nextVersion,
      lastActionId: actionId,
      librarySeeded: true,
      seededVersion: CURRENT_SEED_VERSION,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    const createdItem: StoreItem = {
      id: itemId,
      storeId,
      ...clean,
      createdAtMs: nextVersion,
    };
    const existing = await getCachedItemsAsync();
    const updatedCache = [createdItem, ...existing.filter((i) => i.id !== itemId)];
    await saveCachedItemsAsync(updatedCache, nextVersion);
    return createdItem;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Өдрийн үнэгүй унших/бичих лимит (Quota limit exceeded) дууссан байна.');
    }
    handleFirestoreError(error, OperationType.CREATE, itemPath);
  }
}

export async function updateStoreItemInFirestore(
  itemId: string,
  itemData: {
    name: string;
    description: string;
    priceCoins: number;
    imageUrl: string;
    stock?: number;
    featured?: boolean;
  },
  adminCode: string
): Promise<void> {
  const actionId = generateSafeId('act');
  const clean = sanitizeItemInput(itemData);
  const itemPath = `items/${itemId}`;
  const nextVersion = Date.now();

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'adminActions', actionId), {
      code: adminCode,
      itemId,
      action: 'update',
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'items', itemId), {
      ...clean,
      lastActionId: actionId,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'meta', 'catalog'), {
      version: nextVersion,
      lastActionId: actionId,
      librarySeeded: true,
      seededVersion: CURRENT_SEED_VERSION,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    const existing = await getCachedItemsAsync();
    const updatedCache = existing.map((item) =>
      item.id === itemId ? { ...item, ...clean } : item
    );
    await saveCachedItemsAsync(updatedCache, nextVersion);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error('Өдрийн үнэгүй лимит (Quota limit exceeded) дууссан байна.');
    }
    handleFirestoreError(error, OperationType.UPDATE, itemPath);
  }
}
