import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, ShieldCheck, Database, Zap, Filter, Calendar, Stethoscope } from 'lucide-react';
import { searchEngine } from '../engine';
import { FORMS } from '../core/mappings';
import { schemaRuntimeSync } from '../admin-studio/store/schemaRuntimeSync';
import { normalizeString } from '../utils/stringNormalizer';

interface HomeProps {
  key?: string | number;
  hasData: boolean;
  onUpload: (file: File, formId: string, config?: any) => void;
  onSearch: (query: string, filters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean }) => void;
  getSuggestions: (query: string) => string[];
  compact?: boolean;
  activeFormId?: string;
}

type RecentSearch = {
  query: string;
  filters?: { 
    dateRange?: [string, string], 
    service?: string, 
    categories?: string[],
    fields?: string[],
    onlyLatestSnapshot?: boolean
  };
  timestamp: number;
  resultCount?: number;
};

function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

function formatResultCount(count?: number) {
  if (count === undefined) return '—';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
  return count.toString();
}

function getBadgeClass(count?: number) {
  if (count === undefined) return 'bg-[var(--bg-clinical)] text-[var(--text-secondary)] opacity-50';
  if (count === 0) return 'bg-gray-200 text-gray-600';
  return 'bg-[var(--accent-clinical)] text-white shadow-sm';
}

export default function Home({ hasData, onUpload, onSearch, getSuggestions, compact = false, activeFormId }: HomeProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [service, setService] = useState('');
  const [onlyLatestSnapshot, setOnlyLatestSnapshot] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('queryclin_recent_searches') || '[]');
      return stored.map((s: any) => typeof s === 'string' ? { query: s, timestamp: Date.now() } : s).slice(0, 6);
    } catch {
      return [];
    }
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [ingestionConfig, setIngestionConfig] = useState({
    fileType: 'auto'
  });
  
  const [availableForms, setAvailableForms] = useState<any[]>(FORMS);

  useEffect(() => {
    loadDynamicForms();
  }, []);

  const loadDynamicForms = async () => {
    console.log('[Home] Cargando formularios dinámicos...');
    const dynamicForms = await schemaRuntimeSync.getAllRuntimeMappings();
    console.log('[Home] Formularios dinámicos encontrados:', dynamicForms);
    if (dynamicForms.length > 0) {
      const dynamicIds = new Set(dynamicForms.map(f => f.id));
      const filteredStatic = FORMS.filter(f => !dynamicIds.has(f.id));
      const merged = [...filteredStatic, ...dynamicForms];
      console.log('[Home] Lista final de formularios:', merged);
      setAvailableForms(merged);
    } else {
      console.log('[Home] No se encontraron formularios dinámicos, usando estáticos.');
    }
  };


  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, {
      dateRange: dateStart || dateEnd ? [dateStart, dateEnd] : undefined,
      service: service || undefined,
      categories: (Array.isArray(categories) && categories.length > 0) ? categories : undefined,
      fields: (Array.isArray(selectedFields) && selectedFields.length > 0) ? selectedFields : undefined,
      onlyLatestSnapshot: onlyLatestSnapshot || undefined
    });
  };


  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
        <div className="bg-[var(--surface-clinical)] p-12 rounded-2xl shadow-xl border border-[var(--border-clinical)] max-w-md w-full">
          <div className="w-16 h-16 bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Inicializar Memoria Local</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
            Seleccione el formulario clínico correspondiente antes de importar la matriz de datos (.txt, .xlsx).
          </p>

          <div className="space-y-8 mt-8">
            {/* Paso 1 */}
            <div className="relative pl-10 text-left border-l-2 border-dashed border-[var(--border-clinical)] pb-4">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[var(--accent-clinical)] text-white text-[10px] font-black flex items-center justify-center shadow-lg">1</div>
              <label className="block text-[11px] font-black text-[var(--accent-clinical)] uppercase tracking-[2px] mb-3">
                Seleccionar Modelo Clínico
              </label>
              <div className="relative group">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)]" size={16} />
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-[var(--bg-clinical)] border-2 border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none transition-all text-sm font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="" disabled>-- Elegir especialidad --</option>
                  <option value="universal_import">★ Auto-Detectar Estructura (Mapeador Universal)</option>
                  {availableForms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative pl-10 text-left border-l-2 border-dashed border-[var(--border-clinical)] pb-4">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[var(--accent-clinical)] text-white text-[10px] font-black flex items-center justify-center shadow-lg">2</div>
              <label className="block text-[11px] font-black text-[var(--accent-clinical)] uppercase tracking-[2px] mb-3">
                Configurar Archivo de Datos
              </label>
              <div className="relative group">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)]" size={16} />
                <select
                  value={ingestionConfig.fileType}
                  onChange={(e) => setIngestionConfig(prev => ({ ...prev, fileType: e.target.value }))}
                  className="w-full pl-10 pr-4 py-4 bg-[var(--bg-clinical)] border-2 border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none transition-all text-sm font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="auto">Detección Automática (Recomendado)</option>
                  <option value="txt">Archivo Plano / Texto (.txt, .csv)</option>
                  <option value="xlsx">Libro Excel (.xlsx)</option>
                </select>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative pl-10 text-left">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[var(--accent-clinical)] text-white text-[10px] font-black flex items-center justify-center shadow-lg">3</div>
              <label className="block text-[11px] font-black text-[var(--accent-clinical)] uppercase tracking-[2px] mb-3">
                Finalizar Importación
              </label>
              <input
                type="file"
                accept=".csv, .txt, .xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && selectedFormId) {
                    onUpload(file, selectedFormId, { ...ingestionConfig });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedFormId}
                className="w-full bg-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/90 disabled:opacity-30 disabled:grayscale text-white font-black py-4 px-6 rounded-xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Upload size={20} />
                {selectedFormId ? 'CARGAR ARCHIVO AHORA' : 'SELECCIONE MODELO'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[var(--border-clinical)]">
            <div className="space-y-2">
              <ShieldCheck className="mx-auto text-[var(--text-secondary)]" size={20} />
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Aislamiento<br />Local-First</p>
            </div>
            <div className="space-y-2">
              <Database className="mx-auto text-[var(--text-secondary)]" size={20} />
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Motor en<br />RAM</p>
            </div>
            <div className="space-y-2">
              <Zap className="mx-auto text-[var(--text-secondary)]" size={20} />
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Booleano<br />Avanzado</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto w-full relative z-20 ${compact ? 'mt-6 mb-8' : 'mt-20'}`}>
      {!compact && (
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-4xl font-black tracking-tight mb-4 text-[var(--text-primary)]">
            Explorador de Historias Clínicas
          </h1>
          <p className="text-[var(--text-secondary)] font-medium">
            Análisis masivo de datos clínicos con sintaxis Booleana estricta (AND, OR, NOT).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`relative mx-auto ${compact ? 'max-w-full' : 'max-w-[650px]'}`}>
        <div className="relative flex items-center group">
          <Search className="absolute left-5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)] transition-colors" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.length >= 3) {
                const suggs = getSuggestions(val);
                setSuggestions(suggs);
                setShowSuggestions(suggs.length > 0);
                setActiveSuggestionIndex(-1);
              } else {
                setSuggestions([]);
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
              }
            }}
            onKeyDown={(e) => {
              if (!showSuggestions) return;

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev));
              } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
                e.preventDefault();
                const selected = suggestions[activeSuggestionIndex];
                setQuery(selected);
                onSearch(selected);
                setShowSuggestions(false);
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (query.length >= 3 && suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay para permitir clics
            placeholder="Identificadores, diagnóstico o hallazgos clínicos..."
            className="w-full pl-12 pr-32 py-4 text-[15px] bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] transition-all placeholder:text-[var(--text-secondary)]/50"
          />

          {/* Clinical Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-16 mt-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-[var(--border-clinical)] bg-[var(--bg-clinical)]/50">
                <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest pl-2">Sugerencias Clínicas</span>
              </div>
              <ul className="max-h-[300px] overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        onSearch(s);
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group ${idx === activeSuggestionIndex
                          ? 'bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)]'
                          : 'hover:bg-[var(--accent-clinical)]/5 hover:text-[var(--accent-clinical)]'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">
                          {s.toLowerCase().startsWith(query.toLowerCase()) ? (
                            <>
                              <span className="text-[var(--accent-clinical)]">{s.substring(0, query.length)}</span>
                              {s.substring(query.length)}
                            </>
                          ) : s}
                        </span>
                      </span>
                      <Zap size={12} className={`transition-opacity ${idx === activeSuggestionIndex ? 'opacity-40' : 'opacity-0'}`} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="absolute right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all border ${showFilters || dateStart || dateEnd || (Array.isArray(categories) && categories.length > 0) ? 'bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] border-[var(--accent-clinical)]/30' : 'bg-[var(--bg-clinical)] text-[var(--text-secondary)] border-[var(--border-clinical)] hover:bg-[var(--border-clinical)]/50'}`}
              title="Filtros avanzados"
            >
              <Filter size={16} />
              <span>Filtros {(dateStart || dateEnd || (Array.isArray(categories) && categories.length > 0) || onlyLatestSnapshot) && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-[var(--accent-clinical)] text-white text-[10px]">{(Array.isArray(categories) ? categories.length : 0) + (dateStart || dateEnd ? 1 : 0) + (onlyLatestSnapshot ? 1 : 0)}</span>}</span>
            </button>
            <button
              type="submit"
              className="bg-[var(--accent-clinical)] hover:opacity-90 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
            >
              Consultar
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">Filtros Activos</h4>
              {(dateStart || dateEnd || (Array.isArray(categories) && categories.length > 0) || (Array.isArray(selectedFields) && selectedFields.length > 0)) && (
                <button
                  type="button"
                  onClick={() => { 
                    setDateStart(''); 
                    setDateEnd(''); 
                    setCategories([]); 
                    setSelectedFields([]); 
                    setExpandedCategory(null); 
                    setOnlyLatestSnapshot(false);
                  }}
                  className="text-[11px] font-bold text-[var(--accent-clinical)] hover:underline"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Fecha */}
              <div>
                <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  <Calendar size={14} /> Rango de Fechas
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)]"
                    />
                  </div>
                  <span className="text-[var(--text-secondary)] font-bold text-xs">HASTA</span>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Categorías */}
              <div className="pt-4 border-t border-[var(--border-clinical)]">
                <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  <Stethoscope size={14} /> Categorías Clínicas
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Antecedentes",
                    "Anamnesis y Exploración", "Diagnostico y Tto", "Resultados Pruebas",
                    "Proceso Hosp/CEX", "Otros"
                  ].map(cat => {
                    const safeCats = (categories && Array.isArray(categories)) ? categories : [];
                    const isActive = safeCats.indexOf(cat) !== -1;
                    const isExpanded = expandedCategory === cat;
                    return (
                      <div key={cat} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const currentCats = Array.isArray(categories) ? categories : [];
                            if (isActive) {
                              setCategories(currentCats.filter(c => c !== cat));
                              if (isExpanded) setExpandedCategory(null);
                            } else {
                              setCategories([...currentCats, cat]);
                              setExpandedCategory(cat);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border flex items-center gap-2 ${isActive
                              ? 'bg-[var(--accent-clinical)] text-white border-[var(--accent-clinical)] shadow-sm'
                              : 'bg-[var(--bg-clinical)] text-[var(--text-secondary)] border-[var(--border-clinical)] hover:border-[var(--text-secondary)]'
                            }`}
                        >
                          {cat}
                        </button>
                        {isActive && (
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(prev => prev === cat ? null : cat)}
                            className={`p-1.5 rounded-lg border transition-all ${isExpanded ? 'bg-[var(--accent-clinical)] text-white border-[var(--accent-clinical)]' : 'bg-[var(--surface-clinical)] text-[var(--accent-clinical)] border-[var(--accent-clinical)]/20'}`}
                            title="Configurar campos"
                          >
                            <div className={`w-3 h-3 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              <Zap size={12} />
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sub-categorías (Campos) */}
                {expandedCategory && activeFormId && (
                  <div className="mt-4 p-4 bg-[var(--bg-clinical)]/50 rounded-xl border border-[var(--border-clinical)] animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-clinical)]">Campos de {expandedCategory}</span>
                      <button 
                        type="button"
                        onClick={() => setExpandedCategory(null)}
                        className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(() => {
                        try {
                          const mapping = (activeFormId && Array.isArray(FORMS)) ? FORMS.find(f => f.id === activeFormId) : null;
                          if (!mapping || !mapping.visualCategories) return null;

                          const cleanCat = normalizeString(expandedCategory || "");
                          const targetVisualCats = Object.keys(mapping.visualCategories).filter(k => {
                            const kn = normalizeString(k);
                            return kn === cleanCat || kn.includes(cleanCat) || cleanCat.includes(kn);
                          });
                          const fields: string[] = [];
                          targetVisualCats.forEach(k => {
                            const catFields = mapping.visualCategories[k];
                            if (Array.isArray(catFields)) {
                              catFields.forEach(cf => {
                                if (cf && fields.indexOf(cf) === -1) fields.push(cf);
                              });
                            }
                          });
                          
                          if (fields.length === 0) return (
                            <div className="col-span-full text-center py-4 text-[10px] text-[var(--text-secondary)] italic">
                              No se encontraron campos específicos.
                            </div>
                          );

                          return fields.map((field, fidx) => {
                            const safeSelectedFields = Array.isArray(selectedFields) ? selectedFields : [];
                            const isFieldSelected = safeSelectedFields.indexOf(field) !== -1;
                            return (
                              <label key={`f-${fidx}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--accent-clinical)]/5 cursor-pointer transition-colors group">
                                <input 
                                  type="checkbox"
                                  checked={isFieldSelected}
                                  onChange={() => {
                                    const currentFields = Array.isArray(selectedFields) ? selectedFields : [];
                                    if (isFieldSelected) setSelectedFields(currentFields.filter(f => f !== field));
                                    else setSelectedFields([...currentFields, field]);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-[var(--border-clinical)] text-[var(--accent-clinical)] focus:ring-[var(--accent-clinical)]"
                                />
                                <span className={`text-[11px] font-medium truncate ${isFieldSelected ? 'text-[var(--accent-clinical)] font-bold' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                  {field}
                                </span>
                              </label>
                            );
                          });
                        } catch (err) {
                          console.error("Error rendering sub-categories:", err);
                          return null;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Modo Última Toma */}
              <div className="pt-4 border-t border-[var(--border-clinical)]">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-clinical)] bg-[var(--bg-clinical)] cursor-pointer hover:bg-[var(--accent-clinical)]/5 transition-colors group">
                  <input
                    type="checkbox"
                    checked={onlyLatestSnapshot}
                    onChange={(e) => setOnlyLatestSnapshot(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-clinical)] text-[var(--accent-clinical)] focus:ring-[var(--accent-clinical)]"
                  />
                  <div>
                    <div className={`text-[12px] font-black uppercase tracking-widest ${onlyLatestSnapshot ? 'text-[var(--accent-clinical)]' : 'text-[var(--text-primary)]'}`}>
                      Filtrar solo última toma
                    </div>
                    <div className="text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">
                      Evalúa únicamente la última toma clínica del paciente dentro del rango temporal seleccionado
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
      </form>

      {hasData && !compact && (
        <div className="mt-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          {/* Histórico Column */}
          <div className="w-full">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-[var(--accent-clinical)] mb-6 flex items-center gap-3">
              <div className="w-6 h-[1px] bg-[var(--accent-clinical)] opacity-30"></div>
              Consultas Recientes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentSearches.length > 0 ? recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => { 
                    setQuery(s.query); 
                    if (s.filters) {
                      setDateStart(s.filters.dateRange?.[0] || '');
                      setDateEnd(s.filters.dateRange?.[1] || '');
                      setService(s.filters.service || '');
                      setCategories(s.filters.categories || []);
                      setSelectedFields(s.filters.fields || []);
                      setOnlyLatestSnapshot(s.filters.onlyLatestSnapshot || false);
                      if (s.filters.dateRange || s.filters.service || s.filters.categories || s.filters.fields || s.filters.onlyLatestSnapshot) {
                        setShowFilters(true);
                      }
                    } else {
                      setDateStart('');
                      setDateEnd('');
                      setService('');
                      setCategories([]);
                      setSelectedFields([]);
                      setOnlyLatestSnapshot(false);
                    }
                    onSearch(s.query, s.filters); 
                  }}
                  className="group flex flex-col p-3 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-lg hover:border-[var(--accent-clinical)] hover:shadow-md transition-all text-left overflow-hidden relative min-h-[72px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-clinical)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-[13px] font-bold text-[var(--text-primary)] truncate w-full mb-2 relative z-10">"{s.query}"</span>
                  <div className="flex items-center justify-between w-full mt-auto relative z-10">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-70 flex items-center gap-1">
                      {formatTimeAgo(s.timestamp)}
                    </span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getBadgeClass(s.resultCount)}`}>
                      {formatResultCount(s.resultCount)} {s.resultCount !== undefined ? 'res' : ''}
                    </span>
                  </div>
                </button>
              )) : (
                <div className="col-span-full p-12 border border-dashed border-[var(--border-clinical)] rounded-2xl text-center bg-[var(--surface-clinical)]/30">
                  <p className="text-[12px] text-[var(--text-secondary)] font-medium italic opacity-40">No hay registros en esta sesión.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
