import { RegistroToma } from '../core/types';
import { db } from '../storage/indexedDB';
import { SemanticProcessor } from './SemanticProcessor';
import { selectLatestSnapshots } from './selectLatestSnapshots';
import { normalizeString } from '../utils/stringNormalizer';

// ============================================================
// OKAPI BM25 — Parámetros de ajuste (V3.9.0)
// k1: controla la saturación de la frecuencia del término (TF).
//     Valores típicos: 1.2–2.0. Con k1=1.5, mencionar un término
//     50 veces ya NO multiplica el score x50 como en TF-IDF básico.
// b:  controla la normalización por longitud de documento.
//     b=0.75 penaliza levemente historiales muy largos sin hacerlo
//     tan agresivo como la penalización logarítmica anterior.
// ============================================================
const BM25_K1 = 1.5;
const BM25_B = 0.75;

export interface SearchResult {
  nhc: string;
  patient: any;
  totalScore: number;
  matchingTomasCount: number;
  bestMatchUrl: { idToma: string; ordenToma: number };
  matchedRegistros: { idToma: string; ordenToma: number; score: number; record?: RegistroToma }[];
}

export class QueryEngine {
  private documentCount = 0;
  private patientSkeletons: Record<string, any> = Object.create(null);
  private termFragmentCounts: Record<string, number> = Object.create(null);
  private tokenFragmentsCache: Map<string, any[]> = new Map();
  private readonly MAX_CACHE_SIZE = 1000;

  private queryCache: Map<string, SearchResult[]> = new Map();
  private readonly MAX_QUERY_CACHE_SIZE = 100;
  private debugProfilingMode = false;

  constructor() {
    this.startBackgroundCleanup();
  }

  private metrics = {
    queryCacheHits: 0,
    queryCacheMisses: 0,
    tokenCacheHits: 0,
    tokenCacheMisses: 0,
    lastSearchDurationMs: 0,
    totalSearchTimeMs: 0,
    searchCount: 0,
    slowQueriesCount: 0
  };

  public setDebugProfilingMode(enabled: boolean) {
    this.debugProfilingMode = enabled;
  }

  public getMetrics() {
    return {
      ...this.metrics,
      tokenCacheSize: this.tokenFragmentsCache.size,
      queryCacheSize: this.queryCache.size,
      documentCount: this.documentCount,
      dictionarySize: this.dictionary.length,
      estimatedMemoryFootprintBytes: this.estimateMemoryFootprint()
    };
  }

  private estimateMemoryFootprint(): number {
    let bytes = 0;
    try {
      const skelStr = JSON.stringify(this.patientSkeletons);
      bytes += skelStr.length * 2;
    } catch (_) {}

    try {
      for (const [key, value] of this.tokenFragmentsCache.entries()) {
        bytes += key.length * 2;
        bytes += JSON.stringify(value).length * 2;
      }
    } catch (_) {}

    try {
      for (const [key, value] of this.queryCache.entries()) {
        bytes += key.length * 2;
        bytes += JSON.stringify(value).length * 2;
      }
    } catch (_) {}

    return bytes;
  }

  private getQueryCache(key: string): SearchResult[] | undefined {
    if (this.queryCache.has(key)) {
      const val = this.queryCache.get(key);
      this.queryCache.delete(key);
      this.queryCache.set(key, val!);
      this.metrics.queryCacheHits++;
      return val;
    }
    this.metrics.queryCacheMisses++;
    return undefined;
  }

  private cleanupInterval: number | null = null;

  public startBackgroundCleanup(intervalMs = 60000) {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => {
      this.pruneCache();
    }, intervalMs) as unknown as number;
    console.log(`[QueryEngine Cache] Background cleanup job registered (Interval: ${intervalMs}ms)`);
  }

  public stopBackgroundCleanup() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = null;
  }

  private pruneCache() {
    // Prune Query Cache if > 80% full
    if (this.queryCache.size > this.MAX_QUERY_CACHE_SIZE * 0.8) {
      let pruned = 0;
      for (const key of this.queryCache.keys()) {
        this.queryCache.delete(key);
        pruned++;
        if (this.queryCache.size <= this.MAX_QUERY_CACHE_SIZE * 0.5) break;
      }
      console.log(`[QueryEngine Cache] Pruned ${pruned} stale queries in background.`);
    }

    // Prune Token Cache if > 80% full
    if (this.tokenFragmentsCache.size > this.MAX_CACHE_SIZE * 0.8) {
      let pruned = 0;
      for (const key of this.tokenFragmentsCache.keys()) {
        this.tokenFragmentsCache.delete(key);
        pruned++;
        if (this.tokenFragmentsCache.size <= this.MAX_CACHE_SIZE * 0.5) break;
      }
      console.log(`[QueryEngine Cache] Pruned ${pruned} stale token fragments in background.`);
    }
  }

  private setQueryCache(key: string, value: SearchResult[]) {
    if (this.queryCache.has(key)) {
      this.queryCache.delete(key);
    } else if (this.queryCache.size >= this.MAX_QUERY_CACHE_SIZE) {
      const firstKey = this.queryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.queryCache.delete(firstKey);
      }
    }
    this.queryCache.set(key, value);
  }

  public clearCache() {
    this.tokenFragmentsCache.clear();
    this.queryCache.clear();
    console.log("[QueryEngine Cache] Cache de fragmentos e historial de queries invalidada y limpiada.");
  }

  private hasCache(key: string): boolean {
    if (this.tokenFragmentsCache.has(key)) {
      const val = this.tokenFragmentsCache.get(key);
      this.tokenFragmentsCache.delete(key);
      this.tokenFragmentsCache.set(key, val!);
      this.metrics.tokenCacheHits++;
      return true;
    }
    this.metrics.tokenCacheMisses++;
    return false;
  }

  private getCache(key: string): any[] | undefined {
    if (this.tokenFragmentsCache.has(key)) {
      const val = this.tokenFragmentsCache.get(key);
      this.tokenFragmentsCache.delete(key);
      this.tokenFragmentsCache.set(key, val!);
      return val;
    }
    return undefined;
  }

  private setCache(key: string, value: any[]) {
    if (this.tokenFragmentsCache.has(key)) {
      this.tokenFragmentsCache.delete(key);
    } else if (this.tokenFragmentsCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.tokenFragmentsCache.keys().next().value;
      if (firstKey !== undefined) {
        this.tokenFragmentsCache.delete(firstKey);
      }
    }
    this.tokenFragmentsCache.set(key, value);
  }

  /** Longitud media de los documentos indexados (en tokens). Necesaria para BM25. */
  private avgDocLength = 0;
  public dictionary: string[] = [];

  public async loadIndex() {
    this.patientSkeletons = Object.create(null);
    this.termFragmentCounts = Object.create(null);
    this.clearCache();
    
    console.log("[QueryEngine] Cargando metadatos del índice...");
    
    try {
      const termFrags = await db.getFromStore(db.stores.metadata, 'term_fragment_counts');
      const docCount = await db.getFromStore(db.stores.metadata, 'document_count');
      const avgLen = await db.getFromStore(db.stores.metadata, 'avg_doc_length');

      if (termFrags) {
        this.termFragmentCounts = termFrags;
      }

      this.documentCount = docCount || 0;
      this.avgDocLength = avgLen || 150;
      console.log(`[QueryEngine] Metadatos BM25 cargados: ${this.documentCount} docs, avgLen=${this.avgDocLength} tokens.`);
      
      const allMetaKeys = await db.getAllKeys(db.stores.metadata);
      const skeletonKeys = allMetaKeys.filter(k => k.startsWith('skeletons_frag_'));
      
      console.log(`[QueryEngine] Cargando ${skeletonKeys.length} fragmentos de esqueletos...`);
      
      for (const key of skeletonKeys) {
        const frag = await db.getFromStore(db.stores.metadata, key);
        if (frag) Object.assign(this.patientSkeletons, frag);
      }
      
      console.log(`[QueryEngine] Índice cargado: ${Object.keys(this.patientSkeletons).length} pacientes, ${this.documentCount} documentos.`);
    } catch (err) {
      console.error("[QueryEngine] Error cargando el índice:", err);
      throw err;
    }
  }

  public getPatientSkeletons() {
    return this.patientSkeletons;
  }

  public async loadDictionary() {
    const saved = await db.getFromStore(db.stores.metadata, 'clinical_dictionary');
    if (saved) this.dictionary = saved;
  }

  public getSuggestions(input: string): string[] {
    if (!input || input.length < 3) return [];
    
    const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return this.dictionary
      .filter(term => term.includes(normalized))
      .slice(0, 8);
  }

  public async search(
    query: string, 
    filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean },
    signal?: AbortSignal
  ): Promise<SearchResult[]> {
    const startTime = performance.now();
    
    if (signal?.aborted) {
      throw new DOMException('Search aborted', 'AbortError');
    }

    let filtersKey = '';
    if (filters) {
      filtersKey = `${filters.dateRange?.[0]||''}_${filters.dateRange?.[1]||''}_${filters.service||''}_${filters.categories?.join(',')||''}_${filters.fields?.join(',')||''}_${filters.onlyLatestSnapshot?1:0}`;
    }
    const cacheKey = `${query.trim().toLowerCase()}|${filtersKey}`;
    const cached = this.getQueryCache(cacheKey);
    if (cached) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.metrics.lastSearchDurationMs = duration;
      this.metrics.totalSearchTimeMs += duration;
      this.metrics.searchCount++;
      if (this.debugProfilingMode) {
        console.log(`[QueryEngine Profiler] (Cache Hit) "${query}" devuelto en ${duration.toFixed(2)}ms.`);
      }
      return cached;
    }

    const parseStart = performance.now();
    const normalizedQuery = SemanticProcessor.normalize(query);
    const rawTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    const must: string[] = [];
    const mustNot: string[] = [];
    const should: string[] = [];

    for (let i = 0; i < rawTerms.length; i++) {
      const originalTerm = rawTerms[i];
      const termUpper = originalTerm.toUpperCase();
      const prev = rawTerms[i - 1]?.toUpperCase();
      const next = rawTerms[i + 1]?.toUpperCase();
      
      if (termUpper === 'AND' || termUpper === 'OR' || termUpper === 'NOT') continue;

      const rawTokens = SemanticProcessor.tokenize(originalTerm);
      const tokens = rawTokens.length > 1 ? [rawTokens[rawTokens.length - 1]] : rawTokens;
      
      const compact = originalTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isCode = /[a-z]/.test(compact) && /[0-9]/.test(compact);
      if (isCode && compact.length > 3 && !tokens.includes(compact)) {
        tokens.push(compact);
      }
      
      if (tokens.length === 0) continue;
      
      if (prev === 'NOT' || originalTerm.startsWith('-')) {
        mustNot.push(...tokens);
      } else if (next === 'OR' || prev === 'OR') {
        should.push(...tokens);
      } else {
        must.push(...tokens);
      }
    }

    const uniqueMust = Array.from(new Set(must));

    if (must.length === 0 && should.length === 0) {
      if (signal?.aborted) {
        throw new DOMException('Search aborted', 'AbortError');
      }
      const allResults = await this.getAllRecords(filters, signal);
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.metrics.lastSearchDurationMs = duration;
      this.metrics.totalSearchTimeMs += duration;
      this.metrics.searchCount++;
      
      if (duration > 100) {
        this.metrics.slowQueriesCount++;
        console.warn(`[QueryEngine Warning] Slow query detected: "${query}" took ${duration.toFixed(2)}ms.`);
      }
      
      this.setQueryCache(cacheKey, allResults);
      return allResults;
    }

    const allQueryTokens = Array.from(new Set([...uniqueMust, ...should, ...mustNot]));
    const indexResults: Record<string, any[]> = Object.create(null);
    let cacheHits = 0;
    let cacheMisses = 0;
    
    const dbStart = performance.now();
    if (allQueryTokens.length > 0) {
      const allFragmentKeys: string[] = [];
      const keysToFetch: string[] = [];
      
      for (const token of allQueryTokens) {
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          const key = `${token}:${i}`;
          allFragmentKeys.push(key);
          if (this.hasCache(key)) {
            cacheHits++;
          } else {
            cacheMisses++;
            keysToFetch.push(key);
          }
        }
      }
      
      if (signal?.aborted) {
        throw new DOMException('Search aborted', 'AbortError');
      }
      
      let fetchedFragments: Record<string, any[]> = {};
      if (keysToFetch.length > 0) {
        fetchedFragments = await db.getBatch(db.stores.search_index, keysToFetch);
        if (signal?.aborted) {
          throw new DOMException('Search aborted', 'AbortError');
        }
        for (const key of keysToFetch) {
          if (fetchedFragments[key]) {
            this.setCache(key, fetchedFragments[key]);
          }
        }
      }
      
      for (const token of allQueryTokens) {
        indexResults[token] = [];
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          const key = `${token}:${i}`;
          const frag = this.getCache(key);
          if (frag) indexResults[token].push(...frag);
        }
      }
    }

    const calcStart = performance.now();
    const patientMatches: Record<string, any> = Object.create(null);
    
    const mustNotRecords = new Set<string>();
    for (const term of mustNot) {
      const docs = indexResults[term];
      if (docs) docs.forEach((doc: any) => mustNotRecords.add(`${doc.nhc}_${doc.idToma}_${doc.ordenToma}`));
    }

    const filterStart = filters?.dateRange?.[0] ? new Date(`${filters.dateRange[0]}T00:00:00`).getTime() : null;
    const filterEnd = filters?.dateRange?.[1] ? new Date(`${filters.dateRange[1]}T23:59:59`).getTime() : null;
    const requestedCats = filters?.categories?.map(c => normalizeString(c).replace(/^\d{2}-/, '').trim()) || [];
    const requestedFields = filters?.fields?.map(f => normalizeString(f).replace(/^ec_/, '').replace(/_/g, ' ').trim()) || [];
    
    const cleanCategoryCache = new Map<string, string>();
    const cleanFieldCache = new Map<string, string>();

    const lazySnapshots: Record<string, { idToma: string, maxOrden: number } | null> = {};
    const getLatestSnapshot = (nhc: string) => {
      if (lazySnapshots[nhc] !== undefined) return lazySnapshots[nhc];
      const skeleton = this.patientSkeletons[nhc];
      if (!skeleton || !skeleton.tomasMeta) {
        lazySnapshots[nhc] = null;
        return null;
      }
      let maxD = -Infinity;
      let maxId = '';
      let maxOrd = -1;
      for (const id in skeleton.tomasMeta) {
        const meta = skeleton.tomasMeta[id];
        if (!meta) continue;
        if (filterStart && meta.date < filterStart) continue;
        if (filterEnd && meta.date > filterEnd) continue;
        
        if (meta.date > maxD) {
          maxD = meta.date;
          maxId = id;
          maxOrd = meta.maxOrden ?? -1;
        } else if (meta.date === maxD && maxD !== -Infinity) {
          if (id > maxId) {
            maxId = id;
            maxOrd = meta.maxOrden ?? -1;
          }
        }
      }
      if (maxId) {
        lazySnapshots[nhc] = { idToma: maxId, maxOrden: maxOrd };
        return lazySnapshots[nhc];
      }
      lazySnapshots[nhc] = null;
      return null;
    };

    const processTerms = (terms: string[], isMust: boolean) => {
      for (const term of terms) {
        if (signal?.aborted) {
          throw new DOMException('Search aborted', 'AbortError');
        }
        let docs = indexResults[term];
        if (!docs) continue;

        if (filters?.onlyLatestSnapshot) {
           docs = docs.filter((d: any) => {
             const snapshot = getLatestSnapshot(d.nhc);
             if (!snapshot) return false;
             if (d.idToma !== snapshot.idToma) return false;
             if (snapshot.maxOrden !== undefined && snapshot.maxOrden !== -1) {
                return d.ordenToma === snapshot.maxOrden;
             }
             return true;
           });
           
           const nhcSkeleton = (nhc: string) => this.patientSkeletons[nhc];
           docs = selectLatestSnapshots(docs.map((d: any) => {
             const meta = nhcSkeleton(d.nhc)?.tomasMeta?.[d.idToma];
             return { ...d, date: meta?.date || 0 };
           }));
        }

        const N = this.documentCount;
        const df = docs.length || 1;
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

        for (const doc of docs) {
          const regId = `${doc.idToma}_${doc.ordenToma}`;
          
          if (mustNotRecords.has(`${doc.nhc}_${doc.idToma}_${doc.ordenToma}`)) continue;

          const tf = doc.count;
          const docLen = doc.docLen || this.avgDocLength;
          const tfBm25 = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / this.avgDocLength)));
          
          let fieldBoost = 1.0;
          let docCategories: string[] = doc.c || [];
          
          let hasStructuralMatch = true;
          if (requestedCats.length > 0) {
             const hasMatch = requestedCats.some(req => docCategories.some(dc => {
               let cleanDC = cleanCategoryCache.get(dc);
               if (cleanDC === undefined) {
                 cleanDC = normalizeString(dc).replace(/^\d{2}-/, '').trim();
                 cleanCategoryCache.set(dc, cleanDC);
               }
               return cleanDC.includes(req) || req.includes(cleanDC);
             }));
             if (!hasMatch) hasStructuralMatch = false;
          }
          if (requestedFields.length > 0) {
             const hasMatch = requestedFields.some(req => docCategories.some(dc => {
               let cleanDC = cleanFieldCache.get(dc);
               if (cleanDC === undefined) {
                 cleanDC = normalizeString(dc).replace(/^ec_/, '').replace(/_/g, ' ').trim();
                 cleanFieldCache.set(dc, cleanDC);
               }
               return cleanDC === req || normalizeString(dc) === req;
             }));
             if (!hasMatch) hasStructuralMatch = false;
          }
          if (!hasStructuralMatch) continue;

          if (docCategories.includes('DIAGNOSTICO Y TTO')) fieldBoost = 1.8;
          else if (docCategories.includes('ANTECEDENTES')) fieldBoost = 1.5;
          else if (docCategories.includes('RESULTADOS PRUEBAS')) fieldBoost = 1.2;
          else if (docCategories.includes('OBSERVACIONES')) fieldBoost = 0.9;
          
          const score = tfBm25 * idf * fieldBoost;

          if (!patientMatches[doc.nhc]) {
            patientMatches[doc.nhc] = {
              nhc: doc.nhc,
              totalScore: 0,
              registros: {},
              matchedMustTokens: new Set<string>(),
              matchedTokens: new Set<string>()
            };
          }
          const pm = patientMatches[doc.nhc];
          pm.totalScore += score;
          pm.matchedTokens.add(term);

          if (isMust) pm.matchedMustTokens.add(term);
          if (!pm.registros[regId]) {
            pm.registros[regId] = { idToma: doc.idToma, ordenToma: doc.ordenToma, score: 0, matchedTokens: new Set<string>() };
          }
          pm.registros[regId].score += score;
          pm.registros[regId].matchedTokens.add(term);
        }
      }
    };

    processTerms(uniqueMust, true);
    processTerms(should, false);

    if (signal?.aborted) {
      throw new DOMException('Search aborted', 'AbortError');
    }

    const sortStart = performance.now();
    let results: SearchResult[] = [];
    const filterService = filters?.service?.toLowerCase();

    for (const nhc in patientMatches) {
      const pm = patientMatches[nhc];
      const skeleton = this.patientSkeletons[nhc];

      if (uniqueMust.length > 0 && pm.matchedMustTokens.size < uniqueMust.length) continue;

      const flatRegistros = Object.values(pm.registros).sort((a: any, b: any) => b.score - a.score);
      if (flatRegistros.length === 0) continue;

      const validRegistros = flatRegistros.filter((reg: any) => {
        const meta = skeleton?.tomasMeta?.[reg.idToma];
        
        if (filterService || filterStart || filterEnd) {
           if (!meta) return false;
           if (filterService && meta.service && !meta.service.toLowerCase().includes(filterService)) return false;
           if (filterStart || filterEnd) {
              if (!meta.date) return false;
              if (filterStart && meta.date < filterStart) return false;
              if (filterEnd && meta.date > filterEnd) return false;
           }
        }
        return true;
      });

      if (validRegistros.length === 0) continue;

      if (uniqueMust.length > 0) {
        const hasColocated = validRegistros.some(
          (reg: any) => reg.matchedTokens instanceof Set && uniqueMust.every(term => reg.matchedTokens.has(term))
        );
        if (!hasColocated) continue;
      }

      const uniqueTomasCount = new Set(validRegistros.map((r: any) => r.idToma)).size;
      
      if (should.length > 0) {
        const hasAnyShould = validRegistros.some(
          (reg: any) => reg.matchedTokens instanceof Set && should.some(term => reg.matchedTokens.has(term))
        );
        if (!hasAnyShould) continue;
      }

      const finalScore = pm.totalScore; 

      results.push({
        nhc: pm.nhc,
        patient: skeleton || { nhc: pm.nhc, demographics: {}, tomas: {}, services: [], dates: { start: Infinity, end: -Infinity } },
        totalScore: finalScore,
        matchingTomasCount: uniqueTomasCount,
        bestMatchUrl: { idToma: (validRegistros[0] as any).idToma, ordenToma: (validRegistros[0] as any).ordenToma },
        matchedRegistros: validRegistros as any
      });
    }

    const sortedResults = this.applyFiltersAndSort(results);
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.metrics.lastSearchDurationMs = duration;
    this.metrics.totalSearchTimeMs += duration;
    this.metrics.searchCount++;

    if (duration > 100) {
      this.metrics.slowQueriesCount++;
      console.warn(`[QueryEngine Warning] Slow query detected: "${query}" took ${duration.toFixed(2)}ms. Filters: ${JSON.stringify(filters)}`);
    }

    if (this.debugProfilingMode) {
      const parseTime = dbStart - parseStart;
      const dbTime = calcStart - dbStart;
      const calcTime = sortStart - calcStart;
      const sortTime = endTime - sortStart;
      console.log(`[QueryEngine Profiler] Query: "${query}" | Total: ${duration.toFixed(2)}ms
  - Parsing/Tokenization: ${parseTime.toFixed(2)}ms
  - DB Fetch / Cache Check: ${dbTime.toFixed(2)}ms
  - BM25 calculations: ${calcTime.toFixed(2)}ms
  - Filtering / Sorting: ${sortTime.toFixed(2)}ms
  - Cache stats: tokenHits=${cacheHits}, tokenMisses=${cacheMisses}
  - Memory: ${(this.estimateMemoryFootprint() / 1024 / 1024).toFixed(3)} MB`);
    }

    this.setQueryCache(cacheKey, sortedResults);
    return sortedResults;
  }

  private async getAllRecords(filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean }, signal?: AbortSignal): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const nhcs = Object.keys(this.patientSkeletons);
    
    const filterService = filters?.service?.toLowerCase();
    const filterStart = filters?.dateRange?.[0] ? new Date(`${filters.dateRange[0]}T00:00:00`).getTime() : null;
    const filterEnd = filters?.dateRange?.[1] ? new Date(`${filters.dateRange[1]}T23:59:59`).getTime() : null;
    const requestedCats = filters?.categories?.map(c => normalizeString(c).replace(/^\d{2}-/, '').trim()) || [];
    const requestedFields = filters?.fields?.map(f => normalizeString(f).replace(/^ec_/, '').replace(/_/g, ' ').trim()) || [];

    for (const nhc of nhcs) {
      if (signal?.aborted) {
        throw new DOMException('Search aborted', 'AbortError');
      }
      const skeleton = this.patientSkeletons[nhc];
      if (!skeleton) continue;
      let isValidPatient = true;
      let validTomasCount = 0;
      let matchingTomas: string[] = [];
      let maxD = -Infinity;
      let latestId = '';
      let latestOrd = -1;
      
      const hasAnyFilter = filterService || filterStart || filterEnd || requestedCats.length > 0 || requestedFields.length > 0;
      
      if (hasAnyFilter || filters?.onlyLatestSnapshot) {
         isValidPatient = false;
         if (skeleton.tomasMeta) {
             for (const tomaId in skeleton.tomasMeta) {
                 const meta = skeleton.tomasMeta[tomaId];
                 let isValidToma = true;
                 if (!meta) isValidToma = false;
                 else {
                     if (filterService && meta.service && !meta.service.toLowerCase().includes(filterService)) isValidToma = false;
                     if (filterStart || filterEnd) {
                         if (!meta.date) isValidToma = false;
                         if (filterStart && meta.date < filterStart) isValidToma = false;
                         if (filterEnd && meta.date > filterEnd) isValidToma = false;
                     }
                     if (isValidToma && requestedCats.length > 0) {
                        const tomaCats = meta.categories || [];
                        const hasCatMatch = requestedCats.some(req => tomaCats.some(tc => {
                           const cleanTC = normalizeString(tc).replace(/^\d{2}-/, '').trim();
                           return cleanTC.includes(req) || req.includes(cleanTC);
                        }));
                        if (!hasCatMatch) isValidToma = false;
                     }
                     if (isValidToma && requestedFields.length > 0) {
                        const tomaFields = meta.fields || [];
                        const hasFieldMatch = requestedFields.some(req => tomaFields.some(tf => {
                           const cleanTF = normalizeString(tf).replace(/^ec_/, '').replace(/_/g, ' ').trim();
                           return cleanTF === req || normalizeString(tf) === req;
                        }));
                        if (!hasFieldMatch) isValidToma = false;
                     }
                 }
                 if (isValidToma) {
                    isValidPatient = true;
                    validTomasCount++;
                    matchingTomas.push(tomaId);
                    
                    if (filters?.onlyLatestSnapshot && meta.date !== undefined) {
                       if (meta.date > maxD) {
                         maxD = meta.date;
                         latestId = tomaId;
                         latestOrd = meta.maxOrden ?? -1;
                       } else if (meta.date === maxD && maxD !== -Infinity) {
                         if (tomaId > latestId) {
                           latestId = tomaId;
                           latestOrd = meta.maxOrden ?? -1;
                         }
                       }
                    }
                 }
             }
         }
      } else {
        validTomasCount = Object.keys(skeleton.tomasMeta || {}).length || 1;
      }
      
      if (!isValidPatient) continue;

      if (filters?.onlyLatestSnapshot && latestId) {
        results.push({
          nhc,
          patient: skeleton,
          totalScore: 1,
          matchingTomasCount: 1,
          bestMatchUrl: { idToma: latestId, ordenToma: latestOrd },
          matchedRegistros: []
        });
      } else {
        results.push({
          nhc,
          patient: skeleton,
          totalScore: 1,
          matchingTomasCount: validTomasCount,
          bestMatchUrl: { idToma: matchingTomas[0] || 'N/A', ordenToma: 0 },
          matchedRegistros: []
        });
      }
    }
    return this.applyFiltersAndSort(results);
  }

  private applyFiltersAndSort(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => b.totalScore - a.totalScore);
  }
}

export const queryEngine = new QueryEngine();
