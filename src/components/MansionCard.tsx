import React from 'react';
import { Store } from '../types';
import { LogIn, Plus } from 'lucide-react';
import { playDoorOpenSound } from '../utils/audio';

interface MansionCardProps {
  store: Store;
  onOpenStore: (store: Store) => void;
  ownerMode: boolean;
  onAddNewItem: (store: Store) => void;
  index?: number;
}

export const MansionCard: React.FC<MansionCardProps> = ({
  store,
  onOpenStore,
  ownerMode,
  onAddNewItem,
}) => {
  const handleOpenDoor = (e: React.MouseEvent) => {
    e.stopPropagation();
    playDoorOpenSound();
    onOpenStore(store);
  };

  return (
    <div
      onClick={handleOpenDoor}
      className="bg-[#0b1020] rounded-lg border border-slate-800 hover:border-slate-600 p-4 transition-colors cursor-pointer flex flex-col justify-between gap-3"
    >
      {/* Store Name Only - No image, no image banner text, no description */}
      <div className="flex items-center justify-between">
        <h3 className="font-cinzel text-base font-bold text-slate-100">
          {store.name}
        </h3>
        {ownerMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNewItem(store);
            }}
            className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
            title="Бараа нэмэх"
          >
            <Plus className="w-3 h-3" />
            <span>Нэмэх</span>
          </button>
        )}
      </div>

      {/* Door Action Button */}
      <button
        onClick={handleOpenDoor}
        className="w-full py-2 px-3 rounded bg-[#10182e] hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5 text-slate-400" />
        <span>Хаалга</span>
      </button>
    </div>
  );
};
