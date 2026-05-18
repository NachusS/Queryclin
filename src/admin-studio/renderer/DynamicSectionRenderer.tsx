import React from 'react';
import { ClinicalSection } from '../domain/types';
import { DynamicGroupRenderer } from './DynamicGroupRenderer';

interface DynamicSectionRendererProps {
  section: ClinicalSection;
  data: Record<string, any>;
  searchQuery?: string;
  debugMode?: boolean;
}

export function DynamicSectionRenderer({ section, data, searchQuery = '', debugMode = false }: DynamicSectionRendererProps) {
  // Verificar si la sección tiene algún dato visible
  const hasVisibleData = section.groups.some(group => 
    group.fields.some(field => {
      if (debugMode) return true;
      const val = data[field.sourceField];
      return val !== undefined && val !== null && String(val).trim() !== '';
    })
  );

  if (!hasVisibleData && !debugMode) return null;

  return (
    <div className="mb-8">
      <div className="w-full mb-6">
        <div className="bg-[#1e293b] text-white px-5 py-2 text-[13px] font-black uppercase tracking-[0.15em] border-l-4 border-emerald-500 shadow-md flex items-center justify-between">
          <span>{section.title}</span>
          <div className="h-px flex-1 bg-emerald-500/20 ml-6 opacity-30" />
        </div>
      </div>
      
      <div className="pl-2">
        {section.groups.map(group => (
          <DynamicGroupRenderer 
            key={group.id} 
            group={group} 
            data={data} 
            searchQuery={searchQuery} 
            debugMode={debugMode} 
          />
        ))}
      </div>
    </div>
  );
}
