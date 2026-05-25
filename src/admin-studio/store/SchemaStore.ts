import { db } from '../../storage/indexedDB';
import { FormSchema, Field } from '../domain/schema';

function sanitizeSchema(schema: FormSchema): FormSchema {
  const usedIds = new Set<string>();

  const makeUnique = (id: string, prefix: string): string => {
    if (!id) {
      id = `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
    }
    let finalId = id;
    let counter = 1;
    while (usedIds.has(finalId)) {
      finalId = `${id}_dup${counter}`;
      counter++;
    }
    usedIds.add(finalId);
    return finalId;
  };

  const sanitizeFields = (fields: Field[], prefix: string): Field[] => {
    if (!fields) return [];
    return fields.map(f => {
      if (!f) return f;
      const sanitized = { ...f };
      sanitized.id = makeUnique(sanitized.id, prefix);
      if (sanitized.children) {
        sanitized.children = sanitizeFields(sanitized.children, prefix);
      }
      return sanitized;
    });
  };

  const newSchema = { ...schema };

  // Sanitize headers
  if (newSchema.header) {
    newSchema.header = newSchema.header.map(h => {
      const sanitized = { ...h };
      sanitized.id = makeUnique(sanitized.id, 'hdr');
      if (sanitized.fields) {
        sanitized.fields = sanitizeFields(sanitized.fields, 'fld');
      }
      return sanitized;
    });
  }

  // Sanitize sidebar
  if (newSchema.sidebar) {
    newSchema.sidebar = newSchema.sidebar.map(s => {
      const sanitized = { ...s };
      sanitized.id = makeUnique(sanitized.id, 'sb');
      if (sanitized.fields) {
        sanitized.fields = sanitizeFields(sanitized.fields, 'fld');
      }
      return sanitized;
    });
  }

  // Sanitize sections
  if (newSchema.sections) {
    newSchema.sections = newSchema.sections.map(s => {
      const sanitizedSec = { ...s };
      sanitizedSec.id = makeUnique(sanitizedSec.id, 'sec');
      if (sanitizedSec.groups) {
        sanitizedSec.groups = sanitizedSec.groups.map(g => {
          const sanitizedGrp = { ...g };
          sanitizedGrp.id = makeUnique(sanitizedGrp.id, 'grp');
          if (sanitizedGrp.fields) {
            sanitizedGrp.fields = sanitizeFields(sanitizedGrp.fields, 'fld');
          }
          return sanitizedGrp;
        });
      }
      return sanitizedSec;
    });
  }

  // Sanitize unassignedFields
  if (newSchema.unassignedFields) {
    newSchema.unassignedFields = sanitizeFields(newSchema.unassignedFields, 'fld');
  }

  return newSchema;
}

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
    let schema: FormSchema | null = null;
    if (version) {
      const key = this.getVersionedKey(id, version);
      const result = await db.getFromStore(db.stores.clinical_schemas, key);
      schema = result as FormSchema | null;
    } else {
      // Si no hay versión, buscamos la más reciente
      const all = await this.getAllVersionsOfSchema(id);
      if (all.length === 0) {
        // Retrocompatibilidad: buscar sin prefijo de versión
        const result = await db.getFromStore(db.stores.clinical_schemas, id);
        schema = result as FormSchema | null;
      } else {
        schema = all.sort((a, b) => b.updatedAt - a.updatedAt)[0];
      }
    }

    if (schema) {
      schema = sanitizeSchema(schema);
    }
    return schema;
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
