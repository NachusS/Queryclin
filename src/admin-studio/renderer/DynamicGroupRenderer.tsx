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

export const DynamicGroupRenderer = React.memo<DynamicGroupRendererProps>(({ group, data, searchQuery = '', debugMode = false }) => {
  // Filtrar campos vacíos si no estamos en debugMode
  const activeFields = group.fields.filter(f => {
    if (!f.visible) return false;
    if (debugMode) return true;
    
    // Check if field has direct value
    const val = data[f.sourceField];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return true;
    }
    
    // Check if any child has value
    if (f.children && f.children.length > 0) {
      return f.children.some(child => {
        const childVal = data[child.sourceField];
        return childVal !== undefined && childVal !== null && String(childVal).trim() !== '';
      });
    }
    
    return false;
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
          <div className="mb-2">
            <div className="bg-[var(--header-accent-bg)] text-[var(--header-accent-text)] px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-[var(--border-muted)] w-full shadow-sm">
              {group.title}:
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {colArrays.map((colFields, colIdx) => (
            <div key={colIdx} className={`border border-[var(--border-muted)] shadow-[var(--shadow-sm)] overflow-hidden flex flex-col rounded-sm bg-[var(--surface-primary)] ${colFields.length === 0 ? 'border-transparent shadow-none' : ''}`}>
              {colFields.map(f => {
                const val = data[f.sourceField];
                const displayVal = Array.isArray(val) ? val.join(', ') : (String(val || '').trim() || '--');
                
                return (
                  <div key={f.id} className="flex border-b border-[var(--border-subtle)] last:border-b-0">
                    <div className="bg-[var(--cell-label-bg)] px-3 py-1.5 text-[10px] font-bold border-r border-[var(--border-subtle)] flex items-center flex-1 text-[var(--cell-label-text)] uppercase truncate" title={f.label}>
                      {f.label}:
                    </div>
                    <div className="bg-[var(--cell-value-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--cell-value-text)] flex items-center justify-center w-[85px] text-center tabular-nums">
                      {searchQuery ? <HighlightedText text={displayVal} query={searchQuery} /> : displayVal}
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
          <div className="bg-[var(--header-accent-bg)] text-[var(--header-accent-text)] px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-[var(--border-muted)] w-full shadow-sm">
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
            record={data}
          />
        ))}
      </div>
    </div>
  );
});
