import React from 'react';
import { Flame, Leaf, MessageCircle, Sparkles, Utensils } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { RESTAURANT_CONFIG } from '../data/seedData';

interface HeroBannerProps {
  currentLang: Language;
  onExploreClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentLang,
  onExploreClick,
  searchQuery,
  onSearchChange,
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A] border-b border-white/10">
      {/* Subtle Background Pattern & Ambient Gold Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {/* Authentic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-white/10 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{currentLang === 'es' ? 'Sabor Tradicional de la India en Quito' : 'Authentic Flavors of India in Quito'}</span>
          </div>

          {/* Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F0] leading-tight">
            {currentLang === 'es' ? (
              <>
                Descubre el Arte del <span className="text-[#D4AF37]">Horno Tandoor</span> y Especias Ancestrales
              </>
            ) : (
              <>
                Experience Authentic <span className="text-[#D4AF37]">Tandoori Delicacies</span> & Royal Curries
              </>
            )}
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl mx-auto font-sans">
            {currentLang === 'es'
              ? 'Platos preparados artesanalmente al momento con hierbas frescas, mantequilla clarificada, azafrán y el auténtico nivel de picante a tu gusto.'
              : 'Handcrafted dishes cooked fresh to order with aromatic whole spices, saffron, tandoori marinades, and custom spice levels.'}
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 pt-2 text-xs font-medium text-white/80">
            <span className="flex items-center gap-1.5 glass px-3.5 py-1.5 rounded-full border border-white/10">
              <Flame className="w-3.5 h-3.5 text-[#FF6321]" />
              {currentLang === 'es' ? 'Horno Tandoor de Barro' : 'Clay Tandoor Oven'}
            </span>
            <span className="flex items-center gap-1.5 glass px-3.5 py-1.5 rounded-full border border-white/10">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              {currentLang === 'es' ? 'Opciones Vegetarianas & Veganas' : 'Vegetarian & Vegan Friendly'}
            </span>
            <span className="flex items-center gap-1.5 glass px-3.5 py-1.5 rounded-full border border-white/10">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              {currentLang === 'es' ? 'Pedidos directos por WhatsApp' : 'Direct WhatsApp Orders'}
            </span>
          </div>

          {/* Search Bar */}
          <div className="pt-3 max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-[#F5F5F0] placeholder-white/40 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
