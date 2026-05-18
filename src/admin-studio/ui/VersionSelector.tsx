import React, { useEffect, useState } from 'react';
import { FormSchema } from '../domain/schema';
import { schemaStore } from '../store/SchemaStore';
import { schemaRegistry } from '../store/SchemaRegistry';
import { Clock, RotateCcw, Check, Shield, Plus } from 'lucide-react';

interface VersionSelectorProps {
  currentSchema: FormSchema;
  onSelectVersion: (schema: FormSchema) => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({ currentSchema, onSelectVersion }) => {
  const [versions, setVersions] = useState<FormSchema[]>([]);
  const [activeVersion, setActiveVersion] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
    loadActiveVersion();
  }, [currentSchema.id]);

  const loadVersions = async () => {
    const all = await schemaStore.getAllVersionsOfSchema(currentSchema.id);
    // Ordenar por fecha descendente
    setVersions(all.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const loadActiveVersion = async () => {
    const active = await schemaRegistry.getActiveSchema(currentSchema.id);
    if (active) {
      setActiveVersion(active.version);
    }
  };

  const handleActivate = async (version: string) => {
    try {
      await schemaRegistry.setActiveSchema(currentSchema.id, version);
      setActiveVersion(version);
      alert("¡Versión activada con éxito!");
    } catch (err: any) {
      alert(`Error de Gobernanza:\n${err.message}`);
    }
  };

  const handleCreateNewVersion = async () => {
    if (!currentSchema) return;
    try {
      // Calcular nueva versión (por ejemplo, incrementando 0.1)
      const currentVersion = parseFloat(currentSchema.version);
      const newVersion = (isNaN(currentVersion) ? 1.0 : currentVersion + 0.1).toFixed(1);
      
      const newSchema: FormSchema = {
        ...currentSchema,
        version: newVersion,
        status: 'draft',
        updatedAt: Date.now()
      };
      
      await schemaStore.saveSchema(newSchema);
      onSelectVersion(newSchema);
      await loadVersions();
      alert(`Nueva versión ${newVersion} creada como borrador.`);
    } catch (err: any) {
      console.error('[VersionSelector] Error creating new version:', err);
      alert(`Error al crear nueva versión:\n${err.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[var(--surface-clinical)] border-l border-[var(--border-clinical)] h-full overflow-y-auto hide-scrollbar">
      <div className="flex items-center justify-between border-b border-[var(--border-clinical)] pb-4">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-[var(--accent-clinical)]" />
          <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Historial de Versiones</h2>
        </div>
        <button 
          onClick={handleCreateNewVersion}
          className="p-1.5 bg-[var(--accent-clinical)] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1"
          title="Crear una nueva versión como borrador"
        >
          <Plus size={10} strokeWidth={3} />
          <span>Nueva</span>
        </button>
      </div>

      <div className="space-y-3">
        {versions.map((v, idx) => (
          <div 
            key={`${v.version}-${idx}`} 
            className={`p-4 rounded-xl border transition-all cursor-pointer ${v.version === currentSchema.version ? 'border-[var(--accent-clinical)] bg-[var(--accent-clinical)]/5' : 'border-[var(--border-clinical)]/50 hover:border-[var(--border-clinical)]'}`}
            onClick={() => onSelectVersion(v)}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-[var(--text-primary)]">Versión {v.version}</span>
              <div className="flex items-center gap-2">
                {v.version === activeVersion && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded border bg-blue-50 text-blue-600 border-blue-200 uppercase flex items-center gap-0.5">
                    <Shield size={8} /> Activa
                  </span>
                )}
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${v.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'} uppercase`}>
                  {v.status}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-[var(--text-secondary)] mt-1">
              {new Date(v.updatedAt).toLocaleString()}
            </p>
            
            <div className="flex justify-between items-center mt-2 border-t border-[var(--border-clinical)]/10 pt-2">
              {v.version !== currentSchema.version && (
                <button 
                  className="text-[9px] font-black text-[var(--text-secondary)] uppercase flex items-center gap-1 hover:text-[var(--text-primary)]"
                  onClick={(e) => { e.stopPropagation(); onSelectVersion(v); }}
                >
                  <RotateCcw size={10} /> Restaurar
                </button>
              )}
              
              {v.version !== activeVersion ? (
                <button 
                  className="text-[9px] font-black text-[var(--accent-clinical)] uppercase flex items-center gap-1 hover:text-blue-700 ml-auto"
                  onClick={(e) => { e.stopPropagation(); handleActivate(v.version); }}
                >
                  <Shield size={10} /> Activar
                </button>
              ) : (
                <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1 ml-auto">
                  <Check size={10} /> En Uso
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
