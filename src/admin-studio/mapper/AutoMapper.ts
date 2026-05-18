import { ClinicalFormSchema, ClinicalSection, ClinicalGroup, ClinicalField, ClinicalFieldType } from '../domain/types';

/**
 * Motor de Auto-Mapeo Inteligente (Admin Studio)
 * Deduce estructuras clínicas, detecta multivalores y genera un Schema inicial
 * basado en los nombres de las columnas de un dataset importado.
 */
export class AutoMapper {
  
  static readonly HEADER_KEYWORDS = ['N.H.C', 'NHC', 'CIPA', 'ID_TOMA', 'FECHA', 'HORA', 'SEXO', 'EDAD', 'SERVICIO', 'FACULTATIVO'];
  
  /**
   * Genera un esquema base a partir de un listado de columnas.
   */
  static generateDraftSchema(formName: string, columns: string[]): ClinicalFormSchema {
    const headerFields: ClinicalField[] = [];
    const narrativeFields: ClinicalField[] = [];
    const multivalueGroups: Record<string, ClinicalField[]> = {};
    const constantFields: ClinicalField[] = [];
    const unassignedFields: ClinicalField[] = [];

    // Clasificación de columnas
    for (const col of columns) {
      const fieldId = this.generateId(col);
      const upperCol = col.toUpperCase();

      // 1. Detección de Cabecera Obligatoria
      if (this.HEADER_KEYWORDS.some(kw => upperCol.includes(kw) && !upperCol.includes('ANTECEDENTE'))) {
        headerFields.push(this.createField(col, fieldId, 'text', true));
        continue;
      }

      // 2. Detección Multivalor ($)
      if (col.includes('$')) {
        const [parentName, childName] = col.split('$');
        const parentId = this.generateId(parentName);
        if (!multivalueGroups[parentId]) {
          multivalueGroups[parentId] = [];
        }
        
        multivalueGroups[parentId].push({
          id: this.generateId(col),
          sourceField: col,
          label: childName.trim(),
          type: 'multivalue',
          searchable: true,
          highlightable: true,
          visible: true
        });
        continue;
      }

      // 3. Detección Analíticas / Constantes (Suelen ser cortos o incluir ciertas palabras)
      if (upperCol.includes('FC') || upperCol.includes('TA') || upperCol.includes('Tª') || upperCol.includes('SAT') || col.length <= 5) {
        constantFields.push(this.createField(col, fieldId, 'text', true));
        continue;
      }

      // 4. Narrativa General
      if (upperCol.includes('OBSERVACIONES') || upperCol.includes('DIAGNÓSTICO') || upperCol.includes('EVOLUCIÓN') || upperCol.includes('RECOMENDACIONES')) {
        narrativeFields.push(this.createField(col, fieldId, 'textarea', true));
        continue;
      }

      // 5. El resto queda sin asignar a la paleta
      unassignedFields.push(this.createField(col, fieldId, 'text', true));
    }

    // Construir Secciones Canónicas (Taxonomía Queryclin Oficial)
    const sections: ClinicalSection[] = [
      { id: 'sec-01', title: '01-ANTECEDENTES', order: 1, collapsible: false, groups: [] },
      { id: 'sec-02', title: '02-ANAMNESIS Y EXPLORACIÓN', order: 2, collapsible: false, groups: [] },
      { id: 'sec-03', title: '03-ANALÍTICAS', order: 3, collapsible: false, groups: [] },
      { id: 'sec-04', title: '04-PRUEBAS Y RESULTADOS', order: 4, collapsible: false, groups: [] },
      { id: 'sec-05', title: '05-DIAGNÓSTICO Y TRATAMIENTO', order: 5, collapsible: false, groups: [] },
      { id: 'sec-06', title: '06-PROCESO Y EVOLUCIÓN', order: 6, collapsible: false, groups: [] }
    ];
    
    // Inyectar Multivalores en Pruebas y Resultados
    if (Object.keys(multivalueGroups).length > 0) {
      const mvGroups: ClinicalGroup[] = Object.entries(multivalueGroups).map(([parentId, children]) => ({
        id: `grp-mv-${parentId}`,
        title: children[0].sourceField.split('$')[0].trim(),
        layout: 'stack',
        fields: [{
          id: `mv-${parentId}`,
          sourceField: children[0].sourceField.split('$')[0].trim(),
          label: children[0].sourceField.split('$')[0].trim(),
          type: 'multivalue',
          searchable: true,
          highlightable: true,
          visible: true,
          multivalue: true,
          children: children
        }]
      }));
      
      const targetSec = sections.find(s => s.id === 'sec-04');
      if (targetSec) targetSec.groups.push(...mvGroups);
    }

    // Inyectar Constantes en Anamnesis y Exploración (Grupo específico)
    if (constantFields.length > 0) {
      const targetSec = sections.find(s => s.id === 'sec-02');
      if (targetSec) {
        targetSec.groups.push({
          id: 'grp-constantes',
          title: 'CONSTANTES',
          layout: 'grid',
          columns: 4,
          fields: constantFields
        });
      }
    }

    // Inyectar Narrativa en Proceso y Evolución
    if (narrativeFields.length > 0) {
      const targetSec = sections.find(s => s.id === 'sec-06');
      if (targetSec) {
        targetSec.groups.push({
          id: 'grp-narrativa',
          title: 'NOTAS Y EVOLUCIÓN',
          layout: 'stack',
          fields: narrativeFields
        });
      }
    }

    return {
      id: `schema-${Date.now()}`,
      name: formName,
      version: '1.0',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      header: [{
        id: 'hdr-main',
        layout: 'grid',
        fields: headerFields
      }],
      sidebar: [],
      sections,
      unassignedFields
    };
  }

  private static generateId(name: string): string {
    return 'fld_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20) + '_' + Math.floor(Math.random() * 1000);
  }

  private static createField(source: string, id: string, type: ClinicalFieldType, visible: boolean): ClinicalField {
    return {
      id,
      sourceField: source,
      label: source, // Por defecto, la etiqueta es la cabecera original
      type,
      searchable: true,
      highlightable: true,
      visible,
      multiline: type === 'textarea'
    };
  }
}
