 import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, Database, Users, HelpCircle, ShieldCheck, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { HCEData } from './core/types';
import { searchEngine, SearchResult } from './engine';
import { db } from './storage/indexedDB';
import { parseClinicalDate, extractFecha, extractHora } from './utils/dateParser';
import Home from './components/Home';
import Results from './components/Results';
import HCEView from './components/HCEView';
import Help from './components/Help';
import Evolution from './components/Evolution';
import GlobalHeader from './components/GlobalHeader';
import { AdminRoot } from './admin/AdminRoot';
import { schemaStore } from './admin/persistence/SchemaStore';
import { DynamicHCEView } from './admin/renderer/DynamicHCEView';
import { ClinicalFormSchema } from './admin/domain/types';
import { FORMS } from './core/mappings';
import pkg from '../package.json';


/**
 * Error Boundary para mitigar fallos en tiempo de renderizado
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state: { hasError: boolean } = { hasError: false };
  props!: { children: React.ReactNode };

  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-clinical)] text-center p-10">
          <h2 className="text-2xl font-black text-[var(--accent-clinical)] mb-4">Sistema Temporalmente Fuera de Servicio</h2>
          <p className="text-[var(--text-secondary)] mb-6">Se ha detectado una excepción en la interfaz. Por favor, reinicia la sesión.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[var(--accent-clinical)] text-white font-bold rounded-xl shadow-lg">
            Reiniciar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const VERSION = pkg.version;
const BUILD_DATE = __BUILD_DATE__;

type ViewState = 'home' | 'results' | 'hce' | 'help' | 'evolution';

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

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('queryclin_theme') as 'light' | 'dark') || 'light';
  });

  const [debugMode, setDebugMode] = useState<boolean>(() => {
    return localStorage.getItem('queryclin_debug') === 'true';
  });

  const searchIdRef = useRef(0);


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
  }, [debugMode]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleDebug = () => setDebugMode(prev => !prev);


  const handleFileUpload = async (file: File, formId: string, config?: { fileType: string, delimiter: string }) => {
    const mapping = FORMS.find(f => f.id === formId);
    if (!mapping) {
        alert("Error crítico: Formulario no válido.");
        return;
    }

    setIsProcessing(true);
    setProcessingType('ingest');
    setDebugLogs([]);
    setProgressPercent(0);

    try {
      const buffer = await file.arrayBuffer();
      let text = '';

      if (file.name.toLowerCase().endsWith('.xlsx') || config?.fileType === 'xlsx') {
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellFormula: true, dateNF: 'dd/mm/yyyy hh:mm:ss' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Rescatar campos que Excel malinterpretó como fórmulas (ej: "- Paciente con tos" -> #NAME?)
        if (worksheet['!ref']) {
          const range = XLSX.utils.decode_range(worksheet['!ref']);
          for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({r: R, c: C});
              const cell = worksheet[cellAddress];
              if (cell && cell.t === 'e' && cell.f) {
                cell.t = 's'; // Cambiar tipo a string
                cell.v = cell.f; // Restaurar el texto original (ej: "- Paciente")
                delete cell.w; // Forzar que sheet_to_csv recalcule el formato
              }
            }
          }
        }
        
        text = XLSX.utils.sheet_to_csv(worksheet, { FS: config?.delimiter || '|', dateNF: 'dd/mm/yyyy hh:mm:ss' });
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

      const worker = new Worker(new URL('./ingestion/csv.worker.ts', import.meta.url) + '?v=' + Date.now(), { type: 'module' });
      worker.postMessage({ 
        csvText: text, 
        mapping, 
        strictMode: false,
        delimiter: file.name.toLowerCase().endsWith('.xlsx') ? '|' : config?.delimiter,
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
          
          // Primero actualizamos estados ligeros para cerrar el cargador
          setPatientCount(patientCount);
          setActiveFormId(formId);
          setData({ patients: {} }); 
          setIsProcessing(false);
          setProcessingType(null);
          worker.terminate();

          // Cargamos el índice pesado en el siguiente tick
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
          worker.terminate();
        } else if (type === 'debug_warn') {
          // No aborta, solo acumula los logs
          setDebugLogs(prev => [...prev, ...event.data.logs]);
        } else if (type === 'error') {
          console.error("Error en el worker:", message);
          alert("Error crítico durante la ingesta: " + message);
          setIsProcessing(false);
          setProcessingType(null);
          worker.terminate();
        }
      };


      worker.onerror = (err) => {
        console.error("Fallo crítico del worker:", err);
        setIsProcessing(false);
        setProcessingType(null);
        worker.terminate();
      };
    } catch (err: any) {
      console.error("Fallo crítico en handleFileUpload:", err);
      setIsProcessing(false);
      setProcessingType(null);
      alert("Error preparando el archivo para ingesta: " + err.message);
    }
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
    
    try {
      // Auditoría de Rango: Asegurar que dateStart no sea posterior a dateEnd
      let finalDateRange = filters?.dateRange;
      if (finalDateRange && finalDateRange[0] && finalDateRange[1]) {
        if (new Date(finalDateRange[0]) > new Date(finalDateRange[1])) {
          finalDateRange = [finalDateRange[1], finalDateRange[0]];
        }
      }

      let results = await searchEngine.search(q, { ...filters, dateRange: finalDateRange });
      
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
    } catch (err) {
      console.error("[App] Fallo crítico en el motor de búsqueda:", err);
      // Opcional: Notificar al usuario o mantener estado previo
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
        {isAdminMode && <AdminRoot onExit={() => setIsAdminMode(false)} />}
        <GlobalHeader 
          query={query}
          activeFilters={activeFilters}
          onSearch={handleSearch}
          onGoHome={() => { setQuery(''); setView('home'); setIsAdminMode(false); }}
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

          {view === 'home' && (
            <div className="transition-all duration-500 ease-in-out">
              <Home 
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
                onBack={() => { setQuery(''); setView('home'); }} 
                onSelect={(res) => {
                  const idx = searchResults.findIndex(r => r.nhc === res.nhc);
                  setSelectedIndex(idx);
                  setView('hce');
                }}
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
              onTomaNavigate={(tIdx, vIdx) => {
                setSelectedTomaIndex(tIdx);
                setSelectedVersionIndex(vIdx);
              }}
              onNavigate={(idx) => {
                setSelectedIndex(idx);
                setSelectedTomaIndex(0);
                setSelectedVersionIndex(0);
              }}
              onBack={() => setView('results')}
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
        </main>
      </div>
    </ErrorBoundary>
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
