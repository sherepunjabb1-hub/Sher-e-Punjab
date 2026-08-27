import React, { useEffect, useState } from 'react';
import {
  Check,
  CircleDot,
  CupSoda,
  Flame,
  Minus,
  Plus,
  Utensils,
  Wheat,
  X,
} from 'lucide-react';
import {
  AddonOption,
  CompanionOption,
  Language,
  MenuItem,
  SoftDrinkOption,
  SpiceLevel,
} from '../types';
import { SPICE_LEVEL_LABELS, TRANSLATIONS } from '../utils/translations';
import {
  COMPANION_OPTIONS,
  SOFT_DRINK_OPTIONS,
  getItemCustomizationType,
} from '../utils/menuCustomization';

interface DishCustomizationModalProps {
  item: MenuItem | null;
  currentLang: Language;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    spiceLevel: SpiceLevel | undefined,
    companionOption: CompanionOption | undefined,
    drinkFlavor: SoftDrinkOption | undefined,
    selectedAddons: AddonOption[],
    specialInstructions: string,
    quantity: number
  ) => void;
}

export const DishCustomizationModal: React.FC<DishCustomizationModalProps> = ({
  item,
  currentLang,
  onClose,
  onAddToCart,
}) => {
  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';

  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>('medium');
  const [companionOption, setCompanionOption] = useState<CompanionOption>('plain_naan');
  const [drinkFlavor, setDrinkFlavor] = useState<SoftDrinkOption>('coke');
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Sync state whenever the selected item changes
  useEffect(() => {
    if (item) {
      setSpiceLevel(item.defaultSpiceLevel || 'medium');
      setCompanionOption('plain_naan');
      setDrinkFlavor('coke');
      setInstructions('');
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  const customType = getItemCustomizationType(item);

  const singleUnitPrice = item.price;
  const totalPrice = singleUnitPrice * quantity;

  const name = isEs ? item.nameEs : item.nameEn || item.nameEs;
  const description = isEs ? item.descriptionEs : item.descriptionEn || item.descriptionEs;

  const handleConfirm = () => {
    const finalSpice =
      customType === 'curry_with_companion' || customType === 'starter_spice_only'
        ? spiceLevel
        : undefined;

    const finalCompanion =
      customType === 'curry_with_companion' ? companionOption : undefined;

    const finalFlavor =
      customType === 'soft_drink_flavor' ? drinkFlavor : undefined;

    onAddToCart(
      item,
      finalSpice,
      finalCompanion,
      finalFlavor,
      [], // No unrequested addons
      instructions,
      quantity
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#121212] border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-8 text-[#F5F5F0] flex flex-col max-h-[90vh] glass"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Image */}
        <div className="relative h-44 sm:h-52 w-full shrink-0">
          <img
            src={item.imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 dish-overlay" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="serif text-xl sm:text-2xl font-bold text-[#F5F5F0] drop-shadow-md">
              {name}
            </h3>
            <p className="text-[#D4AF37] font-mono font-bold text-base mt-0.5">
              ${item.price.toFixed(2)} USD
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Description */}
          <p className="text-white/70 leading-relaxed text-xs sm:text-sm font-sans">
            {description}
          </p>

          {/* 1. SPICE LEVEL (For Curries and Starters only) */}
          {(customType === 'curry_with_companion' || customType === 'starter_spice_only') && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#FF6321]" />
                <span>{t.spiceLevel}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['mild', 'medium', 'hot', 'extra_hot'] as SpiceLevel[]).map((level) => {
                  const info = SPICE_LEVEL_LABELS[level];
                  const isSelected = spiceLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSpiceLevel(level)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-[#FF6321]/20 border-[#FF6321] text-[#FF6321] ring-2 ring-[#FF6321]/30 font-bold shadow-lg shadow-[#FF6321]/10'
                          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {Array.from({ length: info.iconCount }).map((_, i) => (
                          <Flame
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-[#FF6321]' : 'text-white/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs">{isEs ? info.es : info.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. COMPANION (Included 1 choice of Plain Naan, Roti, Rice, or Garlic Naan for Curries) */}
          {customType === 'curry_with_companion' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t.companionTitle}</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {isEs ? 'Incluido' : 'Included'}
                </span>
              </div>
              <p className="text-[11px] text-white/50">{t.companionSubtitle}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPANION_OPTIONS.map((opt) => {
                  const isSelected = companionOption === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setCompanionOption(opt.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white ring-1 ring-[#D4AF37]/40'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">
                            {isEs ? opt.nameEs : opt.nameEn}
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">
                            {isEs ? opt.shortDescEs : opt.shortDescEn}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SOFT DRINK FLAVORS (For Soft Drinks item in drinks category) */}
          {customType === 'soft_drink_flavor' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <CupSoda className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.softDrinkTitle}</span>
              </label>
              <p className="text-[11px] text-white/50">{t.softDrinkSubtitle}</p>

              <div className="grid grid-cols-2 gap-2">
                {SOFT_DRINK_OPTIONS.map((drink) => {
                  const isSelected = drinkFlavor === drink.id;
                  return (
                    <button
                      key={drink.id}
                      type="button"
                      onClick={() => setDrinkFlavor(drink.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white ring-1 ring-[#D4AF37]/40'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <span className="text-xs font-bold">
                          {isEs ? drink.nameEs : drink.nameEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
              {t.specialInstructions}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t.specialInstructionsPlaceholder}
              rows={2}
              className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity & Confirm Button */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/60 flex items-center justify-between gap-4 shrink-0">
          {/* Quantity selector */}
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/15">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors active:scale-95"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-9 text-center font-mono font-bold text-sm text-[#D4AF37]">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold flex items-center justify-center transition-colors active:scale-95"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to order button */}
          <button
            onClick={handleConfirm}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-[#D4AF37] hover:bg-[#c49f27] active:scale-98 text-black font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#D4AF37]/25 flex items-center justify-between uppercase tracking-wider"
          >
            <span>{t.addToOrder}</span>
            <span className="font-mono text-black font-extrabold">
              ${totalPrice.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
