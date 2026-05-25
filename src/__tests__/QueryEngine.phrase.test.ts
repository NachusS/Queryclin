import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryEngine } from '../engine/QueryEngine';
import { IndexerService } from '../engine/IndexerService';
import { Patient } from '../core/types';
import { FormMapping } from '../core/mappings';

// --- DB MOCKS ---
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

describe('QueryEngine - Quoted Phrase Search Tests', () => {
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
    // Reset mock DB
    for (const k in mockSearchIndex) delete mockSearchIndex[k];
    for (const k in mockMetadata) delete mockMetadata[k];
    for (const k in mockPatients) delete mockPatients[k];

    queryEngine = new QueryEngine();
    indexerService = new IndexerService();
  });

  afterEach(() => {
    queryEngine.stopBackgroundCleanup();
  });

  async function indexData(patients: Record<string, Patient>) {
    indexerService.startIndexing();
    const { db } = await import('../storage/indexedDB');
    await db.saveBatch(db.stores.patients, patients);
    for (const nhc in patients) {
      await indexerService.indexPatient(nhc, patients[nhc], true, mockMapping);
    }
    await indexerService.finalizeIndexing();
    await queryEngine.loadIndex();
  }

  it('Caso 1: Debe encontrar coincidencia de frase exacta e idéntica', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'el paciente tiene infarto miocardio' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'el paciente tiene infarto miocardio' } }
          }
        }
      }
    });

    const results = await queryEngine.search('"infarto miocardio"');
    expect(results.length).toBe(1);
    expect(results[0].nhc).toBe('P1');
  });

  it('Caso 2: NO debe coincidir si hay palabras intermedias (exige exactitud total)', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'el paciente tiene infarto agudo miocardio' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'el paciente tiene infarto agudo miocardio' } }
          }
        }
      }
    });

    const results = await queryEngine.search('"infarto miocardio"');
    expect(results.length).toBe(0);
  });

  it('Caso 3: NO debe coincidir si las palabras están invertidas', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'el paciente tiene miocardio infarto' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'el paciente tiene miocardio infarto' } }
          }
        }
      }
    });

    const results = await queryEngine.search('"infarto miocardio"');
    expect(results.length).toBe(0);
  });

  it('Caso 4: Compatibilidad con AND y frase exacta', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'diabetes e insuficiencia renal' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'diabetes e insuficiencia renal' } }
          }
        }
      },
      'P2': {
        nhc: 'P2',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'insuficiencia renal sin diabetes' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'insuficiencia renal sin diabetes' } }
          }
        }
      }
    });

    const results = await queryEngine.search('diabetes AND "insuficiencia renal"');
    expect(results.length).toBe(1);
    expect(results[0].nhc).toBe('P1');
  });

  it('Caso 5: Compatibilidad con NOT y frase exacta', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'insuficiencia renal y dialisis' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'insuficiencia renal y dialisis' } }
          }
        }
      },
      'P2': {
        nhc: 'P2',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'insuficiencia renal' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'insuficiencia renal' } }
          }
        }
      }
    });

    const results = await queryEngine.search('"insuficiencia renal" NOT dialisis');
    expect(results.length).toBe(1);
    expect(results[0].nhc).toBe('P2');
  });

  it('Caso 6: Negaciones - "sin insuficiencia renal" debe respetar el contexto completo', async () => {
    await indexData({
      'P1': {
        nhc: 'P1',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'paciente sin insuficiencia renal en este momento' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'paciente sin insuficiencia renal en este momento' } }
          }
        }
      },
      'P2': {
        nhc: 'P2',
        demographics: {},
        tomas: {
          'T1': {
            idToma: 'T1',
            registros: [{ ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'presenta insuficiencia renal' } }],
            latest: { ordenToma: 1, data: { FECHA: '2024-01-01', 'Enfermedad Actual': 'presenta insuficiencia renal' } }
          }
        }
      }
    });

    // Buscar la frase negativa "sin insuficiencia renal"
    const resultsNegPhrase = await queryEngine.search('"sin insuficiencia renal"');
    expect(resultsNegPhrase.length).toBe(1);
    expect(resultsNegPhrase[0].nhc).toBe('P1');

    // Buscar "insuficiencia renal" (positiva) no debe encontrar a P1 porque está negada (negation shielding)
    const resultsPosPhrase = await queryEngine.search('"insuficiencia renal"');
    expect(resultsPosPhrase.length).toBe(1);
    expect(resultsPosPhrase[0].nhc).toBe('P2');
  });
});
