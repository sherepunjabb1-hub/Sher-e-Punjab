import React, { useState } from 'react';
import { Flame, Leaf, MessageCircle, Sparkles, Utensils } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { RestaurantLogo } from './RestaurantLogo';

interface HeroBannerProps {
  currentLang: Language;
  onExploreClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  customLogoUrl?: string | null;
  heroBgUrl?: string | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentLang,
  onExploreClick,
  searchQuery,
  onSearchChange,
  customLogoUrl,
  heroBgUrl,
}) => {
  const t = TRANSLATIONS[currentLang];
  const [bgLoadError, setBgLoadError] = useState(false);

  const hasCustomBg = Boolean(heroBgUrl && heroBgUrl.trim() && !bgLoadError);

  return (
    <div className="relative overflow-hidden bg-[#0A0A0A] border-b border-white/10 min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
      {/* 1. Full-Bleed Background Image (Fulfills the entire background smoothly when uploaded) */}
      {hasCustomBg && (
        <>
          <img
            src={heroBgUrl!.trim()}
            alt="Sher E Punjab Atmosphere"
            className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
            onError={() => setBgLoadError(true)}
          />
          {/* Rich cinematic dark gradient overlays ensuring perfect text contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-[#0A0A0A]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black/40 via-black/75 to-[#0A0A0A]" />
        </>
      )}

      {/* 2. Default Ambient Gold Atmospheric Lighting (Always layered for luxury depth) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-[#0A0A0A]/60 to-[#0A0A0A] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#D4AF37]/10 blur-3xl rounded-full pointer-events-none" />

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Authentic Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase shadow-lg shadow-black/50">
            <div className="w-4 h-4 shrink-0 rounded-full overflow-hidden flex items-center justify-center">
              <RestaurantLogo customLogoUrl={customLogoUrl} className="w-full h-full object-contain" />
            </div>
            <span>{currentLang === 'es' ? 'Sabor Tradicional de la India en Quito' : 'Authentic Flavors of India in Quito'}</span>
          </div>

          {/* Headline */}
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5F5F0] leading-[1.15] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            {currentLang === 'es' ? (
              <>
                Descubre el Arte del <span className="text-[#D4AF37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">Horno Tandoor</span> y Especias Ancestrales
              </>
            ) : (
              <>
                Experience Authentic <span className="text-[#D4AF37] drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">Tandoori Delicacies</span> & Royal Curries
              </>
            )}
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-2xl mx-auto font-sans drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            {currentLang === 'es'
              ? 'Platos preparados artesanalmente al momento con hierbas frescas, mantequilla clarificada, azafrán y el auténtico nivel de picante a tu gusto.'
              : 'Handcrafted dishes cooked fresh to order with aromatic whole spices, saffron, tandoori marinades, and custom spice levels.'}
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 pt-1 text-xs font-medium text-white/90">
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md shadow-black/40">
              <Flame className="w-3.5 h-3.5 text-[#FF6321]" />
              {currentLang === 'es' ? 'Horno Tandoor de Barro' : 'Clay Tandoor Oven'}
            </span>
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md shadow-black/40">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              {currentLang === 'es' ? 'Opciones Vegetarianas & Veganas' : 'Vegetarian & Vegan Friendly'}
            </span>
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-md shadow-black/40">
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
                className="w-full bg-black/70 backdrop-blur-lg border border-white/20 focus:border-[#D4AF37] rounded-2xl py-3.5 pl-5 pr-12 text-sm text-[#F5F5F0] placeholder-white/50 shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs px-2 py-1 bg-white/10 rounded-lg transition-colors"
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

