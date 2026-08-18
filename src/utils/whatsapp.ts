import { CartItem, Language, OrderCustomerDetails } from '../types';
import { RESTAURANT_CONFIG } from '../data/seedData';
import { SERVICE_TYPE_LABELS, SPICE_LEVEL_LABELS } from './translations';
import { RESTAURANT_BRANCHES } from './branchRouting';

export function generateWhatsAppOrderUrl(
  items: CartItem[],
  details: OrderCustomerDetails,
  subtotal: number,
  deliveryFee: number,
  total: number,
  lang: Language = 'es'
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
      : lang === 'es' ? 'Retiro en restaurante' : 'Pickup at restaurant';

  let message = `Hola *${branch.name}*, ${isEs ? 'quiero hacer un pedido' : 'I would like to place an order'}:\n\n`;
  message += `- *${isEs ? 'Cliente' : 'Customer'}:* ${details.customerName.trim()}\n`;
  message += `- *${isEs ? 'Teléfono' : 'Phone'}:* ${details.customerPhone.trim()}\n`;
  message += `- *${isEs ? 'Servicio' : 'Service'}:* ${serviceLabel}\n`;
  message += `- *${isEs ? 'Dirección' : 'Address'}:* ${locationDetail.trim()}\n`;

  if (details.serviceType === 'delivery' && details.branchDistanceKm !== undefined) {
    message += `- *${isEs ? 'Distancia a Sucursal' : 'Distance to Branch'}:* ${details.branchDistanceKm.toFixed(1)} km\n`;
  }

  if (details.liveLocation) {
    message += `- *📍 ${isEs ? 'Ubicación GPS' : 'Live GPS'}:* ${details.liveLocation.mapsUrl}\n`;
    if (details.liveLocation.accuracy) {
      message += `  _(${isEs ? 'Precisión' : 'Accuracy'} ±${Math.round(details.liveLocation.accuracy)}m)_\n`;
    }
  }

  message += `\n*${isEs ? 'PEDIDO' : 'ORDER ITEMS'}:*\n`;

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

  message += `\n--------------------------------\n`;
  if (details.serviceType === 'delivery' && deliveryFee > 0) {
    message += `*${isEs ? 'Subtotal' : 'Subtotal'}:* $${subtotal.toFixed(2)} USD\n`;
    message += `*${isEs ? 'Envío a Domicilio' : 'Delivery Fee'}:* $${deliveryFee.toFixed(2)} USD\n`;
  }
  message += `*Total:* $${total.toFixed(2)} USD\n`;

  if (details.orderNotes && details.orderNotes.trim().length > 0) {
    message += `*${isEs ? 'Notas Adicionales' : 'Additional Notes'}:* ${details.orderNotes.trim()}\n`;
  }

  message += `--------------------------------\n`;
  message += `${isEs ? `¡Gracias por su preferencia en ${branch.name}!` : `Thank you for choosing ${branch.name}!`}`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${targetWhatsApp}?text=${encodedMessage}`;
}
