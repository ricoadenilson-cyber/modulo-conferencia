/**
 * IndexedDB storage for product photos with localStorage fallback.
 * Photos are permanent: not cleared by "Zerar" or day rollover.
 */

const DB_NAME = 'modulo_conferencia_photos_db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

interface PhotoRecord {
  code: string;
  dataUrl: string;
  updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'code' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

export async function saveProductPhoto(code: string, dataUrl: string): Promise<void> {
  const record: PhotoRecord = {
    code,
    dataUrl,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(`foto_${code}`, dataUrl);
    } catch {
      // Storage full or private mode, ignore silently
    }
  }
}

export async function getProductPhoto(code: string): Promise<string | null> {
  try {
    const db = await getDB();
    const result = await new Promise<PhotoRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(code);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result && result.dataUrl) {
      return result.dataUrl;
    }
  } catch {
    // Continue to fallback
  }

  // Check localStorage fallback
  try {
    return localStorage.getItem(`foto_${code}`);
  } catch {
    return null;
  }
}

export async function deleteProductPhoto(code: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(code);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error and try localStorage
  }

  try {
    localStorage.removeItem(`foto_${code}`);
  } catch {
    // ignore
  }
}

export async function getAllProductPhotos(codes: string[]): Promise<Record<string, string>> {
  const photos: Record<string, string> = {};

  try {
    const db = await getDB();
    const records = await new Promise<PhotoRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const rec of records) {
      if (rec.code && rec.dataUrl) {
        photos[rec.code] = rec.dataUrl;
      }
    }
  } catch {
    // IndexedDB failed, fallback to localStorage
  }

  // Also check localStorage for any codes not found in IndexedDB
  for (const code of codes) {
    if (!photos[code]) {
      try {
        const item = localStorage.getItem(`foto_${code}`);
        if (item) {
          photos[code] = item;
        }
      } catch {
        // ignore
      }
    }
  }

  return photos;
}
