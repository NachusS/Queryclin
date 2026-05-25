import { FormSchema, Field } from '../domain/schema';

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
        errors.push(`Regla 6 (Fidelidad): El campo '${field.label || field.id}' no tiene un sourceField asignado. Debe mapear exactamente a una columna del CSV.`);
      }
    }

    // 3. Unicidad de IDs
    const ids = new Set<string>();
    
    // Validar IDs de cabecera
    if (schema.header) {
      for (const headerGroup of schema.header) {
        if (headerGroup.id) {
          if (ids.has(headerGroup.id)) {
            errors.push(`ID de grupo de cabecera duplicado: ${headerGroup.id}`);
          }
          ids.add(headerGroup.id);
        }
      }
    }

    // Validar IDs de barra lateral
    if (schema.sidebar) {
      for (const sidebarGroup of schema.sidebar) {
        if (sidebarGroup.id) {
          if (ids.has(sidebarGroup.id)) {
            errors.push(`ID de grupo de barra lateral duplicado: ${sidebarGroup.id}`);
          }
          ids.add(sidebarGroup.id);
        }
      }
    }

    // Validar IDs de secciones y sus grupos
    if (schema.sections) {
      for (const section of schema.sections) {
        if (section.id) {
          if (ids.has(section.id)) {
            errors.push(`ID de sección duplicado: ${section.id}`);
          }
          ids.add(section.id);
        }
        
        if (section.groups) {
          for (const group of section.groups) {
            if (group.id) {
              if (ids.has(group.id)) {
                errors.push(`ID de grupo duplicado: ${group.id}`);
              }
              ids.add(group.id);
            }
          }
        }
      }
    }

    // Validar IDs de todos los campos colectados recursivamente
    for (const field of allFields) {
      if (field.id) {
        if (ids.has(field.id)) {
          errors.push(`ID de campo duplicado: ${field.id}`);
        }
        ids.add(field.id);
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
    if (!schema.sections || schema.sections.length === 0) {
      warnings.push("El esquema no tiene secciones. Se verá vacío.");
    }

    if (schema.sections) {
      const hasEmptyGroups = schema.sections.some(s => s.groups && s.groups.some(g => !g.fields || g.fields.length === 0));
      if (hasEmptyGroups) {
        warnings.push("Hay grupos sin campos asignados.");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Helper para obtener todos los campos del esquema recursivamente.
   */
  private static getAllFields(schema: FormSchema): Field[] {
    const fields: Field[] = [];
    
    // Collect from header
    if (schema.header) {
      for (const headerGroup of schema.header) {
        if (headerGroup.fields) {
          this.collectFieldsRecursively(headerGroup.fields, fields);
        }
      }
    }
    
    // Collect from sidebar
    if (schema.sidebar) {
      for (const sidebarGroup of schema.sidebar) {
        if (sidebarGroup.fields) {
          this.collectFieldsRecursively(sidebarGroup.fields, fields);
        }
      }
    }
    
    // Collect from sections
    if (schema.sections) {
      for (const section of schema.sections) {
        if (section.groups) {
          for (const group of section.groups) {
            if (group.fields) {
              this.collectFieldsRecursively(group.fields, fields);
            }
          }
        }
      }
    }
    
    // Collect from unassignedFields
    if (schema.unassignedFields) {
      this.collectFieldsRecursively(schema.unassignedFields, fields);
    }
    
    return fields;
  }

  private static collectFieldsRecursively(fields: Field[], list: Field[]) {
    if (!fields) return;
    for (const field of fields) {
      if (!field) continue;
      list.push(field);
      if (field.children) {
        this.collectFieldsRecursively(field.children, list);
      }
    }
  }
}
