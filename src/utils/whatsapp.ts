import { CartItem, Language, OrderCustomerDetails, PayPhonePaymentInfo } from '../types';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { SERVICE_TYPE_LABELS, SPICE_LEVEL_LABELS } from './translations';
import { RESTAURANT_BRANCHES } from './branchRouting';

function sanitizeInput(str: string): string {
  if (!str) return '';
  return str.replace(/[*_~`]/g, '').trim();
}

export function openWhatsAppUrl(url: string): void {
  try {
    const win = window.open(url, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.assign(url);
    }
  } catch {
    window.location.assign(url);
  }
}

export function generateWhatsAppOrderUrl(
  items: CartItem[],
  details: OrderCustomerDetails,
  subtotal: number,
  deliveryFee: number,
  total: number,
  lang: Language = 'es',
  paymentMethod: 'QR' | 'TRANSFER' | 'CASH' | 'CARD' | 'PAYPHONE' = 'QR',
  orderNumber?: string,
  transferTransactionId?: string,
  hasReceiptAttachment: boolean = false,
  cashBillAmount?: string
): string {
  const isEs = lang === 'es';
  const branch = details.assignedBranch || RESTAURANT_BRANCHES[1]; // default to Quito branch if not assigned
  const targetWhatsApp = branch.whatsappNumber || RESTAURANT_CONFIG.whatsappNumber;

  const serviceLabel =
    lang === 'es'
      ? SERVICE_TYPE_LABELS[details.serviceType].es
      : SERVICE_TYPE_LABELS[details.serviceType].en;

  const locationDetail =
    details.serviceType === 'delivery'
      ? details.deliveryAddress || (lang === 'es' ? 'No especificada' : 'Not specified')
      : details.serviceType === 'dine_in'
      ? `${lang === 'es' ? 'Mesa' : 'Table'}: ${details.tableNumber || (lang === 'es' ? 'No indicada' : 'Not specified')}`
      : lang === 'es'
      ? 'Retiro en restaurante'
      : 'Pickup at restaurant';

  const cleanCustomerName = sanitizeInput(details.customerName);
  const cleanCustomerId = sanitizeInput(details.customerId);
  const cleanCustomerPhone = sanitizeInput(details.customerPhone);
  const cleanCustomerEmail = sanitizeInput(details.customerEmail);
  const cleanAddress = sanitizeInput(locationDetail);

  let message = '';

  message += `🍛 *NUEVO PEDIDO - SHER E PUNJAB*\n`;
  if (orderNumber) {
    message += `🧾 *Código de Pedido:* #${orderNumber}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (paymentMethod === 'QR') {
    message += `💳 *MÉTODO DE PAGO:* 📱 Pago con QR Deuna! / Banco Pichincha\n`;
    message += `👤 *Titular Deuna:* Sukhjinder Boparai\n`;
    if (transferTransactionId && transferTransactionId.trim()) {
      message += `🔖 *ID TRANSACCIÓN / COMPROBANTE DEUNA:* ${sanitizeInput(transferTransactionId)}\n`;
    }
    if (hasReceiptAttachment) {
      message += `📸 *Comprobante:* ✅ Captura de pago Deuna! adjunta\n`;
    } else {
      message += `📸 *Comprobante:* Adjunto comprobante a continuación en este chat\n`;
    }
  } else if (paymentMethod === 'TRANSFER') {
    message += `💳 *MÉTODO DE PAGO:* 🏦 Transferencia Bancaria (Banco Pichincha)\n`;
    message += `📌 *Cuenta:* Ahorros 3031633500 (SHER E PUNJAB - RUC 1715256226001)\n`;
    if (transferTransactionId && transferTransactionId.trim()) {
      message += `🔖 *N° DE COMPROBANTE / ID TRANSACCIÓN:* ${sanitizeInput(transferTransactionId)}\n`;
    }
    if (hasReceiptAttachment) {
      message += `📸 *Comprobante:* ✅ Foto de comprobante adjunta\n`;
    } else {
      message += `📸 *Comprobante:* Adjunto comprobante a continuación en este chat\n`;
    }
  } else {
    message += `💵 *MÉTODO DE PAGO:* 💵 Efectivo contra entrega (Al repartidor)\n`;
    if (cashBillAmount && cashBillAmount.trim()) {
      message += `💵 *Paga con billete de:* $${sanitizeInput(cashBillAmount)} USD (Requiere cambio)\n`;
    }
  }
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `👤 *${isEs ? 'Cliente' : 'Customer'}:* ${cleanCustomerName}\n`;
  message += `🆔 *${isEs ? 'Cédula / RUC (ID cualquier país)' : 'ID / Cedula / RUC (any country ID)'}:* ${cleanCustomerId}\n`;
  message += `📞 *${isEs ? 'Teléfono' : 'Phone'}:* ${cleanCustomerPhone}\n`;
  message += `✉️ *${isEs ? 'Correo Electrónico' : 'Email'}:* ${cleanCustomerEmail}\n`;
  message += `🛎️ *${isEs ? 'Servicio' : 'Service'}:* ${serviceLabel}\n`;
  message += `📍 *${isEs ? 'Dirección' : 'Address'}:* ${cleanAddress}\n`;

  if (details.serviceType === 'delivery' && details.branchDistanceKm !== undefined) {
    message += `📏 *${isEs ? 'Distancia a Sucursal' : 'Distance to Branch'}:* ${details.branchDistanceKm.toFixed(1)} km\n`;
  }

  if (details.liveLocation) {
    message += `🌐 *${isEs ? 'Ubicación GPS' : 'Live GPS'}:* ${details.liveLocation.mapsUrl}\n`;
    if (details.liveLocation.accuracy) {
      message += `  _(${isEs ? 'Precisión' : 'Accuracy'} ±${Math.round(details.liveLocation.accuracy)}m)_\n`;
    }
  }

  message += `\n🍽️ *${isEs ? 'DETALLE DEL PEDIDO' : 'ORDER DETAILS'}:*\n`;

  items.forEach((item) => {
    const itemName = isEs ? item.nameEs : item.nameEn;
    const itemTotal = (item.totalUnitPrice * item.quantity).toFixed(2);
    message += `• ${item.quantity}x ${itemName} ($${itemTotal})\n`;

    if (item.spiceLevel) {
      const spiceText = isEs
        ? SPICE_LEVEL_LABELS[item.spiceLevel].es
        : SPICE_LEVEL_LABELS[item.spiceLevel].en;
      message += `  - ${isEs ? 'Picante' : 'Spice'}: ${spiceText}\n`;
    }

    if (item.companionOption) {
      const compText =
        item.companionOption === 'plain_naan'
          ? isEs
            ? 'Pan Naan Tradicional'
            : 'Plain Naan'
          : item.companionOption === 'roti'
          ? isEs
            ? 'Pan Roti (Integral)'
            : 'Roti (Whole Wheat)'
          : item.companionOption === 'rice'
          ? isEs
            ? 'Arroz Basmati Simple'
            : 'Basmati Rice'
          : isEs
          ? 'Pan Garlic Naan (Ajo)'
          : 'Garlic Naan';
      message += `  - ${isEs ? 'Acompañamiento' : 'Companion'}: ${compText}\n`;
    }

    if (item.drinkFlavor) {
      const flavorText =
        item.drinkFlavor === 'coke'
          ? 'coke'
          : item.drinkFlavor === 'fanta'
          ? 'fanta'
          : item.drinkFlavor === 'sprite'
          ? 'sprite'
          : 'fuze tea';
      message += `  - ${isEs ? 'Bebida' : 'Drink'}: ${flavorText}\n`;
    }

    if (item.selectedAddons && item.selectedAddons.length > 0) {
      const addonsText = item.selectedAddons
        .map((a) => `${isEs ? a.nameEs : a.nameEn} (+$${a.price.toFixed(2)})`)
        .join(', ');
      message += `  - ${isEs ? 'Extras' : 'Add-ons'}: ${addonsText}\n`;
    }

    if (item.specialInstructions && item.specialInstructions.trim().length > 0) {
      message += `  - ${isEs ? 'Nota' : 'Note'}: ${sanitizeInput(item.specialInstructions)}\n`;
    }
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  if (details.serviceType === 'delivery' && deliveryFee > 0) {
    message += `*${isEs ? 'Subtotal' : 'Subtotal'}:* $${subtotal.toFixed(2)} USD\n`;
    message += `*${isEs ? 'Envío a Domicilio' : 'Delivery Fee'}:* $${deliveryFee.toFixed(2)} USD\n`;
  }
  message += `*TOTAL A PAGAR:* $${total.toFixed(2)} USD\n`;

  if (details.orderNotes && details.orderNotes.trim().length > 0) {
    message += `*${isEs ? 'Notas Adicionales' : 'Additional Notes'}:* ${sanitizeInput(details.orderNotes)}\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  if (paymentMethod === 'TRANSFER') {
    message += `📌 *Por favor verifiquen mi pago y confirmen la preparación.* 🍛\n`;
  } else {
    message += `📌 *Por favor confirmen el pedido para entrega contra entrega.* 🍛\n`;
  }
  message += `${isEs ? `¡Gracias por elegir ${branch.name}!` : `Thank you for choosing ${branch.name}!`}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${targetWhatsApp}?text=${encodedMessage}`;
}

