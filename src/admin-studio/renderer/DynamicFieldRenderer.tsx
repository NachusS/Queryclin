import React from 'react';
import { ClinicalField } from '../domain/types';
import HighlightedText from '../../components/HighlightedText';

interface DynamicFieldRendererProps {
  field: ClinicalField;
  value: any;
  searchQuery?: string;
}

export function DynamicFieldRenderer({ field, value, searchQuery = '' }: DynamicFieldRendererProps) {
  if (!field.visible || value === undefined || value === null || String(value).trim() === '') {
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
                {field.highlightable && searchQuery ? <HighlightedText text={val} query={searchQuery} /> : val}
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
      return field.highlightable && searchQuery ? <HighlightedText text={valStr} query={searchQuery} /> : valStr;
    }

    return valStr.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {field.highlightable && searchQuery ? <HighlightedText text={line} query={searchQuery} /> : line}
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
}
