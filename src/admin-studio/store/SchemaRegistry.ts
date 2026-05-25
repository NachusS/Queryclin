import { db } from '../../storage/indexedDB';
import { FormSchema } from '../domain/schema';
import { SchemaStore } from './SchemaStore';
import { SchemaValidator } from '../validation/SchemaValidator';

export class SchemaRegistry {
  private schemaStore: SchemaStore;
  private readonly ACTIVE_KEY_PREFIX = 'ACTIVE_VERSION_';

  constructor() {
    this.schemaStore = new SchemaStore();
  }

  /**
   * Obtiene el esquema activo para un ID dado.
   * Si no hay esquema activo definido, devuelve el más reciente.
   */
  async getActiveSchema(id: string): Promise<FormSchema | null> {
    const activeKey = `${this.ACTIVE_KEY_PREFIX}${id}`;
    const activeVersion = await db.getFromStore(db.stores.clinical_schemas, activeKey);

    if (activeVersion) {
      return this.schemaStore.getSchema(id, activeVersion);
    }

    // Si no hay activo, devolvemos null (Gobernanza estricta)
    return null;
  }

  /**
   * Establece un esquema (versión específica) como activo.
   * Exige que el esquema pase la validación (Gobernanza).
   */
  async setActiveSchema(id: string, version: string): Promise<boolean> {
    const schema = await this.schemaStore.getSchema(id, version);
    if (!schema) {
      throw new Error(`Esquema no encontrado: ${id} v${version}`);
    }

    // Regla de Gobernanza: Solo esquemas válidos pueden ser ACTIVOS
    const validation = SchemaValidator.validate(schema);
    if (!validation.valid) {
      throw new Error(`Gobernanza: No se puede activar un esquema inválido.\n${validation.errors.join('\n')}`);
    }

    const activeKey = `${this.ACTIVE_KEY_PREFIX}${id}`;
    await db.saveBatch(db.stores.clinical_schemas, { [activeKey]: version });
    
    // SSOT: Sincronizar el mapping compilado en runtime
    const { schemaRuntimeSync } = await import('./schemaRuntimeSync');
    await schemaRuntimeSync.syncRuntimeMapping(id, version);
    
    return true;
  }

  /**
   * Obtiene todas las versiones de un esquema.
   */
  async getAllVersions(id: string): Promise<FormSchema[]> {
    return this.schemaStore.getAllVersionsOfSchema(id);
  }

  /**
   * Guarda un esquema.
   */
  async saveSchema(schema: FormSchema): Promise<void> {
    await this.schemaStore.saveSchema(schema);
  }
}

export const schemaRegistry = new SchemaRegistry();
