import { db } from '../storage/indexedDB';
import { ClinicalFormSchema, ClinicalSection, ClinicalField } from '../admin-studio/domain/types';
import { FormMapping } from '../core/mappings';

// 1. CanonicalHeaderRegistry
export interface CanonicalFieldDefinition {
  id: string;
  label: string;
  category: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'multivalue';
  aliases: string[];
}

export const CanonicalHeaderRegistry: CanonicalFieldDefinition[] = [
  // Claves estructurales
  { id: 'nhc', label: 'N.H.C', category: 'Cabecera', type: 'text', aliases: ['nhc', 'n.h.c', 'n.h.c.', 'cipa', 'id_paciente', 'paciente_id', 'historia_clinica', 'identificador'] },
  { id: 'idToma', label: 'Id_Toma', category: 'Cabecera', type: 'text', aliases: ['id_toma', 'idtoma', 'toma_id', 'visita', 'id_visita', 'toma'] },
  { id: 'ordenToma', label: 'Orden_Toma', category: 'Cabecera', type: 'number', aliases: ['orden_toma', 'orden', 'secuencia', 'seq', 'orden_toma_s'] },
  { id: 'fechaToma', label: 'EC_Fecha_Toma', category: 'Cabecera', type: 'date', aliases: ['ec_fecha_toma', 'fecha', 'fecha_toma', 'date', 'fecha_observacion_clinica'] },
  
  // Demográficos
  { id: 'sexo', label: 'Sexo', category: 'Demografía', type: 'text', aliases: ['sexo', 'gender', 'ec_sexo', 'ec_sexo_paciente'] },
  { id: 'edad', label: 'Edad', category: 'Demografía', type: 'number', aliases: ['edad', 'age', 'ec_edad'] },
  { id: 'fechaNacimiento', label: 'Fecha de Nacimiento', category: 'Demografía', type: 'date', aliases: ['fecha de nacimiento', 'fecha_nacimiento', 'f_nacimiento', 'fnac'] },
  { id: 'cp', label: 'Código Postal', category: 'Demografía', type: 'text', aliases: ['c.p.', 'cp', 'código postal', 'codigo postal', 'demog-codigo postal', 'demog-código postal'] },
  { id: 'ambito', label: 'Ámbito', category: 'Demografía', type: 'text', aliases: ['ámbito', 'ambito', 'clase'] },
  { id: 'ciudad', label: 'Ciudad', category: 'Demografía', type: 'text', aliases: ['ciudad', 'municipio', 'poblacion', 'ec_ciudad_paciente'] },
  { id: 'estadoCivil', label: 'Estado Civil', category: 'Demografía', type: 'text', aliases: ['estado civil', 'ec_estado_civil', 'civil'] },
  { id: 'unidadEnfermeria', label: 'Unidad de Enfermería', category: 'Demografía', type: 'text', aliases: ['unidad de enfermeria', 'unidad de enfermería', 'enfermeria'] },
  
  // Clínicos - Antecedentes
  { id: 'antecedentes_familiares', label: 'Antecedentes Familiares', category: '01-ANTECEDENTES', type: 'textarea', aliases: ['antecedentes familiares', 'ant_familiares', 'antecedentes familiares generales'] },
  { id: 'antecedentes_personales', label: 'Antecedentes Personales', category: '01-ANTECEDENTES', type: 'textarea', aliases: ['antecedentes personales', 'ant_personales', 'antecedentes personales generales'] },
  { id: 'antecedentes_quirurgicos', label: 'Antecedentes Quirúrgicos', category: '01-ANTECEDENTES', type: 'textarea', aliases: ['antecedentes quirurgicos', 'antecedentes quirúrgicos', 'ant_quirurgicos'] },
  { id: 'alergias', label: 'Antecedentes de alergia:', category: '01-ANTECEDENTES', type: 'textarea', aliases: ['alergias', 'alergia', 'antecedentes de alergia', 'reacciones', 'antecedentes de alergia:'] },
  { id: 'motivo_consulta', label: 'Motivo de la consulta', category: '01-ANTECEDENTES', type: 'textarea', aliases: ['motivo de consulta', 'motivo consulta', 'motivo de la consulta', 'motivo_ingreso'] },
  { id: 'tratamiento_previo', label: 'Tratamiento previo', category: '01-ANTECEDENTES', type: 'textarea', aliases: ['tratamiento previo', 'tto previo'] },
  
  // Clínicos - Anamnesis y Exploración
  { id: 'enfermedad_actual', label: 'Enfermedad actual', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'textarea', aliases: ['enfermedad actual', 'historia actual'] },
  { id: 'exploracion_fisica', label: 'Exploración física', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'textarea', aliases: ['exploracion fisica', 'exploración física', 'exploracion'] },
  { id: 'fc', label: 'Frecuencia Cardíaca (FC)', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'number', aliases: ['fc', 'frecuencia cardiaca', 'pulso'] },
  { id: 'ta', label: 'Tensión Arterial (TA)', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'text', aliases: ['ta', 'tension arterial', 'presion arterial', 'tensión arterial'] },
  { id: 'temp', label: 'Temperatura (Tª)', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'number', aliases: ['temp', 'temperatura', 'tª', 'temp.', 't'] },
  { id: 'sat', label: 'Saturación O2', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'number', aliases: ['sat', 'saturacion', 'saturación de oxigeno', 'sat o2'] },
  { id: 'peso', label: 'Peso', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'number', aliases: ['peso', 'peso:', 'weight'] },
  { id: 'talla', label: 'Talla', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'number', aliases: ['talla', 'talla:', 'altura'] },
  { id: 'imc', label: 'IMC', category: '02-ANAMNESIS Y EXPLORACIÓN', type: 'number', aliases: ['imc', 'imc:', 'indice masa corporal'] },
  
  // Analíticas
  { id: 'analitica', label: 'Resultado analítica', category: '03-ANALÍTICAS', type: 'textarea', aliases: ['analitica', 'resultado analitica', 'resultado analítica', 'analisis sangre', 'hemograma'] },
  
  // Pruebas y Resultados
  { id: 'radiodiagnostico', label: 'Resultado radiodiagnóstico', category: '04-PRUEBAS Y RESULTADOS', type: 'textarea', aliases: ['radiodiagnostico', 'rx', 'radiologia', 'resultado radiodiagnóstico'] },
  { id: 'anatomia_patologica', label: 'Resultado anatomía patológica', category: '04-PRUEBAS Y RESULTADOS', type: 'textarea', aliases: ['anatomia patologica', 'ap', 'biopsia', 'resultado anatomía patológica'] },
  { id: 'otras_pruebas', label: 'Otras pruebas realizadas', category: '04-PRUEBAS Y RESULTADOS', type: 'textarea', aliases: ['otras pruebas', 'otras pruebas realizadas', 'pruebas adicionales'] },
  
  // Diagnóstico y Tratamiento
  { id: 'diagnostico', label: 'Diagnóstico', category: '05-DIAGNÓSTICO Y TRATAMIENTO', type: 'textarea', aliases: ['diagnostico', 'diagnóstico', 'juicio diagnostico', 'dx'] },
  { id: 'tratamiento', label: 'Tratamiento', category: '05-DIAGNÓSTICO Y TRATAMIENTO', type: 'textarea', aliases: ['tratamiento', 'tratamiento:', 'tto', 'plan terapeutico'] },
  { id: 'recomendaciones', label: 'Recomendaciones', category: '05-DIAGNÓSTICO Y TRATAMIENTO', type: 'textarea', aliases: ['recomendaciones', 'recomendaciones:', 'consejos de alta'] },
  
  // Proceso y Evolución
  { id: 'evolucion', label: 'Evolución', category: '06-PROCESO Y EVOLUCIÓN', type: 'textarea', aliases: ['evolucion', 'evolución', 'notas de evolucion', 'resumen de evolución', 'evolucion (cex)'] }
];

// 2. SemanticHeaderNormalizer
export class SemanticHeaderNormalizer {
  static normalize(header: string): string {
    if (!header) return '';
    return header
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[:.!?_#]/g, ' ')      // Caracteres especiales
      .replace(/\s+/g, ' ')           // Espacios duplicados
      .trim();
  }
}

// 3. AliasResolver
export class AliasResolver {
  static resolve(header: string): CanonicalFieldDefinition | null {
    const norm = SemanticHeaderNormalizer.normalize(header);
    if (!norm) return null;

    // Coincidencia exacta
    for (const def of CanonicalHeaderRegistry) {
      if (def.id === norm) return def;
      for (const alias of def.aliases) {
        if (SemanticHeaderNormalizer.normalize(alias) === norm) {
          return def;
        }
      }
    }
    
    // Coincidencia parcial
    for (const def of CanonicalHeaderRegistry) {
      for (const alias of def.aliases) {
        const normAlias = SemanticHeaderNormalizer.normalize(alias);
        if (normAlias.length > 3 && (norm.includes(normAlias) || normAlias.includes(norm))) {
          return def;
        }
      }
    }

    return null;
  }
}

// 4. MappingConfidenceEngine
export class MappingConfidenceEngine {
  static calculateScore(sourceHeader: string, targetField: CanonicalFieldDefinition): number {
    const normSource = SemanticHeaderNormalizer.normalize(sourceHeader);
    const normTargetId = SemanticHeaderNormalizer.normalize(targetField.id);
    const normTargetLabel = SemanticHeaderNormalizer.normalize(targetField.label);

    if (normSource === normTargetId || normSource === normTargetLabel) {
      return 1.0;
    }

    for (const alias of targetField.aliases) {
      if (SemanticHeaderNormalizer.normalize(alias) === normSource) {
        return 0.95;
      }
    }

    if (normSource.includes(normTargetId) || normTargetId.includes(normSource)) {
      return 0.8;
    }

    const dist = this.levenshtein(normSource, normTargetId);
    const maxLen = Math.max(normSource.length, normTargetId.length);
    const similarity = maxLen > 0 ? (maxLen - dist) / maxLen : 0;

    if (similarity > 0.6) {
      return similarity * 0.9;
    }

    return 0.0;
  }

  private static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}

// 5. DynamicCategoryInference
export class DynamicCategoryInference {
  static inferSection(header: string): string {
    const norm = SemanticHeaderNormalizer.normalize(header);
    
    if (/antecedente|familiar|quirurgico|alergia|reaccion|habito|tabaco|fuma|droga|alcohol|motivo|tratamiento previo/i.test(norm)) {
      return '01-ANTECEDENTES';
    }
    if (/peso|talla|imc|fc|ta|sat|temp|tension|pulso|presion|constante|exploracion|anamnesis/i.test(norm)) {
      return '02-ANAMNESIS Y EXPLORACIÓN';
    }
    if (/analitica|hemograma|bioquimica|sangre|orina|laboratorio|analisis|plaqueta|leucocito|screening/i.test(norm)) {
      return '03-ANALÍTICAS';
    }
    if (/prueba|resultado|rx|radiologia|ap|biopsia|ecografia|fcf|resultado radiodiagnostico/i.test(norm)) {
      return '04-PRUEBAS Y RESULTADOS';
    }
    if (/diagnostico|juicio|tratamiento|tto|plan|receta|prescripcion|recomendacion/i.test(norm)) {
      return '05-DIAGNÓSTICO Y TRATAMIENTO';
    }
    if (/evolucion|nota|proceso|seguimiento|comentario|observacion/i.test(norm)) {
      return '06-PROCESO Y EVOLUCIÓN';
    }

    return '06-PROCESO Y EVOLUCIÓN';
  }
}

// 6. PersistentMappingProfiles
export interface MappingProfile {
  id: string;
  name: string;
  mappings: Record<string, string>; // sourceHeader -> canonicalFieldId (o "custom" o "ignore")
  demographics: {
    nhc: string;
    idToma: string;
    ordenToma: string;
    fechaToma: string;
    [key: string]: string;
  };
  createdAt: number;
  updatedAt: number;
}

export class PersistentMappingProfiles {
  private static readonly STORE = db.stores.clinical_schemas;
  private static readonly PREFIX = 'PROFILE_';

  static async saveProfile(profile: MappingProfile): Promise<void> {
    const key = `${this.PREFIX}${profile.id}`;
    await db.saveBatch(this.STORE, { [key]: { ...profile, updatedAt: Date.now() } });
  }

  static async getProfile(id: string): Promise<MappingProfile | null> {
    const key = `${this.PREFIX}${id}`;
    return await db.getFromStore(this.STORE, key);
  }

  static async getAllProfiles(): Promise<MappingProfile[]> {
    const keys = await db.getAllKeys(this.STORE);
    const profileKeys = keys.filter(k => k.startsWith(this.PREFIX));
    const results = await db.getBatch(this.STORE, profileKeys);
    return Object.values(results) as MappingProfile[];
  }

  static async deleteProfile(id: string): Promise<void> {
    const key = `${this.PREFIX}${id}`;
    const database = await db.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(this.STORE, 'readwrite');
      const store = transaction.objectStore(this.STORE);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// 7. SchemaCompiler
export class SchemaCompiler {
  static compile(profile: MappingProfile, allHeaders: string[]): ClinicalFormSchema {
    const sections: ClinicalSection[] = [
      { id: 'sec-01', title: '01-ANTECEDENTES', order: 1, collapsible: false, groups: [] },
      { id: 'sec-02', title: '02-ANAMNESIS Y EXPLORACIÓN', order: 2, collapsible: false, groups: [] },
      { id: 'sec-03', title: '03-ANALÍTICAS', order: 3, collapsible: false, groups: [] },
      { id: 'sec-04', title: '04-PRUEBAS Y RESULTADOS', order: 4, collapsible: false, groups: [] },
      { id: 'sec-05', title: '05-DIAGNÓSTICO Y TRATAMIENTO', order: 5, collapsible: false, groups: [] },
      { id: 'sec-06', title: '06-PROCESO Y EVOLUCIÓN', order: 6, collapsible: false, groups: [] }
    ];

    const headerFields: ClinicalField[] = [];
    const unassignedFields: ClinicalField[] = [];
    
    const sectionGroupsMap: Record<string, Record<string, ClinicalField[]>> = {};
    sections.forEach(s => {
      sectionGroupsMap[s.title] = {};
    });

    const structuralHeaders = Object.values(profile.demographics);

    for (const header of allHeaders) {
      const canonicalId = profile.mappings[header];
      const isStructural = structuralHeaders.includes(header);

      if (isStructural) {
        let baseHdrId = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let finalHdrId = `hdr-${baseHdrId}`;
        let hdrCounter = 1;
        while (headerFields.some(h => h.id === finalHdrId)) {
          finalHdrId = `hdr-${baseHdrId}_${hdrCounter}`;
          hdrCounter++;
        }

        headerFields.push({
          id: finalHdrId,
          sourceField: header,
          label: header,
          type: 'text',
          searchable: true,
          highlightable: true,
          visible: true
        });
        continue;
      }

      if (canonicalId === 'ignore') {
        continue;
      }

      let sectionTitle = '06-PROCESO Y EVOLUCIÓN';
      let type: 'text' | 'textarea' | 'number' | 'date' | 'multivalue' = 'text';
      let label = header;

      if (canonicalId && canonicalId !== 'custom') {
        const canonical = CanonicalHeaderRegistry.find(c => c.id === canonicalId);
        if (canonical) {
          sectionTitle = canonical.category;
          type = canonical.type;
          label = canonical.label;
        }
      } else {
        sectionTitle = DynamicCategoryInference.inferSection(header);
        type = header.includes('$') ? 'multivalue' : 'text';
      }

      if (header.includes('$') && type !== 'multivalue') {
        type = 'multivalue';
      }

      let baseId = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      let finalId = `fld-${baseId}`;
      let counter = 1;
      // Check across headerFields and already added fields in sectionGroupsMap
      const isIdUsed = (checkId: string) => {
        if (headerFields.some(h => h.id === checkId)) return true;
        for (const sec of Object.values(sectionGroupsMap)) {
          for (const grp of Object.values(sec)) {
            if (grp.some(f => f.id === checkId)) return true;
          }
        }
        return false;
      };

      while (isIdUsed(finalId)) {
        finalId = `fld-${baseId}_${counter}`;
        counter++;
      }

      const cleanHeader = header.includes('$') ? header.split('$')[1] : header;
      const fieldObj: ClinicalField = {
        id: finalId,
        sourceField: header,
        label: label === header ? cleanHeader : label,
        type,
        searchable: true,
        highlightable: true,
        visible: true,
        multiline: type === 'textarea'
      };

      if (header.includes('$')) {
        const parentName = header.split('$')[0].trim();
        const groupKey = `grp-mv-${parentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        const targetSec = sectionGroupsMap[sectionTitle] ? sectionTitle : '04-PRUEBAS Y RESULTADOS';
        if (!sectionGroupsMap[targetSec][groupKey]) {
          sectionGroupsMap[targetSec][groupKey] = [];
        }
        sectionGroupsMap[targetSec][groupKey].push(fieldObj);
      } else {
        const groupKey = 'grp-general';
        const targetSec = sectionGroupsMap[sectionTitle] ? sectionTitle : '06-PROCESO Y EVOLUCIÓN';
        if (!sectionGroupsMap[targetSec][groupKey]) {
          sectionGroupsMap[targetSec][groupKey] = [];
        }
        sectionGroupsMap[targetSec][groupKey].push(fieldObj);
      }
    }

    sections.forEach(section => {
      const groupsData = sectionGroupsMap[section.title] || {};
      Object.entries(groupsData).forEach(([groupKey, fields]) => {
        if (groupKey.startsWith('grp-mv-')) {
          const parentName = fields[0].sourceField.split('$')[0].trim();
          section.groups.push({
            id: `${section.id}-${groupKey}`,
            title: parentName,
            layout: 'stack',
            fields: [{
              id: `fld-${section.id}-${groupKey}`,
              sourceField: parentName,
              label: parentName,
              type: 'multivalue',
              searchable: true,
              highlightable: true,
              visible: true,
              multivalue: true,
              children: fields
            }]
          });
        } else {
          section.groups.push({
            id: `${section.id}-grp-gen`,
            title: section.title.split('-')[1] || section.title,
            layout: 'grid',
            columns: 2,
            fields: fields
          });
        }
      });
    });

    const headerAliases: Record<string, string[]> = {};
    Object.entries(profile.mappings).forEach(([source, canonical]) => {
      if (canonical && canonical !== 'ignore' && canonical !== 'custom') {
        const def = CanonicalHeaderRegistry.find(c => c.id === canonical);
        if (def) {
          if (!headerAliases[def.label]) {
            headerAliases[def.label] = [];
          }
          if (!headerAliases[def.label].includes(source)) {
            headerAliases[def.label].push(source);
          }
        }
      }
    });

    return {
      id: profile.id,
      name: profile.name,
      version: '1.0',
      status: 'published',
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      header: [{
        id: 'hdr-main',
        layout: 'grid',
        fields: headerFields
      }],
      sidebar: [],
      sections: sections.filter(s => s.groups.length > 0),
      unassignedFields,
      demographics: profile.demographics,
      headerAliases
    };
  }

  static compileToMapping(schema: ClinicalFormSchema): FormMapping {
    const visualCategories: Record<string, string[]> = {};

    for (const section of schema.sections) {
      const fields: string[] = [];
      for (const group of section.groups) {
        for (const field of group.fields) {
          if (field.type === 'multivalue' && field.children) {
            for (const child of field.children) {
              fields.push(child.sourceField);
            }
          } else {
            fields.push(field.sourceField);
          }
        }
      }
      if (fields.length > 0) {
        visualCategories[section.title] = fields;
      }
    }

    return {
      id: schema.id,
      name: schema.name,
      keys: {
        nhc: schema.demographics?.nhc || 'N.H.C',
        idToma: schema.demographics?.idToma || 'Id_Toma',
        ordenToma: schema.demographics?.ordenToma || 'Orden_Toma',
        fechaToma: schema.demographics?.fechaToma || 'EC_Fecha_Toma'
      },
      demographics: schema.demographics || {},
      visualCategories,
      headerAliases: schema.headerAliases || {}
    };
  }
}
