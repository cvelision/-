import React from 'react';
import { ShoppingBag, ShieldCheck, Lock, Search, Bell, Crown } from 'lucide-react';
import { DiamondLogo } from './DiamondLogo';
import { DistrictId } from '../types';

interface HeaderProps {
  totalCartCount: number;
  totalStoreCount: number;
  onOpenCart: () => void;
  ownerMode: boolean;
  onToggleOwnerMode: () => void;
  lordMode: boolean;
  onToggleLordMode: () => void;
  adminUnreadCount: number;
  onOpenAdminNotifications: () => void;
  activeDistrict: DistrictId | 'all';
  onSelectDistrict: (districtId: DistrictId | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onScrollToTop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCartCount,
  totalStoreCount,
  onOpenCart,
  ownerMode,
  onToggleOwnerMode,
  lordMode,
  onToggleLordMode,
  adminUnreadCount,
  onOpenAdminNotifications,
  activeDistrict,
  onSelectDistrict,
  searchQuery,
  onSearchChange,
  onScrollToTop,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080c16] border-b border-slate-800/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand Name */}
          <button
            onClick={onScrollToTop}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer shrink-0"
          >
            <DiamondLogo className="w-8 h-8" glow={false} />
            <span className="font-cinzel text-lg sm:text-xl font-bold tracking-wider text-slate-100">
              Sapphirely
            </span>
          </button>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Хайх..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0c111e] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {ownerMode && (
              <>
                <button
                  onClick={onOpenAdminNotifications}
                  className="relative flex items-center justify-center p-2 rounded-lg bg-[#0d1220] hover:bg-[#151d30] border border-slate-700/80 text-[#c8ba96] transition-colors cursor-pointer"
                  title="Зургийн мэдэгдэл (Зөвхөн Админ)"
                  aria-label="Админ мэдэгдэл"
                >
                  <Bell className="w-4 h-4" />
                  {adminUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center bg-[#8f805d] text-slate-950 text-[10px] font-black rounded-full">
                      {adminUnreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={onToggleLordMode}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    lordMode
                      ? 'bg-[#2a241b] text-[#d4c7a5] border-[#6e6246]/80'
                      : 'bg-[#0d1220] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={lordMode ? 'Lord тохиргооноос гарах' : 'Lord тохиргооруу нэвтрэх (0625)'}
                >
                  <Crown className="w-3.5 h-3.5 text-[#c8ba96]" />
                  <span className="hidden sm:inline">
                    {lordMode ? 'Lord (Гарах)' : 'Lord'}
                  </span>
                </button>
              </>
            )}

            <button
              onClick={onToggleOwnerMode}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                ownerMode
                  ? 'bg-[#23201a] text-[#d4c7a5] border-[#6e6246]/60'
                  : 'bg-[#0d1220] text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {ownerMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#c8ba96]" />
                  <span className="hidden sm:inline">Админ (Гарах)</span>
                  <span className="sm:hidden">Админ</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Админ нэвтрэх</span>
                </>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg bg-[#27344a] hover:bg-[#32425c] border border-slate-600/70 text-slate-100 text-xs font-semibold cursor-pointer transition-colors"
              aria-label="Сагс үзэх"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-[#8f805d] text-slate-950 text-[10px] font-black rounded-full">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span>Сагс</span>
            </button>
          </div>
        </div>

        {/* Mobile Search bar */}
        <div className="md:hidden pb-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Байгууллага, бараа хайх..."
              className="w-full pl-10 pr-4 py-2 bg-[#0c111e] border border-slate-800 rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
            />
          </div>
        </div>

        {/* District Filter Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => onSelectDistrict('all')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'all'
                ? 'bg-[#27344a] text-slate-100 border border-slate-600/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Бүх байгууллагууд ({totalStoreCount})
          </button>
          <button
            onClick={() => onSelectDistrict('east')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'east'
                ? 'bg-[#27344a] text-slate-100 border border-slate-600/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Зүүн хот (5)
          </button>
          <button
            onClick={() => onSelectDistrict('west')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'west'
                ? 'bg-[#27344a] text-slate-100 border border-slate-600/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Баруун хот (5)
          </button>
          <button
            onClick={() => onSelectDistrict('south')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'south'
                ? 'bg-[#27344a] text-slate-100 border border-slate-600/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Өмнөд хот (6)
          </button>
        </div>
      </div>
    </header>
  );
};
