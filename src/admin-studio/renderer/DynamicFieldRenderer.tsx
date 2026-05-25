import React from 'react';
import { ClinicalField } from '../domain/types';
import HighlightedText from '../../components/HighlightedText';

interface DynamicFieldRendererProps {
  field: ClinicalField;
  value: any;
  searchQuery?: string;
  record?: Record<string, any>;
}

export const DynamicFieldRenderer = React.memo<DynamicFieldRendererProps>(({ field, value, searchQuery = '', record }) => {
  if (!field.visible) {
    return null;
  }

  // Soporte para renderizado Multivalor Anidado (ej. multivalores $)
  if (field.children && field.children.length > 0 && record) {
    const activeChildren = field.children.filter(child => {
      const childVal = record[child.sourceField];
      return child.visible && childVal !== undefined && childVal !== null && String(childVal).trim() !== '';
    });

    if (activeChildren.length > 0) {
      return (
        <div className="flex flex-col mb-4 bg-slate-50/50 rounded-lg border border-slate-200/50 p-3">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0056b3] leading-none mb-3 border-b border-[#0056b3]/10 pb-2">
            {field.label}:
          </span>
          <div className="flex flex-col gap-3 pl-2">
            {activeChildren.map(child => {
              const childVal = record[child.sourceField];
              return (
                <div key={child.id} className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 mb-0.5">
                    {child.label}:
                  </span>
                  <span className="text-[12px] text-slate-700 font-semibold">
                    {searchQuery ? (
                      <HighlightedText text={String(childVal)} query={searchQuery} />
                    ) : (
                      String(childVal)
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  }

  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  // Soporte para renderizado Multivalor (estilo HCE-OBS)
  if (field.type === 'multivalue' || field.multivalue || Array.isArray(value)) {
    let listValues: string[] = [];
    if (Array.isArray(value)) {
      listValues = value;
    } else {
      listValues = String(value).split(',').map(v => v.trim());
    }

    if (listValues.length === 0) return null;

    return (
      <div className="flex flex-col mb-4 bg-slate-50/50 rounded-lg border border-slate-200/50 p-3">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0056b3] leading-none mb-3 border-b border-[#0056b3]/10 pb-2">
          {field.label}:
        </span>
        <ul className="flex flex-col gap-2">
          {listValues.map((val, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#0056b3] text-lg leading-none select-none mt-[-2px]">•</span>
              <span className="text-[12px] font-medium text-slate-700">
                {searchQuery ? <HighlightedText text={val} query={searchQuery} /> : val}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Estilo narrativo (multiline) o estándar
  const isNarrative = field.type === 'textarea' || field.multiline || String(value).length > 60;
  const renderValue = () => {
    const valStr = String(value);
    if (!isNarrative || !valStr.includes('\n')) {
      return searchQuery ? <HighlightedText text={valStr} query={searchQuery} /> : valStr;
    }

    return valStr.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {searchQuery ? <HighlightedText text={line} query={searchQuery} /> : line}
        {i < valStr.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col mb-4">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#0056b3] leading-none mb-1">
        {field.label}:
      </span>
      <span className={`text-slate-800 break-words ${isNarrative ? 'text-[12px] leading-relaxed font-medium bg-slate-50/50 p-3 rounded-md border border-slate-100' : 'text-[13px] font-semibold'}`}>
        {renderValue()}
      </span>
    </div>
  );
});
