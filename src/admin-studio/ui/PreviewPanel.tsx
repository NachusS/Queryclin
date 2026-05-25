import React from 'react';
import { FormSchema } from '../domain/schema';
import { FormCompiler } from '../compiler/FormCompiler';
import { Eye } from 'lucide-react';

interface PreviewPanelProps {
  schema: FormSchema;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ schema }) => {
  const compiledMapping = FormCompiler.compile(schema);
  const codeString = FormCompiler.generateRuntimeModule([compiledMapping]);

  return (
    <div className="flex flex-col gap-6 p-6 bg-[var(--surface-clinical)] border-l border-[var(--border-clinical)] h-full overflow-y-auto hide-scrollbar">
      <div className="flex items-center gap-3 border-b border-[var(--border-clinical)] pb-4">
        <Eye size={16} className="text-[var(--accent-clinical)]" />
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Vista Previa del Mapping</h2>
      </div>

      <div className="p-5 bg-slate-900 rounded-3xl border border-white/5 shadow-2xl flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-3">
           <div className="w-2 h-2 bg-red-500 rounded-full"></div>
           <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
           <div className="w-2 h-2 bg-green-500 rounded-full"></div>
           <p className="text-[8px] font-black text-white/40 uppercase tracking-widest ml-2">generated/mappings.runtime.ts</p>
        </div>
        <pre className="text-[10px] text-[var(--accent-clinical)] font-mono overflow-auto flex-1 p-3 bg-black/30 rounded-xl border border-white/5">
          <code>{codeString}</code>
        </pre>
      </div>
    </div>
  );
};
