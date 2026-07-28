import type { MediaAssetMeta } from '@/cms/media/types'

const DB_NAME = 'notype-cms-media'
const DB_VERSION = 1
const STORE = 'assets'

type StoredRow = MediaAssetMeta & { blob: Blob }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

export async function idbListAssets(): Promise<StoredRow[]> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const rows = await reqToPromise(store.getAll() as IDBRequest<StoredRow[]>)
    return rows.sort((a, b) => b.createdAt - a.createdAt)
  } finally {
    db.close()
  }
}

export async function idbPutAsset(row: StoredRow): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await reqToPromise(tx.objectStore(STORE).put(row))
  } finally {
    db.close()
  }
}

export async function idbDeleteAsset(id: string): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await reqToPromise(tx.objectStore(STORE).delete(id))
  } finally {
    db.close()
  }
}

export async function idbClearAssets(): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await reqToPromise(tx.objectStore(STORE).clear())
  } finally {
    db.close()
  }
}
