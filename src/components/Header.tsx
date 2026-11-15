import React from 'react';
import { ShoppingBag, ShieldCheck, Lock, Search } from 'lucide-react';
import { DiamondLogo } from './DiamondLogo';
import { DistrictId } from '../types';

interface HeaderProps {
  totalCartCount: number;
  onOpenCart: () => void;
  ownerMode: boolean;
  onToggleOwnerMode: () => void;
  activeDistrict: DistrictId | 'all';
  onSelectDistrict: (districtId: DistrictId | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onScrollToTop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCartCount,
  onOpenCart,
  ownerMode,
  onToggleOwnerMode,
  activeDistrict,
  onSelectDistrict,
  searchQuery,
  onSearchChange,
  onScrollToTop,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070e24] border-b border-blue-900/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand Name */}
          <button
            onClick={onScrollToTop}
            className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
          >
            <DiamondLogo className="w-8 h-8" glow={false} />
            <span className="font-cinzel text-xl font-bold tracking-wider text-white">
              Sapphirely
            </span>
          </button>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Хайх..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0a1435] border border-blue-900 rounded-lg text-xs text-slate-100 placeholder-blue-300/40 focus:outline-none focus:border-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-blue-300 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Actions: Admin Login Toggle & Cart Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleOwnerMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                ownerMode
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/60'
                  : 'bg-[#0a1435] text-blue-300 border-blue-900 hover:text-white'
              }`}
            >
              {ownerMode ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Админ (Гарах)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Админ нэвтрэх</span>
                </>
              )}
            </button>

            {/* Cart Button with badge: "сагсны дээр байх жижигхэн хэсэгт авсан барааных нь тоо нь байна" */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
              aria-label="Сагс үзэх"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-amber-400 text-slate-950 text-[10px] font-black rounded-full">
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
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Байгууллага, бараа хайх..."
              className="w-full pl-10 pr-4 py-2 bg-blue-950/40 border border-blue-800/50 rounded-full text-xs text-slate-100 placeholder-blue-300/40 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* District Filter Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => onSelectDistrict('all')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Бүх байгууллагууд (30)
          </button>
          <button
            onClick={() => onSelectDistrict('east')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'east'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Зүүн хот (5)
          </button>
          <button
            onClick={() => onSelectDistrict('west')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'west'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Баруун хот (5)
          </button>
          <button
            onClick={() => onSelectDistrict('south')}
            className={`px-3 py-1 rounded font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeDistrict === 'south'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Өмнөд хот (6)
          </button>
        </div>
      </div>
    </header>
  );
};
