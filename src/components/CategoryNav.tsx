import React from 'react';
import { Flame, Leaf, Sparkles, Utensils } from 'lucide-react';
import { Category, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  dietaryFilter: 'all' | 'veg' | 'non_veg' | 'specials';
  onSelectDietaryFilter: (filter: 'all' | 'veg' | 'non_veg' | 'specials') => void;
  currentLang: Language;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  dietaryFilter,
  onSelectDietaryFilter,
  currentLang,
}) => {
  const t = TRANSLATIONS[currentLang];

  return (
    <div className="sticky top-16 sm:top-20 z-30 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/10 py-3 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">
        {/* Dietary Filters Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 text-xs">
          <button
            onClick={() => onSelectDietaryFilter('all')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              dietaryFilter === 'all'
                ? 'bg-white/20 text-white border border-white/30 font-bold shadow-sm'
                : 'glass text-white/60 hover:text-white border border-white/10'
            }`}
          >
            <Utensils className="w-3 h-3" />
            {t.allDiet}
          </button>
          <button
            onClick={() => onSelectDietaryFilter('veg')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              dietaryFilter === 'veg'
                ? 'bg-emerald-600 text-white font-bold shadow-sm ring-1 ring-emerald-400'
                : 'glass text-emerald-400 border border-emerald-500/30 hover:bg-emerald-950/30'
            }`}
          >
            <Leaf className="w-3 h-3" />
            {t.vegOnly}
          </button>
          <button
            onClick={() => onSelectDietaryFilter('non_veg')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              dietaryFilter === 'non_veg'
                ? 'bg-[#FF6321] text-white font-bold shadow-sm ring-1 ring-orange-400'
                : 'glass text-orange-400 border border-orange-500/30 hover:bg-orange-950/30'
            }`}
          >
            <Flame className="w-3 h-3" />
            {t.nonVegOnly}
          </button>
          <button
            onClick={() => onSelectDietaryFilter('specials')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
              dietaryFilter === 'specials'
                ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                : 'glass text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {t.chefSpecials}
          </button>
        </div>

        {/* Category Scrollable Navigation */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all shrink-0 ${
              activeCategoryId === 'all'
                ? 'glass border-[#D4AF37]/60 text-[#D4AF37] bg-[#D4AF37]/10 shadow-lg shadow-[#D4AF37]/10 font-bold'
                : 'glass border-white/10 text-white/60 hover:text-white hover:border-white/20'
            }`}
          >
            {t.allCategories}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-6 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all shrink-0 ${
                activeCategoryId === cat.id
                  ? 'glass border-[#D4AF37]/60 text-[#D4AF37] bg-[#D4AF37]/10 shadow-lg shadow-[#D4AF37]/10 font-bold'
                  : 'glass border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {currentLang === 'es' ? cat.nameEs : cat.nameEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
