import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface FloatingCartButtonProps {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
  currentLang: Language;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount,
  totalAmount,
  onClick,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-fade-in">
      <button
        onClick={onClick}
        className="group relative flex items-center gap-3 bg-[#D4AF37] hover:bg-[#c49f27] text-black px-5 py-3.5 rounded-full font-bold shadow-2xl shadow-[#D4AF37]/30 border border-[#D4AF37]/60 transition-all transform hover:scale-105 active:scale-95"
        aria-label="View shopping cart"
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-black text-[#D4AF37] flex items-center justify-center shadow-inner">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FF6321] text-white text-[11px] font-mono font-bold flex items-center justify-center shadow-md animate-pulse">
            {itemCount}
          </span>
        </div>

        <div className="text-left">
          <div className="text-xs uppercase tracking-widest font-extrabold text-black leading-none">
            {t.viewCart}
          </div>
          <div className="text-sm font-mono font-extrabold text-black mt-0.5">
            ${totalAmount.toFixed(2)} USD
          </div>
        </div>
      </button>
    </div>
  );
};
