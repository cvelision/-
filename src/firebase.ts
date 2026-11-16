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
export const LORD_ACCESS_CODE = '0625';
export const MAX_ITEMS_PER_STORE = 100;
export const FIRESTORE_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

const VERSION_KEY = 'sapphirely_catalog_version_v2';
const RETIRED_IDS_KEY = 'sapphirely_retired_ids_v1';
const LEGACY_CACHE_KEY = 'sapphirely_items_cache_v1';
const IDB_NAME = 'sapphirely_catalog_idb_v1';
const IDB_STORE = 'catalog';
const IDB_ITEMS_KEY = 'all_items';

const RETIRED_BUILTIN_ITEM_IDS = new Set<string>(['obs-item-09', 'glass-item-01']);
const LEGACY_BROKEN_IMAGE_BY_ID: Record<string, string> = {
  'obs-item-01': '/assets/aistudio/Messenger_creation_09C9A8A9-A7ED-4EC6-B809-7561B9A673B8_4edd9447.jpeg',
  'obs-item-11': '/assets/aistudio/Messenger_creation_7E3CCB93-0A95-410F-9CE0-300735A16455_ea353938.jpeg',
  'mech-item-05': '/assets/aistudio/Messenger_creation_80FAC205-A568-4023-BC89-6DD5070A2C04_1649b20f.jpeg',
  'mech-item-06': '/assets/aistudio/Messenger_creation_8A8266E6-FB1D-4FE1-903E-377D663B8357_310e6941.jpeg',
  'mech-item-08': '/assets/aistudio/Messenger_creation_CBE8CFF9-5BF5-49EF-98BD-225B733C3CC6_0b40045c.jpeg',
  'jewel-item-07': '/assets/aistudio/Messenger_creation_77CD61C2-E6A3-49C8-90E7-4EA8B7CDE1BA_448564bf.jpeg',
  'jewel-item-08': '/assets/aistudio/Messenger_creation_7A970E1A-618E-43FB-AAA6-01ED725A074C_67fddf56.jpeg',
  'jewel-item-10': '/assets/aistudio/Messenger_creation_89C44A71-F25D-4814-A28C-DE6DB373BF44_ca2f7c03.jpeg',
  'jewel-item-15': '/assets/aistudio/Messenger_creation_CC72B38A-3722-4C71-BE34-02C0C8216542_57d96e3b.jpeg',
};
const BUILTIN_ITEMS_BY_ID = new Map(BUILTIN_INITIAL_ITEMS.map((it) => [it.id, it]));

function loadLocalRetiredIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RETIRED_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function saveLocalRetiredIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RETIRED_IDS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore
  }
}

let inMemoryRetiredIds: string[] = loadLocalRetiredIds();
let inMemoryCatalogItems: StoreItem[] | null = null;
const locallyCommittedVersions = new Set<number>();

function getCombinedRetiredSet(extraRetiredIds?: string[]): Set<string> {
  const combined = new Set<string>(RETIRED_BUILTIN_ITEM_IDS);
  inMemoryRetiredIds.forEach((id) => combined.add(id));
  if (extraRetiredIds) {
    extraRetiredIds.forEach((id) => combined.add(id));
  }
  return combined;
}

function setLocalCatalogVersion(version: number) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VERSION_KEY, String(version));
  } catch {
    // Ignore
  }
}

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
  if (inMemoryCatalogItems && inMemoryCatalogItems.length > 0) {
    return inMemoryCatalogItems;
  }
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
    if (items.length > 0) {
      inMemoryCatalogItems = items;
      return items;
    }
  } catch {
    // Fallback to legacy localStorage
  }
  return getCachedItems();
}

async function saveCachedItemsAsync(items: StoreItem[], version?: number): Promise<void> {
  inMemoryCatalogItems = items;
  if (typeof window === 'undefined') return;
  if (typeof version === 'number') {
    setLocalCatalogVersion(version);
  }
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

  try {
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
  if (inMemoryCatalogItems && inMemoryCatalogItems.length > 0) {
    return inMemoryCatalogItems;
  }
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

function normalizeStoreId(storeId: string): string {
  return storeId === 'stationery' ? 'library' : storeId;
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

  const rawStoreId = typeof data.storeId === 'string' ? data.storeId : '';

  return {
    id: typeof data.id === 'string' ? data.id : docId,
    storeId: normalizeStoreId(rawStoreId),
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
  return true;
}

export function mergeWithFallbackLibraryItems(
  items: StoreItem[],
  _isSeededOnServer?: boolean,
  extraRetiredIds?: string[]
): StoreItem[] {
  const retiredSet = getCombinedRetiredSet(extraRetiredIds);
  const cleaned = items
    .filter((it) => !retiredSet.has(it.id))
    .map((it) => {
      const normalizedStoreId = normalizeStoreId(it.storeId);
      const brokenUrl = LEGACY_BROKEN_IMAGE_BY_ID[it.id];
      const canonical = BUILTIN_ITEMS_BY_ID.get(it.id);
      if (brokenUrl && canonical && it.imageUrl === brokenUrl) {
        return {
          ...it,
          storeId: normalizedStoreId,
          name: canonical.name,
          priceCoins: canonical.priceCoins,
          imageUrl: canonical.imageUrl,
        };
      }
      if (normalizedStoreId !== it.storeId) {
        return { ...it, storeId: normalizedStoreId };
      }
      return it;
    });
  const existingIds = new Set(cleaned.map((it) => it.id));
  const missing = BUILTIN_INITIAL_ITEMS.filter(
    (it) => !retiredSet.has(it.id) && !existingIds.has(it.id)
  );
  return missing.length > 0 ? [...cleaned, ...missing] : cleaned;
}

export async function fetchAllItemsFromServer(): Promise<StoreItem[]> {
  const itemsPath = 'items';
  const q = query(collection(db, itemsPath), where('deleted', '==', false));
  const snapshot = await getDocsFromServer(q);
  const retiredSet = getCombinedRetiredSet();
  const loaded: StoreItem[] = [];
  snapshot.forEach((docSnap) => {
    const mapped = mapDocToStoreItem(docSnap.id, docSnap.data() as Record<string, unknown>);
    if (!retiredSet.has(mapped.id)) {
      loaded.push(mapped);
    }
  });
  loaded.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  return loaded;
}

/**
 * Listens ONLY to the tiny `meta/catalog` version document (1 doc instead of reading hundreds of docs on every reload).
 * Fetches `items` from Firestore ONLY when another client changed the remote catalog version or local IndexedDB cache is empty.
 */
export function subscribeToItems(
  onItems: (items: StoreItem[]) => void,
  onError?: (err: Error, isQuota: boolean) => void
): () => void {
  let active = true;
  let isFetching = false;
  let hasDeliveredInitialCache = false;

  const deliverCachedFirst = async (): Promise<StoreItem[]> => {
    const cached = await getCachedItemsAsync();
    const displayItems = mergeWithFallbackLibraryItems(cached);
    inMemoryCatalogItems = displayItems;
    if (active && !hasDeliveredInitialCache && displayItems.length > 0) {
      hasDeliveredInitialCache = true;
      onItems(displayItems);
    }
    return displayItems;
  };

  void deliverCachedFirst();

  const metaRef = doc(db, 'meta', 'catalog');
  const unsubscribe = onSnapshot(
    metaRef,
    async (metaSnap) => {
      if (!active) return;

      const metaData = metaSnap.exists() ? metaSnap.data() : undefined;
      const remoteVersion =
        metaData && typeof metaData.version === 'number' ? (metaData.version as number) : 0;

      if (metaData && Array.isArray(metaData.retiredIds)) {
        const remoteRetired = metaData.retiredIds.filter(
          (id): id is string => typeof id === 'string'
        );
        const mergedRetired = Array.from(new Set([...inMemoryRetiredIds, ...remoteRetired]));
        inMemoryRetiredIds = mergedRetired;
        saveLocalRetiredIds(mergedRetired);
      }

      const localVersion = getLocalCatalogVersion();
      const cached = await deliverCachedFirst();

      // Skip full collection read when this client just committed the version OR local cache already matches remote
      if (
        locallyCommittedVersions.has(remoteVersion) ||
        (localVersion !== null && remoteVersion === localVersion)
      ) {
        const synced = mergeWithFallbackLibraryItems(cached);
        inMemoryCatalogItems = synced;
        onItems(synced);
        return;
      }

      if (isFetching) return;
      isFetching = true;

      try {
        const freshItems = await fetchAllItemsFromServer();
        if (!active) return;

        const mergedFresh = mergeWithFallbackLibraryItems(freshItems);
        inMemoryCatalogItems = mergedFresh;
        setLocalCatalogVersion(remoteVersion);
        void saveCachedItemsAsync(mergedFresh, remoteVersion);
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
  const normalizedStoreId = normalizeStoreId(storeId);
  const itemId = generateSafeId(normalizedStoreId);
  const actionId = generateSafeId('act');
  const clean = sanitizeItemInput(itemData);
  const itemPath = `items/${itemId}`;
  const nextVersion = Date.now();

  // Register version before commit so local snapshot listener skips redundant full-collection re-fetch
  locallyCommittedVersions.add(nextVersion);
  setLocalCatalogVersion(nextVersion);

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
      storeId: normalizedStoreId,
      ...clean,
      deleted: false,
      lastActionId: actionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(
      doc(db, 'meta', 'catalog'),
      {
        version: nextVersion,
        lastActionId: actionId,
        librarySeeded: true,
        retiredIds: inMemoryRetiredIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();

    const createdItem: StoreItem = {
      id: itemId,
      storeId: normalizedStoreId,
      ...clean,
      createdAtMs: nextVersion,
    };

    const currentItems = inMemoryCatalogItems ?? mergeWithFallbackLibraryItems(getCachedItems());
    const updatedCache = [createdItem, ...currentItems.filter((i) => i.id !== itemId)];
    inMemoryCatalogItems = updatedCache;
    void saveCachedItemsAsync(updatedCache, nextVersion);

    return createdItem;
  } catch (error) {
    locallyCommittedVersions.delete(nextVersion);
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
  adminCode: string,
  storeIdHint?: string
): Promise<void> {
  const actionId = generateSafeId('act');
  const clean = sanitizeItemInput(itemData);
  const itemPath = `items/${itemId}`;
  const nextVersion = Date.now();

  locallyCommittedVersions.add(nextVersion);
  setLocalCatalogVersion(nextVersion);

  try {
    let existsInFirestore = !BUILTIN_ITEMS_BY_ID.has(itemId);
    if (!existsInFirestore) {
      const snap = await getDocFromServer(doc(db, 'items', itemId));
      existsInFirestore = snap.exists();
    }

    const batch = writeBatch(db);
    if (existsInFirestore) {
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
    } else {
      const canonical = BUILTIN_ITEMS_BY_ID.get(itemId);
      const resolvedStoreId = normalizeStoreId(storeIdHint || canonical?.storeId || 'library');
      batch.set(doc(db, 'adminActions', actionId), {
        code: adminCode,
        itemId,
        action: 'create',
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, 'items', itemId), {
        id: itemId,
        storeId: resolvedStoreId,
        ...clean,
        deleted: false,
        lastActionId: actionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(
      doc(db, 'meta', 'catalog'),
      {
        version: nextVersion,
        lastActionId: actionId,
        librarySeeded: true,
        retiredIds: inMemoryRetiredIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();

    const currentItems = inMemoryCatalogItems ?? mergeWithFallbackLibraryItems(getCachedItems());
    const updatedCache = currentItems.map((item) =>
      item.id === itemId ? { ...item, ...clean } : item
    );
    inMemoryCatalogItems = updatedCache;
    void saveCachedItemsAsync(updatedCache, nextVersion);
  } catch (error) {
    locallyCommittedVersions.delete(nextVersion);
    if (isQuotaExceededError(error)) {
      throw new Error('Өдрийн үнэгүй лимит (Quota limit exceeded) дууссан байна.');
    }
    handleFirestoreError(error, OperationType.UPDATE, itemPath);
  }
}

export async function deleteStoreItemInFirestore(
  itemId: string,
  lordCode: string
): Promise<void> {
  if (lordCode !== LORD_ACCESS_CODE) {
    throw new Error('Бараа устгахын тулд Lord эрхийн код шаардлагатай.');
  }

  const actionId = generateSafeId('del');
  const itemPath = `items/${itemId}`;
  const nextVersion = Date.now();
  const isBuiltin = BUILTIN_ITEMS_BY_ID.has(itemId);
  const nextRetiredIds = isBuiltin
    ? Array.from(new Set([...inMemoryRetiredIds, itemId]))
    : inMemoryRetiredIds;

  locallyCommittedVersions.add(nextVersion);
  setLocalCatalogVersion(nextVersion);

  try {
    let existsInFirestore = !isBuiltin;
    if (isBuiltin) {
      try {
        const snap = await getDocFromServer(doc(db, 'items', itemId));
        existsInFirestore = snap.exists();
      } catch {
        existsInFirestore = false;
      }
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'adminActions', actionId), {
      code: lordCode,
      itemId,
      action: 'delete',
      createdAt: serverTimestamp(),
    });

    if (existsInFirestore) {
      batch.update(doc(db, 'items', itemId), {
        deleted: true,
        lastActionId: actionId,
        updatedAt: serverTimestamp(),
      });
    }

    batch.set(
      doc(db, 'meta', 'catalog'),
      {
        version: nextVersion,
        lastActionId: actionId,
        librarySeeded: true,
        retiredIds: nextRetiredIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();

    if (isBuiltin) {
      inMemoryRetiredIds = nextRetiredIds;
      saveLocalRetiredIds(nextRetiredIds);
    }

    const currentItems = inMemoryCatalogItems ?? mergeWithFallbackLibraryItems(getCachedItems());
    const updatedCache = currentItems.filter((item) => item.id !== itemId);
    inMemoryCatalogItems = updatedCache;
    void saveCachedItemsAsync(updatedCache, nextVersion);
  } catch (error) {
    locallyCommittedVersions.delete(nextVersion);
    if (isQuotaExceededError(error)) {
      throw new Error('Өдрийн үнэгүй лимит (Quota limit exceeded) дууссан байна.');
    }
    handleFirestoreError(error, OperationType.DELETE, itemPath);
  }
}
