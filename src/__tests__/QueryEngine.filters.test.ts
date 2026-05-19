import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryEngine } from '../engine/QueryEngine';
import { IndexerService } from '../engine/IndexerService';
import { Patient } from '../core/types';
import { FormMapping } from '../core/mappings';

// --- MOCKS DE DB ---
const mockSearchIndex: Record<string, any> = {};
const mockMetadata: Record<string, any> = {};
const mockPatients: Record<string, any> = {};

vi.mock('../storage/indexedDB', () => ({
  db: {
    stores: {
      search_index: 'search_index',
      metadata: 'metadata',
      patients: 'patients'
    },
    saveBatch: vi.fn(async (store, items) => {
      if (store === 'search_index') Object.assign(mockSearchIndex, items);
      if (store === 'metadata') Object.assign(mockMetadata, items);
      if (store === 'patients') Object.assign(mockPatients, items);
      return Promise.resolve();
    }),
    getFromStore: vi.fn(async (store, key) => {
      if (store === 'search_index') return mockSearchIndex[key];
      if (store === 'metadata') return mockMetadata[key];
      if (store === 'patients') return mockPatients[key];
      return null;
    }),
    getBatch: vi.fn(async (store, keys) => {
      const results: Record<string, any> = {};
      const target = store === 'search_index' ? mockSearchIndex : (store === 'metadata' ? mockMetadata : mockPatients);
      keys.forEach(key => {
        if (target[key] !== undefined) results[key] = target[key];
      });
      return results;
    }),
    getAllKeys: vi.fn(async (store) => {
      if (store === 'search_index') return Object.keys(mockSearchIndex);
      if (store === 'metadata') return Object.keys(mockMetadata);
      return [];
    }),
    open: vi.fn()
  }
}));

describe('QueryEngine - Filter Validation', () => {
  let queryEngine: QueryEngine;
  let indexerService: IndexerService;

  const mockMapping: FormMapping = {
    id: 'test_form',
    name: 'Test Form',
    keys: { nhc: 'NHC', idToma: 'ID_TOMA', ordenToma: 'ORDEN_TOMA', fechaToma: 'FECHA' },
    demographics: {},
    visualCategories: {
      '01-ANTECEDENTES': ['Antecedentes Personales'],
      '02-ANAMNESIS Y EXPLORACIÓN': ['Enfermedad Actual', 'Exploración Física'],
      '03-DIAGNÓSTICO': ['Diagnóstico']
    }
  };

  beforeEach(async () => {
    // Reset DB
    for (const k in mockSearchIndex) delete mockSearchIndex[k];
    for (const k in mockMetadata) delete mockMetadata[k];
    for (const k in mockPatients) delete mockPatients[k];

    queryEngine = new QueryEngine();
    indexerService = new IndexerService();
  });

  async function indexData(patients: Record<string, Patient>) {
    indexerService.startIndexing();
    for (const nhc in patients) {
      await indexerService.indexPatient(nhc, patients[nhc], true, mockMapping);
    }
    await indexerService.finalizeIndexing();
    await queryEngine.loadIndex();
  }

  it('Debe filtrar por categoría (acento insensible)', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES' } }
          }
        }
      }
    });

    // Buscamos con acento
    const resultsConAcento = await queryEngine.search('DIABETES', { categories: ['02-ANAMNESIS Y EXPLORACIÓN'] });
    expect(resultsConAcento.length).toBe(1);

    // Buscamos sin acento
    const resultsSinAcento = await queryEngine.search('DIABETES', { categories: ['02-ANAMNESIS Y EXPLORACION'] });
    expect(resultsSinAcento.length).toBe(1);
  });

  it('Debe filtrar por campo específico', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES', 'Diagnóstico': 'ASMA' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES', 'Diagnóstico': 'ASMA' } }
          }
        }
      }
    });

    const results = await queryEngine.search('DIABETES', { fields: ['Enfermedad Actual'] });
    expect(results.length).toBe(1);

    const resultsNoMatch = await queryEngine.search('DIABETES', { fields: ['Diagnóstico'] });
    expect(resultsNoMatch.length).toBe(0);
  });

  it('Debe combinar filtros de categoría y campo', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES' } }
          }
        }
      }
    });

    const results = await queryEngine.search('DIABETES', { 
      categories: ['02-ANAMNESIS Y EXPLORACIÓN'],
      fields: ['Enfermedad Actual']
    });
    expect(results.length).toBe(1);
  });

  it('Debe respetar filtros de fecha', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA: '2023-01-01', 'Enfermedad Actual': 'DIABETES' } }],
            latest: { ordenToma: 1, data: { FECHA: '2023-01-01', 'Enfermedad Actual': 'DIABETES' } }
          },
          'T2': { 
            idToma: 'T2', 
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES' } }
          }
        }
      }
    });

    const results = await queryEngine.search('DIABETES', { 
      dateRange: ['2024-01-01', '2024-12-31']
    });
    expect(results.length).toBe(1);
    expect(results[0].bestMatchUrl.idToma).toBe('T2');
  });

  it('Debe manejar campos vacíos sin fallar', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': '' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': '' } }
          }
        }
      }
    });

    const results = await queryEngine.search('DIABETES');
    expect(results.length).toBe(0);
  });

  it('Debe soportar operadores booleanos con filtros estructurales', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES ASMA' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'DIABETES ASMA' } }
          }
        }
      }
    });

    const resultsAnd = await queryEngine.search('DIABETES AND ASMA', { categories: ['02-ANAMNESIS Y EXPLORACIÓN'] });
    expect(resultsAnd.length).toBe(1);

    const resultsNot = await queryEngine.search('DIABETES NOT ASMA', { categories: ['02-ANAMNESIS Y EXPLORACIÓN'] });
    expect(resultsNot.length).toBe(0);
  });
});
