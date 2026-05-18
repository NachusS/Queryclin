import { FormSchema } from '../domain/schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class SchemaValidator {
  /**
   * Valida un FormSchema contra las reglas de negocio y de RULES.md.
   */
  static validate(schema: FormSchema): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validaciones Básicas de Estructura
    if (!schema.id) errors.push("El esquema debe tener un ID base.");
    if (!schema.name) errors.push("El esquema debe tener un nombre.");
    if (!schema.version) errors.push("El esquema debe tener una versión.");

    // 2. Regla 6 de RULES.md: Fidelidad del Dato Clínico
    // "Se prohíbe renombrar, traducir o normalizar destructivamente los campos originales del CSV."
    // Validamos que los sourceField no estén vacíos y mantengan su integridad.
    const allFields = this.getAllFields(schema);
    for (const field of allFields) {
      if (!field.sourceField) {
        errors.push(`Regla 6 (Fidelidad): El campo '${field.label}' no tiene un sourceField asignado. Debe mapear exactamente a una columna del CSV.`);
      }
    }

    // 3. Unicidad de IDs
    const ids = new Set<string>();
    
    // Validar IDs de secciones
    for (const section of schema.sections) {
      if (ids.has(section.id)) errors.push(`ID de sección duplicado: ${section.id}`);
      ids.add(section.id);
      
      // Validar IDs de grupos
      for (const group of section.groups) {
        if (ids.has(group.id)) errors.push(`ID de grupo duplicado: ${group.id}`);
        ids.add(group.id);
        
        // Validar IDs de campos
        for (const field of group.fields) {
          if (ids.has(field.id)) errors.push(`ID de campo duplicado: ${field.id}`);
          ids.add(field.id);
        }
      }
    }

    // 4. Colisiones de Aliases
    const usedAliases = new Set<string>();
    const headerAliases = schema.headerAliases || {};
    for (const [canonical, aliasList] of Object.entries(headerAliases)) {
      for (const alias of aliasList) {
        if (usedAliases.has(alias)) {
          errors.push(`Regla de Integridad: El alias '${alias}' está duplicado y asignado a múltiples cabeceras.`);
        }
        usedAliases.add(alias);
      }
    }

    // 5. Advertencias (Warnings)
    if (schema.sections.length === 0) {
      warnings.push("El esquema no tiene secciones. Se verá vacío.");
    }

    const hasEmptyGroups = schema.sections.some(s => s.groups.some(g => g.fields.length === 0));
    if (hasEmptyGroups) {
      warnings.push("Hay grupos sin campos asignados.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Helper para obtener todos los campos del esquema.
   */
  private static getAllFields(schema: FormSchema) {
    const fields: any[] = [];
    for (const section of schema.sections) {
      for (const group of section.groups) {
        fields.push(...group.fields);
      }
    }
    if (schema.unassignedFields) {
      fields.push(...schema.unassignedFields);
    }
    return fields;
  }
}
