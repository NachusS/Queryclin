import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { Sun, Moon, Database, Users, HelpCircle, ShieldCheck, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { HCEData } from './core/types';
import { searchEngine, SearchResult } from './engine';
import { db } from './storage/indexedDB';
import { parseClinicalDate, extractFecha, extractHora } from './utils/dateParser';
import Home from './components/Home';
import GlobalHeader from './components/GlobalHeader';

// Chunk Splitting: Lazy Loading Heavy Components
const Results = React.lazy(() => import('./components/Results'));
const HCEView = React.lazy(() => import('./components/HCEView'));
const Help = React.lazy(() => import('./components/Help'));
const Evolution = React.lazy(() => import('./components/Evolution'));
const AdminRoot = React.lazy(() => import('./admin-studio/AdminRoot').then(m => ({ default: m.AdminRoot })));
const ManualMappingWizard = React.lazy(() => import('./components/ManualMappingWizard'));

import { schemaStore } from './admin-studio/store/SchemaStore';
import { ClinicalFormSchema } from './admin-studio/domain/types';
import { FORMS } from './core/mappings';
import { schemaRuntimeSync } from './admin-studio/store/schemaRuntimeSync';
import { 
  PersistentMappingProfiles, 
  SchemaCompiler, 
  MappingProfile 
} from './ingestion/UniversalImportEngine';
import pkg from '../package.json';


/**
 * Error Boundary para mitigar fallos en tiempo de renderizado
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // @ts-ignore
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-clinical)] text-center p-10">
          <h2 className="text-2xl font-black text-[var(--accent-clinical)] mb-4">Sistema Temporalmente Fuera de Servicio</h2>
          <p className="text-[var(--text-secondary)] mb-6">Se ha detectado una excepción en la interfaz. Por favor, reinicia la sesión.</p>
          {/* @ts-ignore */}
          {this.state.error && (
            <div className="bg-red-950/20 text-red-500 p-4 rounded-xl text-left font-mono text-sm mb-6 max-w-3xl overflow-auto border border-red-500/20">
              {/* @ts-ignore */}
              <p className="font-bold">{this.state.error.toString()}</p>
              {/* @ts-ignore */}
              <pre className="mt-2 text-xs opacity-70 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[var(--accent-clinical)] text-white font-bold rounded-xl shadow-lg">
            Reiniciar Aplicación
          </button>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

const VERSION = pkg.version;
const BUILD_DATE = __BUILD_DATE__;

const ADMIN_STUDIO_VERSION = "2.0.3-STABLE";
const ADMIN_STUDIO_DATE = "21/05/2026, 09:37";

type ViewState = 'home' | 'results' | 'hce' | 'help' | 'evolution';

function FallbackLoader() {
  return (
    <div className="flex-1 w-full h-full p-8 flex flex-col gap-8 animate-pulse opacity-60">
      <div className="h-14 bg-[var(--surface-clinical)] rounded-2xl border border-[var(--border-clinical)] w-1/3"></div>
      <div className="flex-1 bg-[var(--surface-clinical)] rounded-3xl border border-[var(--border-clinical)] w-full"></div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [data, setData] = useState<HCEData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedTomaIndex, setSelectedTomaIndex] = useState(0);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'ingest' | 'clear' | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [activeFormId, setActiveFormId] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<{ dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean } | undefined>();
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [clinicalSchema, setClinicalSchema] = useState<ClinicalFormSchema | null>(null);

  // Estados para el Mapping Universal
  const [showMappingWizard, setShowMappingWizard] = useState(false);
  const [wizardRawHeaders, setWizardRawHeaders] = useState<string[]>([]);
  const [wizardFileName, setWizardFileName] = useState<string>('');
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadConfig, setPendingUploadConfig] = useState<any>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('queryclin_theme') as 'light' | 'dark') || 'light';
  });

  const [debugMode, setDebugMode] = useState<boolean>(() => {
    return localStorage.getItem('queryclin_debug') === 'true';
  });

  const searchIdRef = useRef(0);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const initData = async () => {
      // Tarea A3: Persistencia de Sesión y Privacidad
      const isSessionActive = sessionStorage.getItem('queryclin_active_session');
      if (!isSessionActive) {
        console.warn("[Privacidad] Nueva sesión detectada. Limpiando IndexedDB para prevenir retención de datos médicos.");
        await db.clear();
        sessionStorage.setItem('queryclin_active_session', 'true');
        setData(null);
        setPatientCount(0);
        return;
      }

      const count = await db.getFromStore(db.stores.metadata, 'patient_count');
      const formId = await db.getFromStore(db.stores.metadata, 'form_id');
      if (count) {
        setData({ patients: {} });
        setPatientCount(count);
        if (formId) setActiveFormId(formId);
        await searchEngine.loadIndex({ patients: {} });
        await searchEngine.loadDictionary();
      }
    };
    initData();
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (view === 'hce' && activeFormId) {
      schemaStore.getPublishedSchemaByFormName(activeFormId.toUpperCase()).then(schema => {
        setClinicalSchema(schema || null);
      });
    }
  }, [activeFormId, view]);

  // Tarea A3: Advertencia en beforeunload si hay datos cargados
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (patientCount > 0) {
        const msg = "Si abandonas la página se perderán los datos clínicos cargados en memoria.";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [patientCount]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('queryclin_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('queryclin_debug', String(debugMode));
    searchEngine.setDebugProfilingMode(debugMode);
  }, [debugMode]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleDebug = () => setDebugMode(prev => !prev);


  const proceedWithIngestion = async (file: File, mapping: any, delimiter: string) => {
    setIsProcessing(true);
    setProcessingType('ingest');
    setDebugLogs([]);
    setProgressPercent(0);

    try {
      const buffer = await file.arrayBuffer();
      let text = '';

      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellFormula: true, dateNF: 'dd/mm/yyyy hh:mm:ss' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        if (worksheet['!ref']) {
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
              const cell = worksheet[cellAddress];
              if (cell && cell.t === 'e' && cell.f) {
                cell.t = 's';
                cell.v = cell.f;
                delete cell.w;
              }
            }
          }
        }
        
        text = XLSX.utils.sheet_to_csv(worksheet, { FS: delimiter || '|', dateNF: 'dd/mm/yyyy hh:mm:ss' });
        console.log('[App] Archivo Excel convertido a CSV para procesamiento. Errores rescatados.');
      } else {
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          text = decoder.decode(buffer);
          console.log('[App] Archivo decodificado como UTF-8');
        } catch (err) {
          console.warn('[App] Fallo en UTF-8, intentando con IBM850 (DOS)...');
          const testDecoder = new TextDecoder('windows-1252');
          text = testDecoder.decode(buffer);
          
          if (text.includes('¢') || text.includes(' ') || text.includes('¡') || text.includes('¤')) {
             console.log('[App] Detectada codificación CP850 (DOS), aplicando transcodificación...');
             text = decodeCP850(buffer);
          }
        }
      }

      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      const worker = new Worker(new URL('./ingestion/csv.worker.ts', import.meta.url) + '?v=' + Date.now(), { type: 'module' });
      workerRef.current = worker;

      worker.postMessage({ 
        csvText: text, 
        mapping, 
        strictMode: false,
        delimiter: file.name.toLowerCase().endsWith('.xlsx') ? '|' : delimiter,
        source_file: file.name,
        ingest_timestamp: new Date().toISOString()
      });
      
      worker.onmessage = async (event) => {
        const { type, progress, total, message, patientCount } = event.data;

        if (type === 'progress') {
          const percent = Math.round((progress / total) * 100);
          setProgressPercent(percent);
          console.log(`[Ingesta] Progreso: ${progress} / ${total} (${percent}%)`);
          return;
        }

        if (type === 'complete') {
          console.log("[App] Ingesta completada. Sincronizando interfaz...");
          
          setPatientCount(patientCount);
          setActiveFormId(mapping.id);
          setData({ patients: {} }); 
          setIsProcessing(false);
          setProcessingType(null);
          if (workerRef.current === worker) {
            workerRef.current = null;
          }
          worker.terminate();

          setTimeout(async () => {
            try {
              await searchEngine.loadIndex({ patients: {} }); 
              await searchEngine.loadDictionary();
            } catch (err: any) {
              console.error("[App] Error diferido al cargar el índice:", err);
              alert("Aviso: El buscador puede tardar unos segundos en activarse.");
            }
          }, 100);
        } else if (type === 'debug_error') {
          setDebugLogs(event.data.logs);
          setIsProcessing(false);
          setProcessingType(null);
          if (workerRef.current === worker) {
            workerRef.current = null;
          }
          worker.terminate();
        } else if (type === 'debug_warn') {
          setDebugLogs(prev => [...prev, ...event.data.logs]);
        } else if (type === 'error') {
          console.error("Error en el worker:", message);
          alert("Error crítico durante la ingesta: " + message);
          setIsProcessing(false);
          setProcessingType(null);
          if (workerRef.current === worker) {
            workerRef.current = null;
          }
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error("Fallo crítico del worker:", err);
        setIsProcessing(false);
        setProcessingType(null);
        if (workerRef.current === worker) {
          workerRef.current = null;
        }
        worker.terminate();
      };
    } catch (err: any) {
      console.error("Fallo crítico en proceedWithIngestion:", err);
      setIsProcessing(false);
      setProcessingType(null);
      alert("Error preparando el archivo para ingesta: " + err.message);
    }
  };

  const handleFileUpload = async (file: File, formId: string, config?: { fileType: string, delimiter: string }) => {
    if (formId === 'universal_import') {
      try {
        const buffer = await file.arrayBuffer();
        let rawHeaders: string[] = [];
        let delimiter = config?.delimiter || '|';

        const deduplicateHeaders = (headers: string[]) => {
          const result: string[] = [];
          const counts: Record<string, number> = {};
          for (const h of headers) {
            let finalH = h;
            const lowerKey = h.toLowerCase();
            let count = counts[lowerKey] || 0;
            if (count > 0) {
              finalH = `${h} (${count})`;
            }
            counts[lowerKey] = count + 1;
            result.push(finalH);
          }
          return result;
        };

        if (file.name.toLowerCase().endsWith('.xlsx') || config?.fileType === 'xlsx') {
          const workbook = XLSX.read(buffer, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          if (json.length > 0) {
            const extracted = json[0].map(String).map(h => h.trim()).filter(Boolean);
            rawHeaders = deduplicateHeaders(extracted);
          }
        } else {
          let text = '';
          try {
            const decoder = new TextDecoder('utf-8');
            text = decoder.decode(buffer.slice(0, 20000));
          } catch {
            const decoder = new TextDecoder('windows-1252');
            text = decoder.decode(buffer.slice(0, 20000));
          }
          const firstLine = text.split('\n')[0] || '';
          delimiter = config?.delimiter || (firstLine.includes('|') ? '|' : firstLine.includes(';') ? ';' : ',');
          const extracted = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
          rawHeaders = deduplicateHeaders(extracted);
        }

        if (rawHeaders.length === 0) {
          alert("Error: No se pudieron leer las cabeceras del archivo.");
          return;
        }

        const profilesList = await PersistentMappingProfiles.getAllProfiles();
        let matchingProfile: MappingProfile | null = null;

        for (const prof of profilesList) {
          const structuralExist = [
            prof.demographics.nhc,
            prof.demographics.idToma,
            prof.demographics.ordenToma,
            prof.demographics.fechaToma
          ].every(hdr => rawHeaders.includes(hdr));

          if (structuralExist) {
            const mappedKeys = Object.keys(prof.mappings);
            const commonKeys = mappedKeys.filter(k => rawHeaders.includes(k));
            const matchRate = commonKeys.length / (mappedKeys.length || 1);
            if (matchRate > 0.85) {
              matchingProfile = prof;
              break;
            }
          }
        }

        if (matchingProfile) {
          console.log(`[UniversalImport] Perfil detectado automáticamente: ${matchingProfile.name}`);
          const compiledSchema = SchemaCompiler.compile(matchingProfile, rawHeaders);
          const compiledMapping = SchemaCompiler.compileToMapping(compiledSchema);
          
          await schemaStore.saveSchema(compiledSchema);
          await schemaRuntimeSync.syncRuntimeMapping(compiledMapping.id, '1.0');
          
          await proceedWithIngestion(file, compiledMapping, delimiter);
        } else {
          setPendingUploadFile(file);
          setPendingUploadConfig({ delimiter });
          setWizardRawHeaders(rawHeaders);
          setWizardFileName(file.name);
          setShowMappingWizard(true);
        }
      } catch (err: any) {
        console.error("Error en pre-flight de importación universal:", err);
        alert("Error al analizar el archivo: " + err.message);
      }
      return;
    }

    let mapping = FORMS.find(f => f.id === formId);
    const runtimeMapping = await schemaRuntimeSync.getRuntimeMapping(formId);
    if (runtimeMapping) {
      mapping = runtimeMapping;
    }

    if (!mapping) {
      alert("Error crítico: Formulario no válido.");
      return;
    }

    await proceedWithIngestion(file, mapping, file.name.toLowerCase().endsWith('.xlsx') ? '|' : (config?.delimiter || '|'));
  };

  // El filtrado por categorías y campos ahora se resuelve de forma nativa e instantánea en QueryEngine.
  // applyFilters se mantiene por compatibilidad de firma, pero devuelve directamente los resultados limpios.
  const applyFilters = async (results: SearchResult[], filters: { categories?: string[], fields?: string[] }, q: string) => {
    return results;
  };

  const handleSearch = async (q: string, filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean }) => {
    const currentId = ++searchIdRef.current;
    setQuery(q);
    setActiveFilters(filters);
    
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;
    
    try {
      // Auditoría de Rango: Asegurar que dateStart no sea posterior a dateEnd
      let finalDateRange = filters?.dateRange;
      if (finalDateRange && finalDateRange[0] && finalDateRange[1]) {
        if (new Date(finalDateRange[0]) > new Date(finalDateRange[1])) {
          finalDateRange = [finalDateRange[1], finalDateRange[0]];
        }
      }

      let results = await searchEngine.search(q, { ...filters, dateRange: finalDateRange }, controller.signal);
      
      // Guardia de Concurrencia: Si esta ya no es la búsqueda actual, abortamos
      if (currentId !== searchIdRef.current) return;

      if ((filters?.categories && filters.categories.length > 0) || (filters?.fields && filters.fields.length > 0)) {
        results = await applyFilters(results, filters, q);
      }
      
      if (q.trim()) {
        try {
          const stored = JSON.parse(localStorage.getItem('queryclin_recent_searches') || '[]');
          const parsed = stored.map((s: any) => typeof s === 'string' ? { query: s, filters: undefined, timestamp: Date.now(), resultCount: undefined } : s);
          
          const currentSearch = { query: q, filters, timestamp: Date.now(), resultCount: results.length };
          const filtered = parsed.filter((s: any) => {
            const sameQuery = s.query === q;
            const sameFilters = JSON.stringify(s.filters) === JSON.stringify(filters);
            return !(sameQuery && sameFilters);
          });

          const newRecent = [currentSearch, ...filtered].slice(0, 6);
          localStorage.setItem('queryclin_recent_searches', JSON.stringify(newRecent));
        } catch (e) {
          console.error("Failed to update recent searches:", e);
        }
      }
      
      setSearchResults(results);
      setView('results');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("[App] Búsqueda cancelada por una consulta más reciente.");
        return;
      }
      console.error("[App] Fallo crítico en el motor de búsqueda:", err);
    }
  };

  const handleClearData = async () => {
    // Tarea B1: Confirmación de Borrado
    if (window.confirm("¿Está seguro de que desea eliminar todos los registros clínicos de la memoria? Esta acción no se puede deshacer y requerirá volver a importar el archivo CSV.")) {
      try {
        setIsProcessing(true);
        setProcessingType('clear');
        setProgressPercent(0);
        await db.clear();
        searchEngine.startIndexing(); // Reinicia el estado interno del buscador
        setData(null);
        setPatientCount(0);
        setActiveFormId('');
        setSearchResults([]);
        setView('home');
        setIsProcessing(false);
        setProcessingType(null);
        console.log("[UI] Estado reseteado tras limpieza de DB.");
      } catch (err) {
        console.error("Error al limpiar la base de datos:", err);
        alert("No se pudo limpiar la base de datos completamente.");
        setIsProcessing(false);
        setProcessingType(null);
      }
    }
  };

  const handleGoHome = useCallback(() => {
    setQuery('');
    setView('home');
    setActiveFilters(undefined);
    setSelectedIndex(-1);
    setSelectedTomaIndex(0);
    setSelectedVersionIndex(0);
    setIsAdminMode(false);
    setSearchResults([]);
    setClinicalSchema(null);
  }, []);

  const handleResultsBack = useCallback(() => {
    setQuery('');
    setView('home');
  }, []);

  const handleResultsSelect = useCallback((res: SearchResult) => {
    const idx = searchResults.findIndex(r => r.nhc === res.nhc);
    setSelectedIndex(idx);
    setView('hce');
  }, [searchResults]);

  const handleTomaNavigate = useCallback((tIdx: number, vIdx: number) => {
    setSelectedTomaIndex(tIdx);
    setSelectedVersionIndex(vIdx);
  }, []);

  const handleNavigateIndex = useCallback((idx: number) => {
    setSelectedIndex(idx);
    setSelectedTomaIndex(0);
    setSelectedVersionIndex(0);
  }, []);

  const handleHceBack = useCallback(() => {
    setView('results');
  }, []);

  // Efecto para cargar el paciente activo para la cabecera
  const [activePatient, setActivePatient] = useState<any>(null);
  useEffect(() => {
    if (view === 'hce' && searchResults[selectedIndex]) {
      db.getFromStore(db.stores.patients, searchResults[selectedIndex].nhc).then(p => {
        setActivePatient(p);
      });
    } else {
      setActivePatient(null);
    }
  }, [selectedIndex, view, searchResults]);

  // Cálculo de Fecha/Hora activa para el GlobalHeader
  const activeDateInfo = useMemo(() => {
    if (!activePatient || !activePatient.tomas) return { date: '--', time: '--' };
    const tomas = Object.values(activePatient.tomas).sort((a: any, b: any) => {
      const getT = (t: any) => {
        const d = parseClinicalDate(t.latest.data['EC_Fecha_Toma'] || t.latest.data['FECHA_TOMA'] || '');
        return d || 0;
      };
      return getT(b) - getT(a);
    });
    const toma = tomas[selectedTomaIndex] as any;
    if (!toma) return { date: '--', time: '--' };
    const sortedVersions = [...toma.registros].sort((a: any, b: any) => b.ordenToma - a.ordenToma);
    const version = sortedVersions[selectedVersionIndex];
    if (!version) return { date: '--', time: '--' };
    
    return {
      date: extractFecha(version.data),
      time: extractHora(version.data)
    };
  }, [activePatient, selectedTomaIndex, selectedVersionIndex]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-[var(--bg-clinical)] text-[var(--text-primary)] font-sans overflow-hidden">
        {isAdminMode && (
          <Suspense fallback={<FallbackLoader />}>
            <AdminRoot onExit={() => setIsAdminMode(false)} onGoHome={handleGoHome} version={ADMIN_STUDIO_VERSION} buildDate={ADMIN_STUDIO_DATE} />
          </Suspense>
        )}
        <GlobalHeader 
          query={query}
          activeFilters={activeFilters}
          onSearch={handleSearch}
          onGoHome={handleGoHome}
          getSuggestions={(q) => searchEngine.getSuggestions(q)}
          view={view}
          currentIndex={selectedIndex}
          totalResults={searchResults.length}
          onNavigate={(idx) => {
             setSelectedIndex(idx);
             setSelectedTomaIndex(0);
             setSelectedVersionIndex(0);
          }}
          onBack={() => {
            if (view === 'hce') setView('results');
            else if (view === 'results') setView('home');
            else setView('home');
            setIsAdminMode(false);
          }}
          activeDate={activeDateInfo.date}
          activeTime={activeDateInfo.time}
          theme={theme}
          toggleTheme={toggleTheme}
          patientCount={patientCount}
          version={VERSION}
          buildDate={BUILD_DATE}
          onClearData={handleClearData}
          onShowAll={() => { handleSearch(''); setIsAdminMode(false); }}
          onShowHelp={() => setView('help')}
          onShowEvolution={() => setView('evolution')}
          debugMode={debugMode}
          toggleDebug={toggleDebug}
          onToggleAdmin={() => setIsAdminMode(true)}
        />



        <main className={`flex-1 overflow-y-auto relative bg-[var(--bg-clinical)] transition-all duration-300`}>
          {isProcessing && (
            <div className="fixed inset-0 bg-[var(--bg-clinical)]/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="w-20 h-20 border-4 border-[var(--accent-clinical)] border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(var(--accent-clinical-rgb),0.2)]"></div>
              
              <div className="max-w-md w-full space-y-6 text-center">
                <h2 className="text-2xl font-black text-[var(--text-primary)]">
                  {processingType === 'clear' ? 'Limpiando memoria clínica...' : 'Procesando registros médicos...'}
                </h2>
                <p className="text-[var(--text-secondary)] font-medium">
                  {processingType === 'clear' 
                    ? 'Eliminando de forma segura todos los registros e índices de la sesión actual. Este proceso asegura la privacidad de los datos.'
                    : 'Queryclin está organizando e indexando la base de datos local para permitir la búsqueda instantánea de los pacientes importados.'}
                </p>
                
                {/* Barra de Progreso Evolutiva */}
                <div className="w-full bg-[var(--surface-clinical)] h-4 rounded-full border border-[var(--border-clinical)] overflow-hidden shadow-inner p-1">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--accent-clinical)] to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--accent-clinical-rgb),0.4)]"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
                  <span>Estado: {processingType === 'clear' ? 'Borrado Seguro' : 'Ingesta Activa'}</span>
                  <span>{progressPercent}% Completado</span>
                </div>
              </div>
            </div>
          )}

          {debugLogs.length > 0 && !isProcessing && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in">
              <div className="bg-red-950 border border-red-500 rounded-2xl w-full max-w-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center gap-4 mb-6 text-red-500">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest">Modo Debug</h2>
                    <p className="text-red-400/80 font-bold text-sm">Registro de inconsistencias o alertas.</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-black/50 rounded-xl p-4 border border-red-500/30 space-y-2">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="text-red-300 font-mono text-[13px] break-words">
                      <span className="opacity-50 mr-2">[{String(i+1).padStart(3, '0')}]</span>
                      {log}
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setDebugLogs([])}
                  className="mt-6 w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          <Suspense fallback={<FallbackLoader />}>
            {showMappingWizard ? (
              <div className="p-8">
                <ManualMappingWizard 
                  fileName={wizardFileName}
                  rawHeaders={wizardRawHeaders}
                  onCancel={() => {
                    setShowMappingWizard(false);
                    setPendingUploadFile(null);
                    setPendingUploadConfig(null);
                  }}
                  onImportComplete={async (compiledMapping) => {
                    setShowMappingWizard(false);
                    if (pendingUploadFile) {
                      await proceedWithIngestion(
                        pendingUploadFile, 
                        compiledMapping, 
                        pendingUploadConfig?.delimiter || '|'
                      );
                    }
                    setPendingUploadFile(null);
                    setPendingUploadConfig(null);
                  }}
                />
              </div>
            ) : (
              <>
                {view === 'home' && (
                  <div className="transition-all duration-500 ease-in-out">
                    <Home 
                      key={isAdminMode ? 'admin' : 'home'}
                      onUpload={handleFileUpload} 
                      onSearch={handleSearch} 
                      getSuggestions={(q) => searchEngine.getSuggestions(q)}
                      hasData={!!data || patientCount > 0} 
                      activeFormId={activeFormId}
                    />
                  </div>
                )}
                {view === 'results' && (
                  <div className="pt-8">
                    <Results 
                      results={searchResults} 
                      query={query}
                      onBack={handleResultsBack} 
                      onSelect={handleResultsSelect}
                    />
                  </div>
                )}
                {view === 'hce' && selectedIndex >= 0 && selectedIndex < searchResults.length && (
                  <HCEView
                    results={searchResults}
                    currentIndex={selectedIndex}
                    query={query}
                    formId={activeFormId}
                    activeFilters={activeFilters}
                    activeTomaIndex={selectedTomaIndex}
                    activeVersionIndex={selectedVersionIndex}
                    onTomaNavigate={handleTomaNavigate}
                    onNavigate={handleNavigateIndex}
                    onBack={handleHceBack}
                    debugMode={debugMode}
                    clinicalSchema={clinicalSchema || undefined}
                  />
                )}
                {view === 'help' && (
                  <Help onBack={() => setView('home')} />
                )}
                {view === 'evolution' && (
                  <Evolution onBack={() => setView('home')} />
                )}
              </>
            )}
          </Suspense>
        </main>
        <DiagnosticPanel debugMode={debugMode} />
      </div>
    </ErrorBoundary>
  );
}

function DiagnosticPanel({ debugMode }: { debugMode: boolean }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [storageStats, setStorageStats] = useState<{ usage: number; quota: number; percentage: number; isSupported: boolean } | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<{ healthy: boolean; corruptedStores: string[]; errors: string[] } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!debugMode) return;
    const updateMetrics = () => {
      setMetrics(searchEngine.getMetrics());
    };
    updateMetrics();
    
    // Fetch Storage Stats
    db.diagnoseStorage().then(stats => setStorageStats(stats));
    
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [debugMode]);

  const handleVerifyIntegrity = async () => {
    setIsChecking(true);
    const status = await db.verifyIntegrity();
    setIntegrityStatus(status);
    setIsChecking(false);
  };

  const handleEmergencyReset = async () => {
    if (window.confirm("CRITICAL WARNING: This will immediately delete the entire Queryclin database and all patient records. Are you sure?")) {
      try {
        await db.emergencyReset();
        window.location.reload();
      } catch (err) {
        alert("Emergency reset failed: " + err);
      }
    }
  };

  if (!debugMode || !metrics) return null;

  const hitRateQuery = (metrics.queryCacheHits + metrics.queryCacheMisses) > 0 
    ? (metrics.queryCacheHits / (metrics.queryCacheHits + metrics.queryCacheMisses)) * 100 
    : 0;
  const hitRateToken = (metrics.tokenCacheHits + metrics.tokenCacheMisses) > 0 
    ? (metrics.tokenCacheHits / (metrics.tokenCacheHits + metrics.tokenCacheMisses)) * 100 
    : 0;
  const memoryMB = metrics.estimatedMemoryFootprintBytes / 1024 / 1024;
  const storageUsageMB = storageStats ? (storageStats.usage / 1024 / 1024).toFixed(1) : '0.0';
  const storageQuotaGB = storageStats ? (storageStats.quota / 1024 / 1024 / 1024).toFixed(1) : '0.0';

  return (
    <div className="fixed bottom-4 right-4 z-[150] font-sans">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-white rounded-full border border-slate-700/50 backdrop-blur-md shadow-xl hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-wider"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          HEALTHCHECK
        </button>
      ) : (
        <div className="w-96 bg-slate-950/95 text-slate-300 border border-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-5 flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-black text-white uppercase tracking-wider">System Healthcheck</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors"
            >
              [Cerrar]
            </button>
          </div>

          <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-2">
            
            <h4 className="text-emerald-400 font-black uppercase tracking-widest border-b border-emerald-900/50 pb-1">Motor de Búsqueda</h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Última Búsqueda:</span>
              <span className="font-bold text-white font-mono">{metrics.lastSearchDurationMs.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Hits Cache Query:</span>
              <span className="font-bold text-white font-mono">{hitRateQuery.toFixed(1)}% <span className="text-slate-500 text-[10px]">({metrics.queryCacheHits}/{metrics.queryCacheHits + metrics.queryCacheMisses})</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Docs Indexados:</span>
              <span className="font-bold text-slate-300 font-mono">{metrics.documentCount}</span>
            </div>

            <h4 className="text-blue-400 font-black uppercase tracking-widest border-b border-blue-900/50 pb-1 mt-4">Almacenamiento (IndexedDB)</h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Uso Actual:</span>
              <span className="font-bold text-white font-mono">{storageUsageMB} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cuota Máxima:</span>
              <span className="font-bold text-white font-mono">{storageQuotaGB} GB</span>
            </div>
            {storageStats && storageStats.percentage > 80 && (
              <div className="bg-amber-900/30 text-amber-500 border border-amber-500/20 p-2 rounded text-[10px] font-bold">
                ⚠️ Advertencia de Cuota: Almacenamiento local al {storageStats.percentage.toFixed(1)}%. Podría ocurrir pérdida de datos persistentes.
              </div>
            )}

            <h4 className="text-purple-400 font-black uppercase tracking-widest border-b border-purple-900/50 pb-1 mt-4">Integridad del Sistema</h4>
            <div className="flex gap-2 mb-2">
              <button 
                onClick={handleVerifyIntegrity}
                disabled={isChecking}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-1.5 rounded text-[10px] font-bold uppercase transition-colors disabled:opacity-50"
              >
                {isChecking ? 'Verificando...' : 'Verificar DB'}
              </button>
              <button 
                onClick={handleEmergencyReset}
                className="flex-1 bg-red-900/50 border border-red-500/30 hover:bg-red-900 hover:border-red-500 text-red-300 py-1.5 rounded text-[10px] font-bold uppercase transition-colors"
              >
                Reset DB
              </button>
            </div>
            
            {integrityStatus && (
              <div className={`p-2 rounded text-[10px] font-mono whitespace-pre-wrap ${integrityStatus.healthy ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'}`}>
                {integrityStatus.healthy 
                  ? '✅ Todas las tablas de IndexedDB verificadas correctamente. Ninguna corrupción detectada.' 
                  : `❌ Corrupción detectada en: ${integrityStatus.corruptedStores.join(', ')}\n${integrityStatus.errors.join('\n')}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Decodificador manual para CP850 (MS-DOS Latin 1).
 * Esencial para exportaciones de sistemas hospitalarios antiguos que no usan estándares modernos.
 */
function decodeCP850(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const cp850Map: Record<number, string> = {
    160: 'á', 130: 'é', 161: 'í', 162: 'ó', 163: 'ú',
    164: 'ñ', 165: 'Ñ', 129: 'ü', 154: 'Ü',
    181: 'Á', 144: 'É', 214: 'Í', 224: 'Ó', 233: 'Ú',
    173: '¡', 168: '¿', 245: '§', 241: '±',
    166: 'ª', 167: 'º', 248: '°'
  };

  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte < 128) {
      result += String.fromCharCode(byte);
    } else {
      result += cp850Map[byte] || '?';
    }
  }
  return result;
}
