import { db } from '../../storage/indexedDB';
import { FormSchema } from '../domain/schema';

export class SchemaStore {
  /**
   * Genera la clave compuesta para almacenar versiones.
   */
  private getVersionedKey(id: string, version: string): string {
    return `${id}_v${version}`;
  }

  /**
   * Guarda un nuevo schema o una nueva versión.
   * Cumple con la regla: "Every schema change increments version".
   */
  async saveSchema(schema: FormSchema): Promise<void> {
    const data = {
      ...schema,
      updatedAt: Date.now()
    };
    const key = this.getVersionedKey(schema.id, schema.version);
    await db.saveBatch(db.stores.clinical_schemas, { [key]: data });
  }

  /**
   * Obtiene un schema específico por su ID y versión.
   * Si no se especifica versión, devuelve la más reciente.
   */
  async getSchema(id: string, version?: string): Promise<FormSchema | null> {
    if (version) {
      const key = this.getVersionedKey(id, version);
      const result = await db.getFromStore(db.stores.clinical_schemas, key);
      return result as FormSchema | null;
    }

    // Si no hay versión, buscamos la más reciente
    const all = await this.getAllVersionsOfSchema(id);
    if (all.length === 0) {
      // Retrocompatibilidad: buscar sin prefijo de versión
      const result = await db.getFromStore(db.stores.clinical_schemas, id);
      return result as FormSchema | null;
    }
    
    // Ordenar por versión (asumiendo numéricas o ordenables) o por updatedAt
    return all.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }

  /**
   * Obtiene todas las versiones de un schema específico.
   */
  async getAllVersionsOfSchema(id: string): Promise<FormSchema[]> {
    const keys = await db.getAllKeys(db.stores.clinical_schemas);
    const relevantKeys = keys.filter(k => k.startsWith(`${id}_v`));
    const results = await db.getBatch(db.stores.clinical_schemas, relevantKeys);
    return Object.values(results) as FormSchema[];
  }

  /**
   * Obtiene todos los schemas guardados (solo la versión más reciente de cada uno).
   */
  async getAllSchemas(): Promise<FormSchema[]> {
    const keys = await db.getAllKeys(db.stores.clinical_schemas);
    const schemaKeys = keys.filter(k => !k.startsWith('ACTIVE_VERSION_') && !k.startsWith('RUNTIME_MAPPING_'));
    const results = await db.getBatch(db.stores.clinical_schemas, schemaKeys);
    const allSchemas = Object.values(results).filter((s: any) => 
      s && typeof s === 'object' && 'id' in s && 'sections' in s
    ) as FormSchema[];
    
    // Agrupar por ID y quedarse con la más reciente
    const latestMap: Record<string, FormSchema> = {};
    for (const s of allSchemas) {
      if (!latestMap[s.id] || s.updatedAt > latestMap[s.id].updatedAt) {
        latestMap[s.id] = s;
      }
    }
    
    return Object.values(latestMap);
  }

  /**
   * Borra una versión específica de un schema.
   */
  async deleteSchemaVersion(id: string, version: string): Promise<void> {
    const key = this.getVersionedKey(id, version);
    const database = await db.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(db.stores.clinical_schemas, 'readwrite');
        const store = transaction.objectStore(db.stores.clinical_schemas);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Borra un schema completo (todas sus versiones) y sus metadatos de runtime.
   */
  async deleteSchema(id: string): Promise<void> {
    const keys = await db.getAllKeys(db.stores.clinical_schemas);
    const schemaKeys = keys.filter(k => 
      k.startsWith(`${id}_v`) || 
      k === id || 
      k === `ACTIVE_VERSION_${id}` || 
      k === `RUNTIME_MAPPING_${id}`
    );
    
    const database = await db.open();
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(db.stores.clinical_schemas, 'readwrite');
        const store = transaction.objectStore(db.stores.clinical_schemas);
        
        for (const key of schemaKeys) {
          store.delete(key);
        }
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Obtiene el schema actualmente publicado para un formulario concreto.
   */
  async getPublishedSchemaByFormName(formName: string): Promise<FormSchema | null> {
    const keys = await db.getAllKeys(db.stores.clinical_schemas);
    const schemaKeys = keys.filter(k => !k.startsWith('ACTIVE_VERSION_') && !k.startsWith('RUNTIME_MAPPING_'));
    const results = await db.getBatch(db.stores.clinical_schemas, schemaKeys);
    const schemas = Object.values(results).filter((s: any) => 
      s && typeof s === 'object' && 'id' in s && 'sections' in s
    ) as FormSchema[];
    
    return schemas.find(s => s.name === formName && s.status === 'published') || null;
  }
}

export const schemaStore = new SchemaStore();
