import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryEngine } from '../engine/QueryEngine';
import { IndexerService } from '../engine/IndexerService';
import { Patient } from '../core/types';

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

describe('QueryEngine - Modo "Última Toma" (Snapshot Mode)', () => {
  let queryEngine: QueryEngine;
  let indexerService: IndexerService;

  beforeEach(async () => {
    // Reset DB
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
    for (const nhc in patients) {
      await indexerService.indexPatient(nhc, patients[nhc], true);
    }
    await indexerService.finalizeIndexing();
    await queryEngine.loadIndex();
  }

  it('Caso A: Debe encontrar solo el término en la última toma si existe en ella', async () => {
    await indexData({
      'NHC_A': {
        nhc: 'NHC_A',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2023-01-01', HALLAZGO: 'NORMAL' } }],
            latest: { ordenToma: 1, data: { FECHA_TOMA: '2023-01-01', HALLAZGO: 'NORMAL' } }
          },
          'T2': { 
            idToma: 'T2', 
            registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'DIABETES' } }],
            latest: { ordenToma: 1, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'DIABETES' } }
          }
        }
      }
    });

    const results = await queryEngine.search('DIABETES', { onlyLatestSnapshot: true });
    expect(results.length).toBe(1);
    expect(results[0].bestMatchUrl.idToma).toBe('T2');
  });

  it('Caso B: NO debe encontrar el término si solo existe en tomas históricas', async () => {
    await indexData({
      'NHC_B': {
        nhc: 'NHC_B',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2023-01-01', HALLAZGO: 'DIABETES' } }],
            latest: { ordenToma: 1, data: { FECHA_TOMA: '2023-01-01', HALLAZGO: 'DIABETES' } }
          },
          'T2': { 
            idToma: 'T2', 
            registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'ASMA' } }],
            latest: { ordenToma: 1, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'ASMA' } }
          }
        }
      }
    });

    // Con filtro de última toma activo, no debería encontrar NHC_B para "DIABETES"
    const resultsSnapshot = await queryEngine.search('DIABETES', { onlyLatestSnapshot: true });
    expect(resultsSnapshot.length).toBe(0);

    // Sin el filtro, sí debería encontrarlo
    const resultsNormal = await queryEngine.search('DIABETES', { onlyLatestSnapshot: false });
    expect(resultsNormal.length).toBe(1);
    expect(resultsNormal[0].nhc).toBe('NHC_B');
  });

  it('Caso Versiones: Debe discriminar versiones antiguas de la misma toma', async () => {
    await indexData({
      'NHC_C': {
        nhc: 'NHC_C',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [
              { ordenToma: 1, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'DIABETES' } },
              { ordenToma: 2, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'CONTROL NORMAL' } }
            ],
            latest: { ordenToma: 2, data: { FECHA_TOMA: '2024-01-01', HALLAZGO: 'CONTROL NORMAL' } }
          }
        }
      }
    });

    // La última versión (Orden 2) es "CONTROL NORMAL". "DIABETES" ya no debería ser un hit.
    const results = await queryEngine.search('DIABETES', { onlyLatestSnapshot: true });
    expect(results.length).toBe(0);
  });

  it('Caso Rango Temporal: Debe seleccionar la última toma dentro del rango especificado', async () => {
    await indexData({
      'NHC_D': {
        nhc: 'NHC_D',
        demographics: {},
        tomas: {
          'T1': { 
            idToma: 'T1', 
            registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2023-05-01', HALLAZGO: 'COVID' } }],
            latest: { ordenToma: 1, data: { FECHA_TOMA: '2023-05-01', HALLAZGO: 'COVID' } }
          },
          'T2': { 
            idToma: 'T2', 
            registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2024-05-01', HALLAZGO: 'COVID' } }],
            latest: { ordenToma: 1, data: { FECHA_TOMA: '2024-05-01', HALLAZGO: 'COVID' } }
          }
        }
      }
    });

    // Si buscamos en el rango de 2023, la última toma válida es T1
    const results2023 = await queryEngine.search('COVID', { 
      onlyLatestSnapshot: true,
      dateRange: ['2023-01-01', '2023-12-31']
    });
    expect(results2023.length).toBe(1);
    expect(results2023[0].bestMatchUrl.idToma).toBe('T1');

    // Si buscamos sin rango, la última es T2
    const resultsGlobal = await queryEngine.search('COVID', { onlyLatestSnapshot: true });
    expect(resultsGlobal[0].bestMatchUrl.idToma).toBe('T2');
  });

  it('Caso Consulta Vacía: Debe devolver exactamente 1 resultado por paciente con snapshot activo', async () => {
    await indexData({
      'P1': { nhc: 'P1', demographics: {}, tomas: { 'T1': { idToma: 'T1', registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2024-01-01' } }], latest: { ordenToma: 1, data: { FECHA_TOMA: '2024-01-01' } } } } },
      'P2': { nhc: 'P2', demographics: {}, tomas: { 'T1': { idToma: 'T1', registros: [{ ordenToma: 1, data: { FECHA_TOMA: '2024-01-01' } }], latest: { ordenToma: 1, data: { FECHA_TOMA: '2024-01-01' } } } } }
    });

    const results = await queryEngine.search('', { onlyLatestSnapshot: true });
    expect(results.length).toBe(2);
    expect(results[0].matchingTomasCount).toBe(1);
  });
});
