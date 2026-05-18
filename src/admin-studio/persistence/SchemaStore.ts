import { db } from '../../storage/indexedDB';
import { ClinicalFormSchema } from '../domain/types';

export class SchemaStore {
  /**
   * Guarda un nuevo schema o actualiza uno existente.
   */
  async saveSchema(schema: ClinicalFormSchema): Promise<void> {
    const data = {
      ...schema,
      updatedAt: Date.now()
    };
    await db.saveBatch(db.stores.clinical_schemas, { [schema.id]: data });
  }

  /**
   * Obtiene un schema específico por su ID.
   */
  async getSchema(id: string): Promise<ClinicalFormSchema | null> {
    const result = await db.getFromStore(db.stores.clinical_schemas, id);
    return result as ClinicalFormSchema | null;
  }

  /**
   * Obtiene todos los schemas guardados.
   */
  async getAllSchemas(): Promise<ClinicalFormSchema[]> {
    const keys = await db.getAllKeys(db.stores.clinical_schemas);
    const results = await db.getBatch(db.stores.clinical_schemas, keys);
    return Object.values(results) as ClinicalFormSchema[];
  }

  /**
   * Borra un schema por su ID.
   * IMPORTANTE: No recomendamos borrar, sino cambiar el 'status' a 'archived'.
   * Este método existe para limpieza técnica interna.
   */
  async deleteSchema(id: string): Promise<void> {
    const database = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(db.stores.clinical_schemas, 'readwrite');
      const store = transaction.objectStore(db.stores.clinical_schemas);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene el schema actualmente publicado para un formulario concreto.
   */
  async getPublishedSchemaByFormName(formName: string): Promise<ClinicalFormSchema | null> {
    const schemas = await this.getAllSchemas();
    return schemas.find(s => s.name === formName && s.status === 'published') || null;
  }
}

export const schemaStore = new SchemaStore();
