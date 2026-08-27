import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { CartItem, Language, OrderCustomerDetails, PayPhonePaymentInfo, OrderRecord } from '../types';
import { saveOrderToFirestore } from '../utils/firebaseStorage';

export interface PayPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  details: OrderCustomerDetails;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currentLang: Language;
  onPaymentSuccess?: (info: PayPhonePaymentInfo) => void;
}

/**
 * Sanitizes phone numbers by stripping all non-numeric characters (+, spaces, dashes, etc.)
 * E.g., "+593 99 900 0608" -> "593999000608", "+1 (555) 234-5678" -> "15552345678"
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// Accepted Card Brand Visual Badges
const CardBrandBadges: React.FC = () => (
  <div className="flex items-center gap-2 flex-wrap">
    {/* VISA */}
    <div
      className="h-7 px-2 bg-gradient-to-r from-[#1434CB] to-[#0A1E7A] rounded-md flex items-center justify-center border border-white/20 shadow-sm"
      title="Visa (Accepted Internationally)"
    >
      <span className="font-sans font-black tracking-wider text-[11px] text-white italic">
        VISA
      </span>
    </div>

    {/* MASTERCARD */}
    <div
      className="h-7 px-2.5 bg-[#1F1F1F] rounded-md flex items-center justify-center border border-white/20 shadow-sm"
      title="Mastercard (Accepted Internationally)"
    >
      <div className="flex items-center -space-x-1.5">
        <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
        <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" />
      </div>
    </div>

    {/* AMERICAN EXPRESS */}
    <div
      className="h-7 px-2 bg-[#006FCF] rounded-md flex items-center justify-center border border-white/20 shadow-sm"
      title="American Express"
    >
      <span className="font-sans font-extrabold tracking-tight text-[10px] text-white">
        AMEX
      </span>
    </div>

    {/* DINERS CLUB */}
    <div
      className="h-7 px-2 bg-[#004A97] rounded-md flex items-center justify-center border border-white/20 shadow-sm"
      title="Diners Club / Discover"
    >
      <span className="font-sans font-bold tracking-tight text-[10px] text-white">
        DINERS
      </span>
    </div>

    {/* DISCOVER */}
    <div
      className="h-7 px-2 bg-[#FF6000] rounded-md flex items-center justify-center border border-white/20 shadow-sm"
      title="Discover"
    >
      <span className="font-sans font-bold tracking-tight text-[9px] text-white">
        DISCOVER
      </span>
    </div>
  </div>
);

export const PayPhoneModal: React.FC<PayPhoneModalProps> = ({
  isOpen = false,
  onClose = () => {},
  items = [],
  details,
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  currentLang = 'es',
}) => {
  const isEs = currentLang === 'es';

  // Customer Form States
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Processing & Error States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formValidationErrors, setFormValidationErrors] = useState<string[]>([]);

  // Sync initial customer details from props when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerName(details?.customerName || '');
      setCustomerPhone(details?.customerPhone || '');
      if (!customerEmail) {
        if (details?.customerName) {
          const sanitized = details.customerName.toLowerCase().replace(/[^a-z0-9]/g, '');
          setCustomerEmail(sanitized ? `${sanitized}@gmail.com` : '');
        }
      }
      setErrorMessage(null);
      setFormValidationErrors([]);
    }
  }, [isOpen, details]);

  if (!isOpen) return null;

  // Format amount explicitly in USD (number with 2 decimal places)
  const totalCartPrice = total > 0 ? Number(total.toFixed(2)) : 0;
  const currentBranch = details?.assignedBranch;

  /**
   * Validate form inputs before sending to /api/create-payment
   */
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!customerName.trim()) {
      errors.push(isEs ? 'El nombre del cliente es obligatorio' : 'Customer name is required');
    }

    const trimmedEmail = customerEmail.trim();
    if (!trimmedEmail) {
      errors.push(isEs ? 'El correo electrónico es obligatorio' : 'Email address is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.push(
        isEs
          ? 'Por favor ingresa un correo electrónico válido (ej: nombre@correo.com)'
          : 'Please enter a valid email address (e.g., name@example.com)'
      );
    }

    const sanitizedPhone = sanitizePhoneNumber(customerPhone);
    if (!sanitizedPhone || sanitizedPhone.length < 7) {
      errors.push(
        isEs
          ? 'Por favor ingresa un número de teléfono con código de país (mínimo 7 dígitos, ej: +1... o +593...)'
          : 'Please enter a valid phone number with country code (e.g., +1... or +593...)'
      );
    }

    setFormValidationErrors(errors);
    return errors.length === 0;
  };

  /**
   * Handles initiating the PayPhone card payment session via /api/create-payment
   */
  const handlePayWithCard = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);

    // 1. Client-side Form Validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // 2. Data Sanitization
    const sanitizedPhone = sanitizePhoneNumber(customerPhone);
    const clientTxId = `SHERE-${Date.now()}`;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const orderNumber = `SP-${Date.now().toString().slice(-6)}`;
    const cleanRef = `Sher-e-Punjab ${orderNumber}`.replace(/[^a-zA-Z0-9 -]/g, '').trim().slice(0, 30);

    // 3. Prepare JSON Payload for /api/create-payment
    const payload = {
      amount: totalCartPrice, // Amount in dollars (e.g. 11.85)
      clientTransactionId: clientTxId,
      email: customerEmail.trim(),
      phoneNumber: sanitizedPhone,
      reference: cleanRef,
    };

    // 4. Save pending order record to Firestore for tracking & redundancy
    try {
      const pendingOrder: OrderRecord = {
        id: orderId,
        orderNumber: orderNumber,
        clientTransactionId: clientTxId,
        items: items,
        customer: {
          ...details,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        },
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: totalCartPrice,
        paymentMethod: 'PAYPHONE',
        paymentStatus: 'PENDING',
        isVerified: false,
        createdAt: new Date().toISOString(),
        status: 'RECEIVED',
      };
      await saveOrderToFirestore(pendingOrder);
    } catch (saveErr) {
      console.warn('[Firestore Pending Order Save Notice]:', saveErr);
    }

    // 5. Send POST request to /api/create-payment (with fallback if running statically)
    try {
      let response: Response;
      try {
        response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (localErr) {
        console.warn('[Local API unreachable, using live production gateway]:', localErr);
        response = await fetch('https://sherepunjabecu.com/api/create-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { rawText: responseText };
      }

      console.log('[PayPhone Payment Gateway Response]:', data);

      if (!response.ok || (data.success === false && !data.payWithPayPhone && !data.paymentUrl)) {
        console.error("PayPhone Error Detail:", data);
        let errorMsg = data?.payphoneMessage || data?.message || data?.error;
        if (data?.errors) {
          if (typeof data.errors === 'string') {
            errorMsg = (errorMsg ? `${errorMsg}: ` : '') + data.errors;
          } else if (Array.isArray(data.errors)) {
            errorMsg = (errorMsg ? `${errorMsg}: ` : '') + data.errors.map((e: any) => typeof e === 'object' ? JSON.stringify(e) : String(e)).join(', ');
          } else if (typeof data.errors === 'object') {
            const formatted = Object.entries(data.errors)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : (typeof v === 'object' ? JSON.stringify(v) : String(v))}`)
              .join('; ');
            errorMsg = (errorMsg ? `${errorMsg}: ` : '') + formatted;
          }
        }
        if (typeof errorMsg === 'object') {
          errorMsg = JSON.stringify(errorMsg, null, 2);
        }
        if (!errorMsg) {
          errorMsg = isEs
            ? 'No se pudo iniciar la pasarela de pago. Por favor verifica tus datos e inténtalo de nuevo.'
            : 'Could not initialize payment gateway. Please verify your details and try again.';
        }
        throw new Error(errorMsg);
      }

      // 6. If data.payWithPayPhone is returned, immediately redirect
      const targetUrl = data?.payWithPayPhone || data?.paymentUrl;

      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        const fallbackMsg = typeof data?.message === 'object' ? JSON.stringify(data.message, null, 2) : (data?.message || data?.error || (isEs ? 'No se recibió la URL de pago segura.' : 'No secure payment URL received from gateway.'));
        throw new Error(fallbackMsg);
      }
    } catch (err: any) {
      console.error("PayPhone Error Detail:", err);
      setIsLoading(false);
      let extractedError = err?.message || err?.error || '';
      if (typeof extractedError === 'object') {
        extractedError = JSON.stringify(extractedError, null, 2);
      }
      if (!extractedError) {
        extractedError = isEs
          ? 'Ocurrió un error al procesar el pago con tarjeta. Por favor inténtalo de nuevo o contáctanos.'
          : 'An error occurred while processing card payment. Please try again or contact support.';
      }
      setErrorMessage(extractedError);
    }
  };

  return (
    <div
      id="payphone-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="payphone-modal-dialog"
        className="relative w-full max-w-lg rounded-2xl bg-[#121212] border border-[#D4AF37]/35 shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: International Client Messaging */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-[#1C1612] via-[#161616] to-[#121212] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#AA820A] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 text-black shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                  {isEs
                    ? 'Tarjeta de Crédito / Débito'
                    : 'Credit / Debit Card'}
                </h3>
              </div>
              <p className="text-xs text-[#D4AF37] font-medium">
                {isEs
                  ? 'Visa y Mastercard Internacionales Aceptadas'
                  : 'International Visa & Mastercard Accepted'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-payphone-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={isEs ? 'Cerrar' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Powered by PayPhone Badge */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center gap-2 text-white/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">
                {isEs
                  ? 'Procesado por PayPhone — No requiere cuenta previa'
                  : 'Powered by PayPhone — No account required'}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {isEs ? 'Seguro' : 'Secure'}
            </span>
          </div>

          {/* Accepted Card Brands Section */}
          <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/10">
            <span className="text-[11px] text-white/60 uppercase tracking-wider font-semibold block">
              {isEs ? 'Tarjetas aceptadas (Nacionales e Internacionales):' : 'Accepted Cards (Domestic & International):'}
            </span>
            <CardBrandBadges />
          </div>

          {/* Error Message Toast */}
          {errorMessage && (
            <div
              id="payphone-error-alert"
              className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-300">
                  {isEs ? 'Error en la transacción:' : 'Transaction error:'}
                </p>
                <p className="mt-0.5 text-white/90 break-words">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-white/40 hover:text-white text-xs cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form Validation Errors */}
          {formValidationErrors.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4" />
                <span>{isEs ? 'Por favor completa los siguientes campos:' : 'Please fill in required fields:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                {formValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Explicit USD Total Card */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] rounded-xl p-4 border border-[#D4AF37]/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{isEs ? 'Restaurante:' : 'Restaurant:'}</span>
              <span className="font-semibold text-white">
                Sher E Punjab ({currentBranch?.name || 'Quito / Cumbayá'})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{isEs ? 'Subtotal Comida:' : 'Food Subtotal:'}</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)} USD</span>
            </div>

            {deliveryFee > 0 && (
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>{isEs ? 'Costo de Envío:' : 'Delivery Fee:'}</span>
                <span className="font-mono text-white">${deliveryFee.toFixed(2)} USD</span>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="font-bold text-sm text-white">
                {isEs ? 'Total a Pagar:' : 'Total Amount:'}
              </span>
              <div className="text-right">
                <span className="font-mono font-bold text-xl text-[#D4AF37]">
                  ${totalCartPrice.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Form: Customer Details with Microcopy */}
          <div className="bg-[#181818] rounded-xl p-4 border border-white/10 space-y-3.5 text-xs">
            <h4 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{isEs ? 'Datos del Cliente para el Pago' : 'Cardholder & Customer Details'}</span>
            </h4>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                {isEs ? 'Nombre Completo' : 'Full Name'}{' '}
                <span className="text-[#FF6321]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={isEs ? 'Ej: John Smith o Carlos Andrade' : 'E.g., John Smith or Carlos Andrade'}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <User className="w-4 h-4 text-white/40 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Email Address with receipt microcopy */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                {isEs ? 'Correo Electrónico (para comprobante oficial)' : 'Email Address (for official receipt)'}{' '}
                <span className="text-[#FF6321]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <Mail className="w-4 h-4 text-white/40 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[10px] text-white/50 mt-1 pl-1">
                {isEs
                  ? 'Recibirás el recibo y comprobante oficial de PayPhone en esta dirección.'
                  : 'You will receive your official PayPhone receipt at this email address.'}
              </p>
            </div>

            {/* Phone Number with International Microcopy */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                {isEs ? 'Número de Teléfono' : 'Phone Number'}{' '}
                <span className="text-[#FF6321]">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 555 123 4567 / +593 99 900 0608"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs sm:text-sm focus:outline-none focus:border-[#D4AF37] transition-colors font-mono"
                />
                <Phone className="w-4 h-4 text-white/40 absolute left-2.5 top-2.5" />
              </div>
              {/* Clear input microcopy for country code */}
              <p className="text-[10px] text-[#D4AF37] mt-1 pl-1 font-medium flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#D4AF37] shrink-0" />
                <span>
                  {isEs
                    ? 'Número de Teléfono (Incluye código de país, ej: +1 para EE.UU., +593 para Ecuador)'
                    : 'Phone Number (Include Country Code, e.g., +1 for USA, +593 for Ecuador)'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Button: Pagar con Tarjeta / Pay with Card */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="payphone-submit-checkout-btn"
              disabled={isLoading || totalCartPrice <= 0}
              onClick={handlePayWithCard}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#C9A028] to-[#AA820A] hover:brightness-110 active:scale-98 disabled:opacity-50 text-black font-bold text-sm sm:text-base flex items-center justify-between transition-all shadow-xl shadow-[#D4AF37]/20 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <CreditCard className="w-5 h-5 text-black shrink-0" />
                )}
                <span>
                  {isLoading
                    ? isEs
                      ? 'Conectando con Pasarela Segura...'
                      : 'Connecting to Secure Gateway...'
                    : isEs
                    ? 'Pagar con Tarjeta'
                    : 'Pay with Card'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-black font-extrabold text-sm sm:text-base">
                <span>${totalCartPrice.toFixed(2)} USD</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </div>
            </button>

            <p className="text-[10px] text-white/50 text-center">
              {isEs
                ? 'Al hacer clic, serás redirigido a la pantalla de pago segura de PayPhone para ingresar los datos de tu tarjeta.'
                : 'You will be redirected to PayPhone’s secure checkout to enter your card details.'}
            </p>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs transition-colors cursor-pointer"
          >
            {isEs ? 'Cancelar y volver al carrito' : 'Cancel and return to cart'}
          </button>
        </div>

        {/* Modal Footer / 256-bit SSL Trust Badge */}
        <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 shrink-0">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEs ? 'Cifrado Seguro 256-bit SSL' : '256-bit SSL Secure Encryption'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Sher E Punjab Ecuador</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPhoneModal;
