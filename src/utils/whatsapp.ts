import { CartItem, Language, OrderCustomerDetails } from '../types';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { SERVICE_TYPE_LABELS, SPICE_LEVEL_LABELS } from './translations';

export function generateWhatsAppOrderUrl(
  items: CartItem[],
  details: OrderCustomerDetails,
  subtotal: number,
  deliveryFee: number,
  total: number,
  lang: Language = 'es'
): string {
  const serviceLabel =
    lang === 'es'
      ? SERVICE_TYPE_LABELS[details.serviceType].es
      : SERVICE_TYPE_LABELS[details.serviceType].en;

  const locationDetail =
    details.serviceType === 'delivery'
      ? details.deliveryAddress || (lang === 'es' ? 'No especificada' : 'Not specified')
      : details.serviceType === 'dine_in'
      ? `${lang === 'es' ? 'Mesa' : 'Table'}: ${details.tableNumber || (lang === 'es' ? 'No indicada' : 'Not specified')}`
      : lang === 'es' ? 'Retiro en restaurante' : 'Pickup at restaurant';

  const isEs = lang === 'es';

  let message = `*NUEVO PEDIDO - ${RESTAURANT_CONFIG.name}*\n`;
  message += `--------------------------------\n`;
  message += `*${isEs ? 'Cliente' : 'Customer'}:* ${details.customerName.trim()}\n`;
  message += `*${isEs ? 'Teléfono' : 'Phone'}:* ${details.customerPhone.trim()}\n`;
  message += `*${isEs ? 'Tipo de Servicio' : 'Service Type'}:* ${serviceLabel}\n`;
  message += `*${isEs ? 'Dirección / Mesa' : 'Address / Table'}:* ${locationDetail.trim()}\n`;
  message += `--------------------------------\n`;
  message += `*ITEMS:*\n`;

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

    if (item.selectedAddons && item.selectedAddons.length > 0) {
      const addonsText = item.selectedAddons
        .map((a) => `${isEs ? a.nameEs : a.nameEn} (+$${a.price.toFixed(2)})`)
        .join(', ');
      message += `  - ${isEs ? 'Extras' : 'Add-ons'}: ${addonsText}\n`;
    }

    if (item.specialInstructions && item.specialInstructions.trim().length > 0) {
      message += `  - ${isEs ? 'Nota' : 'Note'}: ${item.specialInstructions.trim()}\n`;
    }
  });

  message += `--------------------------------\n`;
  if (details.serviceType === 'delivery' && deliveryFee > 0) {
    message += `*${isEs ? 'Subtotal' : 'Subtotal'}:* $${subtotal.toFixed(2)} USD\n`;
    message += `*${isEs ? 'Envío a Domicilio' : 'Delivery Fee'}:* $${deliveryFee.toFixed(2)} USD\n`;
  }
  message += `*${isEs ? 'Total a Pagar' : 'Total Amount'}:* $${total.toFixed(2)} USD\n`;

  if (details.orderNotes && details.orderNotes.trim().length > 0) {
    message += `*${isEs ? 'Notas del Pedido' : 'Order Notes'}:* ${details.orderNotes.trim()}\n`;
  }

  message += `--------------------------------\n`;
  message += `${isEs ? '¡Gracias por su preferencia en Sher E Punjab Quito!' : 'Thank you for choosing Sher E Punjab Quito!'}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${RESTAURANT_CONFIG.whatsappNumber}?text=${encodedMessage}`;
}
