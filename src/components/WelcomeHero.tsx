import React from 'react';
import { ArrowDown } from 'lucide-react';
import { DiamondLogo } from './DiamondLogo';
import { playDoorOpenSound } from '../utils/audio';

interface WelcomeHeroProps {
  onEnterMall: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onEnterMall }) => {
  const handleStartShopping = () => {
    playDoorOpenSound();
    onEnterMall();
  };

  return (
    <section className="py-6 sm:py-16 bg-[#070a13] border-b border-slate-800/80 text-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Simple clean Diamond Logo */}
        <div className="mb-3 sm:mb-6 flex justify-center">
          <DiamondLogo className="w-10 h-10 sm:w-14 sm:h-14" glow={false} />
        </div>

        {/* Required welcome greeting */}
        <h1 className="font-cinzel text-lg sm:text-3xl md:text-4xl font-bold text-slate-100 mb-4 sm:mb-8 leading-snug">
          Саффир улсын нэгдсэн худалдааны төв буюу их дэлгүүрт тавтай морил
        </h1>

        {/* Required "Худалдан авалт хийх" button */}
        <button
          onClick={handleStartShopping}
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-[#27344a] hover:bg-[#32425c] border border-slate-600/70 text-slate-100 font-semibold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer"
        >
          <span>Худалдан авалт хийх</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
