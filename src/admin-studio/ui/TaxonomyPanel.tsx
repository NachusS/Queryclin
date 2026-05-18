import React, { useState } from 'react';
import { FormSchema } from '../domain/schema';
import { Settings2, Plus, Trash2 } from 'lucide-react';

interface TaxonomyPanelProps {
  schema: FormSchema;
  onUpdate: (updatedSchema: FormSchema) => void;
}

export const TaxonomyPanel: React.FC<TaxonomyPanelProps> = ({ schema, onUpdate }) => {
  const [newAliasKey, setNewAliasKey] = useState("");
  const [newAliasValue, setNewAliasValue] = useState("");

  const updateDemographics = (key: string, value: string) => {
    const updatedSchema = {
      ...schema,
      demographics: {
        ...schema.demographics,
        [key]: value
      }
    };
    onUpdate(updatedSchema);
  };

  const addHeaderAlias = () => {
    if (!newAliasKey || !newAliasValue) return;
    
    const currentAliases = schema.headerAliases?.[newAliasKey] || [];
    const updatedSchema = {
      ...schema,
      headerAliases: {
        ...schema.headerAliases,
        [newAliasKey]: [...currentAliases, newAliasValue]
      }
    };
    onUpdate(updatedSchema);
    setNewAliasValue("");
  };

  const removeHeaderAlias = (key: string, value: string) => {
    const currentAliases = schema.headerAliases?.[key] || [];
    const updatedAliases = currentAliases.filter(v => v !== value);
    
    const updatedSchema = { ...schema, headerAliases: { ...schema.headerAliases } };
    if (updatedAliases.length === 0) {
      delete updatedSchema.headerAliases?.[key];
    } else {
      updatedSchema.headerAliases![key] = updatedAliases;
    }
    
    onUpdate(updatedSchema);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[var(--surface-clinical)] border-l border-[var(--border-clinical)] h-full overflow-y-auto hide-scrollbar">
      <div className="flex items-center gap-3 border-b border-[var(--border-clinical)] pb-4">
        <Settings2 size={16} className="text-[var(--accent-clinical)]" />
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Taxonomía y Mapeos</h2>
      </div>

      {/* Datos Demográficos */}
      <div className="space-y-4">
        <h3 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Datos Demográficos (Claves)</h3>
        
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-[var(--text-primary)]">NHC Column</label>
          <input 
            type="text" 
            value={schema.demographics?.nhc || ""} 
            onChange={(e) => updateDemographics('nhc', e.target.value)}
            className="w-full bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] outline-none"
            placeholder="N.H.C"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-[var(--text-primary)]">Fecha Toma Column</label>
          <input 
            type="text" 
            value={schema.demographics?.fechaToma || ""} 
            onChange={(e) => updateDemographics('fechaToma', e.target.value)}
            className="w-full bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] outline-none"
            placeholder="EC_Fecha_Toma"
          />
        </div>
      </div>

      {/* Header Aliases */}
      <div className="space-y-4 border-t border-[var(--border-clinical)] pt-4">
        <h3 className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Aliases de Cabecera</h3>
        
        {/* Lista de Aliases existentes */}
        {schema.headerAliases && Object.entries(schema.headerAliases).map(([key, values]) => (
          <div key={key} className="bg-[var(--bg-clinical)]/50 p-4 rounded-xl border border-[var(--border-clinical)]/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-[var(--accent-clinical)]">{key}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {values.map(val => (
                <span key={val} className="bg-[var(--surface-clinical)] text-[var(--text-primary)] text-[9px] font-bold px-2 py-1 rounded-md border border-[var(--border-clinical)] flex items-center gap-2">
                  {val}
                  <button onClick={() => removeHeaderAlias(key, val)} className="text-red-500 hover:text-red-700">×</button>
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Añadir Nuevo Alias */}
        <div className="bg-[var(--bg-clinical)]/50 p-4 rounded-xl border border-[var(--border-clinical)]/50 space-y-3">
          <input 
            type="text" 
            placeholder="Cabecera Canónica (ej. Cipa)"
            value={newAliasKey}
            onChange={(e) => setNewAliasKey(e.target.value)}
            className="w-full bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-lg p-2 text-xs font-bold"
          />
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Alias (ej. CIPA)"
              value={newAliasValue}
              onChange={(e) => setNewAliasValue(e.target.value)}
              className="flex-1 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-lg p-2 text-xs font-bold"
            />
            <button 
              onClick={addHeaderAlias}
              className="bg-[var(--accent-clinical)] text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
