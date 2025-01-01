import { getAll, get, add, update, remove } from './indexedDB';
import { v4 as uuidv4 } from 'uuid';

const COUPON_STORE = 'coupons';
const STORE_STORE = 'stores';
const PREFERENCES_STORE = 'preferences';

export interface Coupon {
  id: string;
  store: string;
  code: string;
  discount: string;
  expiryDate: string;
  codeImage?: string;
  codeType?: 'qr' | 'barcode';
}

export interface NotificationPreferences {
  daysBeforeExpiry: number;
  notificationTime: string;
}

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const coupons = await getAll<Coupon>(COUPON_STORE);
    return Array.isArray(coupons) ? coupons : [];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw new Error('Failed to fetch coupons');
  }
}

export async function getStores(): Promise<string[]> {
  console.log('getStores function called');
  try {
    const stores = await getAll<{ name: string }>(STORE_STORE);
    const storeNames = Array.isArray(stores) ? stores.map(store => store.name) : [];
    console.log('Retrieved stores:', storeNames);
    return storeNames;
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
}

export async function addCoupon(coupon: Coupon): Promise<void> {
  console.log('addCoupon function called', coupon);
  try {
    if (!coupon.id || !coupon.store || !coupon.code || !coupon.discount || !coupon.expiryDate) {
      throw new Error('Invalid coupon data');
    }
    await add(COUPON_STORE, coupon);
    console.log('Coupon added to COUPON_STORE');
    const stores = await getStores();
    console.log('Current stores:', stores);
    if (!stores.includes(coupon.store)) {
      await add(STORE_STORE, { name: coupon.store });
      console.log('New store added:', coupon.store);
    }
    console.log('addCoupon completed successfully');
  } catch (error) {
    console.error('Error adding coupon:', error);
    throw new Error('Failed to add coupon: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function updateCoupon(updatedCoupon: Coupon): Promise<void> {
  try {
    await update(COUPON_STORE, updatedCoupon);
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw new Error('Failed to update coupon');
  }
}

export async function updateCouponWithNewStore(oldCoupon: Coupon, newStore: string): Promise<void> {
  try {
    // Delete the old coupon
    await remove(COUPON_STORE, oldCoupon.id);

    // Create a new coupon with the updated store
    const newCoupon: Coupon = {
      ...oldCoupon,
      id: uuidv4(), // Generate a new ID for the coupon
      store: newStore
    };

    // Add the new coupon
    await addCoupon(newCoupon);

    // Check if the old store has any remaining coupons
    const coupons = await getCoupons();
    const remainingCouponsForOldStore = coupons.filter(c => c.store === oldCoupon.store);

    // If no coupons remain for the old store, remove it from the stores list
    if (remainingCouponsForOldStore.length === 0) {
      await remove(STORE_STORE, oldCoupon.store);
    }

  } catch (error) {
    console.error('Error updating coupon with new store:', error);
    throw new Error('Failed to update coupon with new store');
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    await remove(COUPON_STORE, id);
    const coupons = await getCoupons();
    const remainingStores = [...new Set(coupons.map(c => c.store))];
    const currentStores = await getStores();
    for (const store of currentStores) {
      if (!remainingStores.includes(store)) {
        await remove(STORE_STORE, store);
      }
    }
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw new Error('Failed to delete coupon');
  }
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefs = await get<NotificationPreferences>(PREFERENCES_STORE, 'notificationPreferences');
    return prefs || { daysBeforeExpiry: 3, notificationTime: '09:00' };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return { daysBeforeExpiry: 3, notificationTime: '09:00' };
  }
}

export async function setNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
  try {
    await update(PREFERENCES_STORE, { key: 'notificationPreferences', ...preferences });
  } catch (error) {
    console.error('Error setting notification preferences:', error);
    throw new Error('Failed to set notification preferences');
  }
}

export async function deleteExpiredCoupons(): Promise<number> {
  try {
    const coupons = await getCoupons();
    const today = new Date();
    const validCoupons = coupons.filter((coupon) => {
      if (coupon.expiryDate === 'No Expiry') return true;
      const expiryDate = new Date(coupon.expiryDate);
      return expiryDate >= today;
    });
    const deletedCount = coupons.length - validCoupons.length;

    for (const coupon of coupons) {
      if (!validCoupons.includes(coupon)) {
        await remove(COUPON_STORE, coupon.id);
      }
    }

    const remainingStores = [...new Set(validCoupons.map(c => c.store))];
    const currentStores = await getStores();
    for (const store of currentStores) {
      if (!remainingStores.includes(store)) {
        await remove(STORE_STORE, store);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error deleting expired coupons:', error);
    throw new Error('Failed to delete expired coupons');
  }
}

export async function hasExpiredCoupons(): Promise<boolean> {
  try {
    const coupons = await getCoupons();
    const today = new Date();
    return coupons.some((coupon) => {
      if (coupon.expiryDate === 'No Expiry') return false;
      const expiryDate = new Date(coupon.expiryDate);
      return expiryDate < today;
    });
  } catch (error) {
    console.error('Error checking for expired coupons:', error);
    return false;
  }
}

