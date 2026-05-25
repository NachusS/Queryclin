import { FormSchema, Field } from '../domain/schema';

export interface DiffResult {
  isBreaking: boolean;
  changes: {
    type: 'breaking' | 'non-breaking';
    message: string;
    path: string;
  }[];
}

export class SchemaDiff {
  /**
   * Compara dos esquemas y detecta cambios, alertando sobre los que rompen compatibilidad.
   */
  static diffSchemas(oldSchema: FormSchema | null, newSchema: FormSchema): DiffResult {
    const result: DiffResult = {
      isBreaking: false,
      changes: []
    };

    if (!oldSchema) {
      return result; // Esquema nuevo, no hay cambios
    }

    const oldFields = this.getAllFields(oldSchema);
    const newFields = this.getAllFields(newSchema);

    const oldFieldsMap = new Map(oldFields.map(f => [f.id, f]));
    const newFieldsMap = new Map(newFields.map(f => [f.id, f]));

    // 1. Detectar campos eliminados (Breaking)
    for (const [id, oldField] of oldFieldsMap.entries()) {
      if (!newFieldsMap.has(id)) {
        result.isBreaking = true;
        result.changes.push({
          type: 'breaking',
          message: `El campo '${oldField.label}' (ID: ${id}) fue eliminado. Los datos ya indexados con este campo no se mostrarán.`,
          path: `fields/${id}`
        });
      }
    }

    // 2. Detectar cambios en campos existentes
    for (const [id, newField] of newFieldsMap.entries()) {
      const oldField = oldFieldsMap.get(id);
      if (oldField) {
        // Cambio de sourceField (Breaking)
        if (oldField.sourceField !== newField.sourceField) {
          result.isBreaking = true;
          result.changes.push({
            type: 'breaking',
            message: `El campo '${newField.label}' cambió su sourceField de '${oldField.sourceField}' a '${newField.sourceField}'. Esto romperá la asociación con datos antiguos.`,
            path: `fields/${id}/sourceField`
          });
        }

        // Cambio de tipo (Breaking)
        if (oldField.type !== newField.type) {
          result.isBreaking = true;
          result.changes.push({
            type: 'breaking',
            message: `El campo '${newField.label}' cambió su tipo de '${oldField.type}' a '${newField.type}'. Puede romper filtros o visualizaciones.`,
            path: `fields/${id}/type`
          });
        }

        // Cambio de etiqueta (Non-breaking)
        if (oldField.label !== newField.label) {
          result.changes.push({
            type: 'non-breaking',
            message: `El campo '${oldField.label}' fue renombrado a '${newField.label}'.`,
            path: `fields/${id}/label`
          });
        }
      } else {
        // Campo nuevo (Non-breaking)
        result.changes.push({
          type: 'non-breaking',
          message: `Nuevo campo añadido: '${newField.label}'.`,
          path: `fields/${id}`
        });
      }
    }

    // 3. Detectar cambios en headerAliases
    const oldAliases = oldSchema.headerAliases || {};
    const newAliases = newSchema.headerAliases || {};

    const allCanonicals = new Set([...Object.keys(oldAliases), ...Object.keys(newAliases)]);

    for (const canonical of allCanonicals) {
      const oldList = oldAliases[canonical] || [];
      const newList = newAliases[canonical] || [];

      // Si se eliminaron aliases (Breaking)
      const removed = oldList.filter(a => !newList.includes(a));
      if (removed.length > 0) {
        result.isBreaking = true;
        result.changes.push({
          type: 'breaking',
          message: `Se eliminaron los aliases [${removed.join(', ')}] para la cabecera '${canonical}'. Archivos antiguos con estas cabeceras fallarán al mapear.`,
          path: `headerAliases/${canonical}`
        });
      }

      // Si se añadieron aliases (Non-breaking)
      const added = newList.filter(a => !oldList.includes(a));
      if (added.length > 0) {
        result.changes.push({
          type: 'non-breaking',
          message: `Se añadieron los aliases [${added.join(', ')}] para la cabecera '${canonical}'.`,
          path: `headerAliases/${canonical}`
        });
      }
    }

    return result;
  }

  private static getAllFields(schema: FormSchema): Field[] {
    const fields: Field[] = [];
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
