export type Language = 'es' | 'en';

export type SpiceLevel = 'mild' | 'medium' | 'hot' | 'extra_hot';

export type CompanionOption = 'plain_naan' | 'roti' | 'rice' | 'garlic_naan';

export type SoftDrinkOption = 'coke' | 'fanta' | 'sprite' | 'fuze_tea';

export type ServiceType = 'dine_in' | 'takeout' | 'delivery';

export interface AddonOption {
  id: string;
  nameEs: string;
  nameEn: string;
  price: number;
  isDefault?: boolean;
}

export interface MenuItem {
  id: string;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isChefSpecial?: boolean;
  isAvailable: boolean;
  spiceCustomizable?: boolean;
  defaultSpiceLevel?: SpiceLevel;
  availableAddons?: AddonOption[];
}

export interface Category {
  id: string;
  nameEs: string;
  nameEn: string;
  iconName?: string;
  order: number;
}

export interface CartItem {
  cartItemId: string; // Unique hash based on item id + spice + companion + flavor + addons + notes
  dishId: string;
  nameEs: string;
  nameEn: string;
  basePrice: number;
  totalUnitPrice: number;
  spiceLevel?: SpiceLevel;
  companionOption?: CompanionOption;
  drinkFlavor?: SoftDrinkOption;
  selectedAddons: AddonOption[];
  specialInstructions?: string;
  quantity: number;
  imageUrl: string;
}

export interface RestaurantBranch {
  id: string;
  name: string;
  shortName: string;
  address: string;
  sector: string;
  latitude: number;
  longitude: number;
  whatsappNumber: string;
  whatsappFormatted: string;
}

export interface LiveLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  mapsUrl: string;
  addressText?: string;
}

export interface OrderCustomerDetails {
  customerName: string;
  customerPhone: string;
  serviceType: ServiceType;
  deliveryAddress: string;
  tableNumber: string;
  orderNotes: string;
  liveLocation?: LiveLocationData;
  assignedBranch?: RestaurantBranch;
  branchDistanceKm?: number;
  isManualBranch?: boolean;
}

export interface RestaurantConfig {
  name: string;
  taglineEs: string;
  taglineEn: string;
  address: string;
  city: string;
  country: string;
  whatsappNumber: string;
  whatsappFormatted: string;
  openingHour: number; // 12 (12 PM)
  openingMinute: number; // 0
  closingHour: number; // 21 (9 PM)
  closingMinute: number; // 30 (9:30 PM)
  deliveryFee: number; // USD
  currency: string;
}

export interface PayPhonePaymentInfo {
  isPaid: boolean;
  transactionId?: string | number;
  clientTransactionId?: string;
  authorizationCode?: string;
  statusCode?: number;
  transactionStatus?: string;
  paidAmountDollars?: number;
  cardBrand?: string;
  lastDigits?: string;
  email?: string;
  phoneNumber?: string;
  paymentDate?: string;
  message?: string;
}

export interface PayPhoneCreateResponse {
  success: boolean;
  token?: string;
  paymentId?: number | string;
  clientTransactionId?: string;
  amountCents?: number;
  taxCents?: number;
  amountWithTaxCents?: number;
  amountWithoutTaxCents?: number;
  isDirectFallback?: boolean;
  storeId?: string;
  appId?: string;
  error?: string;
}

export interface RestaurantBranding {
  logoUrl?: string | null;
  heroBgUrl?: string | null;
  updatedAt?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  clientTransactionId: string;
  items: CartItem[];
  customer: OrderCustomerDetails;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'QR' | 'TRANSFER' | 'CASH' | 'PAYPHONE' | 'CARD';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  isVerified: boolean;
  transferTransactionId?: string;
  receiptImageData?: string;
  receiptFileName?: string;
  cashBillAmount?: string;
  payphonePayment?: PayPhonePaymentInfo;
  createdAt: string;
  status: 'RECEIVED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED';
}


