import React, { useState } from 'react';
import { AdminDashboard } from './ui/AdminDashboard';
import { FormDesigner } from './ui/FormDesigner';
import { Settings, HelpCircle, X } from 'lucide-react';

interface AdminRootProps {
  onExit: () => void;
  version: string;
  buildDate: string;
}

export function AdminRoot({ onExit, version, buildDate }: AdminRootProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (!isAuthorized) {
    return (
      <div className="absolute inset-0 z-[200] bg-[var(--bg-clinical)]">
        <div className="flex flex-col h-full">
          <div className="bg-[var(--surface-clinical)] border-b border-[var(--border-clinical)] px-6 py-4 flex justify-between items-center shadow-sm">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[var(--accent-clinical)] rounded-full animate-pulse"></div>
                <span className="text-[var(--text-primary)] font-black text-xs uppercase tracking-[0.2em]">Queryclin Security Layer</span>
             </div>
             <button 
              onClick={onExit} 
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs uppercase tracking-widest transition-colors"
             >
                &times; Cancelar
             </button>
          </div>
          <PasscodeGate onCorrect={() => setIsAuthorized(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] bg-[var(--bg-clinical)] overflow-hidden flex flex-col">
      {/* Cabecera Unificada de Admin Studio */}
      <header className="h-16 bg-[var(--surface-clinical)] border-b border-[var(--border-clinical)] flex justify-between items-center px-6 relative z-[110] shadow-sm backdrop-blur-md bg-opacity-95 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-clinical)] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Settings size={24} strokeWidth={3} />
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline">
                <span className="text-[22px] font-black tracking-tighter text-[var(--accent-clinical)]">Query</span>
                <span className="text-[22px] font-medium tracking-tighter text-[var(--text-primary)]">clin</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] opacity-60 mt-0.5">Admin Studio</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] rounded-full border border-[var(--accent-clinical)]/20">
            <span className="text-[10px] font-black tracking-widest">V{version}</span>
            <span className="w-[1px] h-3 bg-[var(--accent-clinical)]/30"></span>
            <span className="text-[9px] font-bold opacity-70">{buildDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHelp(true)}
            className={`p-2 rounded-full transition-all ${showHelp ? 'bg-[var(--accent-clinical)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/5'}`}
            title="Ayuda para el Administrador"
          >
            <HelpCircle size={20} />
          </button>

          <button 
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-clinical)] transition-all group active:scale-95"
          >
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span className="text-[11px] font-black uppercase tracking-widest">Salir de Admin</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto animate-in fade-in duration-500">
        {selectedSchemaId ? (
          <FormDesigner 
            schemaId={selectedSchemaId} 
            onBack={() => setSelectedSchemaId(null)} 
          />
        ) : (
          <AdminDashboard 
            onSelectSchema={id => setSelectedSchemaId(id)} 
          />
        )}
      </div>

      {/* Modal de Ayuda */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-clinical)]">
              <div className="flex items-center gap-3">
                <HelpCircle size={20} className="text-[var(--accent-clinical)]" />
                <span className="text-[14px] font-black uppercase tracking-widest text-[var(--text-primary)]">Guía del Administrador</span>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-auto space-y-6">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent-clinical)] mb-2">Diferencia entre Plantilla y Biblioteca</h3>
                <div className="space-y-4 text-[13px] text-[var(--text-primary)] leading-relaxed">
                  <p>
                    <strong>📄 Plantillas (Templates):</strong> Son formularios completos y pre-diseñados (ej: Alergias, Observaciones). Úsalos para clonar un modelo existente y modificarlo.
                  </p>
                  <p>
                    <strong>🧱 Biblioteca de Recursos:</strong> Son listas de campos canónicos (los que vienen en los Excel originales). Úsalos para construir un formulario desde cero, arrastrando los bloques a tu gusto.
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--border-clinical)] pt-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent-clinical)] mb-2">Ciclo de Vida de un Formulario</h3>
                <ul className="space-y-2 text-[12px] text-[var(--text-secondary)] list-disc pl-4">
                  <li><strong>Borrador:</strong> El formulario se está editando y no está disponible para su uso.</li>
                  <li><strong>Publicado:</strong> Se congela la versión. Puedes crear nuevas versiones para seguir editando.</li>
                  <li><strong>Activo:</strong> Es la versión que el sistema utilizará para procesar los archivos Excel e importar datos en la pantalla principal.</li>
                </ul>
              </div>

              <div className="bg-[var(--accent-clinical)]/5 border border-[var(--accent-clinical)]/20 rounded-xl p-4">
                <p className="text-[11px] text-[var(--accent-clinical)] font-bold">
                  ⚠️ Importante: Para que un formulario aparezca en el menú desplegable de la pantalla principal, DEBE estar "Publicado" y "Activo" en el Historial de Versiones.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PasscodeGate({ onCorrect }: { onCorrect: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === "admin123") {
      onCorrect();
    } else {
      setError(true);
      setCode("");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-clinical)]">
      <div className="max-w-sm w-full bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-clinical)]/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex justify-center mb-10 relative z-10">
           <div className="w-20 h-20 bg-[var(--accent-clinical)]/10 border border-[var(--accent-clinical)]/20 rounded-3xl flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-[var(--accent-clinical)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           </div>
        </div>
        
        <h2 className="text-3xl font-black mb-2 text-[var(--text-primary)] text-center tracking-tight uppercase">Acceso Privado</h2>
        <p className="text-[10px] text-[var(--text-secondary)] mb-10 font-black uppercase tracking-[0.3em] text-center opacity-40">Admin Governance Portal</p>
        
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-3">
            <input 
              type="password" 
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 text-3xl tracking-[0.8em] text-center focus:ring-2 focus:ring-[var(--accent-clinical)] focus:border-transparent outline-none transition-all text-[var(--accent-clinical)] placeholder:text-[var(--border-clinical)]"
              placeholder="••••"
            />
            {error && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-[0.2em] animate-bounce">Credenciales Inválidas</p>}
          </div>
          
          <button className="w-full bg-[var(--accent-clinical)] hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-blue-500/20 active:scale-95">
            Desbloquear Engine
          </button>
        </form>
      </div>
      <p className="mt-16 text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.4em] opacity-30">Queryclin Security Protocol v6.5.0</p>
    </div>
  );
}
