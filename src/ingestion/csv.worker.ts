import { streamCSV } from './csvStreamer';
import { db } from '../storage/indexedDB';
import { searchEngine } from '../engine';
import { PatientData } from '../core/types';
import { SYSTEM_VERSION } from '../core/version';

import { FormMapping } from '../core/mappings';

// REMOVED: detectNhcKey, as it violates the strict mapping rules.

self.onmessage = async (e: MessageEvent) => {
  const { csvText, mapping, strictMode, delimiter, source_file, ingest_timestamp } = e.data;
  
  if (!mapping || !mapping.keys) {
    self.postMessage({ type: 'error', message: 'ERROR: Falta formulario/mapping externo. Ejecución detenida.' });
    return;
  }

  let headerMap: Record<string, string> = {};

  try {
    console.log(`[Worker] Iniciando Ingesta Determinista (${SYSTEM_VERSION})...`);
    
    const BATCH_SIZE = 2500;
    let recordsBatch: any[] = [];
    let totalProcessed = 0;
    const uniqueNhcs = new Set<string>();
    
    searchEngine.startIndexing();

    // Calcular el total de líneas para el progreso (sin cargar en memoria arrays masivos)
    let estimatedTotal = 0;
    for (let i = 0; i < csvText.length; i++) {
      if (csvText[i] === '\n') estimatedTotal++;
    }
    if (csvText.length > 0 && csvText[csvText.length - 1] !== '\n') estimatedTotal++;
    if (estimatedTotal > 0) estimatedTotal--; // Restar la cabecera

    const stream = streamCSV(csvText, delimiter);

    for (const record of stream) {
      if (totalProcessed === 0) {
        headerMap = buildHeaderMap(record, mapping);
      }
      
      const normalizedRecord = normalizeRecord(record, headerMap);

      if (totalProcessed === 0) {
        // Validar que las claves estructurales existan (considerando aliases)
        const keys = Object.keys(normalizedRecord);
        const structuralKeys = [mapping.keys.nhc, mapping.keys.idToma, mapping.keys.ordenToma];
        const missingStruct = structuralKeys.filter(k => !keys.includes(k));
        
        if (missingStruct.length > 0) {
            self.postMessage({ type: 'debug_error', logs: [`Faltan claves estructurales requeridas por el formulario: ${missingStruct.join(', ')}`] });
            return; // Abort
        }
        
        // Validar campos no mapeados (Mapping Completo)
        const allMappedKeys = [
          ...structuralKeys,
          mapping.keys.fechaToma,
          ...Object.values(mapping.demographics || {}),
          ...Object.values(mapping.visualCategories).flat()
        ];
        
        const unmappedFields = Object.keys(record).filter(k => {
            // Un campo está "mapeado" si es una clave estructural, demográfica o de categoría,
            // o si es un alias de alguna de ellas.
            const isStructural = structuralKeys.includes(k);
            const isFecha = mapping.keys.fechaToma === k;
            const isDemo = Object.values(mapping.demographics || {}).includes(k);
            const isVisual = Object.values(mapping.visualCategories).flat().includes(k);
            
            if (isStructural || isFecha || isDemo || isVisual) return false;

            // Verificar si este key original es un alias de algo mapeado
            if (mapping.headerAliases) {
                return !Object.entries(mapping.headerAliases as any).some(([canonical, aliases]) => {
                    const isMappedCanonical = allMappedKeys.includes(canonical);
                    if (!isMappedCanonical) return false;
                    return (aliases as string[]).some(a => a.toLowerCase().trim() === k.toLowerCase().trim().replace(/:$/, ''));
                });
            }
            
            return true;
        });

        if (unmappedFields.length > 0) {
            if (strictMode) {
                self.postMessage({ type: 'debug_error', logs: [`Detectados campos en el CSV no definidos en el Mapping: ${unmappedFields.join(', ')}. Modo STRICT bloquea el almacenamiento silencioso.`] });
                return; // Abort
            } else {
                console.warn(`[Worker] Campos no mapeados detectados (se ignorarán visualmente): ${unmappedFields.join(', ')}`);
            }
        }
      }

      const nhc = normalizedRecord[mapping.keys.nhc];
      if (!nhc) {
          console.error('[DEBUG] Record actual:', record);
          console.error('[DEBUG] Cabeceras mapeadas:', headerMap);
          console.error('[DEBUG] Record normalizado:', normalizedRecord);
          console.error('[DEBUG] Clave NHC esperada:', mapping.keys.nhc);
          self.postMessage({ type: 'debug_error', logs: [`Falta estructura clave (NHC nulo/vacío) en la línea ${totalProcessed + 1}.`] });
          return; // Abort
      }
      uniqueNhcs.add(String(nhc));

      recordsBatch.push(record);
      totalProcessed++;

      if (recordsBatch.length >= BATCH_SIZE) {
        await processBatch(recordsBatch, totalProcessed, mapping, headerMap);
        recordsBatch = [];
        
        self.postMessage({ 
          type: 'progress', 
          progress: totalProcessed, 
          total: estimatedTotal
        });
      }
    }

    // Procesar el último lote
    if (recordsBatch.length > 0) {
      await processBatch(recordsBatch, totalProcessed, mapping, headerMap);
      self.postMessage({ 
        type: 'progress', 
        progress: totalProcessed, 
        total: estimatedTotal
      });
    }

    console.log(`[Worker] Finalizando indexación de ${totalProcessed} registros (${uniqueNhcs.size} pacientes)...`);
    await searchEngine.finalizeIndexing();
    
    await db.saveBatch(db.stores.metadata, { 
      'patient_count': uniqueNhcs.size, 
      'form_id': mapping.id,
      'source_file': source_file,
      'ingest_timestamp': ingest_timestamp
    });

    self.postMessage({ type: 'complete', total: totalProcessed, patientCount: uniqueNhcs.size });

  } catch (error: any) {
    console.error('[Worker] Error crítico:', error);
    if (error.message && error.message.startsWith('DEBUG:')) {
      self.postMessage({ type: 'debug_error', logs: [error.message.replace('DEBUG:', '').trim()] });
    } else {
      self.postMessage({ type: 'error', message: error.message });
    }
  }
};

/**
 * Procesa un lote de registros aplicando la transformación determinista
 */
async function processBatch(records: any[], currentTotal: number, mapping: FormMapping, headerMap: Record<string, string>) {
  if (records.length === 0) return;

  // Normalización previa de cabeceras basada en mapa pre-calculado
  const normalizedRecords = records.map(record => normalizeRecord(record, headerMap));

  const batchNhcs = Array.from(new Set(
    normalizedRecords.map(r => r[mapping.keys.nhc]).filter(Boolean).map(String)
  ));

  const existingPatients = await db.getBatch(db.stores.patients, batchNhcs);
  const batchPatients: Record<string, PatientData> = { ...existingPatients };

  const { nhc: nhcKey, idToma: idTomaKey, ordenToma: ordenTomaKey } = mapping.keys;
  const demographics = mapping.demographics;

  for (const record of normalizedRecords) {
    const nhc = record[nhcKey] ? String(record[nhcKey]) : null;
    if (!nhc) continue; // Si llegara a faltar, ya deberíamos haber lanzado el error en la lectura

    if (!batchPatients[nhc]) {
      const demoData: Record<string, string> = {};
      if (demographics) {
          for (const [canonicalKey, sourceKey] of Object.entries(demographics)) {
              demoData[canonicalKey] = record[sourceKey] || '';
          }
      }

      // Regla especial HCE-ALG: Evitar duplicidad de fechas
      if (record['Fecha_Observacion_Clinica'] && record['EC_Fecha_Toma'] === record['Fecha_Observacion_Clinica']) {
        delete record['Fecha_Observacion_Clinica'];
      }

      batchPatients[nhc] = {
        nhc,
        demographics: demoData,
        tomas: {}
      };
    }

    const idToma = record[idTomaKey];
    const ordenToma = parseInt(record[ordenTomaKey]);
    
    if (!idToma || isNaN(ordenToma)) {
        throw new Error(`DEBUG: Falta Identificador de Toma o de Orden en línea NHC ${nhc}`);
    }

    if (!batchPatients[nhc].tomas[idToma]) {
      batchPatients[nhc].tomas[idToma] = {
        idToma,
        latest: { ordenToma, data: record },
        registros: []
      };
    } else {
      if (ordenToma > batchPatients[nhc].tomas[idToma].latest.ordenToma) {
        batchPatients[nhc].tomas[idToma].latest = { ordenToma, data: record };
      }
    }
    
    const existingRecord = batchPatients[nhc].tomas[idToma].registros.find(r => r.ordenToma === ordenToma);
    if (existingRecord) {
      // Duplicado detectado: En lugar de duplicar la vista, fusionamos los campos (Multivalue Hardening)
      self.postMessage({ type: 'debug_warn', logs: [`Fusionando datos duplicados en NHC ${nhc}, Toma ${idToma}, Orden ${ordenToma}`] });
      
      for (const [key, value] of Object.entries(record)) {
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
          existingRecord.data[key] = value as any;
        }
      }
    } else {
      batchPatients[nhc].tomas[idToma].registros.push({ ordenToma, data: record });
    }
  }

  for (const nhc of batchNhcs) {
    if (batchPatients[nhc]) {
      await searchEngine.indexPatient(nhc, batchPatients[nhc], currentTotal < 20000, mapping);
    }
  }

  await db.saveBatch(db.stores.patients, batchPatients);
  
  // FIX BUG-004: flushIndex() NO se llama aquí incondicionalmente.
  // En su lugar, hacemos un flush por umbral de tamaño para gestionar memoria
  // sin causar la doble escritura que ocurría cuando finalizeIndexing() volvía a flushar.
  // El flush final definitivo lo realiza finalizeIndexing().
  await searchEngine.flushIndexIfNeeded();

  
  // Limpieza agresiva de memoria
  for (const key in batchPatients) delete batchPatients[key];
}

/**
 * Pre-calcula el mapa de cabeceras basándose en el primer registro y los aliases del mapping
 */
function buildHeaderMap(firstRecord: any, mapping: FormMapping): Record<string, string> {
  const map: Record<string, string> = {};
  const recordKeys = Object.keys(firstRecord);
  
  const allCanonical = [
    ...Object.keys(mapping.headerAliases || {}),
    ...Object.values(mapping.visualCategories || {}).flat(),
    mapping.keys.nhc,
    mapping.keys.idToma,
    mapping.keys.ordenToma,
    mapping.keys.fechaToma
  ];

  for (const canonical of allCanonical) {
    if (!canonical) continue;
    const aliases = (mapping.headerAliases && mapping.headerAliases[canonical]) || [];
    const cleanCanonical = canonical.toLowerCase().trim().replace(/:$/, '');
    
    const foundKey = recordKeys.find(k => {
      const cleanK = k.toLowerCase().trim().replace(/:$/, '');
      return cleanK === cleanCanonical || aliases.some(a => a.toLowerCase().trim() === cleanK);
    });
    
    if (foundKey) {
      map[foundKey] = canonical;
    }
  }
  return map;
}

/**
 * Normaliza un registro CSV utilizando el mapa pre-calculado (O(1))
 */
function normalizeRecord(record: any, headerMap: Record<string, string>): any {
  const normalized: any = {};
  for (const key of Object.keys(record)) {
    const canonical = headerMap[key];
    if (canonical) {
      normalized[canonical] = record[key];
    } else {
      normalized[key] = record[key];
    }
  }
  return normalized;
}
