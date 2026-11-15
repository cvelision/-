import React, { useState, useEffect } from 'react';
import { Store, StoreItem } from '../types';
import { X, Sparkles, Check, Upload } from 'lucide-react';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  store: Store | null;
  editingItem: StoreItem | null;
  onSave: (
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
  ) => Promise<void>;
}

const SAMPLE_PRESET_IMAGES = [
  { name: 'Алтан эрдэнэс', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Хааны хувцас', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80' },
  { name: 'Нарийн боов', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
  { name: 'Болор лонхтой сүрчиг', url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Эртний ном судар', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80' },
  { name: 'Эмийн ургамал, рашаан', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
];

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Зураг уншихад алдаа гарлаа'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Зургийн формат буруу байна'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Зургийг нээхэд алдаа гарлаа'));
      img.onload = () => {
        const MAX_DIM = 640;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.70;
        let compressed = canvas.toDataURL('image/jpeg', quality);
        while (compressed.length > 120000 && quality > 0.32) {
          quality -= 0.08;
          compressed = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(compressed);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  store,
  editingItem,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceCoins, setPriceCoins] = useState<number>(100);
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(10);
  const [featured, setFeatured] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description);
      setPriceCoins(editingItem.priceCoins);
      setImageUrl(editingItem.imageUrl);
      setStock(editingItem.stock || 10);
      setFeatured(!!editingItem.featured);
    } else {
      setName('');
      setDescription('');
      setPriceCoins(100);
      setImageUrl('');
      setStock(10);
      setFeatured(false);
    }
    setError(null);
    setIsSaving(false);
  }, [editingItem, isOpen]);

  if (!isOpen || !store) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError(null);
      const compressed = await compressImageFile(file);
      if (compressed.length > 680000) {
        setError('Зургийн хэмжээ хэт том байна. Өөр жижиг зураг эсвэл URL ашиглана уу.');
        return;
      }
      setImageUrl(compressed);
    } catch {
      setError('Зураг оруулахад алдаа гарлаа.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Барааны нэрийг оруулна уу');
      return;
    }
    if (priceCoins <= 0) {
      setError('Зоосны үнэ 0-ээс их байх ёстой');
      return;
    }
    if (!imageUrl.trim()) {
      setError('Барааны зургийн холбоос эсвэл зураг оруулна уу');
      return;
    }
    if (imageUrl.trim().length > 680000) {
      setError('Зургийн хэмжээ хэт том байна. Дахин өөр зураг сонгоно уу.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(
        store.id,
        {
          name: name.trim(),
          description: description.trim() || `${store.name} өргөөний бараа`,
          priceCoins: Number(priceCoins),
          imageUrl: imageUrl.trim(),
          stock: Number(stock) || 10,
          featured,
        },
        editingItem?.id
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Хадгалах үед алдаа гарлаа: ${err.message}`
          : 'Бараа хадгалах үед алдаа гарлаа'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-xl bg-[#070e24] border border-blue-700/60 rounded-3xl p-6 shadow-2xl z-10 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-blue-900/60">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-amber-400">
              {store.name} өргөөний бараа удирдах
            </span>
            <h3 className="font-cinzel text-xl font-bold text-white">
              {editingItem ? 'Бараа засах' : 'Шинэ бараа нэмэх'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-blue-900/40 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">
              Барааны нэр *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Жишээ: Хатан хааны сувдан хүзүүний зүүлт"
              className="w-full px-3.5 py-2.5 bg-blue-950/60 border border-blue-800 rounded-xl text-sm text-white placeholder-blue-400/40 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-blue-200 mb-1">
                Үнэ (Зоос) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🪙</span>
                <input
                  type="number"
                  min="1"
                  value={priceCoins}
                  onChange={(e) => setPriceCoins(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full pl-8 pr-3 py-2.5 bg-blue-950/60 border border-blue-800 rounded-xl text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-200 mb-1">
                Бэлэн байгаа тоо (Ширхэг)
              </label>
              <input
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 bg-blue-950/60 border border-blue-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">
              Зургийн холбоос (URL эсвэл Компьютероос сонгох) *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-white placeholder-blue-400/40 focus:outline-none focus:border-amber-400"
              />
              <label className="px-3 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Зураг оруулах</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-2 flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-[10px] text-blue-300/70 whitespace-nowrap">Бэлэн зураг:</span>
              {SAMPLE_PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className="px-2 py-0.5 rounded text-[10px] bg-blue-950 hover:bg-blue-900 border border-blue-800/60 text-blue-200 whitespace-nowrap cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {imageUrl && (
              <div className="mt-2 relative h-32 rounded-xl overflow-hidden border border-blue-800/80 bg-slate-950">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setError('Зургийн холбоос буруу эсвэл харагдахгүй байна')}
                />
                <div className="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Зураг бэлэн
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1">
              Барааны тайлбар
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Барааны чанар, хэрэглээ, онцлогийг бичнэ үү..."
              className="w-full px-3.5 py-2 bg-blue-950/60 border border-blue-800 rounded-xl text-xs text-white placeholder-blue-400/40 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="featuredItem"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-blue-950 border-blue-700"
            />
            <label htmlFor="featuredItem" className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Хааны онцлох бараа болгох</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-900/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-semibold text-blue-200 cursor-pointer disabled:opacity-50"
            >
              Цуцлах
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving
                ? 'Хадгалж байна...'
                : editingItem
                  ? 'Өөрчлөлтийг хадгалах'
                  : 'Барааг өргөөнд нэмэх'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
