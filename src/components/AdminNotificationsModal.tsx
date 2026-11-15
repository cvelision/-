import React, { useState } from 'react';
import { StoreItem } from '../types';
import { Bell, BellRing, CheckCheck, Copy, Check, ExternalLink, X } from 'lucide-react';

export interface AdminNotificationEntry {
  item: StoreItem;
  storeName: string;
  isUnread: boolean;
}

interface AdminNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotificationEntry[];
  unreadCount: number;
  browserPermission: NotificationPermission | 'unsupported';
  onRequestBrowserPermission: () => void;
  onMarkAllRead: () => void;
  onOpenStore: (storeId: string) => void;
}

function formatDateTime(ms?: number): string {
  if (!ms) return 'Саяхан';
  try {
    return new Date(ms).toLocaleString('mn-MN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Саяхан';
  }
}

export const AdminNotificationsModal: React.FC<AdminNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  browserPermission,
  onRequestBrowserPermission,
  onMarkAllRead,
  onOpenStore,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const customItems = notifications
    .map((n) => n.item)
    .filter((it) => !it.id.startsWith('lib-item-') && !it.id.startsWith('obs-item-'));

  const handleCopyItemsCode = async () => {
    const targetItems = customItems.length > 0 ? customItems : notifications.map((n) => n.item);
    const serialized = JSON.stringify(
      targetItems.map((it) => ({
        id: it.id,
        storeId: it.storeId,
        name: it.name,
        description: it.description,
        priceCoins: it.priceCoins,
        imageUrl: it.imageUrl,
        stock: it.stock ?? 30,
        featured: Boolean(it.featured),
      })),
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(serialized);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-[#070e24] border border-blue-800/70 rounded-2xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="p-4 bg-[#091228] border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-white">
                Админ мэдэгдэл ({unreadCount} шинэ)
              </h3>
              <p className="text-[11px] text-slate-400">
                Зөвхөн админ эрхээр нэвтэрсэн үед зураг болон барааны мэдэгдэл харагдана
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser push notification helper */}
        <div className="px-4 py-2.5 bg-[#050b1c] border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
          {browserPermission === 'granted' ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" />
              Хөтөчийн шууд мэдэгдэл идэвхтэй байна
            </span>
          ) : browserPermission === 'unsupported' ? (
            <span className="text-slate-400">
              Таны хөтөч дээрх систем мэдэгдэл дэмжихгүй тул эндээс шууд хянана уу
            </span>
          ) : (
            <>
              <span className="text-slate-300">
                Зураг нэмэгдэх бүрт хөтөч дээр мэдэгдэл авах:
              </span>
              <button
                type="button"
                onClick={onRequestBrowserPermission}
                className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold whitespace-nowrap cursor-pointer"
              >
                Мэдэгдэл асаах
              </button>
            </>
          )}
        </div>

        {/* Notification List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Одоогоор нэмэгдсэн барааны зураг алга байна.
            </div>
          ) : (
            notifications.map((entry) => (
              <div
                key={entry.item.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  entry.isUnread
                    ? 'bg-blue-950/50 border-amber-500/50'
                    : 'bg-[#050a18] border-slate-800'
                }`}
              >
                <img
                  src={entry.item.imageUrl}
                  alt={entry.item.name}
                  className="w-12 h-12 rounded-lg object-contain bg-[#020611] border border-slate-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {entry.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                    <p className="text-xs font-bold text-slate-100 truncate">
                      {entry.item.name}
                    </p>
                  </div>
                  <p className="text-[11px] text-blue-300 truncate">
                    {entry.storeName} • 🪙 {entry.item.priceCoins.toLocaleString()} Зоос
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {formatDateTime(entry.item.createdAtMs)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenStore(entry.item.storeId);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Орох</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050a18] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Бүгдийг уншсан болгох</span>
            </button>
            <button
              type="button"
              onClick={handleCopyItemsCode}
              disabled={notifications.length === 0}
              className="px-3 py-1.5 rounded bg-blue-950 hover:bg-blue-900 disabled:opacity-40 border border-blue-800/70 text-xs text-blue-200 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Хуулагдлаа</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Код хуулах</span>
                </>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 cursor-pointer"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};
