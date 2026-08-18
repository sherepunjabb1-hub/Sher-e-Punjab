import React, { useEffect, useState } from 'react';
import { Check, Flame, Minus, Plus, Utensils, X } from 'lucide-react';
import { AddonOption, Language, MenuItem, SpiceLevel } from '../types';
import { SPICE_LEVEL_LABELS, TRANSLATIONS } from '../utils/translations';
import { DEFAULT_ADDONS } from '../data/seedData';

interface DishCustomizationModalProps {
  item: MenuItem | null;
  currentLang: Language;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    spiceLevel: SpiceLevel | undefined,
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
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Sync state whenever the selected item changes
  useEffect(() => {
    if (item) {
      setSpiceLevel(item.defaultSpiceLevel || 'medium');
      setSelectedAddons([]);
      setInstructions('');
      setQuantity(1);
    }
  }, [item]);

  if (!item) return null;

  // Available addons: either dish-specific or default addons pool
  const addonsPool: AddonOption[] =
    item.availableAddons && item.availableAddons.length > 0 ? item.availableAddons : DEFAULT_ADDONS;

  const toggleAddon = (addon: AddonOption) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const singleUnitPrice = item.price + addonsTotal;
  const totalPrice = singleUnitPrice * quantity;

  const name = isEs ? item.nameEs : (item.nameEn || item.nameEs);
  const description = isEs ? item.descriptionEs : (item.descriptionEn || item.descriptionEs);

  const handleConfirm = () => {
    onAddToCart(
      item,
      item.spiceCustomizable ? spiceLevel : undefined,
      selectedAddons,
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
          <p className="text-white/70 leading-relaxed text-xs sm:text-sm font-sans">{description}</p>

          {/* Spice Level Selector */}
          {item.spiceCustomizable && (
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
                          ? 'bg-[#FF6321]/20 border-[#FF6321] text-[#FF6321] ring-2 ring-[#FF6321]/30 font-bold'
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

          {/* Add-ons Checklist */}
          {addonsPool.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-[#D4AF37]" />
                <span>{t.addonsTitle}</span>
              </label>

              <div className="space-y-2">
                {addonsPool.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.id === addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/60 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                              : 'border-white/20 bg-white/5'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {isEs ? addon.nameEs : addon.nameEn}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#D4AF37]">
                        +${addon.price.toFixed(2)}
                      </span>
                    </div>
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
            <span className="w-9 text-center font-mono font-bold text-sm text-[#D4AF37]">{quantity}</span>
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
