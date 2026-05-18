import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IndexerService } from '../engine/IndexerService';
import { QueryEngine } from '../engine/QueryEngine';
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

describe('Multivalue Hardening Tests', () => {
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

  it('Debe indexar y buscar valores en campos con array (Multivalue)', async () => {
    const patient: any = {
      nhc: 'P1',
      demographics: {},
      tomas: {
        'T1': {
          idToma: 'T1',
          registros: [
            { 
              ordenToma: 1, 
              data: { 
                FECHA: '2024-01-01', 
                'FCF$VALOR': ['BRADICARDIA', 'DECELERACION'] 
              } 
            }
          ]
        }
      }
    };

    indexerService.startIndexing();
    await indexerService.indexPatient('P1', patient, true);
    await indexerService.finalizeIndexing();
    await queryEngine.loadIndex();

    const results1 = await queryEngine.search('BRADICARDIA');
    expect(results1.length).toBe(1);
    expect(results1[0].nhc).toBe('P1');

    const results2 = await queryEngine.search('DECELERACION');
    expect(results2.length).toBe(1);
    expect(results2[0].nhc).toBe('P1');
  });

  it('Debe manejar campos con $ y buscar por el nombre del campo o valor', async () => {
    const patient: any = {
      nhc: 'P1',
      demographics: {},
      tomas: {
        'T1': {
          idToma: 'T1',
          registros: [
            { 
              ordenToma: 1, 
              data: { 
                FECHA: '2024-01-01', 
                'Menograma$Eumenorrea': 'SI' 
              } 
            }
          ]
        }
      }
    };

    indexerService.startIndexing();
    await indexerService.indexPatient('P1', patient, true);
    await indexerService.finalizeIndexing();
    await queryEngine.loadIndex();

    const resultsParent = await queryEngine.search('Menograma');
    expect(resultsParent.length).toBe(1);

    const resultsChild = await queryEngine.search('Eumenorrea');
    expect(resultsChild.length).toBe(1);
  });

  it('Debe simular la fusión de datos duplicados (Lógica de csv.worker.ts)', () => {
    const existingRecord = { ordenToma: 1, data: { FECHA: '2024-01-01', 'FCF$VALOR': 'BRADICARDIA' } as Record<string, any> };
    const newRecord = { FECHA: '2024-01-01', 'FCF$VALOR': 'DECELERACION' };

    for (const [key, value] of Object.entries(newRecord)) {
      if (value === null || value === undefined || String(value).trim() === '') continue;
      
      if (existingRecord.data[key]) {
        const existingVal = existingRecord.data[key];
        if (Array.isArray(existingVal)) {
          if (!existingVal.includes(String(value))) {
            existingVal.push(String(value));
          }
        } else if (existingVal !== String(value)) {
          existingRecord.data[key] = [String(existingVal), String(value)];
        }
      } else {
        existingRecord.data[key] = value;
      }
    }

    expect(Array.isArray(existingRecord.data['FCF$VALOR'])).toBe(true);
    expect(existingRecord.data['FCF$VALOR']).toEqual(['BRADICARDIA', 'DECELERACION']);
  });
});
