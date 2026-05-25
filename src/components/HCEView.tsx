import { useState, useEffect, useMemo, memo } from 'react';
import { SearchResult } from '../engine';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, User, AlertTriangle, 
  Calendar, Clock, Hash, Eye
} from 'lucide-react';

import HighlightedText from './HighlightedText';
import { db } from '../storage/indexedDB';
import { normalizeString } from '../utils/stringNormalizer';
import { Patient, Toma, getGender } from '../core/types';
import { FORMS } from '../core/mappings';
import { parseClinicalDate, extractFecha, extractHora } from '../utils/dateParser';
import { DynamicSectionRenderer } from '../admin-studio/renderer/DynamicSectionRenderer';
import { schemaRuntimeSync } from '../admin-studio/store/schemaRuntimeSync';
import { ClinicalFormSchema } from '../admin-studio/domain/types';

interface HCEViewProps {
  results: SearchResult[];
  currentIndex: number;
  query: string;
  onBack: () => void;
  onNavigate: (index: number) => void;
  formId: string;
  activeFilters?: { dateRange?: [string, string], service?: string, categories?: string[], fields?: string[], onlyLatestSnapshot?: boolean };
  activeTomaIndex: number;
  activeVersionIndex: number;
  onTomaNavigate: (tIdx: number, vIdx: number) => void;
  debugMode: boolean;
  clinicalSchema?: ClinicalFormSchema;
}


// ─── Avatar de Paciente ───────────────────────────────────────────────────────
const PatientAvatar = memo(function PatientAvatar({ gender, size = 28 }: { gender: 'male' | 'female' | 'neutral', size?: number }) {
  const cfg = {
    male:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    border: 'border-cyan-500/20' },
    female:  { bg: 'bg-purple-400/10',  text: 'text-purple-400',  border: 'border-purple-400/20' },
    neutral: { bg: 'bg-[var(--accent-clinical)]/10', text: 'text-[var(--accent-clinical)]', border: 'border-[var(--accent-clinical)]/20' },
  }[gender];
  return (
    <div className={`w-14 h-14 ${cfg.bg} ${cfg.text} ${cfg.border} border-2 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <User size={size} />
    </div>
  );
});

// ─── Chip de Dato Demográfico ──────────────────────────────────────────────────
const DemoChip = memo(function DemoChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] px-3 py-1.5 rounded-lg text-[12px]">
      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-70">{label}</span>
      <span className="font-bold text-[var(--text-primary)]">{value}</span>
    </span>
  );
});

// ─── Campo Clínico Individual ──────────────────────────────────────────────────
// ─── Lista Global de Campos de Constantes (para exclusión) ───────────────────
const CONSTANT_FIELDS = new Set([
  'IMC:', 'IMC', 'VALORACIÓN IMC', 'VALORACION IMC', 'VALORACIÓN IMC:',
  'DIABETES MELLITUS', 'DIABETES MELLITUS:', 'DETALLES DM', 'DETALLES DIABETES MELLITUS', 'DETALLES DM:',
  'O2 HB', 'OXIHEMOGLOBINA (O2 HB)', 'O2 HB:', 'SATURACIÓN O2',
  'HÁBITO ENÓLICO', 'HABITO ENOLICO', 'HÁBITO ENÓLICO:', 'ALCOHOL', 'HABITO ENÓLICO',
  'HÁBITOS TÓXICOS', 'HABITOS TOXICOS', 'HÁBITOS TÓXICOS:', 'HABITOS TÓXICOS GESTACIÓN', 'HABITOS TÓXICOS',
  'PESO:', 'PESO', 'SUPERFICIE CORPORAL', 'SUPERFICIE CORPORAL:', 'SUP. CORPORAL:', 'SUPERFICIE CORP:',
  'FC', 'FRECUENCIA CARDÍACA', 'FC:',
  'HTA (HIPERTENSIÓN ARTERIAL)', 'HTA', 'HTA:', 'HIPERTENSIÓN ARTERIAL', 'TIPO DE HTA',
  'DETALLES HIPERTENSIÓN ARTERIAL', 'DETALLES HTA', 'DETALLES HIPERTENSIÓN ARTERIAL:', 'DETALLES HTA:',
  'AÑOS FUMANDO', 'AÑOS FUMANDO:',
  'CIGARRILLOS AL DIA', 'CIGARRILLOS AL DÍA', 'CIGARRILLOS AL DIA:', 'CIGARRILLOS/DÍA', 'CIGARRILLOS AL DÍA:',
  'HÁBITO TABÁQUICO', 'HABITO TABAQUICO', 'HÁBITO TABÁQUICO:', 'HABITO TABÁQUICO',
  'GRUPO SANGUÍNEO', 'GRUPO SANGUINEO Y RH', 'GRUPO SANGUÍNEO:', 'G. SANGUÍNEO', 'GRUPO Y RH:', 'GRUPO Y RH',
  'TRANSFUSIONES', 'TRANSFUSIONES:', 'ANTECEDENTES TRANSFUSIONALES', 'MOTIVOS TRANSFUSIONES',
  'PERÍMETRO ABDOMINAL', 'PERIMETRO ABDOMINAL', 'PERÍMETRO ABDOMINAL:',
  'AÑOS DESDE QUE DEJO DE FUMAR', 'AÑOS DESDE QUE DEJÓ DE FUMAR', 'AÑOS DESDE QUE DEJO DE FUMAR:', 'AÑOS DESDE QUE DEJÓ DE FUMAR:',
  'DISLIPEMIA', 'DISLIPEMIA:', 'DISLIDIPEMIA', 'DETALLES DISLIPEMIA', 'DETALLES DISLIDIPEMIA', 'DETALLES DISLIPEMIA:', 'DETALLES DISLIDIPEMIA:',
  'PAQUETES AÑO', 'PAQUETES AÑO:', 'PAQUETES/AÑO',
  'TALLA:', 'TALLA',
  'TMP', 'T', 'TEMPERATURA', 'TMP:', 'TEMPERATURA:', 'T:',
  'PAD', 'PAD:',
  'PAS', 'PAS:',
  'GRADO NYHA', 'NYHA', 'GRADO NYHA:',
  'AUMENTO DE PESO DESDE EL COMIENZO DEL EMBARAZO', 'PESO 1ª VISITA'
].map(k => k.toUpperCase()));

const NARRATIVE_FIELDS = new Set([
  'SENSIBILIDAD ANTIÍBIÓTICOS', 'SENSIBILIDAD ANTIBIÓTICOS', 'SENSIBILIDAD ANTIIBIÓTICOS', 
  'OBSERVACIONES', 'OBSERVACIONES:', 'OBSERVACIONES::', 'OTRAS ANALÍTICAS', 'OTRAS ANALITICAS', 'OTRAS ANALÍTICAS:',
  'RESUMEN ANALÍTICA', 'RESUMEN ANALITICA', 'RESUMEN ANALÍTICA:', 'ANAMNESIS', 'MOTIVO DE CONSULTA:', 'MOTIVO DE CONSULTA',

  'ANTECEDENTES FAMILIARES GENERALES', 'ANTECEDENTES PERSONALES GENERALES', 'ANTECEDENTES QUIRÚRGICOS GENERALES',
  'DETALLES DM', 'DETALLES HIPERTENSIÓN ARTERIAL', 'DETALLES DISLIPEMIA', 'DETALLES DIABETES MELLITUS',
  'TRATAMIENTO CRÓNICO', 'TRATAMIENTO CRONICO', 'TRATAMIENTO', 'RECOMENDACIONES', 'MOTIVO DE ALTA',
  'PROCESOS GINECOLÓGICOS ANTERIORES:', 'EVOLUCIÓN', 'EVOLUCION', 'PLAN', 'RECOMENDACIONES', 'DIAGNÓSTICO', 'DIAGNOSTICO',
  'OBSERVACIONES', 'RESUMEN', 'ANTECEDENTES FAMILIARES', 'ANTECEDENTES PERSONALES',
  'EXPLORACIÓN FÍSICA', 'EXPLORACION FISICA', 'EXPLORACIÓN GENERAL', 'EXPLORACION GENERAL',
  'JUICIO DIAGNÓSTICO', 'JUICIO DIAGNOSTICO', 'MOTIVO DE CONSULTA', 'MOTIVO DE INGRESO',
  'TRATAMIENTO RECOMENDADO', 'EVOLUCIÓN (CEX)', 'ANTECEDENTES FAMILIARES GENERALES',
  'ANTECEDENTES PERSONALES GENERALES', 'ANTECEDENTES QUIRÚRGICOS GENERALES',
  'TRATAMIENTO PREVIO', 'TRATAMIENTO CRÓNICO', 'ENFERMEDAD ACTUAL', 'EXPLORACIÓN FÍSICA:',
  'SITUACIÓN BASAL (OTROS)', 'SITUACIÓN BASAL', 'OTRAS EXPLORACIONES',
  'RESULTADO ANALÍTICA', 'RESULTADO ANALITICA', 'RESULTADOS PRUEBAS', 'RESULTADO ANATOMÍA PATOLÓGICA',
  'RESULTADO RADIODIAGNÓSTICO', 'OTRAS PRUEBAS REALIZADAS', 'PRUEBAS SOLICITADAS'

].map(k => k.toUpperCase()));


// UTILIDADES DE NORMALIZACIÓN (Fuera del componente para evitar re-creación)
const cleanLabel = (s: string) => s.replace(/:$/, '').trim().toUpperCase();
const cleanTitle = (s: string) => (s || "").replace(/^\d{2,}-\s*/, '').replace(/^\d{2,}\.\d{2,}-\s*/, '').replace(/^\d{2,}\s*-\s*/, '').trim();
const cleanKeyStr = (s: string) => String(s)
  .replace(/[\u00A0\u200B-\u200D\uFEFF'":;]/g, ' ')
  .replace(/[_-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toUpperCase();





// ─── Campo Clínico Individual ──────────────────────────────────────────────────
const ClinicalField = memo(function ClinicalField({ label, value, query, highlight, shouldHighlight = true }: { label: string; value: string | string[]; query: string; highlight?: boolean; shouldHighlight?: boolean }) {
  const isMultivalue = Array.isArray(value);
  const displayValue = isMultivalue ? '' : String(value);
  const isLong = !isMultivalue && displayValue.length > 80;
  
  // Mejora de legibilidad: 3 o más espacios -> Salto de línea; punto y 2 espacios -> Salto de línea
  const formattedValue = useMemo(() => {
    if (isMultivalue) return '';
    return displayValue
      .replace(/ {3,}/g, '\n')
      .replace(/\. {2,}/g, '.\n')
      .trim();
  }, [displayValue, isMultivalue]);


  const isBoolean = !isMultivalue && ['SI','NO','SÍ','TRUE','FALSE','POSITIVO','NEGATIVO'].includes(displayValue.trim().toUpperCase());

  return (
    <div className={`flex flex-col gap-0.5 border-b border-[var(--border-clinical)]/60 last:border-0 pb-3 last:pb-0 ${highlight ? 'bg-[var(--accent-clinical)]/5 rounded-xl p-3 -mx-3 ring-1 ring-[var(--accent-clinical)]/20' : ''}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent-clinical)] leading-none mb-1">
        {label}:
      </span>
      {isMultivalue ? (
        <div className="mt-1 space-y-1.5">
          {/* Lista de hallazgos abierta por defecto sin contador */}
          <div className="bg-slate-50/50 border-2 border-slate-100 rounded-2xl overflow-hidden">
            <ul className="flex flex-col divide-y divide-slate-100">
              {value.map((item, idx) => (
                <li key={idx} className="px-5 py-2.5 flex items-start gap-3 hover:bg-white transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-clinical)] mt-2 shrink-0" />
                  <span className="text-[15px] font-bold text-slate-800 leading-tight">
                    {shouldHighlight ? <HighlightedText text={item} query={query} /> : item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : isBoolean ? (
        <span className={`inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-wide ${
          ['SI','SÍ','TRUE','POSITIVO'].includes(displayValue.trim().toUpperCase())
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-red-600 text-white shadow-sm'
        }`}>
          {displayValue}
        </span>
      ) : isLong ? (
        <p className="text-[15px] text-slate-900 leading-[1.75] whitespace-pre-wrap font-bold">
          {shouldHighlight ? <HighlightedText text={formattedValue} query={query} /> : formattedValue}
        </p>
      ) : (
        <span className="text-[16px] text-slate-900 font-black leading-snug whitespace-pre-wrap">
          {shouldHighlight ? <HighlightedText text={formattedValue} query={query} /> : formattedValue}
        </span>
      )}
    </div>
  );
});

// ─── Grid de Datos Clínicos (Estilo Tabla Constantes) ───────────────────────
// ─── Grid de Datos Clínicos (Estetica Identica a Constantes) ───────────────
const ClinicalGrid = memo(function ClinicalGrid({ title, fields, query, shouldHighlight = true, showEmpty = false }: { title?: string, fields: { key: string, value: string | string[] }[], query: string, shouldHighlight?: boolean, showEmpty?: boolean }) {
  if (fields.length === 0) return null;

  // Repartir campos en 4 bloques verticales para mantener la estética de cajas separadas
  const numCols = 4;
  const fieldsPerCol = Math.ceil(fields.length / numCols);
  const columns = Array.from({ length: numCols }, (_, i) => 
    fields.slice(i * fieldsPerCol, (i + 1) * fieldsPerCol)
  );

  return (
    <div className="my-4 select-none w-full">
      {title && (
        <div className="bg-[#0056b3] text-white px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-slate-800 inline-block mb-[1px] shadow-sm">
          {title}:
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((colFields, colIdx) => (
          <div key={colIdx} className={`border border-slate-300 shadow-sm overflow-hidden flex flex-col rounded-sm bg-white ${colFields.length === 0 ? 'border-transparent shadow-none' : ''}`}>
            {colFields.map((f, fIdx) => {
              const val = Array.isArray(f.value) ? f.value.join(', ') : (String(f.value).trim() || '--');
              if (!showEmpty && (val === '--' || val === '')) return null;
              return (
                <div key={fIdx} className="flex border-b border-slate-200 last:border-b-0">
                  <div className="bg-white px-3 py-1.5 text-[10px] font-bold border-r border-slate-200 flex items-center flex-1 text-slate-700 uppercase truncate" title={f.key}>
                    {f.key}:
                  </div>
                  <div className="bg-[#F1F8E9] px-3 py-1.5 text-[11px] font-medium text-slate-800 flex items-center justify-center w-[85px] text-center tabular-nums">
                    {shouldHighlight ? <HighlightedText text={val} query={query} /> : val}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});







// ─── Bloque de Constantes Clínicas (Inmutable) ────────────────────────────────
// ─── Bloque de Constantes Clínicas (Inmutable) ────────────────────────────────
const ClinicalConstants = memo(function ClinicalConstants({ data, query, formId, shouldHighlight = true }: { data: Record<string, string>, query: string, formId?: string, shouldHighlight?: boolean }) {
  const getV = (keys: string[]) => {
    for (const k of keys) {
      const val = data[k];
      if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
    }
    return '--';
  };

  const Field = ({ label, keys, minW = "120px", valW = "85px" }: { label: string, keys: string[], minW?: string, valW?: string }) => {
    const value = getV(keys);

    return (
      <div className="flex border-b border-slate-200 last:border-b-0">
        <div className={`bg-white px-3 py-1.5 text-[10px] font-bold border-r border-slate-200 flex items-center flex-1 text-slate-700 uppercase`} style={{ minWidth: minW }}>
          {label}
        </div>
        <div className={`bg-[#F1F8E9] px-3 py-1.5 text-[11px] font-medium text-slate-800 flex items-center justify-center text-center tabular-nums`} style={{ minWidth: valW }}>
          {shouldHighlight ? <HighlightedText text={value} query={query} /> : value}
        </div>
      </div>
    );
  };



  const displayFormId = (formId || '').split('_')[1]?.toUpperCase() || '';

  return (
    <div className="my-4 select-none w-full">
      <div className="bg-[#0056b3] text-white px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-slate-800 inline-block mb-[1px] shadow-sm">
        Constantes {displayFormId}:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Columna 1 */}
        <div className="border border-slate-300 shadow-sm overflow-hidden flex flex-col rounded-sm bg-white">
          <Field label="IMC:" keys={['IMC:', 'IMC']} />
          <Field label="Valoración IMC:" keys={['Valoración IMC', 'Valoracion IMC', 'Valoración IMC:']} />
          <Field label="Diabetes Mellitus:" keys={['Diabetes Mellitus', 'Diabetes mellitus', 'Diabetes Mellitus:', 'Diabetes Gestacional']} />
          <Field label="Detalles DM:" keys={['Detalles DM', 'Detalles Diabetes Mellitus', 'Detalles Diabetes mellitus', 'Detalles DM:', 'Detalles Diabetes Mellitus:']} />
          <Field label="O2 Hb:" keys={['O2 Hb', 'Oxihemoglobina (O2 Hb)', 'O2 Hb:', 'Saturación O2']} />
          <Field label="Hábito Enólico:" keys={['Hábito Enólico', 'Habito Enolico', 'Hábito Enólico:', 'Alcohol', 'Habito Enólico', 'Alcohol durante el embarazo?']} />
          <Field label="Hábitos Tóxicos:" keys={['Hábitos Tóxicos', 'Habitos Toxicos', 'Hábitos Tóxicos:', 'Habitos tóxicos', 'Hábitos tóxicos gestación']} />
        </div>
        {/* Columna 2 */}
        <div className="border border-slate-300 shadow-sm overflow-hidden flex flex-col rounded-sm bg-white">
          <Field label="Peso:" keys={['Peso:', 'Peso']} />
          <Field label="Sup. Corporal:" keys={['Superficie Corporal', 'Superficie corporal', 'Superficie Corporal:', 'Sup. Corporal:', 'Superficie Corp:']} />
          <Field label="FC:" keys={['FC', 'Frecuencia Cardíaca', 'FC:']} />
          <Field label="HTA:" keys={['HTA (Hipertensión Arterial)', 'HTA', 'HTA:', 'Hipertensión Arterial', 'Tipo de HTA']} />
          <Field label="Detalles HTA:" keys={['Detalles Hipertensión Arterial', 'Detalles HTA', 'Detalles Hipertensión Arterial:', 'Detalles HTA:']} />
          <Field label="Años Fumando:" keys={['Años fumando', 'Años fumando:', 'Años Fumando']} />
          <Field label="Cigarrillos Día:" keys={['Cigarrillos al dia', 'Cigarrillos al día', 'Cigarrillos al dia:', 'Cigarrillos/día', 'Cigarrillos al día:']} />
          <Field label="Hábito Tabáquico:" keys={['Hábito Tabáquico', 'Habito Tabaquico', 'Hábito Tabáquico:', 'Habito Tabáquico', 'Fumadora durante el embarazo?']} />
        </div>
        {/* Columna 3 */}
        <div className="border border-slate-300 shadow-sm overflow-hidden flex flex-col rounded-sm bg-white">
          <Field label="Grupo Sanguíneo:" keys={['Grupo Sanguíneo', 'Grupo sanguineo y RH', 'Grupo Sanguíneo:', 'G. Sanguíneo', 'Grupo Sanguíneo:', 'Grupo y RH:', 'Grupo y RH']} />
          <Field label="Transfusiones:" keys={['Transfusiones', 'Transfusiones:', 'Antecedentes Transfusionales', 'Motivos Transfusiones']} />
          <Field label="Perímetro abd.:" keys={['Perímetro abdominal', 'Perimetro abdominal', 'Perímetro abdominal:']} />
          <Field label="Años dejó fumar:" keys={['Años desde que dejo de fumar', 'Años desde que dejó de fumar', 'Años desde que dejo de fumar:', 'Años desde que dejó de fumar:']} />
          <Field label="Dislipemia:" keys={['Dislipemia', 'Dislipemia:', 'Dislipidemia']} />
          <Field label="Detalle Dislip.:" keys={['Detalles Dislipemia', 'Detalles Dislipidemia', 'Detalles Dislipemia:', 'Detalles Dislipidemia:', 'Detalles Dislipemia:']} />
          <Field label="Paquetes año:" keys={['Paquetes año', 'Paquetes año:', 'Paquetes/año']} />
          <Field label="Aumento Peso:" keys={['Aumento de peso desde el comienzo del embarazo', 'Peso 1ª Visita']} />
        </div>
        {/* Columna 4 */}
        <div className="border border-slate-300 shadow-sm overflow-hidden flex flex-col rounded-sm bg-white">
          <Field label="Talla:" keys={['Talla:', 'Talla']} />
          <Field label="Tmp:" keys={['Tmp', 'T', 'Temperatura', 'Tmp:', 'Temperatura:', 'T:']} />
          <Field label="PAD:" keys={['PAD', 'PAD:']} />
          <Field label="PAS:" keys={['PAS', 'PAS:']} />
          <Field label="NYHA:" keys={['Grado NYHA', 'NYHA', 'Grado NYHA:']} />
        </div>
      </div>

    </div>
  );
});

// ─── Cabecera de Sección Clínica ───────────────────────────────────────────────
const SectionHeader = memo(function SectionHeader({ label }: { label: string }) {
  return (
    <div className="w-full mb-6">
      <div className="bg-[#1e293b] text-white px-5 py-2 text-[13px] font-black uppercase tracking-[0.15em] border-l-4 border-emerald-500 shadow-md flex items-center justify-between">
        <span>{label}</span>
        <div className="h-px flex-1 bg-emerald-500/20 ml-6 opacity-30" />
      </div>
    </div>
  );
});

// ─── Campo de Cabecera Compacta (HCE-ALG) ───────────────────────────────────
const HeaderField = memo(function HeaderField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${highlight ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-white border-slate-200'}`}>
      <span className="text-[10px] font-black uppercase text-slate-400">{label}:</span>
      <span className={`text-[12px] font-bold ${highlight ? 'text-red-700' : 'text-slate-700'}`}>{value || '--'}</span>
    </div>
  );
});


// ─── Timeline Lateral de Tomas ─────────────────────────────────────────────────
const TomaTimeline = memo(function TomaTimeline({
  sortedTomas,
  activeIndex,
  activeVersionIndex,
  onSelect,
  isHCEALG = false,
  query = '',
  matchedRegistros = [],
}: {
  sortedTomas: Toma[];
  activeIndex: number;
  activeVersionIndex: number;
  onSelect: (tomaIdx: number, versionIdx: number) => void;
  isHCEALG?: boolean;
  query?: string;
  matchedRegistros?: any[];
}) {
  const hasMatch = (idToma: string, ordenToma?: number) => {
    if (!query || query.trim() === '') return false;
    if (ordenToma !== undefined) {
      return matchedRegistros?.some(m => String(m.idToma) === String(idToma) && Number(m.ordenToma) === Number(ordenToma)) || false;
    }
    return matchedRegistros?.some(m => String(m.idToma) === String(idToma)) || false;
  };
  return (
    <div className="flex flex-col gap-0 sticky top-[180px] max-h-[75vh] overflow-y-auto hide-scrollbar rounded-xl border border-slate-200 shadow-sm bg-white">
      {isHCEALG ? (
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegación / Tomas</span>
        </div>
      ) : (
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mb-3 px-2 py-3 opacity-50">
          Historial de Tomas ({sortedTomas.length})
        </h3>
      )}
      <div className="flex flex-col">
        {sortedTomas.map((t, tIdx) => {
          if (isHCEALG) {
            const sortedRegs = [...t.registros].sort((a, b) => b.ordenToma - a.ordenToma);
            
            return (
              <div key={t.idToma} className="flex flex-col border-b border-slate-100 last:border-0">
                <div className="bg-[#FFF9E5] px-3 py-1.5 text-[13px] font-black text-slate-800 border-b border-slate-200 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Hash size={11} className="text-slate-500" />
                    <HighlightedText text={t.idToma} query={query} />
                    {hasMatch(t.idToma) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-1" title="Contiene coincidencias" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 tabular-nums">
                    <span>{extractFecha(t.latest.data)}</span>
                    <span className="opacity-30">|</span>
                    <span>{extractHora(t.latest.data)}</span>
                  </div>
                </div>
                {sortedRegs.map((r, rIdx) => {
                  const isActive = tIdx === activeIndex && rIdx === activeVersionIndex;
                  const isMatch = hasMatch(t.idToma, r.ordenToma);
                  const fecha = extractFecha(r.data);
                  const hora = extractHora(r.data);
                  const orden = r.ordenToma;

                  return (
                    <button
                       key={`${t.idToma}-${orden}`}
                      onClick={() => onSelect(tIdx, rIdx)}
                      className={`flex items-center text-[11px] transition-all border-b border-slate-50 last:border-0 ${
                        isActive 
                          ? 'bg-[#0074D9] text-white' 
                          : isMatch 
                            ? 'bg-amber-100/50 text-slate-700 hover:bg-amber-100' 
                            : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`px-3 py-2 w-10 font-black text-center border-r ${
                        isActive 
                          ? 'border-blue-400/30' 
                          : isMatch 
                            ? 'border-amber-200 text-amber-600 bg-amber-200/20' 
                            : 'border-slate-100 text-slate-400'
                      }`}>
                        {orden}
                      </span>
                      <div className="px-3 py-2 flex-1 flex items-center justify-end gap-1.5 tabular-nums overflow-hidden">
                        <span className={`font-bold truncate ${!isActive && isMatch ? 'text-amber-700' : ''}`}>
                          <HighlightedText text={fecha} query={query} />
                        </span>
                        <span className={`text-[9px] font-medium ${isActive ? 'text-blue-100' : isMatch ? 'text-amber-500' : 'text-slate-400'}`}>{hora}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          }

          const isActive = tIdx === activeIndex;
          const isMatch = hasMatch(t.idToma, t.latest?.ordenToma);
          const isLatest = tIdx === 0;
          const fecha = extractFecha(t.latest?.data || {});
          const hora = extractHora(t.latest?.data || {});
          const usuario = String(t.latest?.data['Usuario'] || t.latest?.data['USUARIO_TOMA'] || '');

          return (
            <button
              key={t.idToma}
              onClick={() => onSelect(tIdx, 0)}
              className={`group flex flex-col items-start gap-1.5 py-4 px-4 -ml-[2px] border-l-2 transition-all text-left rounded-r-xl ${
                isActive 
                  ? 'border-l-2 border-[var(--accent-clinical)] bg-[var(--accent-clinical)]/8' 
                  : isMatch
                    ? 'border-amber-400 bg-amber-500/5 hover:bg-amber-500/10'
                    : 'border-transparent hover:border-[var(--accent-clinical)]/50 hover:bg-[var(--accent-clinical)]/4'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className={`text-[11px] font-black flex items-center gap-1 ${
                  isActive 
                    ? 'text-[var(--accent-clinical)]' 
                    : isMatch
                      ? 'text-amber-600'
                      : 'text-[var(--text-secondary)]'
                }`}>
                  <Hash size={9} />
                  <HighlightedText text={t.idToma} query={query} />
                  {!isActive && isMatch && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
                  )}
                </span>
                {isLatest && (
                  <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                    Última
                  </span>
                )}
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${isActive ? 'text-[var(--accent-clinical)]' : isMatch ? 'text-amber-700' : 'text-[var(--text-primary)]'}`}>
                <Calendar size={10} className={isActive ? 'text-[var(--accent-clinical)]' : isMatch ? 'text-amber-500' : 'text-[var(--text-secondary)] opacity-60'} />
                <span><HighlightedText text={fecha} query={query} /></span>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isActive ? 'text-[var(--accent-clinical)]/70' : isMatch ? 'text-amber-600/70' : 'text-[var(--text-secondary)] opacity-70'}`}>
                <Clock size={9} />
                <span>{hora}</span>
              </div>
              {usuario && (
                <span className="text-[9px] text-[var(--text-secondary)] opacity-50 truncate max-w-[140px]">
                  <HighlightedText text={usuario} query={query} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// ─── Componente Principal HCEView ──────────────────────────────────────────────
export default function HCEView({ 
  results, currentIndex, query, onBack, onNavigate, formId, activeFilters,
  activeTomaIndex, activeVersionIndex, onTomaNavigate, debugMode, clinicalSchema
}: HCEViewProps) {
  const currentResult = results[currentIndex];
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);


  
  const [formMapping, setFormMapping] = useState<any>(FORMS[0]);

  useEffect(() => {
    if (!currentResult) return;
    let active = true;
    onTomaNavigate(0, 0);
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const p = await db.getFromStore(db.stores.patients, currentResult.nhc);
        
        // SSOT: Cargar mapping compilado en runtime desde IndexedDB
        let mapping = FORMS.find(f => f.id === formId);
        const runtimeMapping = await schemaRuntimeSync.getRuntimeMapping(formId);
        if (runtimeMapping) {
          mapping = runtimeMapping;
          console.log(`[HCEView] Usando mapping runtime para ${formId}`);
        }
        setFormMapping(mapping || FORMS[0]);

        if (active && p) {
          setPatient(p);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (active) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
        if (active) setLoading(false);
      }
    };
    fetchPatient();
    return () => { active = false; };
  }, [currentResult?.nhc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar navegación si el usuario está escribiendo en algún input (ej. el buscador de la cabecera)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < results.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, results.length, onNavigate]);

  // Scroll contextual: localiza y destaca el primer match en el visor HCE
  useEffect(() => {
    if (query && query.trim() !== '' && !loading && patient) {
      const timer = setTimeout(() => {
        const firstHighlight = document.querySelector('.highlight-match');
        if (firstHighlight) {
          firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [query, activeTomaIndex, activeVersionIndex, currentIndex, loading, patient]);

  const sortedTomas = useMemo(() => {
    if (!patient || !patient.tomas) return [];
    
    let tomasArray = Object.values(patient.tomas) as Toma[];
    if (activeFilters?.onlyLatestSnapshot && currentResult?.bestMatchUrl?.idToma) {
      tomasArray = tomasArray.filter(t => t.idToma === currentResult.bestMatchUrl.idToma);
      if (currentResult.bestMatchUrl.ordenToma && currentResult.bestMatchUrl.ordenToma > 0) {
        tomasArray = tomasArray.map(t => ({
          ...t,
          registros: t.registros.filter(r => r.ordenToma === currentResult.bestMatchUrl.ordenToma)
        }));
      }
    }
    
    return tomasArray.sort((a, b) => {
      const getTime = (t: Toma) => {
        if (!t || !t.latest || !t.latest.data) return 0;
        const dStr = String(t.latest.data['EC_Fecha_Toma'] || t.latest.data['FECHA_TOMA'] || '');
        const hStr = String(t.latest.data['HORA_TOMA'] || t.latest.data['EC_Hora_Toma'] || '');
        const ts = parseClinicalDate(dStr);
        if (!ts) return 0;
        
        // Si hay hora, intentamos añadirla al timestamp
        if (hStr && hStr.includes(':')) {
           const [h, m] = hStr.split(':').map(Number);
           if (!isNaN(h) && !isNaN(m)) {
               const d = new Date(ts);
               d.setHours(h, m, 0, 0);
               return d.getTime();
           }
        }
        return ts;
      };
      return getTime(b as unknown as Toma) - getTime(a as unknown as Toma);
    });
  }, [patient, activeFilters?.onlyLatestSnapshot, currentResult?.bestMatchUrl]);

  const activeToma = sortedTomas[activeTomaIndex];
  const sortedVersions = useMemo(() => {
    if (!activeToma) return [];
    let versions = [...activeToma.registros];
    
    if (activeFilters?.onlyLatestSnapshot && currentResult?.bestMatchUrl?.ordenToma && currentResult.bestMatchUrl.ordenToma > 0) {
      versions = versions.filter(v => v.ordenToma === currentResult.bestMatchUrl.ordenToma);
    }
    
    return versions.sort((a, b) => b.ordenToma - a.ordenToma);
  }, [activeToma, activeFilters?.onlyLatestSnapshot, currentResult?.bestMatchUrl]);
  const activeVersion = sortedVersions[activeVersionIndex];

  const hasNext = currentIndex < results.length - 1;
  const hasPrev = currentIndex > 0;
  const hasPrevToma = activeTomaIndex > 0;
  const hasNextToma = activeTomaIndex < sortedTomas.length - 1;
  const hasPrevVersion = activeVersionIndex > 0;
  const hasNextVersion = activeVersionIndex < sortedVersions.length - 1;

  if (!currentResult) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
        <h2 className="text-xl font-black text-[var(--accent-clinical)] uppercase tracking-widest">Error de Referencia</h2>
        <p className="text-sm text-[var(--text-secondary)] font-bold">No se ha podido localizar el expediente seleccionado.</p>
        <button onClick={onBack} className="mt-4 px-8 py-3 bg-[var(--accent-clinical)] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Volver a Resultados
        </button>
      </div>
    );
  }

  if (loading || !patient) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-clinical)] p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
        {/* Cabecera Demográfica Skeleton */}
        <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-[2rem] p-6 shadow-sm flex items-start justify-between">
          <div className="flex items-center gap-6 w-full">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-clinical)] animate-pulse border border-[var(--border-clinical)]"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-[var(--bg-clinical)] rounded-lg w-1/4 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-[var(--bg-clinical)] rounded-lg w-20 animate-pulse"></div>
                <div className="h-6 bg-[var(--bg-clinical)] rounded-lg w-24 animate-pulse"></div>
                <div className="h-6 bg-[var(--bg-clinical)] rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Panel Izquierdo Skeleton */}
          <div className="lg:w-80 flex flex-col gap-6 shrink-0">
            <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-[2rem] p-6 shadow-sm min-h-[300px]">
              <div className="h-5 bg-[var(--bg-clinical)] rounded-md w-1/2 mb-6 animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-16 bg-[var(--bg-clinical)] rounded-xl w-full animate-pulse"></div>
                <div className="h-16 bg-[var(--bg-clinical)] rounded-xl w-full animate-pulse"></div>
                <div className="h-16 bg-[var(--bg-clinical)] rounded-xl w-full animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Panel Derecho (Contenido Clínico) Skeleton */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-[2rem] p-6 shadow-sm min-h-[500px]">
              <div className="h-6 bg-[var(--bg-clinical)] rounded-md w-1/3 mb-8 animate-pulse"></div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="h-20 bg-[var(--bg-clinical)] rounded-xl animate-pulse"></div>
                <div className="h-20 bg-[var(--bg-clinical)] rounded-xl animate-pulse"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-[var(--bg-clinical)] rounded-md w-full animate-pulse"></div>
                <div className="h-4 bg-[var(--bg-clinical)] rounded-md w-11/12 animate-pulse"></div>
                <div className="h-4 bg-[var(--bg-clinical)] rounded-md w-9/12 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const demo = patient.demographics || {};
  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const renderedSections: any[] = [];
  
  // Taxonomía estricta basada en el orden del formulario definido en mappings.ts


  if (activeVersion) {

    // Agrupar subcategorías bajo categorías principales (ej: "01-ANTECEDENTES > PERS")
    const categoriesMap: Record<string, { title: string, subcategories: { title: string | null, fields: any[] }[] }> = {};
    const categoriesOrder: string[] = [];

    Object.entries(formMapping.visualCategories).forEach(([catKey, allowedKeys]) => {
      const parts = catKey.split('>').map(s => s.trim());
      const mainCatKey = parts[0];
      const subCatTitle = parts[1] || null;

      const categoryFields: { key: string, value: string | string[] }[] = [];
      const multivalueGroups: Record<string, string[]> = {};
      const processedParents = new Set<string>();

      (allowedKeys as string[]).forEach(key => {
        const value = activeVersion.data[key];
        
        // Exclusión de campos redundantes que ya están en cabecera o control
        const redundantFields = [
          'EDAD', 'EDAD TOMA', 'ÁMBITO', 'AMBITO', 'FINALIDAD DE LA TOMA:', 'REACCIONES ADVERSAS A FÁRMACOS',
          'N.H.C', 'NHC', 'CIPA', 'EC_SEXO', 'SEXO', 'FECHA DE NACIMIENTO', 'F_NACIMIENTO', 'DEMOG-CÓDIGO POSTAL', 'CP', 'C.P.',
          'ID_TOMA', 'IDENTIFICADOR TOMA', 'ORDEN_TOMA', 'VERSION REGISTRO', 'EC_FECHA_TOMA', 'FECHA TOMA', 'EC_PROCESO', 'PROCESO', 'EC_PROCESO2', 'PROCESO 2',
          'EC_USUARIO_CREADOR', 'CONTADOR', 'EC_CIUDAD_PACIENTE', 'CIUDAD', 'EC_ESTADO_CIVIL', 'ESTADO CIVIL', 'UNIDAD DE ENFERMERÍA', 'UNIDAD'
        ];
        if (redundantFields.includes(key.toUpperCase())) return;



        if (key.includes('$')) {

          const [parent, childRaw] = key.split('$');
          const child = childRaw.trim();
          
          if (!multivalueGroups[parent]) multivalueGroups[parent] = [];

          if (value !== undefined && value !== null && String(value).trim() !== '') {

            const strVal = String(value).trim().toUpperCase();
            const isPositive = ['SI', 'SÍ', 'TRUE', '1', 'POSITIVO', 'ACTIVO', 'DETECTADO'].includes(strVal);

            if (isPositive) {
              if (child !== '(Variables)') {
                multivalueGroups[parent].push(child);
              } else if (multivalueGroups[parent].length === 0) {
                multivalueGroups[parent].push(child);
              }
            } else {
              const isNegative = ['NO', 'FALSE', '0', 'NEGATIVO', 'INACTIVO', 'NO DETECTADO'].includes(strVal);
              if (!isNegative) {
                multivalueGroups[parent].push(`${child}: ${value}`);
              }
            }
          }


          // Limpiar "(Variables)" si han entrado otros campos más descriptivos
          if (multivalueGroups[parent].length > 1) {
            multivalueGroups[parent] = multivalueGroups[parent].filter(v => v !== '(Variables)');
          }

          if (!processedParents.has(parent)) {
            processedParents.add(parent);
            categoryFields.push({ key: `__MV__${parent}`, value: [] });
          }
        } else {
          categoryFields.push({ key, value: (value !== undefined && value !== null) ? String(value) : '' });
        }

      });

      const finalFields = categoryFields.map(f => {
        if (f.key.startsWith('__MV__')) {
          const parent = f.key.replace('__MV__', '');
          return { key: parent, value: multivalueGroups[parent] };
        }
        return f;
      }).filter(f => !Array.isArray(f.value) || f.value.length > 0);

      if (finalFields.length > 0) {
        if (!categoriesMap[mainCatKey]) {
          categoriesMap[mainCatKey] = { title: mainCatKey, subcategories: [] };
          categoriesOrder.push(mainCatKey);
        }
        
        // Evitar duplicidad: Si ya existe una subcategoría con título y esta es la "root" (null), 
        // o si esta tiene título y la root ya tiene estos campos, priorizamos la específica.
        const existingSub = categoriesMap[mainCatKey].subcategories.find(s => s.title === subCatTitle);
        if (existingSub) {
          existingSub.fields = [...existingSub.fields, ...finalFields];
        } else {
          categoriesMap[mainCatKey].subcategories.push({ title: subCatTitle, fields: finalFields });
        }
      }
    });

    // Post-procesamiento: Deduplicar campos entre la raíz (null) y las subcategorías con nombre
    // Y deduplicar por label (ej: "Grupo y RH" vs "Grupo y RH:")

    categoriesOrder.forEach(catKey => {
      const cat = categoriesMap[catKey];
      
      // 1. Deduplicar campos por etiqueta dentro de cada subcategoría
      cat.subcategories.forEach(sub => {
        const seen = new Set<string>();
        sub.fields = sub.fields.filter(f => {
          const lbl = cleanLabel(f.key);
          if (seen.has(lbl)) return false;
          seen.add(lbl);
          return true;
        });
      });

      // 2. Deduplicar entre raíz y subcategorías
      const rootSub = cat.subcategories.find(s => s.title === null);
      if (rootSub && cat.subcategories.length > 1) {
        const otherLabels = new Set(
          cat.subcategories
            .filter(s => s.title !== null)
            .flatMap(s => s.fields.map(f => cleanLabel(f.key)))
        );
        rootSub.fields = rootSub.fields.filter(f => !otherLabels.has(cleanLabel(f.key)));
      }
      
      cat.subcategories = cat.subcategories.filter(s => s.fields.length > 0);
    });


    // Convertir mapa a lista de secciones renderizables
    categoriesOrder.forEach(mainKey => {
      const cat = categoriesMap[mainKey];
      const isCatSelected = !activeFilters?.categories || activeFilters.categories.length === 0 || activeFilters.categories.some(filterCat => {
        const cleanFilter = normalizeString(filterCat).replace(/^\d{2}-/, '').trim();
        const cleanCat = normalizeString(cat.title).replace(/^\d{2}-/, '').trim();
        return cleanCat === cleanFilter || cleanCat.includes(cleanFilter) || filterCat.includes(cleanCat);
      });

      // ALWAYS push the section to show full history, regardless of filters
      renderedSections.push({ 
        title: cleanTitle(cat.title), 
        isSelected: isCatSelected,
        subcategories: cat.subcategories.map(sub => ({
          ...sub,
          title: sub.title ? cleanTitle(sub.title) : null
        }))
      } as any);
    });


    const excludedKeys = new Set([
      ...Object.keys(formMapping.keys).map(cleanKeyStr),
      ...Object.values(formMapping.keys).map(cleanKeyStr),
      ...Object.keys(formMapping.demographics).map(cleanKeyStr),
      ...Object.values(formMapping.demographics).map(cleanKeyStr),
      ...Object.values(formMapping.visualCategories).flat().map(cleanKeyStr),
      ...Object.keys(formMapping.headerAliases || {}).map(cleanKeyStr),
      ...Object.values(formMapping.headerAliases || {}).flat().map(cleanKeyStr),
      'NHC', 'N.H.C', 'ID_TOMA', 'ORDEN_TOMA', 'EC_FECHA_TOMA', 'FECHA_TOMA', 'FECHA', 'HORA', 'USUARIO', 'IDENTIFICADOR TOMA', 'VERSION REGISTRO',
      'FECHA OBSERVACION CLINICA', 'EC EDAD PACIENTE', 'EDAD TOMA', 'DEMOG DOMICILIO', 'CONTADOR', 'EC PROCESO', 'EC USUARIO CREADOR',
      'EC CIUDAD PACIENTE', 'EC ESTADO CIVIL', 'UNIDAD DE ENFERMERIA', 'UNIDAD ENFERMERIA',
      'ÁMBITO:', 'AMBITO:', '%INR', 'ACTO CLÍNICO RELACIONADO', 'ID ACTO CLÍNICO RELACIONADO',
      '_IS_DUPLICATE'
    ]);


    const unmappedFields: { key: string, value: string }[] = [];
    Object.entries(activeVersion.data).forEach(([key, value]) => {
       const cleanKey = cleanKeyStr(key);
       if (excludedKeys.has(cleanKey)) return;
       
       if (value !== undefined && value !== null && String(value).trim() !== '') {
         unmappedFields.push({ key, value: String(value) });
       }
    });
    
    if (unmappedFields.length > 0 && debugMode) {
      renderedSections.push({ title: 'Campos no mapeados (debug)', isSelected: true, subcategories: [{ title: null, fields: unmappedFields }] } as any);
    }

  }

  const fechaActiva = activeVersion ? extractFecha(activeVersion.data) : '--';
  const horaActiva = activeVersion ? extractHora(activeVersion.data) : '--';
  const ordenActivo = activeVersion?.ordenToma ?? 1;

  return (
    <div className="flex flex-col w-full pt-8 pb-40 clinical-surface">
      <div className="flex gap-8 items-start justify-center">
        <aside className="w-52 shrink-0 hidden lg:block">
          <TomaTimeline
            sortedTomas={sortedTomas}
            activeIndex={activeTomaIndex}
            activeVersionIndex={activeVersionIndex}
            isHCEALG={true}
            query={query}
            matchedRegistros={currentResult?.matchedRegistros}
            onSelect={(tIdx, vIdx) => { 
              onTomaNavigate(tIdx, vIdx); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
          />
        </aside>

        <div className="flex-1 min-w-0 max-w-4xl">
            <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl mb-4 shadow-sm overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 border-b border-[var(--border-clinical)] bg-[#FFF9E5]">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-[16px] font-black text-slate-800 uppercase">NHC:</span>
                  <span className="text-[20px] font-black text-slate-900">{patient.nhc}</span>
                </div>
                <HeaderField label="CIPA" value={demo['cipa'] || demo['CIPA']} />
                <HeaderField label="EC_Sexo" value={demo['sexo'] || demo['Sexo']} />
                  <HeaderField label="F_Nacimiento" value={demo['fechaNacimiento'] || demo['Fecha de Nacimiento']} />
                </div>

              <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 bg-white">
                <HeaderField label="C.P" value={demo['cp'] || demo['Código Postal']} />
                <HeaderField label="Edad" value={demo['edad'] || activeVersion?.data['Edad'] || activeVersion?.data['EDAD']} />
                <HeaderField label="AMBITO" value={demo['ambito'] || activeVersion?.data['Ámbito'] || activeVersion?.data['AMBITO']} />
                <HeaderField label="EC_Proceso2" value={activeVersion?.data['EC_Proceso2'] || activeVersion?.data['Proceso 2']} />
                <HeaderField label="UNIDAD" value={demo['unidadEnfermeria'] || demo['Unidad de Enfermería']} />
                <div className="flex-1" />
                <HeaderField 
                  label="ALERGIAS" 
                  value={demo['reacciones'] || demo['Alergias'] || activeVersion?.data['ALERGIAS'] || activeVersion?.data['Alergias']} 
                  highlight={!!(demo['reacciones'] || demo['Alergias'] || activeVersion?.data['ALERGIAS'] || activeVersion?.data['Alergias']) && String(demo['reacciones'] || demo['Alergias'] || activeVersion?.data['ALERGIAS'] || activeVersion?.data['Alergias']).toUpperCase() !== 'NO CONSTAN'} 
                />
              </div>
            </div>

          {activeToma ? (
            <>
                <div className="flex items-center gap-2 mb-4 hidden">
                  <button
                    disabled={!hasPrevToma}
                    onClick={() => { onTomaNavigate(activeTomaIndex - 1, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] rounded-lg disabled:opacity-20 transition-all"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50">
                    {activeTomaIndex + 1} / {sortedTomas.length}
                  </span>
                  <button
                    disabled={!hasNextToma}
                    onClick={() => { onTomaNavigate(activeTomaIndex + 1, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] rounded-lg disabled:opacity-20 transition-all"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>





              {clinicalSchema ? (
                <div className="flex flex-col gap-2">
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 shadow-sm">
                    <Eye size={14} />
                    Modo Visualización Dinámica: {clinicalSchema.name} v{clinicalSchema.version}
                  </div>
                  {clinicalSchema.sections
                    .sort((a, b) => a.order - b.order)
                    .map(section => (
                      <div key={section.id} className="bg-[var(--surface-clinical)] border-2 border-[var(--border-clinical)] rounded-3xl p-6 mb-6 shadow-md">
                        <DynamicSectionRenderer 
                          section={section}
                          data={activeVersion.data}
                          searchQuery={query}
                          debugMode={debugMode}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                renderedSections.map((section, sIdx) => {
                const isAnamnesis = section.title.toUpperCase().includes('ANAMNESIS') || section.title.toUpperCase().includes('EXPLORACION');
                const isAntecedentesSection = section.title.toUpperCase().includes('ANTECEDENTES');
                
                const shouldBeGrid = (sub: any) => {
                  const gridKeywords = [
                    'HEMATOLOGIA', 'BIOQUIMICA', 'COAGULACION', 'ORINA', 'SEROLOGIAS', 'ANALITICAS', 
                    'DATACION', 'CERVIX', 'ESTETICA', 'SCREENING', 'GESTACIÓN', 'GESTACION', 
                    'ANTECEDENTES OBS', 'VISITA CONTROL', 'EXPLORACION OBSTÉTRICA',
                    'ANALITICA', 'CONSTANTES', 'TECNICA'
                  ];



                  const sectionMatch = gridKeywords.some(k => section.title.toUpperCase().includes(k));
                  const titleMatch = sub.title && gridKeywords.some(k => sub.title.toUpperCase().includes(k));
                  return sectionMatch || titleMatch;
                };



                return (
                  <div key={section.title} className={`bg-[var(--surface-clinical)] border-2 border-[var(--border-clinical)] rounded-3xl p-6 mb-6 shadow-md ${section.title === 'Campos no mapeados (debug)' ? 'bg-red-950/10 border-red-500/30' : ''}`}>
                    <SectionHeader label={section.title} />
                    
                    <div className="flex flex-col gap-6">
                      {section.subcategories.map((sub: any, subIdx: number) => {
                        const isGrid = shouldBeGrid(sub) || (isAntecedentesSection && formId === 'hce_obs');
                        const isTechnicalGrid = isGrid && formId === 'hce_obs';
                        
                        let fields = sub.fields.filter((f: any) => isAntecedentesSection || !CONSTANT_FIELDS.has(f.key.toUpperCase()));

                        if (!debugMode && !isTechnicalGrid) {
                          fields = fields.filter((f: any) => f.value !== undefined && f.value !== null && String(f.value).trim() !== '');
                        }

                        if (fields.length === 0 && !(sub.title?.toUpperCase() === 'CONSTANTES')) return null;

                        const narrativeFields = fields.filter((f: any) => 
                          NARRATIVE_FIELDS.has(f.key.toUpperCase()) || 
                          (String(f.value).length > 40 && !isGrid)
                        );
                        const tabularFields = fields.filter((f: any) => !narrativeFields.includes(f));

                        return (
                          <div key={sub.title || subIdx} className="flex flex-col gap-4">
                            {sub.title && sub.title.toUpperCase() !== 'ANTECEDENTES PERSONALES' && (narrativeFields.length > 0 || !isGrid) && (
                              <div className="mb-2">
                                <div className="bg-[#0056b3] text-white px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-slate-800 w-full shadow-sm">
                                  {sub.title}:
                                </div>
                              </div>
                            )}

                            {/* Campos narrativos (Texto) */}
                            <div className="flex flex-col gap-4">
                              {narrativeFields
                                .filter((f: any) => debugMode || (f.value !== undefined && f.value !== null && String(f.value).trim() !== ''))
                                .map((f: any) => (
                                <ClinicalField 
                                  key={f.key}
                                  label={f.key} 
                                  value={f.value} 
                                  query={query} 
                                  highlight={queryTokens.some(t => String(f.value).toLowerCase().includes(t))} 
                                />
                              ))}
                            </div>


                            {/* Campos tabulares (Tabla) */}
                            {tabularFields.length > 0 && (
                              isGrid ? (
                                <ClinicalGrid 
                                  title={sub.title || section.title} 
                                  fields={tabularFields} 
                                  query={query} 
                                  showEmpty={debugMode || isTechnicalGrid} 
                                />
                              ) : (


                                <div className="flex flex-col gap-4">
                                  {tabularFields.map((f: any) => {
                                    const isAfterExploracion = !sub.title && (f.key.toUpperCase().includes('EXPLORACIÓN FÍSICA') || f.key.toUpperCase().includes('EXPLORACION FISICA'));
                                    return (
                                      <div key={f.key}>
                                        <ClinicalField 
                                          label={f.key} 
                                          value={f.value} 
                                          query={query} 
                                          highlight={queryTokens.some(t => String(f.value).toLowerCase().includes(t))} 
                                          shouldHighlight={true}
                                        />
                                        {isAfterExploracion && (
                                          <ClinicalConstants data={activeVersion.data} query={query} formId={formId} shouldHighlight={true} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )
                            )}


                            {/* Ubicación original: Subcategoría CONSTANTES en OBS */}
                            {sub.title?.toUpperCase() === 'CONSTANTES' && (
                              <ClinicalConstants data={activeVersion.data} query={query} formId={formId} shouldHighlight={true} />
                            )}
                          </div>
                        );
                      })}


                      
                      {/* Caso de seguridad para MIR/ALG si no se renderizó arriba */}
                      {isAnamnesis && formId !== 'hce_obs' && 
                       !section.subcategories.some((sub: any) => sub.fields.some((f: any) => f.key.toUpperCase().includes('EXPLORACIÓN FÍSICA'))) && (
                        <ClinicalConstants data={activeVersion.data} query={query} formId={formId} shouldHighlight={true} />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            </>
          ) : (
            <div className="text-center py-20 text-[var(--text-secondary)] font-bold">
              No hay tomas disponibles para este paciente.
            </div>
          )}
        </div>
        <aside className="w-52 shrink-0 hidden lg:block" />
      </div>
    </div>
  );
}
