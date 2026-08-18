import { RestaurantBranch } from '../types';

/**
 * Restaurant Branches Configuration
 * Edit these coordinates, names, and WhatsApp numbers as needed.
 */
export const RESTAURANT_BRANCHES: RestaurantBranch[] = [
  {
    id: 'cumbaya',
    name: 'Sher E Punjab Cumbayá',
    shortName: 'Cumbayá',
    sector: 'Valle de Cumbayá & Tumbaco',
    address: 'Av. Pampite y Chimborazo, Cumbayá, Ecuador',
    latitude: -0.1983,
    longitude: -78.4354,
    whatsappNumber: '593958888698',
    whatsappFormatted: '+593 95 888 8698',
  },
  {
    id: 'quito',
    name: 'Sher E Punjab Quito',
    shortName: 'Quito Centro-Norte (La Mariscal / La Floresta)',
    sector: 'Quito Urbano (Norte, Centro, Sur)',
    address: 'Juan León Mera 2677 y La Pinta, Quito, Ecuador',
    latitude: -0.2023,
    longitude: -78.4911,
    whatsappNumber: '593987900005',
    whatsappFormatted: '+593 98 790 0005',
  },
];

/**
 * Calculates the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers (km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Determines the closest restaurant branch given a set of coordinates.
 */
export function findClosestBranch(
  userLat: number,
  userLng: number,
  branches: RestaurantBranch[] = RESTAURANT_BRANCHES
): { branch: RestaurantBranch; distanceKm: number } {
  let minDistance = Infinity;
  let closestBranch = branches[0];

  for (const branch of branches) {
    const dist = calculateHaversineDistance(
      userLat,
      userLng,
      branch.latitude,
      branch.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestBranch = branch;
    }
  }

  return {
    branch: closestBranch,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  assignedBranch: RestaurantBranch;
  distanceKm: number;
}

/**
 * Geocodes an address string using OpenStreetMap Nominatim restricted to Ecuador (countrycodes=ec).
 */
export async function geocodeEcuadorAddress(
  addressQuery: string,
  signal?: AbortSignal
): Promise<GeocodeResult | null> {
  const cleanQuery = addressQuery.trim();
  if (!cleanQuery) return null;

  // Append Ecuador/Quito context if missing to improve geocoding accuracy
  let queryWithContext = cleanQuery;
  const lower = cleanQuery.toLowerCase();
  if (!lower.includes('ecuador') && !lower.includes('quito') && !lower.includes('cumbaya') && !lower.includes('tumbaco')) {
    queryWithContext = `${cleanQuery}, Quito, Ecuador`;
  } else if (!lower.includes('ecuador')) {
    queryWithContext = `${cleanQuery}, Ecuador`;
  }

  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    queryWithContext
  )}&countrycodes=ec&limit=1`;

  const response = await fetch(endpoint, {
    headers: {
      'Accept-Language': 'es',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Geocoding HTTP error: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const first = data[0];
  const lat = parseFloat(first.lat);
  const lng = parseFloat(first.lon);

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const { branch, distanceKm } = findClosestBranch(lat, lng);

  return {
    latitude: lat,
    longitude: lng,
    displayName: first.display_name,
    assignedBranch: branch,
    distanceKm,
  };
}

/**
 * Calculates delivery fee based on distance from the closest branch:
 * - From 0 to 3 km: $2.00 USD
 * - Over 3 km: $2.00 + $0.50 per additional km
 * Default baseline (when distance is pending or within 0-3km): $2.00 USD
 */
export function calculateDeliveryFee(distanceKm?: number): number {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return 2.00;
  }
  if (distanceKm <= 3.0) {
    return 2.00;
  }
  const extraKm = distanceKm - 3.0;
  const totalFee = 2.00 + extraKm * 0.50;
  return Math.round(totalFee * 100) / 100;
}
