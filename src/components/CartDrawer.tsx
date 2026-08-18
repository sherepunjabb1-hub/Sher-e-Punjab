import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  Car,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Flame,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { CartItem, Language, OrderCustomerDetails, RestaurantBranch } from '../types';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { TRANSLATIONS, SPICE_LEVEL_LABELS } from '../utils/translations';
import { generateWhatsAppOrderUrl } from '../utils/whatsapp';
import {
  RESTAURANT_BRANCHES,
  calculateDeliveryFee,
  findClosestBranch,
  geocodeEcuadorAddress,
} from '../utils/branchRouting';

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
    assignedBranch: RESTAURANT_BRANCHES[1], // default to Quito branch
    branchDistanceKm: undefined,
    isManualBranch: false,
  });

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Address Geocoding states
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingFailed, setGeocodingFailed] = useState(false);
  const [showManualBranchPicker, setShowManualBranchPicker] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + item.totalUnitPrice * item.quantity, 0);
  const deliveryFee =
    details.serviceType === 'delivery'
      ? calculateDeliveryFee(details.branchDistanceKm)
      : 0;
  const totalAmount = subtotal + deliveryFee;

  // Auto-geocode when user pauses typing delivery address
  useEffect(() => {
    if (details.serviceType !== 'delivery') return;
    if (details.isManualBranch) return; // respect manual choice

    const addressText = details.deliveryAddress.trim();
    if (addressText.length < 3) {
      return;
    }

    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    geocodeTimeoutRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsGeocoding(true);
      setGeocodingFailed(false);

      try {
        const result = await geocodeEcuadorAddress(addressText, abortControllerRef.current.signal);
        if (result) {
          setDetails((prev) => ({
            ...prev,
            assignedBranch: result.assignedBranch,
            branchDistanceKm: result.distanceKm,
            isManualBranch: false,
          }));
          setGeocodingFailed(false);
        } else {
          setGeocodingFailed(true);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setGeocodingFailed(true);
        }
      } finally {
        setIsGeocoding(false);
      }
    }, 800);

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [details.deliveryAddress, details.serviceType, details.isManualBranch]);

  const handleManualBranchSelect = (branch: RestaurantBranch) => {
    setDetails((prev) => ({
      ...prev,
      assignedBranch: branch,
      isManualBranch: true,
      branchDistanceKm: undefined,
    }));
    setShowManualBranchPicker(false);
    setGeocodingFailed(false);
  };

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        isEs
          ? 'La geolocalización no es compatible con este navegador'
          : 'Geolocation is not supported by this browser'
      );
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        // Find closest branch from exact GPS coordinates
        const { branch, distanceKm } = findClosestBranch(lat, lng);

        let detectedAddress = '';
        try {
          // Attempt reverse geocoding to human readable street
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: { 'Accept-Language': isEs ? 'es' : 'en' },
              signal: controller.signal,
            }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              detectedAddress = data.display_name;
            }
          }
        } catch {
          // Ignore reverse geocode failure
        }

        setDetails((prev) => ({
          ...prev,
          liveLocation: {
            latitude: lat,
            longitude: lng,
            accuracy,
            mapsUrl,
            addressText: detectedAddress || undefined,
          },
          assignedBranch: branch,
          branchDistanceKm: distanceKm,
          isManualBranch: false,
          deliveryAddress:
            prev.deliveryAddress.trim() === '' && detectedAddress
              ? detectedAddress
              : prev.deliveryAddress,
        }));

        setIsLocating(false);
        setGeocodingFailed(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(t.locationErrorPermission);
        } else if (error.code === error.TIMEOUT) {
          setLocationError(
            isEs
              ? 'Tiempo de espera agotado al obtener señal GPS.'
              : 'GPS signal request timed out.'
          );
        } else {
          setLocationError(
            isEs
              ? 'No se pudo obtener la ubicación GPS actual.'
              : 'Could not retrieve current GPS location.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleRemoveLiveLocation = () => {
    setDetails((prev) => ({
      ...prev,
      liveLocation: undefined,
    }));
    setLocationError(null);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!details.customerName.trim()) {
      errors.push(isEs ? 'El nombre del cliente es obligatorio' : 'Customer name is required');
    }
    if (!details.customerPhone.trim()) {
      errors.push(isEs ? 'El teléfono o WhatsApp es obligatorio' : 'Phone / WhatsApp is required');
    }
    if (details.serviceType === 'delivery' && !details.deliveryAddress.trim() && !details.liveLocation) {
      errors.push(
        isEs
          ? 'La dirección de entrega o la ubicación GPS es obligatoria'
          : 'Delivery address or live GPS location is required'
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

    // Launch WhatsApp directly
    window.open(whatsappUrl, '_blank');

    // Post-order action: Clear cart and show notification
    setOrderSentSuccess(true);
    setTimeout(() => {
      onClearCart();
      setOrderSentSuccess(false);
      onClose();
    }, 1800);
  };

  const currentBranch = details.assignedBranch || RESTAURANT_BRANCHES[1];

  if (!isOpen) return null;

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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-semibold text-white/80">
                      {isEs ? 'Ingresa tu dirección o sector para entrega' : 'Enter your delivery address or sector'}{' '}
                      <span className="text-[#FF6321]">
                        {details.liveLocation ? '' : '*'}
                      </span>
                    </label>
                    {isGeocoding && (
                      <span className="text-[10px] text-[#D4AF37] flex items-center gap-1 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {t.calculatingBranch}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={details.deliveryAddress}
                    onChange={(e) => {
                      setDetails({
                        ...details,
                        deliveryAddress: e.target.value,
                        isManualBranch: false,
                      });
                    }}
                    placeholder={isEs ? 'Ej: Av. Pampite / Cumbayá, La Floresta, La Carolina, Tumbaco...' : 'E.g., Cumbayá, La Floresta, Shyris, Tumbaco...'}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                  />

                  {/* Assigned Branch Dynamic Status Card */}
                  <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider flex items-center gap-1">
                            <span>{t.assignedBranchLabel}</span>
                            {details.isManualBranch && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-normal">
                                {t.manualBranchBadge}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-white text-xs sm:text-sm">
                            📍 {currentBranch.name}
                          </div>
                          {details.branchDistanceKm !== undefined && (
                            <div className="text-[11px] text-white/70">
                              {isEs ? 'Aproximadamente a' : 'Approximately'}{' '}
                              <span className="text-[#D4AF37] font-bold">
                                {details.branchDistanceKm.toFixed(1)} km
                              </span>{' '}
                              {isEs ? 'de tu dirección' : 'from your address'}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowManualBranchPicker(!showManualBranchPicker)}
                        className="text-[10px] font-semibold text-[#D4AF37] hover:underline flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-lg border border-[#D4AF37]/30 hover:border-[#D4AF37]"
                      >
                        <span>{t.changeBranchManual}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Manual Branch Dropdown Fallback */}
                    {(showManualBranchPicker || geocodingFailed) && (
                      <div className="pt-2 border-t border-white/10 space-y-1.5 animate-fade-in">
                        <p className="text-[11px] text-white/80 font-medium">
                          {geocodingFailed
                            ? isEs
                              ? '⚠️ No pudimos detectar automáticamente la dirección exacta. Por favor selecciona tu sucursal más cercana:'
                              : '⚠️ Address coordinates not found. Please select your branch manually:'
                            : t.selectBranchPrompt}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {RESTAURANT_BRANCHES.map((b) => {
                            const isSelected = currentBranch.id === b.id;
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => handleManualBranchSelect(b)}
                                className={`p-2 rounded-xl text-left border transition-all ${
                                  isSelected
                                    ? 'bg-[#D4AF37] text-black font-bold border-[#D4AF37]'
                                    : 'bg-black/50 border-white/15 text-white/80 hover:border-[#D4AF37]/50'
                                }`}
                              >
                                <div className="text-xs">{b.name}</div>
                                <div className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-white/40'}`}>
                                  {b.sector}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live GPS Location Capture Area */}
                  {!details.liveLocation ? (
                    <div>
                      <button
                        type="button"
                        onClick={handleGetLiveLocation}
                        disabled={isLocating}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] font-semibold text-xs transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                      >
                        {isLocating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                            <span>{t.detectingLocation}</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                            <span>{t.useLiveLocation}</span>
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-white/40 mt-1 pl-1">
                        {t.locationOptionalHint}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                              <span>{t.locationAttached}</span>
                            </div>
                            <div className="text-[11px] font-mono text-white/60">
                              {details.liveLocation.latitude.toFixed(5)}, {details.liveLocation.longitude.toFixed(5)}
                              {details.liveLocation.accuracy && (
                                <span className="ml-1 text-white/40">
                                  (±{Math.round(details.liveLocation.accuracy)}m)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <a
                            href={details.liveLocation.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[10px] font-medium border border-white/10"
                            title={t.openInGoogleMaps}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span className="hidden sm:inline">{t.openInGoogleMaps}</span>
                          </a>
                          <button
                            type="button"
                            onClick={handleGetLiveLocation}
                            disabled={isLocating}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10"
                            title={isEs ? 'Actualizar GPS' : 'Refresh GPS'}
                          >
                            <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLiveLocation}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/50 text-white/40 hover:text-rose-400 transition-colors border border-white/10"
                            title={t.removeLocation}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Geolocation error notification */}
                  {locationError && (
                    <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{locationError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLocationError(null)}
                        className="text-amber-400/60 hover:text-amber-300 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
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
                  <span className="flex items-center gap-1">
                    <span>{t.deliveryFee}</span>
                    <span className="text-[10px] text-[#D4AF37] font-medium">
                      {details.branchDistanceKm !== undefined
                        ? `(${details.branchDistanceKm.toFixed(1)} km)`
                        : `(0–3 km: $2.00)`}
                    </span>
                  </span>
                  <span className="font-mono text-[#D4AF37] font-semibold">
                    ${deliveryFee.toFixed(2)} USD
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold text-white">
                <span className="serif">{t.total}</span>
                <span className="font-mono text-[#D4AF37]">${totalAmount.toFixed(2)} USD</span>
              </div>
            </div>

            {/* WhatsApp Checkout Button with Branch Indicator */}
            <button
              onClick={handleCheckoutWhatsApp}
              className="w-full py-4 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-black font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 uppercase tracking-wider group"
            >
              <MessageCircle className="w-5 h-5 fill-black text-[#25D366]" />
              <span>
                {isEs
                  ? `Pedir a ${currentBranch.shortName}`
                  : `Order from ${currentBranch.shortName}`}
              </span>
            </button>

            <p className="text-[11px] text-white/40 text-center leading-relaxed">
              {isEs
                ? `Tu pedido se enviará directamente al WhatsApp de ${currentBranch.name} (${currentBranch.whatsappFormatted}).`
                : `Your order will be routed directly to ${currentBranch.name} (${currentBranch.whatsappFormatted}).`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
