import { HCEData, Patient } from '../core/types';
import { indexerService } from './IndexerService';
import { FormMapping } from '../core/mappings';
import { queryEngine, SearchResult } from './QueryEngine';

export type { SearchResult };

class SearchEngineFacade {
  // --- Ingestion & Indexing ---
  async buildIndex(data: HCEData) {
    if (!data || !data.patients) return;
    const nhcs = Object.keys(data.patients);
    const totalPatients = nhcs.length;

    indexerService.startIndexing();

    for (let i = 0; i < totalPatients; i++) {
      const nhc = nhcs[i];
      await indexerService.indexPatient(nhc, data.patients[nhc], i < 10000);
      if (i > 0 && i % 5000 === 0) {
        await indexerService.flushIndex();
      }
    }
    await indexerService.finalizeIndexing();
  }

  startIndexing() {
    queryEngine.clearCache();
    indexerService.startIndexing();
  }

  async indexPatient(nhc: string, patient: Patient, isSampling: boolean, mapping?: FormMapping) {
    await indexerService.indexPatient(nhc, patient, isSampling, mapping);
  }

  async flushIndexIfNeeded() {
    await indexerService.flushIndexIfNeeded();
  }

  async finalizeIndexing() {
    await indexerService.finalizeIndexing();
    queryEngine.clearCache();
  }

  // --- Search & Queries ---
  async loadIndex(data?: HCEData) {
    await queryEngine.loadIndex();
  }

  getPatientSkeletons() {
    return queryEngine.getPatientSkeletons();
  }

  async loadDictionary() {
    await queryEngine.loadDictionary();
  }

  getSuggestions(input: string): string[] {
    return queryEngine.getSuggestions(input);
  }

  private activeAbortController: AbortController | null = null;

  async search(
    query: string, 
    filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean },
    signal?: AbortSignal
  ): Promise<SearchResult[]> {
    if (!signal) {
      if (this.activeAbortController) {
        this.activeAbortController.abort();
      }
      this.activeAbortController = new AbortController();
      signal = this.activeAbortController.signal;
    }
    
    try {
      return await queryEngine.search(query, filters, signal);
    } finally {
      if (this.activeAbortController?.signal === signal) {
        this.activeAbortController = null;
      }
    }
  }

  getMetrics() {
    return queryEngine.getMetrics();
  }

  setDebugProfilingMode(enabled: boolean) {
    queryEngine.setDebugProfilingMode(enabled);
  }
}

export const searchEngine = new SearchEngineFacade();
