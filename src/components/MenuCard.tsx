import React from 'react';
import { Flame, Leaf, Minus, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Language, MenuItem } from '../types';
import { SPICE_LEVEL_LABELS, TRANSLATIONS } from '../utils/translations';

interface MenuCardProps {
  item: MenuItem;
  currentLang: Language;
  quantityInCart: number;
  onQuickAdd: (item: MenuItem) => void;
  onQuickRemove: (item: MenuItem) => void;
  onOpenCustomize: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  currentLang,
  quantityInCart,
  onQuickAdd,
  onQuickRemove,
  onOpenCustomize,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';

  const name = isEs ? item.nameEs : (item.nameEn || item.nameEs);
  const description = isEs ? item.descriptionEs : (item.descriptionEn || item.descriptionEs);

  const hasCustomizations = item.spiceCustomizable || (item.availableAddons && item.availableAddons.length > 0);

  return (
    <div className="dish-card bg-[#141414] border border-white/5 hover:border-[#D4AF37]/40 shadow-2xl transition-all duration-300 flex flex-col justify-between group rounded-xl overflow-hidden">
      {/* Top Image Box with Sophisticated Dark Gradient Overlay */}
      <div
        className="relative h-48 sm:h-52 w-full overflow-hidden cursor-pointer"
        onClick={() => onOpenCustomize(item)}
      >
        <img
          src={item.imageUrl}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Sophisticated Dark Gradient Overlay */}
        <div className="absolute inset-0 dish-overlay" />

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap gap-1.5">
            {item.isVegetarian ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {t.vegOnly}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                {isEs ? 'Non-Veg' : 'Non-Veg'}
              </span>
            )}

            {item.isChefSpecial && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 backdrop-blur-sm uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                {isEs ? 'Chef Special' : "Chef's Pick"}
              </span>
            )}
          </div>

          {/* Price Badge on Top Right */}
          <span className="px-2.5 py-1 rounded-full text-sm font-bold bg-black/80 text-[#D4AF37] border border-[#D4AF37]/30 shadow-md backdrop-blur-sm font-mono">
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Spice Level Indicator on Bottom of Image */}
        {item.defaultSpiceLevel && (
          <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[10px] text-white/90 bg-black/70 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm uppercase tracking-wider">
            <Flame className="w-3 h-3 text-[#FF6321]" />
            <span>
              {isEs
                ? SPICE_LEVEL_LABELS[item.defaultSpiceLevel].es
                : SPICE_LEVEL_LABELS[item.defaultSpiceLevel].en}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5 cursor-pointer" onClick={() => onOpenCustomize(item)}>
          <h3 className="serif text-xl text-[#F5F5F0] group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-white/70 leading-relaxed line-clamp-2 font-sans">
            {description}
          </p>
        </div>

        {/* Bottom Actions Row */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          {/* Customization Link if available */}
          {hasCustomizations ? (
            <button
              onClick={() => onOpenCustomize(item)}
              className="text-xs text-[#D4AF37] hover:text-[#e8ca68] flex items-center gap-1 font-medium py-1 px-2 rounded-full hover:bg-white/5 transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{t.customize}</span>
            </button>
          ) : (
            <div />
          )}

          {/* Add to Cart / Inline Quantity Control */}
          <div className="shrink-0">
            {quantityInCart > 0 ? (
              <div className="inline-flex items-center bg-white/10 border border-white/20 text-white rounded-full p-0.5">
                <button
                  onClick={() => onQuickRemove(item)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95 text-base"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-xs text-[#D4AF37] font-mono">{quantityInCart}</span>
                <button
                  onClick={() => onQuickAdd(item)}
                  className="w-7 h-7 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black flex items-center justify-center transition-colors active:scale-95 text-base font-bold"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (hasCustomizations) {
                    onOpenCustomize(item);
                  } else {
                    onQuickAdd(item);
                  }
                }}
                className="bg-[#D4AF37] text-black px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#c49f27] active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.add}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
