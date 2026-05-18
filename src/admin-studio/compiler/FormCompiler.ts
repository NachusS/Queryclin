import { FormSchema } from '../domain/schema';
import { FormMapping } from '../../core/mappings';
import { SchemaValidator } from '../validation/SchemaValidator';

export class FormCompiler {
  /**
   * Compila un FormSchema en un FormMapping compatible con Queryclin core.
   */
  static compile(schema: FormSchema): FormMapping {
    // 0. Pre-compilation validation (RULES.md blocking gate)
    const validation = SchemaValidator.validate(schema);
    if (!validation.valid) {
      throw new Error(`Error de Compilación: El esquema no cumple con las reglas.\n${validation.errors.join('\n')}`);
    }

    const visualCategories: Record<string, string[]> = {};

    // 1. Generar visualCategories a partir de las secciones y grupos
    for (const section of schema.sections) {
      const fields: string[] = [];
      for (const group of section.groups) {
        for (const field of group.fields) {
          fields.push(field.sourceField);
        }
      }
      
      // Garbage Collection: Eliminar categorías vacías
      if (fields.length > 0) {
        visualCategories[section.title] = fields;
      }
    }

    // 2. Extraer claves estructurales (asumiendo que están en demographics o fijas)
    const keys = {
      nhc: schema.demographics?.nhc || 'N.H.C',
      idToma: 'Id_Toma', // Fallback estándar
      ordenToma: 'Orden_Toma', // Fallback estándar
      fechaToma: schema.demographics?.fechaToma || 'EC_Fecha_Toma'
    };

    return {
      id: schema.id,
      name: schema.name,
      keys,
      demographics: schema.demographics || {},
      visualCategories,
      headerAliases: schema.headerAliases || {}
    };
  }

  /**
   * Genera el contenido del archivo mappings.runtime.ts
   */
  static generateRuntimeModule(mappings: FormMapping[]): string {
    const json = JSON.stringify(mappings, null, 2);
    return `/**
 * Archivo generado automáticamente por Queryclin Admin Studio.
 * NO MODIFICAR MANUALMENTE.
 */

import { FormMapping } from '../core/mappings';

export const RUNTIME_FORMS: FormMapping[] = ${json};
`;
  }
}
