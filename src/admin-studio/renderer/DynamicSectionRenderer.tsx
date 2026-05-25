import React from 'react';
import { ClinicalSection } from '../domain/types';
import { DynamicGroupRenderer } from './DynamicGroupRenderer';

interface DynamicSectionRendererProps {
  section: ClinicalSection;
  data: Record<string, any>;
  searchQuery?: string;
  debugMode?: boolean;
}

export const DynamicSectionRenderer = React.memo<DynamicSectionRendererProps>(({ section, data, searchQuery = '', debugMode = false }) => {
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
    <div className="flex flex-col gap-2">
      <div className="w-full mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#004b93] to-slate-800 rounded-lg transform skew-x-[-12deg] z-0 shadow-lg border border-slate-700" />
        <div className="relative z-10 px-6 py-2.5 text-white flex items-center gap-3 font-bold tracking-widest text-sm uppercase">
          <div className="w-1.5 h-4 bg-[var(--accent-clinical)] rounded-full shadow-[0_0_8px_var(--accent-clinical)]" />
          {section.title}
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
});
