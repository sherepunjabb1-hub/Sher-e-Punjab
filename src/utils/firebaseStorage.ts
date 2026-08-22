import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Category, MenuItem, RestaurantConfig } from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  RESTAURANT_CONFIG,
} from '../data/seedData';
import {
  getStoredCategories,
  getStoredMenuItems,
  setStoredCategories,
  setStoredMenuItems,
} from './storage';

export const MASTER_RECOVERY_CODE = 'QUITO-SEP-ADMIN';
const DEFAULT_PASSWORD = 'sherepunjab2025';

// Memory cache for synchronous password checks if needed
let cachedAdminPassword = DEFAULT_PASSWORD;

/**
 * Initialize and listen to real-time Menu Items from Firestore
 */
export function subscribeToMenuItems(
  onUpdate: (items: MenuItem[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const menuCollection = collection(db, 'menu_items');

  return onSnapshot(
    menuCollection,
    async (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty, auto-seed with all 131 default items
        console.log('Firestore menu_items collection empty. Auto-seeding...');
        const initialItems = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
        onUpdate(initialItems);
        await seedFirestoreMenuItems(initialItems);
      } else {
        const items: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as MenuItem);
        });
        // Sort items logically by category and name/order if possible
        items.sort((a, b) => a.nameEs.localeCompare(b.nameEs));
        setStoredMenuItems(items); // Update local cache
        onUpdate(items);
      }
    },
    (error) => {
      console.warn('Firebase menu subscription error, falling back to cache:', error);
      if (onError) onError(error);
      const fallback = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
      onUpdate(fallback);
    }
  );
}

/**
 * Initialize and listen to real-time Categories from Firestore
 */
export function subscribeToCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const catCollection = collection(db, 'categories');

  return onSnapshot(
    catCollection,
    async (snapshot) => {
      if (snapshot.empty) {
        console.log('Firestore categories collection empty. Auto-seeding...');
        const initialCats = getStoredCategories() || DEFAULT_CATEGORIES;
        onUpdate(initialCats);
        await seedFirestoreCategories(initialCats);
      } else {
        const cats: Category[] = [];
        snapshot.forEach((docSnap) => {
          cats.push(docSnap.data() as Category);
        });
        cats.sort((a, b) => (a.order || 0) - (b.order || 0));
        setStoredCategories(cats); // Update local cache
        onUpdate(cats);
      }
    },
    (error) => {
      console.warn('Firebase categories subscription error, using cache:', error);
      if (onError) onError(error);
      const fallback = getStoredCategories() || DEFAULT_CATEGORIES;
      onUpdate(fallback);
    }
  );
}

/**
 * Listen to real-time Admin Auth Settings in Firestore
 */
export function subscribeToAdminAuth(
  onUpdate?: (password: string) => void
): Unsubscribe {
  const authDocRef = doc(db, 'settings', 'admin_auth');

  return onSnapshot(
    authDocRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        // Seed default admin password to cloud
        await setDoc(authDocRef, {
          password: DEFAULT_PASSWORD,
          updatedAt: new Date().toISOString(),
        });
        cachedAdminPassword = DEFAULT_PASSWORD;
      } else {
        const data = docSnap.data();
        if (data?.password) {
          cachedAdminPassword = data.password;
          if (onUpdate) onUpdate(data.password);
        }
      }
    },
    (err) => {
      console.warn('Firebase admin auth listener error:', err);
    }
  );
}

/**
 * Save / Update single Menu Item in Firestore (Real-time live to all visitors)
 */
export async function saveMenuItemToFirestore(dish: MenuItem): Promise<void> {
  const docRef = doc(db, 'menu_items', dish.id);
  await setDoc(docRef, { ...dish, updatedAt: new Date().toISOString() });
}

/**
 * Delete Menu Item from Firestore
 */
export async function deleteMenuItemFromFirestore(dishId: string): Promise<void> {
  const docRef = doc(db, 'menu_items', dishId);
  await deleteDoc(docRef);
}

/**
 * Toggle Dish Availability in Firestore
 */
export async function toggleDishAvailabilityInFirestore(
  dishId: string,
  isAvailable: boolean
): Promise<void> {
  const docRef = doc(db, 'menu_items', dishId);
  await updateDoc(docRef, { isAvailable, updatedAt: new Date().toISOString() });
}

/**
 * Save / Update Category in Firestore
 */
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  const docRef = doc(db, 'categories', category.id);
  await setDoc(docRef, { ...category, updatedAt: new Date().toISOString() });
}

/**
 * Delete Category from Firestore
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  const docRef = doc(db, 'categories', categoryId);
  await deleteDoc(docRef);
}

/**
 * Bulk seed Menu Items into Firestore using batched writes
 */
export async function seedFirestoreMenuItems(items: MenuItem[] = DEFAULT_MENU_ITEMS): Promise<void> {
  try {
    const batchSize = 400; // Firestore limit is 500 ops per batch
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const docRef = doc(db, 'menu_items', item.id);
        batch.set(docRef, { ...item, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
    }
    console.log(`Successfully seeded ${items.length} menu items into Firestore!`);
  } catch (error) {
    console.error('Error seeding Firestore menu items:', error);
  }
}

/**
 * Bulk seed Categories into Firestore
 */
export async function seedFirestoreCategories(categories: Category[] = DEFAULT_CATEGORIES): Promise<void> {
  try {
    const batch = writeBatch(db);
    categories.forEach((cat) => {
      const docRef = doc(db, 'categories', cat.id);
      batch.set(docRef, { ...cat, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
    console.log(`Successfully seeded ${categories.length} categories into Firestore!`);
  } catch (error) {
    console.error('Error seeding Firestore categories:', error);
  }
}

/**
 * Reset entire cloud menu back to original official 2025 seeds
 */
export async function resetCloudMenuToDefault(): Promise<{ menu: MenuItem[]; categories: Category[] }> {
  try {
    // Delete existing menu items
    const menuSnaps = await getDocs(collection(db, 'menu_items'));
    const catSnaps = await getDocs(collection(db, 'categories'));

    const deleteBatch = writeBatch(db);
    menuSnaps.forEach((d) => deleteBatch.delete(d.ref));
    catSnaps.forEach((d) => deleteBatch.delete(d.ref));
    await deleteBatch.commit();

    // Re-seed with fresh defaults
    await seedFirestoreMenuItems(DEFAULT_MENU_ITEMS);
    await seedFirestoreCategories(DEFAULT_CATEGORIES);

    return {
      menu: DEFAULT_MENU_ITEMS,
      categories: DEFAULT_CATEGORIES,
    };
  } catch (err) {
    console.error('Error resetting cloud menu:', err);
    return {
      menu: DEFAULT_MENU_ITEMS,
      categories: DEFAULT_CATEGORIES,
    };
  }
}

/**
 * Verify Admin Password against Firestore cloud database (with memory fallback)
 */
export async function verifyAdminPasswordCloud(passwordAttempt: string): Promise<boolean> {
  const cleanAttempt = passwordAttempt.trim();
  try {
    const authDocRef = doc(db, 'settings', 'admin_auth');
    const snap = await getDoc(authDocRef);
    if (snap.exists()) {
      const currentPass = snap.data()?.password;
      if (currentPass) {
        cachedAdminPassword = currentPass;
        return cleanAttempt === currentPass.trim();
      }
    }
  } catch (err) {
    console.warn('Cloud password check error, using cached password:', err);
  }
  return cleanAttempt === cachedAdminPassword.trim();
}

/**
 * Synchronous password check from live cached state
 */
export function verifyAdminPasswordFast(passwordAttempt: string): boolean {
  return passwordAttempt.trim() === cachedAdminPassword.trim();
}

/**
 * Update Admin Password in Firestore cloud database (Immediately live everywhere)
 */
export async function updateAdminPasswordCloud(newPassword: string): Promise<void> {
  const cleanPass = newPassword.trim();
  cachedAdminPassword = cleanPass;
  const authDocRef = doc(db, 'settings', 'admin_auth');
  await setDoc(authDocRef, {
    password: cleanPass,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Reset password via Master Recovery Key in Cloud Firestore
 */
export async function resetAdminPasswordWithMasterSecretCloud(
  masterCodeAttempt: string,
  newPassword: string
): Promise<boolean> {
  if (masterCodeAttempt.trim() === MASTER_RECOVERY_CODE) {
    await updateAdminPasswordCloud(newPassword);
    return true;
  }
  return false;
}
