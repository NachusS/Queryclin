/**
 * DB optimizada para Big Data: Soporte para índice fragmentado.
 */
export const db = {
  dbName: 'QueryclinDB',
  version: 7,
  stores: {
    patients: 'patients',
    metadata: 'metadata',
    search_index: 'search_index',
    clinical_schemas: 'clinical_schemas',
    clinical_schema_versions: 'clinical_schema_versions',
    clinical_layouts: 'clinical_layouts'
  },

  _db: null as IDBDatabase | null,

  migrationsRegistry: {
    1: { description: 'Crear almacenes base', run: () => {} },
    5: { description: 'Asegurar consistencia del modelo V5 sin borrar', run: () => {} },
    7: { description: 'Soporte para layouts y versiones clínicas avanzadas', run: () => {} }
  } as Record<number, { description: string; run: (database: IDBDatabase) => void }>,
  
  async open(): Promise<IDBDatabase> {
    if (this._db) return this._db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (e: any) => {
        const database = e.target.result;
        const oldVersion = e.oldVersion;
        const newVersion = e.newVersion;
        console.warn(`[DB Upgrade] Upgrading database from v${oldVersion} to v${newVersion}`);
        
        // Creación aditiva de almacenes: NUNCA se destruye información existente
        const targetStores = Object.values(this.stores);
        targetStores.forEach(s => {
          if (!database.objectStoreNames.contains(s)) {
            console.warn(`[DB Migration] Additive step: Creating missing store "${s}"`);
            database.createObjectStore(s);
          } else {
            console.log(`[DB Migration] Preserved store "${s}" with existing records.`);
          }
        });

        // Ejecutar pasos del registro de migración si existen en el rango de upgrade
        for (let v = oldVersion + 1; v <= newVersion; v++) {
          const step = this.migrationsRegistry[v];
          if (step) {
            console.warn(`[DB Migration Step] Running migration for version ${v}: ${step.description}`);
            try {
              step.run(database);
            } catch (err) {
              console.error(`[DB Migration Error] Failed at version ${v}:`, err);
            }
          }
        }
        
        // Validación de la migración
        const validationFailed = targetStores.some(s => !database.objectStoreNames.contains(s));
        if (validationFailed) {
          console.error(`[DB Migration Failure] Some required stores are missing after upgrade!`);
        } else {
          console.log(`[DB Migration Success] Database structural integrity validated. Stores present: ${Array.from(database.objectStoreNames).join(', ')}`);
        }
      };
      request.onsuccess = () => {
        this._db = request.result;
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async saveBatch(storeName: string, items: Record<string, any>): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      for (const key in items) {
        store.put(items[key], key);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async addBatch(storeName: string, items: any[]): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      for (const item of items) {
        store.add(item);
      }
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async getBatch(storeName: string, keys: string[]): Promise<Record<string, any>> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const results: Record<string, any> = {};
      let count = 0;

      if (keys.length === 0) return resolve({});

      keys.forEach(key => {
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result !== undefined) {
            results[key] = request.result;
          }
          count++;
          if (count === keys.length) resolve(results);
        };
        request.onerror = () => {
          console.error(`[DB] Error crítico al leer clave "${key}" en ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    });
  },


  async getFromStore(storeName: string, key: string): Promise<any> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  async getAllKeys(storeName: string): Promise<string[]> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  },

  async getAllByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(): Promise<void> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(Object.values(this.stores), 'readwrite');
      Object.values(this.stores).forEach(s => {
        transaction.objectStore(s).clear();
      });
      transaction.oncomplete = () => {
        console.log("[DB] Base de datos limpiada íntegramente.");
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // --- DIAGNOSTICS & RECOVERY ---

  async diagnoseStorage(): Promise<{ usage: number; quota: number; percentage: number; isSupported: boolean }> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        return {
          usage,
          quota,
          percentage: quota > 0 ? (usage / quota) * 100 : 0,
          isSupported: true
        };
      } catch (err) {
        console.error('[DB Diagnostics] Storage estimation failed:', err);
      }
    }
    return { usage: 0, quota: 0, percentage: 0, isSupported: false };
  },

  async verifyIntegrity(): Promise<{ healthy: boolean; corruptedStores: string[]; errors: string[] }> {
    console.log('[DB Integrity] Starting integrity check...');
    const corruptedStores: string[] = [];
    const errors: string[] = [];
    let database: IDBDatabase;
    
    try {
      database = await this.open();
    } catch (e: any) {
      return { healthy: false, corruptedStores: ['ALL'], errors: [`Failed to open DB: ${e.message}`] };
    }

    const stores = Object.values(this.stores);
    for (const rawStoreName of stores) {
      const storeName = rawStoreName as string;
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = database.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const countReq = store.count();
          countReq.onsuccess = () => resolve();
          countReq.onerror = () => reject(countReq.error);
        });
      } catch (e: any) {
        console.error(`[DB Integrity] Store ${storeName} appears corrupted:`, e);
        corruptedStores.push(storeName);
        errors.push(`Store ${storeName}: ${e.message}`);
      }
    }

    return {
      healthy: corruptedStores.length === 0,
      corruptedStores,
      errors
    };
  },

  async emergencyReset(): Promise<void> {
    console.warn('[DB Emergency] Executing emergency database reset! All data will be lost.');
    if (this._db) {
      this._db.close();
      this._db = null;
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => {
        console.log('[DB Emergency] Database successfully deleted.');
        resolve();
      };
      request.onerror = () => {
        console.error('[DB Emergency] Failed to delete database:', request.error);
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('[DB Emergency] Database deletion blocked by other tabs.');
        reject(new Error('Blocked by other tabs'));
      };
    });
  }
};
