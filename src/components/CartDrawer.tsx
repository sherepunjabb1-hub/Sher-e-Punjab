import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  Flame,
  Home,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  UploadCloud,
  Utensils,
  X,
} from 'lucide-react';
import { CartItem, Language, OrderCustomerDetails, OrderRecord, RestaurantBranch } from '../types';
import { TRANSLATIONS, SPICE_LEVEL_LABELS } from '../utils/translations';
import { generateWhatsAppOrderUrl } from '../utils/whatsapp';
import { saveOrderToFirestore } from '../utils/firebaseStorage';
import { PayPhoneModal } from './PayPhoneModal';
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

  // Multi-step checkout state: 'cart' (Item selection & Customer Info) -> 'payment' (Payment Method, Bank Info, Tx ID & Receipt Attachment)
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment'>('cart');

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

  // Payment states: CARD (PayPhone international card), TRANSFER (Banco Pichincha), CASH
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'CARD' | 'TRANSFER' | 'CASH'>('CARD');
  const [isPayPhoneModalOpen, setIsPayPhoneModalOpen] = useState<boolean>(false);
  const [transferTxId, setTransferTxId] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [cashBillAmount, setCashBillAmount] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Address Geocoding states
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingFailed, setGeocodingFailed] = useState(false);
  const [showManualBranchPicker, setShowManualBranchPicker] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset step to 'cart' if drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setCheckoutStep('cart');
      setFormErrors([]);
    }
  }, [isOpen]);

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + item.totalUnitPrice * item.quantity, 0);
  const deliveryFee =
    details.serviceType === 'delivery'
      ? calculateDeliveryFee(details.branchDistanceKm)
      : 0;
  const totalAmount = subtotal + deliveryFee;

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle receipt image upload & resize
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress/resize image to prevent giant base64 strings
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setReceiptImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceiptImage = () => {
    setReceiptImage(null);
    setReceiptFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        // Match closest branch
        const closestMatch = findClosestBranch(lat, lng);

        setDetails((prev) => ({
          ...prev,
          liveLocation: {
            latitude: lat,
            longitude: lng,
            accuracy,
            mapsUrl,
          },
          assignedBranch: closestMatch.branch,
          branchDistanceKm: closestMatch.distanceKm,
          isManualBranch: false,
        }));
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocating(false);
        setLocationError(t.locationErrorPermission);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
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

  const validateCartForm = (): boolean => {
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

  const handleProceedToPayment = () => {
    if (items.length === 0) return;
    if (!validateCartForm()) return;
    setFormErrors([]);
    setCheckoutStep('payment');
  };

  const handleSendWhatsAppOrder = async () => {
    if (items.length === 0) return;
    setIsSubmittingOrder(true);

    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = `SP-${Date.now().toString().slice(-6)}`;
    const clientTransactionId = `${manualPaymentMethod}-${Date.now().toString().slice(-8)}`;

    // Save order record to Firestore with Transaction ID & Receipt Attachment info
    const orderRecord: OrderRecord = {
      id: orderId,
      orderNumber: orderNumber,
      clientTransactionId: clientTransactionId,
      items: items,
      customer: details,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: totalAmount,
      paymentMethod: manualPaymentMethod,
      paymentStatus: 'PENDING',
      isVerified: false,
      transferTransactionId: transferTxId.trim() || undefined,
      receiptImageData: receiptImage || undefined,
      receiptFileName: receiptFileName || undefined,
      cashBillAmount: cashBillAmount.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'RECEIVED',
    };

    try {
      await saveOrderToFirestore(orderRecord);
    } catch (err) {
      console.warn('Could not persist order to Firestore:', err);
    }

    const url = generateWhatsAppOrderUrl(
      items,
      details,
      subtotal,
      deliveryFee,
      totalAmount,
      currentLang,
      manualPaymentMethod,
      orderNumber,
      transferTxId.trim() || undefined,
      !!receiptImage,
      cashBillAmount.trim() || undefined
    );

    window.open(url, '_blank');
    setOrderSentSuccess(true);
    setIsSubmittingOrder(false);

    setTimeout(() => {
      onClearCart();
      setOrderSentSuccess(false);
      setCheckoutStep('cart');
      setTransferTxId('');
      setReceiptImage(null);
      setReceiptFileName('');
      setCashBillAmount('');
      onClose();
    }, 2000);
  };

  const currentBranch = details.assignedBranch || RESTAURANT_BRANCHES[1];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end">
      <div
        className="w-full max-w-lg bg-[#0E0E0E] border-l border-white/10 text-[#F5F5F0] flex flex-col h-full shadow-2xl animate-slide-left glass"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Step Indicator & Back Button */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
          <div className="flex items-center gap-3">
            {checkoutStep === 'payment' ? (
              <button
                type="button"
                onClick={() => setCheckoutStep('cart')}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-[#D4AF37] flex items-center justify-center border border-white/15 transition-all active:scale-95 cursor-pointer"
                title={isEs ? 'Volver al Carrito' : 'Back to Cart'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="serif text-lg sm:text-xl font-bold text-[#F5F5F0]">
                  {checkoutStep === 'cart'
                    ? t.cartTitle
                    : isEs
                    ? 'Método de Pago y Comprobante'
                    : 'Payment & Verification'}
                </h2>
              </div>
              <p className="text-xs text-white/50">
                {checkoutStep === 'cart' ? (
                  `${items.length} ${isEs ? 'artículo(s) seleccionados' : 'item(s) selected'}`
                ) : (
                  <span className="text-[#D4AF37]">
                    {isEs ? 'Paso 2 de 2: Confirmación y Pago' : 'Step 2 of 2: Payment & Confirmation'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Toast */}
        {orderSentSuccess && (
          <div className="m-4 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex items-center gap-3 animate-fade-in shadow-xl shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold text-white">{t.orderClearedNotice}</p>
              <p className="text-emerald-300">{t.orderRedirectNotice}</p>
            </div>
          </div>
        )}

        {/* Empty Cart Screen */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="serif text-lg font-bold text-white">{t.cartEmpty}</h3>
            <p className="text-xs text-white/50 max-w-xs">{t.cartEmptySub}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              {t.exploreMenu}
            </button>
          </div>
        ) : checkoutStep === 'cart' ? (
          /* ========================================================= */
          /* STEP 1: CART ITEMS & CUSTOMER / DELIVERY DETAILS           */
          /* ========================================================= */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                    {isEs ? 'Platos en tu Pedido' : 'Dishes in Order'}
                  </span>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-[11px] text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isEs ? 'Vaciar carrito' : 'Clear all'}</span>
                  </button>
                </div>

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
                          className="text-white/40 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                          title={isEs ? 'Eliminar del pedido' : 'Remove item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Customization Details Breakdown */}
                      {(item.spiceLevel ||
                        item.companionOption ||
                        item.drinkFlavor ||
                        item.selectedAddons.length > 0 ||
                        item.specialInstructions) && (
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

                          {item.companionOption && (
                            <div className="flex items-center gap-1 text-[#D4AF37] font-medium">
                              <Utensils className="w-3 h-3" />
                              <span>
                                {isEs ? 'Acompañamiento:' : 'Companion:'}{' '}
                                {item.companionOption === 'plain_naan'
                                  ? isEs ? 'Pan Naan Tradicional' : 'Plain Naan'
                                  : item.companionOption === 'roti'
                                  ? isEs ? 'Pan Roti (Integral)' : 'Roti (Whole Wheat)'
                                  : item.companionOption === 'rice'
                                  ? isEs ? 'Arroz Basmati Simple' : 'Basmati Rice'
                                  : isEs ? 'Pan Garlic Naan (Ajo)' : 'Garlic Naan'}
                              </span>
                            </div>
                          )}

                          {item.drinkFlavor && (
                            <div className="flex items-center gap-1 text-emerald-400 font-medium">
                              <span>🥤</span>
                              <span>
                                {isEs ? 'Bebida:' : 'Drink:'}{' '}
                                {item.drinkFlavor === 'coke'
                                  ? 'coke'
                                  : item.drinkFlavor === 'fanta'
                                  ? 'fanta'
                                  : item.drinkFlavor === 'sprite'
                                  ? 'sprite'
                                  : 'fuze tea'}
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
                            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-xs text-[#D4AF37]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold flex items-center justify-center active:scale-95 cursor-pointer"
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
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
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
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
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
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
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
                        {isEs ? 'Dirección o sector de entrega' : 'Delivery address or sector'}{' '}
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
                          className="text-[10px] font-semibold text-[#D4AF37] hover:underline flex items-center gap-0.5 bg-black/40 px-2 py-1 rounded-lg border border-[#D4AF37]/30 hover:border-[#D4AF37] cursor-pointer"
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
                                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
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
                          className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 hover:border-[#D4AF37]/60 text-[#D4AF37] font-semibold text-xs transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
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
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10 cursor-pointer"
                              title={isEs ? 'Actualizar GPS' : 'Refresh GPS'}
                            >
                              <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveLiveLocation}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/50 text-white/40 hover:text-rose-400 transition-colors border border-white/10 cursor-pointer"
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
                          className="text-amber-400/60 hover:text-amber-300 p-0.5 cursor-pointer"
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

            {/* Step 1 Compact Clean Footer: Price breakdown + Proceed Button */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/90 space-y-3 shrink-0">
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
                  <span className="font-mono text-[#D4AF37] text-lg">${totalAmount.toFixed(2)} USD</span>
                </div>
              </div>

              <button
                type="button"
                id="cart-proceed-to-payment-btn"
                onClick={handleProceedToPayment}
                className="w-full py-3.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#c49f27] active:scale-98 text-black font-bold text-sm sm:text-base transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isEs ? 'Continuar al Pago' : 'Proceed to Payment'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">${totalAmount.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* STEP 2: PAYMENT METHOD, BANK DETAILS, TX ID & ATTACHMENT  */
          /* ========================================================= */
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Order Brief Summary Card */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-white/60 font-medium">
                    {isEs ? 'Resumen del Pedido' : 'Order Summary'}
                  </span>
                  <span className="font-bold text-[#D4AF37] font-mono text-sm">
                    ${totalAmount.toFixed(2)} USD
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-white/75">
                  <div>
                    <span className="text-white/40 block">{isEs ? 'Cliente:' : 'Customer:'}</span>
                    <span className="font-medium text-white truncate block">{details.customerName}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">{isEs ? 'Servicio:' : 'Service:'}</span>
                    <span className="font-medium text-white truncate block">
                      {details.serviceType === 'delivery'
                        ? isEs ? 'Entrega a Domicilio' : 'Home Delivery'
                        : details.serviceType === 'takeout'
                        ? isEs ? 'Para Llevar (Retiro)' : 'Takeout / Pickup'
                        : isEs ? `En Mesa #${details.tableNumber || '-'}` : `Table #${details.tableNumber || '-'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  {isEs ? 'Selecciona tu Forma de Pago:' : 'Select Payment Method:'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Card (PayPhone) Option */}
                  <button
                    type="button"
                    onClick={() => setManualPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      manualPaymentMethod === 'CARD'
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                        <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                        <span>{isEs ? 'Tarjeta' : 'Card'}</span>
                      </span>
                      {manualPaymentMethod === 'CARD' && (
                        <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70 leading-tight">
                      {isEs ? 'Visa / Mastercard Int.' : 'Int. Visa & Mastercard'}
                    </span>
                  </button>

                  {/* Transfer Option */}
                  <button
                    type="button"
                    onClick={() => setManualPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      manualPaymentMethod === 'TRANSFER'
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20 ring-1 ring-[#D4AF37]'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                        <Banknote className="w-4 h-4 text-[#D4AF37]" />
                        <span>{isEs ? 'Transferencia' : 'Transfer'}</span>
                      </span>
                      {manualPaymentMethod === 'TRANSFER' && (
                        <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70 leading-tight">
                      {isEs ? 'Pichincha / Deuna' : 'Pichincha / Deuna'}
                    </span>
                  </button>

                  {/* Cash Option */}
                  <button
                    type="button"
                    onClick={() => setManualPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      manualPaymentMethod === 'CASH'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <span>{isEs ? 'Efectivo' : 'Cash'}</span>
                      </span>
                      {manualPaymentMethod === 'CASH' && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/70 leading-tight">
                      {isEs ? 'Contra entrega' : 'On delivery'}
                    </span>
                  </button>
                </div>
              </div>

              {/* CARD (PAYPHONE) DETAILS & ACTION */}
              {manualPaymentMethod === 'CARD' ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E1810] via-[#161616] to-[#121212] border border-[#D4AF37]/35 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm">
                            {isEs
                              ? 'Tarjeta de Crédito / Débito'
                              : 'Credit / Debit Card'}
                          </div>
                          <div className="text-[10px] text-[#D4AF37]">
                            {isEs
                              ? 'Visa y Mastercard Internacionales Aceptadas'
                              : 'International Visa & Mastercard Accepted'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        USD
                      </span>
                    </div>

                    {/* Powered by Payphone trust pill */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {isEs
                          ? 'Powered by PayPhone — No account required (No requiere cuenta)'
                          : 'Powered by PayPhone — No account required'}
                      </span>
                    </div>

                    {/* Accepted Card Badges */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider block">
                        {isEs ? 'Tarjetas Aceptadas:' : 'Accepted Cards:'}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="h-6 px-2 bg-[#1434CB] rounded text-[10px] text-white font-black italic flex items-center">
                          VISA
                        </div>
                        <div className="h-6 px-2 bg-[#1F1F1F] rounded flex items-center border border-white/20">
                          <div className="flex items-center -space-x-1">
                            <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
                            <div className="w-3 h-3 rounded-full bg-[#F79E1B]" />
                          </div>
                        </div>
                        <div className="h-6 px-2 bg-[#006FCF] rounded text-[9px] text-white font-bold flex items-center">
                          AMEX
                        </div>
                        <div className="h-6 px-2 bg-[#004A97] rounded text-[9px] text-white font-bold flex items-center">
                          DINERS
                        </div>
                        <div className="h-6 px-2 bg-[#FF6000] rounded text-[9px] text-white font-bold flex items-center">
                          DISCOVER
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-white/60">{isEs ? 'Total a procesar:' : 'Total in USD:'}</span>
                      <span className="font-mono font-bold text-[#D4AF37] text-base">
                        ${totalAmount.toFixed(2)} USD
                      </span>
                    </div>

                    {/* Direct Card Modal Trigger Button */}
                    <button
                      type="button"
                      id="open-payphone-checkout-btn"
                      onClick={() => setIsPayPhoneModalOpen(true)}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C9A028] to-[#AA820A] hover:brightness-110 active:scale-98 text-black font-bold text-xs sm:text-sm flex items-center justify-between transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-black" />
                        <span>
                          {isEs
                            ? 'Abrir Pasarela de Pago con Tarjeta'
                            : 'Open Card Payment Gateway'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-black font-extrabold">
                        <span>${totalAmount.toFixed(2)} USD</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : manualPaymentMethod === 'TRANSFER' ? (
                <div className="space-y-4 animate-fade-in">
                  {/* Official Bank Account Details Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-black/80 to-black/60 border border-[#D4AF37]/35 space-y-3 text-xs shadow-lg">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="font-bold text-[#D4AF37] text-xs flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-[#D4AF37]" />
                        <span>{isEs ? 'Datos de Cuenta Bancaria Oficial' : 'Official Bank Account Details'}</span>
                      </span>
                      <span className="text-[10px] text-white/50">{isEs ? 'Quito, Ecuador' : 'Quito, Ecuador'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs bg-white/5 p-3 rounded-xl border border-white/5 font-sans">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">{isEs ? 'Banco:' : 'Bank:'}</span>
                        <span className="font-bold text-white">Banco Pichincha</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">{isEs ? 'Tipo de Cuenta:' : 'Account Type:'}</span>
                        <span className="text-white/90">{isEs ? 'Cuenta Corriente' : 'Checking Account'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">{isEs ? 'Número de Cuenta:' : 'Account Number:'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#D4AF37] text-sm">2100224162</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText('2100224162', 'acc_num')}
                            className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/90 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Copiar número"
                          >
                            {copiedField === 'acc_num' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedField === 'acc_num' ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar' : 'Copy')}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">{isEs ? 'Titular:' : 'Beneficiary:'}</span>
                        <span className="font-medium text-white truncate">SHER E PUNJAB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">{isEs ? 'RUC / C.I.:' : 'ID / RUC:'}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white/90">1715256226001</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText('1715256226001', 'ruc_num')}
                            className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/90 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Copiar RUC"
                          >
                            {copiedField === 'ruc_num' ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedField === 'ruc_num' ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar' : 'Copy')}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[11px] text-amber-200/90 leading-relaxed">
                      💡 {isEs
                        ? `Monto exacto a transferir: $${totalAmount.toFixed(2)} USD. Puedes pagar desde Banca Móvil Pichincha o Deuna.`
                        : `Exact transfer amount: $${totalAmount.toFixed(2)} USD. You can pay via Pichincha Mobile or Deuna.`}
                    </div>
                  </div>

                  {/* Transaction ID / Comprobante Number Input */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <label className="block text-xs font-semibold text-white/90">
                      {isEs ? 'Número de Comprobante / ID de Transacción (Opcional):' : 'Transaction ID / Receipt Number (Optional):'}
                    </label>
                    <input
                      type="text"
                      value={transferTxId}
                      onChange={(e) => setTransferTxId(e.target.value)}
                      placeholder={isEs ? 'Ej: 38491028 o últimos 6 dígitos' : 'E.g., 38491028 or last 6 digits'}
                      className="w-full bg-black/50 border border-white/15 focus:border-[#D4AF37] rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-white/50">
                      {isEs
                        ? 'Ingresa el número de referencia o código de comprobante que te entrega tu banco tras la transferencia.'
                        : 'Enter the reference number provided by your bank after the transfer.'}
                    </p>
                  </div>

                  {/* Payment Receipt / Comprobante Attachment Area */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-white/90">
                        {isEs ? 'Adjuntar Foto o Captura del Comprobante:' : 'Attach Receipt Photo or Screenshot:'}
                      </label>
                      <span className="text-[10px] text-emerald-400 font-medium">
                        {isEs ? 'Verificación más rápida' : 'Faster verification'}
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleReceiptFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {!receiptImage ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 hover:border-[#D4AF37]/60 rounded-xl p-4 text-center cursor-pointer transition-all bg-black/30 hover:bg-black/50 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                          {isEs ? 'Haz clic para subir o tomar foto del comprobante' : 'Click to upload or take receipt photo'}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {isEs ? 'Formatos soportados: JPG, PNG, Captura de pantalla' : 'Supported: JPG, PNG, Screenshots'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                              {receiptFileName || (isEs ? 'Comprobante adjunto' : 'Receipt attached')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveReceiptImage}
                            className="text-xs text-rose-400 hover:text-rose-300 p-1 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isEs ? 'Eliminar' : 'Remove'}</span>
                          </button>
                        </div>

                        {/* Image Preview Thumbnail */}
                        <div className="relative rounded-lg overflow-hidden border border-white/10 max-h-48 bg-black">
                          <img
                            src={receiptImage}
                            alt="Receipt preview"
                            className="w-full h-auto max-h-48 object-contain mx-auto"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-300 text-center">
                          ✓ {isEs ? 'Comprobante listo. Se guardará con tu pedido y podrás enviarlo por WhatsApp.' : 'Receipt attached successfully.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* CASH ON DELIVERY DETAILS */
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isEs ? 'Pago en Efectivo Contra Entrega' : 'Cash on Delivery'}</span>
                    </div>
                    <p className="text-white/80 leading-relaxed">
                      {isEs
                        ? `Pagarás el total de $${totalAmount.toFixed(2)} USD directamente al repartidor al momento de recibir tu pedido.`
                        : `You will pay the total of $${totalAmount.toFixed(2)} USD in cash upon receiving your delivery.`}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <label className="block text-xs font-semibold text-white/90">
                      {isEs ? '¿Con cuánto vas a pagar? (Opcional para cambio exacto):' : 'Paying with what bill? (Optional for exact change):'}
                    </label>
                    <input
                      type="text"
                      value={cashBillAmount}
                      onChange={(e) => setCashBillAmount(e.target.value)}
                      placeholder={isEs ? 'Ej: Con billete de $20 o $50' : 'E.g., $20 or $50 bill'}
                      className="w-full bg-black/50 border border-white/15 focus:border-emerald-500 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none"
                    />
                    <p className="text-[11px] text-white/50">
                      {isEs
                        ? 'Indícanos si necesitas cambio para que el repartidor lleve el dinero necesario.'
                        : 'Let us know if you need change so our delivery driver is prepared.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 Footer: Confirm & Send via WhatsApp */}
            <div className="p-4 sm:p-5 border-t border-white/10 bg-black/90 space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">{isEs ? 'Total a Pagar:' : 'Total to Pay:'}</span>
                <span className="font-mono font-bold text-lg text-[#D4AF37]">${totalAmount.toFixed(2)} USD</span>
              </div>

              <button
                type="button"
                id="manual-whatsapp-confirm-btn"
                onClick={handleSendWhatsAppOrder}
                disabled={isSubmittingOrder}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 active:scale-98 text-white font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-black/25 flex items-center justify-center shrink-0">
                    {isSubmittingOrder ? (
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-bold tracking-wide text-sm sm:text-base leading-snug">
                      {isEs ? 'Confirmar y Enviar por WhatsApp' : 'Confirm & Send via WhatsApp'}
                    </div>
                    <div className="text-[11px] font-normal text-emerald-100">
                      {manualPaymentMethod === 'TRANSFER'
                        ? isEs
                          ? 'Abrir chat y verificar con restaurante'
                          : 'Open chat and verify with restaurant'
                        : isEs
                        ? 'Enviar pedido con pago contra entrega'
                        : 'Send order with cash payment'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono bg-black/35 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="font-bold text-sm text-[#D4AF37]">${totalAmount.toFixed(2)}</span>
                </div>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50 text-center pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {isEs
                    ? 'Atención directa y verificación con Sher E Punjab (+593 98 790 0005)'
                    : 'Direct verification with Sher E Punjab (+593 98 790 0005)'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* PayPhone Card Payment Modal for International & Domestic Cards */}
      {isPayPhoneModalOpen && (
        <PayPhoneModal
          isOpen={isPayPhoneModalOpen}
          onClose={() => setIsPayPhoneModalOpen(false)}
          items={items}
          details={details}
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={totalAmount}
          currentLang={currentLang}
        />
      )}
    </div>
  );
};
