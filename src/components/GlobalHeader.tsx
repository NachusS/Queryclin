import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronRight, Home as HomeIcon, Sun, Moon, HelpCircle, Database, ArrowLeft, ChevronLeft, Bug, Eye, Settings } from 'lucide-react';


interface GlobalHeaderProps {
  query: string;
  activeFilters: any;
  onSearch: (q: string, filters?: any) => void;
  onGoHome: () => void;
  getSuggestions: (q: string) => string[];
  view: string;
  currentIndex?: number;
  totalResults?: number;
  onNavigate?: (index: number) => void;
  onBack?: () => void;
  activeDate?: string;
  activeTime?: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  patientCount: number;
  version: string;
  buildDate: string;
  onClearData: () => void;
  onShowAll: () => void;
  onShowHelp: () => void;
  onShowEvolution: () => void;
  debugMode: boolean;
  toggleDebug: () => void;
  onToggleAdmin?: () => void;
}


export default function GlobalHeader({ 
  query, activeFilters, onSearch, onGoHome, getSuggestions, 
  view, currentIndex, totalResults, onNavigate, onBack,
  activeDate, activeTime,
  theme, toggleTheme, patientCount, version, buildDate,
  onClearData, onShowAll, onShowHelp, onShowEvolution,
  debugMode, toggleDebug, onToggleAdmin
}: GlobalHeaderProps) {

  const [localQuery, setLocalQuery] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery, activeFilters);
    setShowSuggestions(false);
  };

  const hasFilters = (activeFilters?.categories?.length || 0) + 
                    (activeFilters?.fields?.length || 0) + 
                    (activeFilters?.dateRange ? 1 : 0) + 
                    (activeFilters?.service ? 1 : 0) +
                    (activeFilters?.onlyLatestSnapshot ? 1 : 0) > 0;

  return (
    <header className="h-16 bg-[var(--surface-clinical)] border-b border-[var(--border-clinical)] flex items-center px-6 gap-6 shadow-sm backdrop-blur-md bg-opacity-95 shrink-0 z-50">
      {/* IZQUIERDA: Marca, NachuS y Versión (Siempre visible) */}
      <div className="flex items-center gap-6 shrink-0">
        <div onClick={onGoHome} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 bg-[var(--accent-clinical)] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <Search size={24} strokeWidth={3} />
          </div>
          <div className="flex items-baseline leading-none">
            <span className="text-[22px] font-black tracking-tighter text-[var(--accent-clinical)]">Query</span>
            <span className="text-[22px] font-medium tracking-tighter text-[var(--text-primary)]">clin</span>
          </div>
        </div>

        <div className="hidden xl:flex items-center text-[19px] font-medium tracking-[-0.03em] select-none antialiased ml-2">
          <span className="text-[#4285F4]">N</span>
          <span className="text-[#EA4335]">a</span>
          <span className="text-[#FBBC05]">c</span>
          <span className="text-[#4285F4]">h</span>
          <span className="text-[#34A853]">u</span>
          <span className="text-[#EA4335]">S</span>
        </div>
        
        <div 
          onClick={onShowEvolution}
          className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] rounded-full border border-[var(--accent-clinical)]/20 cursor-pointer transition-all hover:bg-[var(--accent-clinical)]/20 shadow-sm active:scale-95"
          title={`Ver guía cronológica (Build: ${buildDate})`}
        >
          <span className="text-[10px] font-black tracking-widest">{version.startsWith('V') ? version : `V${version}`}</span>
          <span className="w-[1px] h-3 bg-[var(--accent-clinical)]/30"></span>
          <span className="text-[9px] font-bold opacity-70">{buildDate}</span>
        </div>
      </div>

      {/* CONTEXTUAL: Botón Volver e Info de Toma (Solo en HCE) */}
      {view === 'hce' && onBack && (
        <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-300 border-l border-[var(--border-clinical)] pl-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-clinical)] transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">Volver</span>
          </button>
          
          {activeDate && (
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50 mb-0.5">Versión activa</span>
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <span className="text-[12px] font-black">{activeDate}</span>
                <span className="text-[12px] font-medium opacity-40">{activeTime}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CENTRO: Buscador (Alineado con el contenido del informe) */}
      <div className="flex-1 flex justify-center px-4">
        <div className={`w-full ${view === 'hce' ? 'max-w-4xl' : 'max-w-2xl'} relative`}>
          {view !== 'home' && (
            <>
              <form onSubmit={handleSubmit} className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => {
                    setLocalQuery(e.target.value);
                    setSuggestions(getSuggestions(e.target.value));
                    setShowSuggestions(true);
                  }}
                  placeholder={view === 'hce' ? "Buscar en el expediente..." : "Buscar paciente, patología, síntoma..."}
                  className={`w-full bg-[var(--bg-clinical)] border ${hasFilters ? 'border-[var(--accent-clinical)] ring-2 ring-[var(--accent-clinical)]/10' : 'border-[var(--border-clinical)]'} rounded-xl py-2.5 pl-10 pr-12 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] transition-all shadow-sm`}
                />
                <Search size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${hasFilters ? 'text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] opacity-50'}`} />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {hasFilters && (
                    <div className="flex items-center justify-center w-6 h-6 bg-[var(--accent-clinical)] text-white rounded-lg shadow-md animate-pulse" title="Filtros activos">
                      <Filter size={12} />
                    </div>
                  )}
                  <button 
                    type="submit"
                    className="p-1 hover:text-[var(--accent-clinical)] transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </form>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-primary)] border border-[var(--border-clinical)] rounded-xl shadow-2xl overflow-hidden z-[100]">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLocalQuery(s);
                        onSearch(s, activeFilters);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-5 py-3 text-left text-sm hover:bg-[var(--bg-clinical)] flex items-center justify-between group"
                    >
                      <span className="font-bold text-[var(--text-primary)]">{s}</span>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-clinical)]" />
                    </button>
                  ))}
                </div>
              )}
              
              {!showSuggestions && hasFilters && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] rounded-lg py-1.5 px-3 text-center text-[11px] text-[var(--status-warning-text)] font-bold shadow-sm z-40 animate-in fade-in slide-in-from-top-2">
                  ⚠️ Búsqueda restringida. Se están ignorando las áreas clínicas no incluidas en el filtro activo.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* DERECHA: Paginador y Herramientas */}
      <div className="flex items-center gap-4 shrink-0 min-w-[280px] justify-end">
        {view === 'hce' && currentIndex !== undefined && totalResults !== undefined && onNavigate && (
          <div className="flex items-center gap-3 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] px-3 py-1.5 rounded-xl shadow-sm shrink-0 animate-in slide-in-from-right-4 duration-300">
            <span className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-secondary)] border-r border-[var(--border-clinical)] pr-3">
              Expediente {currentIndex + 1} de {totalResults}
            </span>
            <div className="flex gap-1">
              <button 
                disabled={currentIndex === 0} 
                onClick={() => onNavigate(currentIndex - 1)} 
                className="p-1 hover:bg-[var(--bg-clinical)] rounded-lg disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={currentIndex === totalResults - 1} 
                onClick={() => onNavigate(currentIndex + 1)} 
                className="p-1 hover:bg-[var(--bg-clinical)] rounded-lg disabled:opacity-20 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-[var(--border-clinical)] pl-4">
          <button onClick={toggleTheme} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/5 rounded-full transition-all">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={toggleDebug}
            title={debugMode ? "Desactivar Modo Debug" : "Activar Modo Debug"}
            className={`p-2 rounded-full transition-all ${debugMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10'}`}
          >
            {debugMode ? <Bug size={20} /> : <Eye size={20} />}
          </button>

          {onToggleAdmin && (
            <button 
              onClick={onToggleAdmin}
              title="Admin Studio (Form Designer)"
              className="p-2 rounded-full transition-all text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10"
            >
              <Settings size={20} />
            </button>
          )}

          <button 
            onClick={onShowHelp}
            className={`p-2 rounded-full transition-all ${view === 'help' ? 'bg-[var(--accent-clinical)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/5'}`}
          >
            <HelpCircle size={20} />
          </button>

          
          <div className="w-px h-6 bg-[var(--border-clinical)] mx-1" />
          
          <button 
            onClick={onShowAll}
            className="flex flex-col items-end leading-none hover:opacity-70 transition-opacity active:scale-95 px-2"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-50">Pacientes</span>
            <span className="text-[14px] font-black text-[var(--text-primary)]">{patientCount}</span>
          </button>
          
          <button 
            onClick={onClearData}
            className="w-9 h-9 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-all shadow-inner active:scale-95"
            title="Borrar base de datos local"
          >
            <Database size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
