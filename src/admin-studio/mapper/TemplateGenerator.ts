import { FORMS } from '../../core/mappings';
import { ClinicalFormSchema, ClinicalSection, ClinicalGroup, ClinicalField } from '../domain/types';

/**
 * Generador de Esquemas avanzados para Queryclin Admin Studio.
 * Soporta creación desde plantillas canónicas y desde listas de cabeceras puras.
 */
export class TemplateGenerator {
  
  /**
   * Genera un esquema basado en las categorías visuales de una plantilla existente.
   * Ahora detecta y añade metadatos estructurales básicos.
   */
  static generateFromTemplate(formId: string): ClinicalFormSchema | null {
    const mapping = FORMS.find(f => f.id === formId);
    if (!mapping) return null;

    const sections: ClinicalSection[] = [];
    const sectionMap: Record<string, ClinicalSection> = {};

    // Mapear visualCategories a Secciones y Grupos
    Object.entries(mapping.visualCategories).forEach(([catKey, fields], index) => {
      const parts = catKey.split('>').map(s => s.trim());
      const sectionTitle = parts[0];
      const groupTitle = parts[1] || 'GENERAL';

      let section = sectionMap[sectionTitle];
      if (!section) {
        section = {
          id: `sec-${sectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: sectionTitle,
          order: index + 1,
          collapsible: false,
          groups: []
        };
        sectionMap[sectionTitle] = section;
        sections.push(section);
      }

      const group: ClinicalGroup = {
        id: `grp-${groupTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${index}`,
        title: groupTitle,
        layout: groupTitle.includes('CONSTANTES') || groupTitle.includes('ANALITICA') ? 'grid' : 'stack',
        columns: 4,
        fields: fields.map((f, fIdx) => this.createField(f, fIdx))
      };

      section.groups.push(group);
    });

    return {
      id: `schema-tpl-${formId}-${Date.now()}`,
      name: `${mapping.name} (Copia Personalizada)`,
      version: '1.0',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      header: [{
        id: 'hdr-1',
        layout: 'grid',
        fields: Object.entries(mapping.headerAliases || {}).map(([key, aliases]) => this.createField(aliases[0] || key, 0, key))
      }],
      sidebar: [],
      sections: sections.sort((a, b) => a.order - b.order),
      unassignedFields: []
    };
  }

  /**
   * Crea un esquema desde cero basado únicamente en una lista de cabeceras (piped string).
   * Todos los campos se inician como 'unassigned' en la paleta.
   */
  static generateFromRawHeaders(name: string, rawHeaders: string): ClinicalFormSchema {
    const fields = rawHeaders.split('|')
      .map(h => h.trim())
      .filter(h => h.length > 0)
      .map((h, idx) => this.createField(h, idx));

    // Separar campos técnicos de cabecera (NHC, Id_Toma, etc)
    const technicalKeys = ['NHC', 'N.H.C', 'ID_TOMA', 'ORDEN_TOMA', 'FECHA_TOMA', 'EC_FECHA_TOMA', 'CIPA'];
    const headerFields = fields.filter(f => technicalKeys.some(tk => f.sourceField.toUpperCase().includes(tk)));
    const contentFields = fields.filter(f => !technicalKeys.some(tk => f.sourceField.toUpperCase().includes(tk)));

    return {
      id: `schema-raw-${Date.now()}`,
      name: name,
      version: '1.0',
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      header: [{
        id: 'hdr-1',
        layout: 'grid',
        fields: headerFields
      }],
      sidebar: [],
      sections: [{
        id: 'sec-general',
        title: 'Información Clínica',
        order: 1,
        collapsible: false,
        groups: []
      }],
      unassignedFields: contentFields
    };
  }

  private static createField(source: string, index: number, overrideLabel?: string): ClinicalField {
    const isNarrative = source.length > 40 || 
                      source.toUpperCase().includes('ANAMNESIS') || 
                      source.toUpperCase().includes('OBSERVACIONES') ||
                      source.toUpperCase().includes('EXPLORACION');

    return {
      id: `fld-${source.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${index}`,
      sourceField: source,
      label: overrideLabel || source,
      type: isNarrative ? 'textarea' : 'text',
      visible: true,
      searchable: true,
      highlightable: true,
      multiline: isNarrative,
      multivalue: source.includes('$')
    };
  }

  static getAvailableTemplates() {
    return FORMS.map(f => ({ id: f.id, name: f.name }));
  }
}
