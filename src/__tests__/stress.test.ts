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

function generateRandomPatient(id: number): Patient {
  return {
    nhc: `NHC-${id}`,
    demographics: {
      'NOMBRE': `Paciente ${id}`,
      'SEXO': id % 2 === 0 ? 'H' : 'M',
      'EDAD': String(20 + (id % 60))
    },
    tomas: {
      'T1': {
        idToma: 'T1',
        latest: { ordenToma: 1, data: { 'FECHA': '2024-01-01', 'DIAGNOSTICO': 'Hipertension arterial', 'FCF$VALOR': id % 10 === 0 ? 'BRADICARDIA' : 'NORMAL' } },
        registros: [
          { 
            ordenToma: 1, 
            data: { 
              'FECHA': '2024-01-01', 
              'DIAGNOSTICO': 'Hipertension arterial', 
              'FCF$VALOR': id % 10 === 0 ? 'BRADICARDIA' : 'NORMAL' 
            } 
          }
        ]
      }
    }
  };
}

describe('Operational Stress Testing Protocol', () => {
  let queryEngine: QueryEngine;
  let indexerService: IndexerService;

  beforeEach(async () => {
    for (const k in mockSearchIndex) delete mockSearchIndex[k];
    for (const k in mockMetadata) delete mockMetadata[k];
    for (const k in mockPatients) delete mockPatients[k];

    queryEngine = new QueryEngine();
    indexerService = new IndexerService();
  });

  it('Stress Test - Small Dataset (~500 pacientes)', async () => {
    const count = 500;
    console.log(`[StressTest] Generando ${count} pacientes...`);
    const startTime = performance.now();
    
    indexerService.startIndexing();
    for (let i = 0; i < count; i++) {
      const p = generateRandomPatient(i);
      await indexerService.indexPatient(p.nhc, p, true);
    }
    await indexerService.finalizeIndexing();
    
    const indexingTime = performance.now() - startTime;
    console.log(`[StressTest] Indexación de ${count} pacientes completada en ${indexingTime.toFixed(2)}ms`);
    
    await queryEngine.loadIndex();
    
    const queryStartTime = performance.now();
    const results = await queryEngine.search('BRADICARDIA');
    const queryTime = performance.now() - queryStartTime;
    
    console.log(`[StressTest] Búsqueda en ${count} pacientes completada en ${queryTime.toFixed(2)}ms. Resultados: ${results.length}`);
    
    expect(results.length).toBeGreaterThan(0);
  });

  it('Stress Test - Medium Dataset (~10k pacientes)', async () => {
    const count = 10000;
    console.log(`[StressTest] Generando ${count} pacientes...`);
    const startTime = performance.now();
    
    indexerService.startIndexing();
    for (let i = 0; i < count; i++) {
      const p = generateRandomPatient(i);
      await indexerService.indexPatient(p.nhc, p, true);
    }
    await indexerService.finalizeIndexing();
    
    const indexingTime = performance.now() - startTime;
    console.log(`[StressTest] Indexación de ${count} pacientes completada en ${indexingTime.toFixed(2)}ms`);
    
    await queryEngine.loadIndex();
    
    const queryStartTime = performance.now();
    const results = await queryEngine.search('BRADICARDIA');
    const queryTime = performance.now() - queryStartTime;
    
    console.log(`[StressTest] Búsqueda en ${count} pacientes completada en ${queryTime.toFixed(2)}ms. Resultados: ${results.length}`);
    
    expect(results.length).toBeGreaterThan(0);
  }, 60000);

  it.skip('Stress Test - Large Dataset (~100k pacientes)', async () => {
    const count = 100000;
    console.log(`[StressTest] Generando ${count} pacientes...`);
    const startTime = performance.now();
    
    indexerService.startIndexing();
    for (let i = 0; i < count; i++) {
      const p = generateRandomPatient(i);
      await indexerService.indexPatient(p.nhc, p, true);
    }
    await indexerService.finalizeIndexing();
    
    const indexingTime = performance.now() - startTime;
    console.log(`[StressTest] Indexación de ${count} pacientes completada en ${indexingTime.toFixed(2)}ms`);
    
    await queryEngine.loadIndex();
    
    const queryStartTime = performance.now();
    const results = await queryEngine.search('BRADICARDIA');
    const queryTime = performance.now() - queryStartTime;
    
    console.log(`[StressTest] Búsqueda en ${count} pacientes completada en ${queryTime.toFixed(2)}ms. Resultados: ${results.length}`);
    
    expect(results.length).toBeGreaterThan(0);
  }, 600000);
});
