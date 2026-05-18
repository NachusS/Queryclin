import React from 'react';
import { ClinicalGroup } from '../domain/types';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';
import HighlightedText from '../../components/HighlightedText';

interface DynamicGroupRendererProps {
  group: ClinicalGroup;
  data: Record<string, any>;
  searchQuery?: string;
  debugMode?: boolean;
}

export function DynamicGroupRenderer({ group, data, searchQuery = '', debugMode = false }: DynamicGroupRendererProps) {
  // Filtrar campos vacíos si no estamos en debugMode
  const activeFields = group.fields.filter(f => {
    if (!f.visible) return false;
    if (debugMode) return true;
    const val = data[f.sourceField];
    return val !== undefined && val !== null && String(val).trim() !== '';
  });

  if (activeFields.length === 0 && !debugMode) return null;

  // Lógica de Grid (estilo Constantes o Analíticas)
  if (group.layout === 'grid' || group.layout === 'table') {
    const columns = group.columns || 4;
    const fieldsPerCol = Math.ceil(activeFields.length / columns);
    const colArrays = Array.from({ length: columns }, (_, i) => 
      activeFields.slice(i * fieldsPerCol, (i + 1) * fieldsPerCol)
    );

    return (
      <div className="my-4 select-none w-full">
        {group.title && (
          <div className="bg-[#0056b3] text-white px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-slate-800 inline-block mb-[1px] shadow-sm">
            {group.title}:
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {colArrays.map((colFields, colIdx) => (
            <div key={colIdx} className={`border border-slate-300 shadow-sm overflow-hidden flex flex-col rounded-sm bg-white ${colFields.length === 0 ? 'border-transparent shadow-none' : ''}`}>
              {colFields.map(f => {
                const val = data[f.sourceField];
                const displayVal = Array.isArray(val) ? val.join(', ') : (String(val || '').trim() || '--');
                
                return (
                  <div key={f.id} className="flex border-b border-slate-200 last:border-b-0">
                    <div className="bg-white px-3 py-1.5 text-[10px] font-bold border-r border-slate-200 flex items-center flex-1 text-slate-700 uppercase truncate" title={f.label}>
                      {f.label}:
                    </div>
                    <div className="bg-[#F1F8E9] px-3 py-1.5 text-[11px] font-medium text-slate-800 flex items-center justify-center w-[85px] text-center tabular-nums">
                      {f.highlightable && searchQuery ? <HighlightedText text={displayVal} query={searchQuery} /> : displayVal}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Lógica por defecto (Stack)
  return (
    <div className="flex flex-col gap-4">
      {group.title && group.title.toUpperCase() !== 'ANTECEDENTES PERSONALES' && (
        <div className="mb-2">
          <div className="bg-[#0056b3] text-white px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-slate-800 w-full shadow-sm">
            {group.title}:
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {activeFields.map(f => (
          <DynamicFieldRenderer 
            key={f.id} 
            field={f} 
            value={data[f.sourceField]} 
            searchQuery={searchQuery} 
          />
        ))}
      </div>
    </div>
  );
}
