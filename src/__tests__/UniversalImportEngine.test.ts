import { describe, it, expect } from 'vitest';
import { 
  SemanticHeaderNormalizer, 
  AliasResolver, 
  MappingConfidenceEngine, 
  DynamicCategoryInference, 
  SchemaCompiler, 
  MappingProfile 
} from '../ingestion/UniversalImportEngine';

describe('UniversalImportEngine', () => {
  describe('SemanticHeaderNormalizer', () => {
    it('debe limpiar acentos y normalizar a minúsculas', () => {
      expect(SemanticHeaderNormalizer.normalize('N.H.C.')).toBe('n h c');
      expect(SemanticHeaderNormalizer.normalize('Fecha de Nacimiento:')).toBe('fecha de nacimiento');
      expect(SemanticHeaderNormalizer.normalize('Antecedentes de Alérgia')).toBe('antecedentes de alergia');
    });
  });

  describe('AliasResolver', () => {
    it('debe resolver alias conocidos', () => {
      const resolvedNhc = AliasResolver.resolve('historia_clinica');
      expect(resolvedNhc).not.toBeNull();
      expect(resolvedNhc?.id).toBe('nhc');

      const resolvedFecha = AliasResolver.resolve('fecha_observacion_clinica');
      expect(resolvedFecha).not.toBeNull();
      expect(resolvedFecha?.id).toBe('fechaToma');
    });

    it('debe devolver null para cabeceras desconocidas', () => {
      expect(AliasResolver.resolve('campo_completamente_aleatorio_123')).toBeNull();
    });
  });

  describe('MappingConfidenceEngine', () => {
    it('debe calcular confianza alta para coincidencia exacta', () => {
      const nhcDef = {
        id: 'nhc',
        label: 'N.H.C',
        category: 'Cabecera',
        type: 'text' as const,
        aliases: ['nhc']
      };
      const score = MappingConfidenceEngine.calculateScore('nhc', nhcDef);
      expect(score).toBe(1.0);
    });

    it('debe calcular confianza alta para alias comunes', () => {
      const nhcDef = {
        id: 'nhc',
        label: 'N.H.C',
        category: 'Cabecera',
        type: 'text' as const,
        aliases: ['historia_clinica']
      };
      const score = MappingConfidenceEngine.calculateScore('historia_clinica', nhcDef);
      expect(score).toBe(0.95);
    });
  });

  describe('DynamicCategoryInference', () => {
    it('debe inferir sección de antecedentes', () => {
      expect(DynamicCategoryInference.inferSection('Antecedentes Quirúrgicos')).toBe('01-ANTECEDENTES');
      expect(DynamicCategoryInference.inferSection('Alergia al polen')).toBe('01-ANTECEDENTES');
    });

    it('debe inferir constantes en anamnesis', () => {
      expect(DynamicCategoryInference.inferSection('Tensión arterial')).toBe('02-ANAMNESIS Y EXPLORACIÓN');
      expect(DynamicCategoryInference.inferSection('FC')).toBe('02-ANAMNESIS Y EXPLORACIÓN');
    });
  });

  describe('SchemaCompiler', () => {
    it('debe compilar un perfil y un listado de cabeceras en un ClinicalFormSchema correcto', () => {
      const profile: MappingProfile = {
        id: 'profile_test',
        name: 'Test Profile',
        mappings: {
          'Paciente_ID': 'nhc',
          'Visita_ID': 'idToma',
          'Secuencia': 'ordenToma',
          'Fecha': 'fechaToma',
          'Dolor': 'enfermedad_actual'
        },
        demographics: {
          nhc: 'Paciente_ID',
          idToma: 'Visita_ID',
          ordenToma: 'Secuencia',
          fechaToma: 'Fecha'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const rawHeaders = ['Paciente_ID', 'Visita_ID', 'Secuencia', 'Fecha', 'Dolor'];
      const schema = SchemaCompiler.compile(profile, rawHeaders);

      expect(schema.id).toBe('profile_test');
      expect(schema.name).toBe('Test Profile');
      expect(schema.demographics.nhc).toBe('Paciente_ID');
      expect(schema.sections.length).toBeGreaterThan(0);

      const mapping = SchemaCompiler.compileToMapping(schema);
      expect(mapping.id).toBe('profile_test');
      expect(mapping.keys.nhc).toBe('Paciente_ID');
    });
  });
});
