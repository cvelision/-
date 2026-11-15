import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { StoreItem } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const ADMIN_ACCESS_CODE = '54PPH1R3';

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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'items', 'health-check'));
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

function sanitizeItemInput(
  itemData: {
    name: string;
    description: string;
    priceCoins: number;
    imageUrl: string;
    stock?: number;
    featured?: boolean;
  }
) {
  const name = itemData.name.trim().slice(0, 200);
  const description = itemData.description.trim().slice(0, 1000);
  const priceCoins = Math.min(100000000, Math.max(1, Math.round(Number(itemData.priceCoins) || 1)));
  const imageUrl = itemData.imageUrl.trim().slice(0, 700000);
  const stock = Math.min(1000000, Math.max(0, Math.round(Number(itemData.stock ?? 10))));
  const featured = Boolean(itemData.featured);

  return { name, description, priceCoins, imageUrl, stock, featured };
}

export function subscribeToItems(
  onItems: (items: StoreItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const itemsPath = 'items';
  const q = query(collection(db, itemsPath), where('deleted', '==', false));

  return onSnapshot(
    q,
    (snapshot) => {
      const loaded: StoreItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: typeof data.id === 'string' ? data.id : docSnap.id,
          storeId: typeof data.storeId === 'string' ? data.storeId : '',
          name: typeof data.name === 'string' ? data.name : '',
          description: typeof data.description === 'string' ? data.description : '',
          priceCoins: typeof data.priceCoins === 'number' ? data.priceCoins : 0,
          imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
          stock: typeof data.stock === 'number' ? data.stock : 10,
          featured: Boolean(data.featured),
        });
      });
      onItems(loaded);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, itemsPath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
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
): Promise<void> {
  const itemId = generateSafeId(storeId);
  const actionId = generateSafeId('act');
  const clean = sanitizeItemInput(itemData);
  const itemPath = `items/${itemId}`;

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
    await batch.commit();
  } catch (error) {
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
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, itemPath);
  }
}

export async function deleteStoreItemInFirestore(
  itemId: string,
  adminCode: string
): Promise<void> {
  const actionId = generateSafeId('act');
  const itemPath = `items/${itemId}`;

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'adminActions', actionId), {
      code: adminCode,
      itemId,
      action: 'delete',
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'items', itemId), {
      deleted: true,
      lastActionId: actionId,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, itemPath);
  }
}
