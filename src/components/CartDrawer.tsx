import React, { useState } from 'react';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  Flame,
  Home,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { CartItem, Language, OrderCustomerDetails, ServiceType } from '../types';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { SERVICE_TYPE_LABELS, SPICE_LEVEL_LABELS, TRANSLATIONS } from '../utils/translations';
import { generateWhatsAppOrderUrl } from '../utils/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentLang: Language;
  onUpdateQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currentLang,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[currentLang];
  const isEs = currentLang === 'es';

  // Customer & order state
  const [details, setDetails] = useState<OrderCustomerDetails>({
    customerName: '',
    customerPhone: '',
    serviceType: 'delivery',
    deliveryAddress: '',
    tableNumber: '',
    orderNotes: '',
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + item.totalUnitPrice * item.quantity, 0);
  const deliveryFee = details.serviceType === 'delivery' ? RESTAURANT_CONFIG.deliveryFee : 0;
  const totalAmount = subtotal + deliveryFee;

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!details.customerName.trim()) {
      errors.push(isEs ? 'El nombre del cliente es obligatorio' : 'Customer name is required');
    }
    if (!details.customerPhone.trim()) {
      errors.push(isEs ? 'El teléfono o WhatsApp es obligatorio' : 'Phone / WhatsApp is required');
    }
    if (details.serviceType === 'delivery' && !details.deliveryAddress.trim()) {
      errors.push(
        isEs
          ? 'La dirección de entrega en Quito es obligatoria'
          : 'Delivery address in Quito is required'
      );
    }
    if (details.serviceType === 'dine_in' && !details.tableNumber.trim()) {
      errors.push(
        isEs ? 'El número de mesa es recomendado' : 'Table number is recommended'
      );
    }
    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) return;
    if (!validateForm()) return;

    const whatsappUrl = generateWhatsAppOrderUrl(
      items,
      details,
      subtotal,
      deliveryFee,
      totalAmount,
      currentLang
    );

    // Launch WhatsApp
    window.open(whatsappUrl, '_blank');

    // Post-order action: Clear cart and show notification
    setOrderSentSuccess(true);
    setTimeout(() => {
      onClearCart();
      setOrderSentSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end">
      <div
        className="w-full max-w-lg bg-[#0E0E0E] border-l border-white/10 text-[#F5F5F0] flex flex-col h-full shadow-2xl animate-slide-left glass"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="serif text-lg sm:text-xl font-bold text-[#F5F5F0]">
                {t.cartTitle}
              </h2>
              <p className="text-xs text-white/50">
                {items.length} {isEs ? 'artículo(s)' : 'item(s)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {orderSentSuccess && (
          <div className="m-4 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex items-center gap-3 animate-fade-in shadow-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-white">{t.orderClearedNotice}</p>
              <p className="text-emerald-300">{t.orderRedirectNotice}</p>
            </div>
          </div>
        )}

        {/* Body Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="serif text-lg font-bold text-white">{t.cartEmpty}</h3>
            <p className="text-xs text-white/50 max-w-xs">{t.cartEmptySub}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              {t.exploreMenu}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            {/* Items List */}
            <div className="space-y-3">
              {items.map((item) => {
                const name = isEs ? item.nameEs : item.nameEn;
                return (
                  <div
                    key={item.cartItemId}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3">
                        <img
                          src={item.imageUrl}
                          alt={name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                        <div>
                          <h4 className="serif font-bold text-sm text-white">{name}</h4>
                          <span className="font-mono text-[#D4AF37] font-bold">
                            ${item.totalUnitPrice.toFixed(2)} c/u
                          </span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="text-white/40 hover:text-rose-400 p-1 transition-colors"
                        title={isEs ? 'Eliminar del pedido' : 'Remove item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Customization Details Breakdown */}
                    {(item.spiceLevel || item.selectedAddons.length > 0 || item.specialInstructions) && (
                      <div className="pl-2 border-l-2 border-[#D4AF37]/50 space-y-1 text-[11px] text-white/70 pt-1">
                        {item.spiceLevel && (
                          <div className="flex items-center gap-1 text-[#FF6321] font-medium">
                            <Flame className="w-3 h-3" />
                            <span>
                              {isEs ? 'Picante:' : 'Spice:'}{' '}
                              {isEs
                                ? SPICE_LEVEL_LABELS[item.spiceLevel].es
                                : SPICE_LEVEL_LABELS[item.spiceLevel].en}
                            </span>
                          </div>
                        )}

                        {item.selectedAddons.map((addon) => (
                          <div key={addon.id} className="text-white/60">
                            + {isEs ? addon.nameEs : addon.nameEn} (${addon.price.toFixed(2)})
                          </div>
                        ))}

                        {item.specialInstructions && (
                          <div className="text-white/60 italic">
                            "{item.specialInstructions}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quantity Adjustment Bar */}
                    <div className="pt-2 flex justify-between items-center border-t border-white/10">
                      <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/15">
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-xs text-[#D4AF37]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold flex items-center justify-center active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-mono text-sm font-bold text-white">
                        ${(item.totalUnitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Service Type Selection Tabs */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                {t.serviceType}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDetails({ ...details, serviceType: 'delivery' })}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    details.serviceType === 'delivery'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-[11px]">{t.serviceDelivery}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetails({ ...details, serviceType: 'takeout' })}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    details.serviceType === 'takeout'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span className="text-[11px]">{t.serviceTakeout}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetails({ ...details, serviceType: 'dine_in' })}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    details.serviceType === 'dine_in'
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] font-bold'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span className="text-[11px]">{t.serviceDineIn}</span>
                </button>
              </div>
            </div>

            {/* Customer Details Input Fields */}
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {t.customerName} <span className="text-[#FF6321]">*</span>
                </label>
                <input
                  type="text"
                  value={details.customerName}
                  onChange={(e) => setDetails({ ...details, customerName: e.target.value })}
                  placeholder={isEs ? 'Ej: Carlos Andrade' : 'E.g., John Doe'}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {t.customerPhone} <span className="text-[#FF6321]">*</span>
                </label>
                <input
                  type="tel"
                  value={details.customerPhone}
                  onChange={(e) => setDetails({ ...details, customerPhone: e.target.value })}
                  placeholder={isEs ? 'Ej: 098 765 4321' : 'E.g., +593 98 765 4321'}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              {/* Address (If Delivery) */}
              {details.serviceType === 'delivery' && (
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    {t.deliveryAddress} <span className="text-[#FF6321]">*</span>
                  </label>
                  <textarea
                    value={details.deliveryAddress}
                    onChange={(e) => setDetails({ ...details, deliveryAddress: e.target.value })}
                    placeholder={t.deliveryAddressPlaceholder}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                  />
                </div>
              )}

              {/* Table Number (If Dine-in) */}
              {details.serviceType === 'dine_in' && (
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    {t.tableNumber}
                  </label>
                  <input
                    type="text"
                    value={details.tableNumber}
                    onChange={(e) => setDetails({ ...details, tableNumber: e.target.value })}
                    placeholder={t.tableNumberPlaceholder}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none"
                  />
                </div>
              )}

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">
                  {t.orderNotes}
                </label>
                <input
                  type="text"
                  value={details.orderNotes}
                  onChange={(e) => setDetails({ ...details, orderNotes: e.target.value })}
                  placeholder={t.orderNotesPlaceholder}
                  className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            {/* Validation errors notice */}
            {formErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t.fillRequiredFields}</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {formErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer with Price Summary & Checkout Action */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-black/70 space-y-4 shrink-0">
            {/* Calculation Breakdown */}
            <div className="space-y-1.5 text-xs text-white/70">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-mono">${subtotal.toFixed(2)} USD</span>
              </div>
              {details.serviceType === 'delivery' && (
                <div className="flex justify-between">
                  <span>{t.deliveryFee}</span>
                  <span className="font-mono">
                    {deliveryFee > 0 ? `$${deliveryFee.toFixed(2)} USD` : t.freeDelivery}
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold text-white">
                <span className="serif">{t.total}</span>
                <span className="font-mono text-[#D4AF37]">${totalAmount.toFixed(2)} USD</span>
              </div>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full py-4 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-black font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <MessageCircle className="w-5 h-5 fill-black text-[#25D366]" />
              <span>{t.sendWhatsAppOrder}</span>
            </button>

            <p className="text-[11px] text-white/40 text-center leading-relaxed">
              {t.orderRedirectNotice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
