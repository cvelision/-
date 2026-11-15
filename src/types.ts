export type DistrictId = 'main' | 'central' | 'east' | 'west' | 'south';

export interface District {
  id: DistrictId;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  iconName: string;
  colorScheme: string;
}

export interface StoreItem {
  id: string;
  storeId: string;
  name: string;
  description: string;
  priceCoins: number; // In coins (зоос)
  imageUrl: string;
  stock?: number;
  featured?: boolean;
}

export interface Store {
  id: string;
  name: string;
  districtId: DistrictId;
  category: string;
  description: string;
  doorTitle: string;
  doorColor: string;
  mansionStyle: string;
  bannerImage: string;
  items: StoreItem[];
}

export interface CartItem {
  item: StoreItem;
  store: Store;
  quantity: number;
}

export interface StoreCheque {
  id: string;
  date: string;
  senderName: string; // Илгээгч
  receiverName: string; // Хүлээн авагч: Тухайн байгууллагын нэр буюу зардаг зүйлс
  storeId: string;
  storeName: string;
  totalCoins: number; // Дүн
  purpose: string; // Утга: "Худалдан авалт"
  royalSealText: string; // "Либертиа хатан хааны төр засаглал"
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}
