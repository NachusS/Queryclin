import { db } from '../../storage/indexedDB';
import { FormCompiler } from '../compiler/FormCompiler';
import { FormSchema } from '../domain/schema';
import { SchemaStore } from './SchemaStore';

export class SchemaRuntimeSync {
  private schemaStore: SchemaStore;
  private readonly RUNTIME_MAPPING_PREFIX = 'RUNTIME_MAPPING_';

  constructor() {
    this.schemaStore = new SchemaStore();
  }

  /**
   * Sincroniza el esquema activo con el almacenamiento runtime en IndexedDB.
   */
  async syncRuntimeMapping(id: string, version: string): Promise<void> {
    const schema = await this.schemaStore.getSchema(id, version);
    if (!schema) throw new Error(`Esquema no encontrado para sincronización: ${id} v${version}`);

    // 1. Compilar el esquema a mapping
    const compiledMapping = FormCompiler.compile(schema);

    // 2. Guardar en IndexedDB con clave especial para uso en Runtime
    const key = `${this.RUNTIME_MAPPING_PREFIX}${id}`;
    await db.saveBatch(db.stores.clinical_schemas, { [key]: compiledMapping });

    console.log(`[RuntimeSync] Mapping sincronizado para ${id} v${version}`);
    
    // 3. Invalidar cache de QueryEngine (Si el engine tuviera cache o necesitara recarga)
    // Como el motor lee el mapping en cada carga/visualización (App y HCEView), 
    // al estar en IndexedDB se usará en la siguiente operación automáticamente.
  }

  /**
   * Obtiene el mapping compilado en runtime para un ID dado.
   */
  async getRuntimeMapping(id: string): Promise<any | null> {
    const key = `${this.RUNTIME_MAPPING_PREFIX}${id}`;
    return await db.getFromStore(db.stores.clinical_schemas, key);
  }

  /**
   * Obtiene todos los mappings compilados en runtime.
   */
  async getAllRuntimeMappings(): Promise<any[]> {
    const keys = await db.getAllKeys(db.stores.clinical_schemas);
    console.log('[RuntimeSync] Todas las claves en clinical_schemas:', keys);
    const runtimeKeys = keys.filter(k => k.startsWith(this.RUNTIME_MAPPING_PREFIX));
    console.log('[RuntimeSync] Claves de runtime filtradas:', runtimeKeys);
    
    const results: any[] = [];
    for (const key of runtimeKeys) {
      const mapping = await db.getFromStore(db.stores.clinical_schemas, key);
      if (mapping) {
        results.push(mapping);
      }
    }
    return results;
  }
}

export const schemaRuntimeSync = new SchemaRuntimeSync();
