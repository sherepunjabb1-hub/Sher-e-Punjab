export type Language = 'es' | 'en';

export type SpiceLevel = 'mild' | 'medium' | 'hot' | 'extra_hot';

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
  cartItemId: string; // Unique hash based on item id + spice + addons + notes
  dishId: string;
  nameEs: string;
  nameEn: string;
  basePrice: number;
  totalUnitPrice: number;
  spiceLevel?: SpiceLevel;
  selectedAddons: AddonOption[];
  specialInstructions?: string;
  quantity: number;
  imageUrl: string;
}

export interface OrderCustomerDetails {
  customerName: string;
  customerPhone: string;
  serviceType: ServiceType;
  deliveryAddress: string;
  tableNumber: string;
  orderNotes: string;
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
