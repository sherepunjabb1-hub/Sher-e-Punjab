import { CartItem, Category, MenuItem } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_MENU_ITEMS } from '../data/seedData';

const STORAGE_KEYS = {
  MENU_ITEMS: 'sherepunjab_menu_items_v2025',
  CATEGORIES: 'sherepunjab_categories_v2025',
  CART: 'sherepunjab_cart_items_v2025',
  LANGUAGE: 'sherepunjab_language_pref',
  ADMIN_AUTH_TOKEN: 'sherepunjab_admin_auth_v2',
  ADMIN_PASSWORD_HASH: 'sherepunjab_admin_pass_v2',
};

// Default initial admin password: "sherepunjab2025"
// Master recovery secret code: "QUITO-SEP-ADMIN"
const DEFAULT_PASSWORD = 'sherepunjab2025';
export const MASTER_RECOVERY_CODE = 'QUITO-SEP-ADMIN';

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading stored categories', err);
  }
  // Initialize with seed defaults
  setStoredCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function setStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories', err);
  }
}

export function getStoredMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading stored menu items', err);
  }
  // Initialize with seed defaults
  setStoredMenuItems(DEFAULT_MENU_ITEMS);
  return DEFAULT_MENU_ITEMS;
}

export function setStoredMenuItems(items: MenuItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving menu items', err);
  }
}

export function resetToSeedData(): { menu: MenuItem[]; categories: Category[] } {
  setStoredMenuItems(DEFAULT_MENU_ITEMS);
  setStoredCategories(DEFAULT_CATEGORIES);
  return {
    menu: DEFAULT_MENU_ITEMS,
    categories: DEFAULT_CATEGORIES,
  };
}

export function getStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CART);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading cart from localStorage', err);
  }
  return [];
}

export function setStoredCart(cart: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (err) {
    console.error('Error saving cart to localStorage', err);
  }
}

export function clearStoredCart(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CART);
  } catch (err) {
    console.error('Error clearing cart', err);
  }
}

// Admin Security Management
export function verifyAdminPassword(passwordAttempt: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH);
    const validPassword = stored || DEFAULT_PASSWORD;
    return passwordAttempt.trim() === validPassword.trim();
  } catch {
    return passwordAttempt.trim() === DEFAULT_PASSWORD;
  }
}

export function updateAdminPassword(newPassword: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD_HASH, newPassword.trim());
  } catch (err) {
    console.error('Error updating admin password', err);
  }
}

export function resetAdminPasswordWithMasterSecret(masterCodeAttempt: string, newPassword: string): boolean {
  if (masterCodeAttempt.trim() === MASTER_RECOVERY_CODE) {
    updateAdminPassword(newPassword);
    return true;
  }
  return false;
}

export function compressImageFile(file: File, maxWidth = 900, maxHeight = 700, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = elem.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
