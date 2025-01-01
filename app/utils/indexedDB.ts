const DB_NAME = 'CouponAppDB';
const DB_VERSION = 1;
const COUPON_STORE = 'coupons';
const STORE_STORE = 'stores';
const PREFERENCES_STORE = 'preferences';

let db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(COUPON_STORE)) {
        db.createObjectStore(COUPON_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_STORE)) {
        db.createObjectStore(STORE_STORE, { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains(PREFERENCES_STORE)) {
        db.createObjectStore(PREFERENCES_STORE, { keyPath: 'key' });
      }
    };
  });
}

export function getAll<T>(storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    }).catch(reject);
  });
}

export function get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    }).catch(reject);
  });
}

export function add<T>(storeName: string, item: T): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    }).catch(reject);
  });
}

export function update<T>(storeName: string, item: T): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    }).catch(reject);
  });
}

export function remove(storeName: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB().then(db => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    }).catch(reject);
  });
}

