import { HCEData, RegistroToma } from '../core/types';
import { CLINICAL_SYNONYMS, STEM_WHITELIST } from './clinicalSynonyms';
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
  /** Longitud media de los documentos indexados (en tokens). Necesaria para BM25. */
  private avgDocLength = 0;
  public dictionary: string[] = [];

  public async loadIndex() {
    this.patientSkeletons = Object.create(null);
    
    console.log("[QueryEngine] Cargando metadatos del índice...");
    
    try {
      const termFrags = await db.getFromStore(db.stores.metadata, 'term_fragment_counts');
      const docCount = await db.getFromStore(db.stores.metadata, 'document_count');
      const avgLen = await db.getFromStore(db.stores.metadata, 'avg_doc_length');

      if (termFrags) {
        this.termFragmentCounts = termFrags;
      }

      this.documentCount = docCount || 0;
      // BM25: la longitud media se estima como total_tokens / document_count.
      // Si no está almacenada (datasets anteriores a V3.9.0), se usa un fallback heurístico.
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
    
    // Usamos el tokenizer para la normalización básica
    const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return this.dictionary
      .filter(term => term.includes(normalized))
      .slice(0, 8);
  }

  public async search(query: string, filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean }): Promise<SearchResult[]> {
    const rawTerms = query.split(/\s+/).filter(t => t.length > 0);
    const must: string[] = [];
    const mustNot: string[] = [];
    const should: string[] = [];

    for (let i = 0; i < rawTerms.length; i++) {
      const originalTerm = rawTerms[i];
      const termUpper = originalTerm.toUpperCase();
      const prev = rawTerms[i - 1]?.toUpperCase();
      const next = rawTerms[i + 1]?.toUpperCase();
      
      if (termUpper === 'AND' || termUpper === 'OR' || termUpper === 'NOT') continue;

      // MEJORA V3.9.0: Usar SemanticProcessor
      const rawTokens = SemanticProcessor.tokenize(originalTerm);
      const tokens = rawTokens.length > 1 ? [rawTokens[rawTokens.length - 1]] : rawTokens; // Tomar el canónico si existe
      
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

    if (must.length === 0 && should.length === 0) return await this.getAllRecords(filters);

    const allQueryTokens = Array.from(new Set([...uniqueMust, ...should, ...mustNot]));
    const indexResults: Record<string, any[]> = Object.create(null);
    
    if (allQueryTokens.length > 0) {
      const allFragmentKeys: string[] = [];
      for (const token of allQueryTokens) {
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          allFragmentKeys.push(`${token}:${i}`);
        }
      }
      
      const fragments = await db.getBatch(db.stores.search_index, allFragmentKeys);
      
      for (const token of allQueryTokens) {
        indexResults[token] = [];
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          const frag = fragments[`${token}:${i}`];
          if (frag) indexResults[token].push(...frag);
        }
      }
    }

    const patientMatches: Record<string, any> = Object.create(null);
    
    const mustNotRecords = new Set<string>();
    for (const term of mustNot) {
      const docs = indexResults[term];
      if (docs) docs.forEach((doc: any) => mustNotRecords.add(`${doc.nhc}_${doc.idToma}_${doc.ordenToma}`));
    }

    const filterStart = filters?.dateRange?.[0] ? new Date(`${filters.dateRange[0]}T00:00:00`).getTime() : null;
    const filterEnd = filters?.dateRange?.[1] ? new Date(`${filters.dateRange[1]}T23:59:59`).getTime() : null;

    const globalLatestSnapshot: Record<string, { idToma: string, maxOrden: number }> = {};
    if (filters?.onlyLatestSnapshot) {
      for (const nhc in this.patientSkeletons) {
        const skeleton = this.patientSkeletons[nhc];
        if (!skeleton.tomasMeta) continue;
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
        if (maxId) globalLatestSnapshot[nhc] = { idToma: maxId, maxOrden: maxOrd };
      }
    }

    const processTerms = (terms: string[], isMust: boolean) => {
      for (const term of terms) {
        let docs = indexResults[term];
        if (!docs) continue;

        if (filters?.onlyLatestSnapshot) {
           docs = docs.filter((d: any) => {
             const snapshot = globalLatestSnapshot[d.nhc];
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
          if (filters?.categories && filters.categories.length > 0) {
             const requestedCats = filters.categories.map(c => normalizeString(c).replace(/^\d{2}-/, '').trim());
             const hasMatch = requestedCats.some(req => docCategories.some(dc => {
               const cleanDC = normalizeString(dc).replace(/^\d{2}-/, '').trim();
               return cleanDC.includes(req) || req.includes(cleanDC);
             }));
             if (!hasMatch) hasStructuralMatch = false;
          }
          if (filters?.fields && filters.fields.length > 0) {
             const requestedFields = filters.fields.map(f => normalizeString(f).replace(/^ec_/, '').replace(/_/g, ' ').trim());
             const hasMatch = requestedFields.some(req => docCategories.some(dc => {
               const cleanDC = normalizeString(dc).replace(/^ec_/, '').replace(/_/g, ' ').trim();
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
              matchedTokens: new Set<string>() // NUEVO: Track de todos los tokens
            };
          }
          const pm = patientMatches[doc.nhc];
          pm.totalScore += score;
          pm.matchedTokens.add(term); // Registrar siempre

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
      
      // MEJORA V6.2.5 (Fixed): Si hay términos SHOULD (OR), validar presencia
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

    return this.applyFiltersAndSort(results);
  }

  private async getAllRecords(filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean }): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const nhcs = Object.keys(this.patientSkeletons);
    
    const filterService = filters?.service?.toLowerCase();
    const filterStart = filters?.dateRange?.[0] ? new Date(`${filters.dateRange[0]}T00:00:00`).getTime() : null;
    const filterEnd = filters?.dateRange?.[1] ? new Date(`${filters.dateRange[1]}T23:59:59`).getTime() : null;
    const requestedCats = filters?.categories?.map(c => c.toUpperCase().replace(/^\d{2}-/, '').trim()) || [];

    const globalLatestSnapshot: Record<string, { idToma: string, maxOrden: number }> = {};
    if (filters?.onlyLatestSnapshot) {
      for (const nhc in this.patientSkeletons) {
        const skeleton = this.patientSkeletons[nhc];
        if (!skeleton.tomasMeta) continue;
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
        if (maxId) globalLatestSnapshot[nhc] = { idToma: maxId, maxOrden: maxOrd };
      }
    }

    for (const nhc of nhcs) {
      const skeleton = this.patientSkeletons[nhc];
      let isValidPatient = true;
      let validTomasCount = 0;
      let matchingTomas: string[] = [];
      
      if (filterService || filterStart || filterEnd || requestedCats.length > 0) {
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
                        const hasCatMatch = requestedCats.some(req => tomaCats.some(tc => tc.toUpperCase().includes(req)));
                        if (!hasCatMatch) isValidToma = false;
                     }
                 }
                 if (isValidToma) {
                    isValidPatient = true;
                    validTomasCount++;
                    matchingTomas.push(tomaId);
                 }
             }
         }
      } else {
        validTomasCount = Object.keys(skeleton.tomasMeta || {}).length || 1;
      }
      
      if (!isValidPatient) continue;

      if (filters?.onlyLatestSnapshot && globalLatestSnapshot[nhc]) {
        results.push({
          nhc,
          patient: skeleton,
          totalScore: 1,
          matchingTomasCount: 1,
          bestMatchUrl: { idToma: globalLatestSnapshot[nhc].idToma, ordenToma: globalLatestSnapshot[nhc].maxOrden },
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
