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
    <section className="py-14 sm:py-20 bg-[#04091a] border-b border-blue-900/50 text-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Simple clean Diamond Logo */}
        <div className="mb-6 flex justify-center">
          <DiamondLogo className="w-14 h-14" glow={false} />
        </div>

        {/* Required welcome greeting */}
        <h1 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-8 leading-snug">
          Саффир улсын нэгдсэн худалдааны төв буюу их дэлгүүрт тавтай морил
        </h1>

        {/* Required "Худалдан авалт хийх" button */}
        <button
          onClick={handleStartShopping}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm tracking-wide transition-colors cursor-pointer"
        >
          <span>Худалдан авалт хийх</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
