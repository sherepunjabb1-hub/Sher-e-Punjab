import { RESTAURANT_CONFIG } from '../data/seedData';

export interface RestaurantStatus {
  isOpen: boolean;
  statusTextEs: string;
  statusTextEn: string;
  nextOpenTextEs: string;
  nextOpenTextEn: string;
  currentEcuadorTime: string;
}

/**
 * Computes opening status according to Ecuador Time (UTC-5 / America/Guayaquil)
 * Operating Hours: Mon - Sun | 12:00 PM (12:00) to 9:30 PM (21:30)
 */
export function getRestaurantStatus(): RestaurantStatus {
  // Get current UTC time and convert to Ecuador (UTC-5)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  // Ecuador is UTC-5 all year round (no daylight saving)
  const ecuadorDate = new Date(utc - 5 * 3600000);

  const hours = ecuadorDate.getHours();
  const minutes = ecuadorDate.getMinutes();
  const currentTotalMinutes = hours * 60 + minutes;

  const openTotalMinutes = RESTAURANT_CONFIG.openingHour * 60 + RESTAURANT_CONFIG.openingMinute; // 12:00 -> 720
  const closeTotalMinutes = RESTAURANT_CONFIG.closingHour * 60 + RESTAURANT_CONFIG.closingMinute; // 21:30 -> 1290

  const isOpen = currentTotalMinutes >= openTotalMinutes && currentTotalMinutes < closeTotalMinutes;

  const timeFormatted = ecuadorDate.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    isOpen,
    statusTextEs: isOpen ? 'Abierto Ahora' : 'Cerrado Ahora',
    statusTextEn: isOpen ? 'Open Now' : 'Closed Now',
    nextOpenTextEs: isOpen ? 'Cierra a las 9:30 PM' : 'Abre a las 12:00 PM',
    nextOpenTextEn: isOpen ? 'Closes at 9:30 PM' : 'Opens at 12:00 PM',
    currentEcuadorTime: timeFormatted,
  };
}
