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
import { Category, MenuItem, OrderRecord, RestaurantConfig } from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  RESTAURANT_CONFIG,
} from '../data/seedData';
import {
  getStoredCategories,
  getStoredHeroBg,
  getStoredMenuItems,
  getStoredRestaurantLogo,
  setStoredCategories,
  setStoredHeroBg,
  setStoredMenuItems,
  setStoredRestaurantLogo,
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
  // Always emit local stored items first for instantaneous UI load
  const cachedItems = getStoredMenuItems();
  if (cachedItems && cachedItems.length > 0) {
    onUpdate(cachedItems);
  } else {
    onUpdate(DEFAULT_MENU_ITEMS);
  }

  try {
    const menuCollection = collection(db, 'menu_items');

    return onSnapshot(
      menuCollection,
      async (snapshot) => {
        try {
          if (snapshot.empty) {
            console.log('Firestore menu_items collection empty. Initializing defaults...');
            const initialItems = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
            onUpdate(initialItems);
            await seedFirestoreMenuItems(initialItems);
          } else {
            const items: MenuItem[] = [];
            snapshot.forEach((docSnap) => {
              items.push(docSnap.data() as MenuItem);
            });
            items.sort((a, b) => a.nameEs.localeCompare(b.nameEs));
            setStoredMenuItems(items); // Update local cache
            onUpdate(items);
          }
        } catch (innerErr) {
          console.warn('[Firestore Menu] Snapshot processing note:', innerErr);
        }
      },
      (error) => {
        // Handle unavailable / offline gracefully
        console.warn('[Firestore Menu] Operating in offline mode with cached menu:', error?.message || error);
        if (onError) onError(error);
        const fallback = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
        onUpdate(fallback);
      }
    );
  } catch (err) {
    console.warn('[Firestore Menu] Initialization note:', err);
    const fallback = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
    onUpdate(fallback);
    return () => {};
  }
}

/**
 * Initialize and listen to real-time Categories from Firestore
 */
export function subscribeToCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  // Emit local cache immediately
  const cachedCats = getStoredCategories();
  if (cachedCats && cachedCats.length > 0) {
    onUpdate(cachedCats);
  } else {
    onUpdate(DEFAULT_CATEGORIES);
  }

  try {
    const catCollection = collection(db, 'categories');

    return onSnapshot(
      catCollection,
      async (snapshot) => {
        try {
          if (snapshot.empty) {
            console.log('Firestore categories collection empty. Initializing defaults...');
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
        } catch (innerErr) {
          console.warn('[Firestore Categories] Snapshot processing note:', innerErr);
        }
      },
      (error) => {
        console.warn('[Firestore Categories] Operating in offline mode with cached categories:', error?.message || error);
        if (onError) onError(error);
        const fallback = getStoredCategories() || DEFAULT_CATEGORIES;
        onUpdate(fallback);
      }
    );
  } catch (err) {
    console.warn('[Firestore Categories] Initialization note:', err);
    const fallback = getStoredCategories() || DEFAULT_CATEGORIES;
    onUpdate(fallback);
    return () => {};
  }
}

/**
 * Listen to real-time Admin Auth Settings in Firestore
 */
export function subscribeToAdminAuth(
  onUpdate?: (password: string) => void
): Unsubscribe {
  try {
    const authDocRef = doc(db, 'settings', 'admin_auth');

    return onSnapshot(
      authDocRef,
      async (docSnap) => {
        try {
          if (!docSnap.exists()) {
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
        } catch (innerErr) {
          console.warn('[Firestore Auth] Processing note:', innerErr);
        }
      },
      (err) => {
        console.warn('[Firestore Auth] Listener note (using local cache):', err?.message || err);
      }
    );
  } catch (err) {
    console.warn('[Firestore Auth] Initialization note:', err);
    return () => {};
  }
}

/**
 * Listen to real-time Restaurant Branding (Logo & Hero Background) in Firestore
 */
export function subscribeToRestaurantBranding(
  onUpdate: (branding: { logoUrl: string | null; heroBgUrl: string | null }) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  // Emit local cache immediately for instantaneous 0ms UI load
  const cachedLogo = getStoredRestaurantLogo();
  const cachedHeroBg = getStoredHeroBg();
  onUpdate({ logoUrl: cachedLogo, heroBgUrl: cachedHeroBg });

  try {
    const brandingDocRef = doc(db, 'settings', 'restaurant_branding');

    return onSnapshot(
      brandingDocRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const logo = data?.logoUrl ? String(data.logoUrl).trim() : null;
            const heroBg = data?.heroBgUrl ? String(data.heroBgUrl).trim() : null;
            setStoredRestaurantLogo(logo);
            setStoredHeroBg(heroBg);
            onUpdate({ logoUrl: logo, heroBgUrl: heroBg });
          } else {
            const localLogo = getStoredRestaurantLogo();
            const localBg = getStoredHeroBg();
            onUpdate({ logoUrl: localLogo, heroBgUrl: localBg });
          }
        } catch (innerErr) {
          console.warn('[Firestore Branding] Snapshot processing note:', innerErr);
        }
      },
      (error) => {
        console.warn('[Firestore Branding] Operating with cached branding:', error?.message || error);
        if (onError) onError(error);
        const fallbackLogo = getStoredRestaurantLogo();
        const fallbackBg = getStoredHeroBg();
        onUpdate({ logoUrl: fallbackLogo, heroBgUrl: fallbackBg });
      }
    );
  } catch (err) {
    console.warn('[Firestore Branding] Initialization note:', err);
    const fallbackLogo = getStoredRestaurantLogo();
    const fallbackBg = getStoredHeroBg();
    onUpdate({ logoUrl: fallbackLogo, heroBgUrl: fallbackBg });
    return () => {};
  }
}

/**
 * Backward-compatible alias for logo subscription
 */
export function subscribeToRestaurantLogo(
  onUpdate: (logoUrl: string | null) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  return subscribeToRestaurantBranding((b) => onUpdate(b.logoUrl), onError);
}

/**
 * Save custom Restaurant Logo to Firestore & local storage
 */
export async function saveRestaurantLogoToFirestore(logoUrl: string | null): Promise<void> {
  const cleanUrl = logoUrl ? logoUrl.trim() : null;
  setStoredRestaurantLogo(cleanUrl);

  try {
    const brandingDocRef = doc(db, 'settings', 'restaurant_branding');
    await setDoc(
      brandingDocRef,
      {
        logoUrl: cleanUrl || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore Logo Save] Stored locally, will sync when online:', err);
  }
}

/**
 * Reset Restaurant Logo to default vector crest
 */
export async function resetRestaurantLogoInFirestore(): Promise<void> {
  setStoredRestaurantLogo(null);

  try {
    const brandingDocRef = doc(db, 'settings', 'restaurant_branding');
    await setDoc(
      brandingDocRef,
      {
        logoUrl: '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore Logo Reset] Reset locally:', err);
  }
}

/**
 * Save custom Hero Background image to Firestore & local storage
 */
export async function saveHeroBgToFirestore(heroBgUrl: string | null): Promise<void> {
  const cleanUrl = heroBgUrl ? heroBgUrl.trim() : null;
  setStoredHeroBg(cleanUrl);

  try {
    const brandingDocRef = doc(db, 'settings', 'restaurant_branding');
    await setDoc(
      brandingDocRef,
      {
        heroBgUrl: cleanUrl || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore HeroBg Save] Stored locally, will sync when online:', err);
  }
}

/**
 * Reset Hero Background to default elegant dark gradient
 */
export async function resetHeroBgInFirestore(): Promise<void> {
  setStoredHeroBg(null);

  try {
    const brandingDocRef = doc(db, 'settings', 'restaurant_branding');
    await setDoc(
      brandingDocRef,
      {
        heroBgUrl: '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore HeroBg Reset] Reset locally:', err);
  }
}

/**
 * Save / Update single Menu Item in Firestore (Real-time live to all visitors)
 */
export async function saveMenuItemToFirestore(dish: MenuItem): Promise<void> {
  // Update local cache immediately
  const existing = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
  const idx = existing.findIndex((m) => m.id === dish.id);
  const updated = idx >= 0 ? [...existing] : [dish, ...existing];
  if (idx >= 0) updated[idx] = dish;
  setStoredMenuItems(updated);

  try {
    const docRef = doc(db, 'menu_items', dish.id);
    await setDoc(docRef, { ...dish, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn('[Firestore Save] Stored locally, will sync when reconnected:', e);
  }
}

/**
 * Delete Menu Item from Firestore
 */
export async function deleteMenuItemFromFirestore(dishId: string): Promise<void> {
  // Update local cache immediately
  const existing = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
  const filtered = existing.filter((m) => m.id !== dishId);
  setStoredMenuItems(filtered);

  try {
    const docRef = doc(db, 'menu_items', dishId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[Firestore Delete] Deleted locally, will sync when reconnected:', e);
  }
}

/**
 * Toggle Dish Availability in Firestore
 */
export async function toggleDishAvailabilityInFirestore(
  dishId: string,
  isAvailable: boolean
): Promise<void> {
  const existing = getStoredMenuItems() || DEFAULT_MENU_ITEMS;
  const updated = existing.map((m) => (m.id === dishId ? { ...m, isAvailable } : m));
  setStoredMenuItems(updated);

  try {
    const docRef = doc(db, 'menu_items', dishId);
    await updateDoc(docRef, { isAvailable, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn('[Firestore Toggle] Updated locally, will sync when reconnected:', e);
  }
}

/**
 * Save / Update Category in Firestore
 */
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  const existing = getStoredCategories() || DEFAULT_CATEGORIES;
  const idx = existing.findIndex((c) => c.id === category.id);
  const updated = idx >= 0 ? [...existing] : [...existing, category];
  if (idx >= 0) updated[idx] = category;
  setStoredCategories(updated);

  try {
    const docRef = doc(db, 'categories', category.id);
    await setDoc(docRef, { ...category, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn('[Firestore Save Cat] Stored locally, will sync when reconnected:', e);
  }
}

/**
 * Delete Category from Firestore
 */
export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  const existing = getStoredCategories() || DEFAULT_CATEGORIES;
  const filtered = existing.filter((c) => c.id !== categoryId);
  setStoredCategories(filtered);

  try {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('[Firestore Delete Cat] Deleted locally, will sync when reconnected:', e);
  }
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

/**
 * Save / Register Order into Cloud Firestore in real time
 */
export async function saveOrderToFirestore(order: OrderRecord): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', order.id);
    await setDoc(orderDocRef, {
      ...order,
      updatedAt: new Date().toISOString(),
    });
    console.log(`[Firestore Orders] Order ${order.orderNumber} securely saved to cloud database.`);
  } catch (err) {
    console.warn('[Firestore Orders] Error saving order to Firestore (saved locally):', err);
  }
}

/**
 * Real-time listener for Orders in Cloud Firestore
 */
export function subscribeToOrders(
  onUpdate: (orders: OrderRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  try {
    const ordersCollection = collection(db, 'orders');
    return onSnapshot(
      ordersCollection,
      (snapshot) => {
        const list: OrderRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as OrderRecord);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('[Firestore Orders] Subscription note:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('[Firestore Orders] Initialization note:', err);
    return () => {};
  }
}

/**
 * Update status of an Order in Cloud Firestore
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  status: OrderRecord['status']
): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Firestore Orders] Error updating order status:', err);
  }
}

/**
 * Update payment verification and status of an Order in Cloud Firestore
 */
export async function updateOrderPaymentInFirestore(
  orderId: string,
  paymentStatus: OrderRecord['paymentStatus'],
  isVerified: boolean,
  status?: OrderRecord['status']
): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    const updateData: any = {
      paymentStatus,
      isVerified,
      updatedAt: new Date().toISOString(),
    };
    if (status) {
      updateData.status = status;
    }
    await updateDoc(orderDocRef, updateData);
  } catch (err) {
    console.warn('[Firestore Orders] Error updating order payment status:', err);
  }
}


