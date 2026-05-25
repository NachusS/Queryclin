import React, { useState } from 'react';
import { read, utils } from 'xlsx';
import { AutoMapper } from '../mapper/AutoMapper';
import { schemaStore } from '../store/SchemaStore';
import { ClinicalFormSchema } from '../domain/types';

export function ImportWizard({ onComplete }: { onComplete: (schemaId: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [draftSchema, setDraftSchema] = useState<ClinicalFormSchema | null>(null);
  const [step, setStep] = useState<number>(1);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    const buffer = await uploadedFile.arrayBuffer();
    const workbook = read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parsear solo la cabecera (1 fila)
    const json = utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    if (json.length > 0) {
      const detectedColumns = json[0]
        .map(String)
        .filter(c => c.trim() !== '')
        // Limpiar retornos de carro
        .map(c => c.replace(/\r/g, '').trim());
      
      setColumns(detectedColumns);
      setStep(2);
    }
  };

  const handleGenerateSchema = async () => {
    if (columns.length === 0) return;
    const schema = AutoMapper.generateDraftSchema(file?.name || 'Nuevo Formulario', columns);
    setDraftSchema(schema);
    
    // Guardar el draft en la BBDD
    await schemaStore.saveSchema(schema);
    setStep(3);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 mt-8">
      <h1 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-wider">
        Creador Automático de Plantillas
      </h1>
      <p className="text-sm text-slate-500 mb-6 pb-4 border-b border-emerald-500">
        Analiza un archivo Excel o CSV para auto-generar un formulario clínico a medida.
      </p>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-slate-600 font-medium">1. Selecciona un archivo Excel (XLSX) o CSV para analizar su estructura de cabeceras.</p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".xlsx,.csv,.txt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload} 
            />
            <span className="text-slate-500 font-bold">Haz clic o arrastra un archivo clínico aquí</span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <p className="text-emerald-700 font-bold bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            ✅ Archivo analizado con éxito. Se han detectado {columns.length} columnas distintas.
          </p>
          
          <div className="max-h-64 overflow-y-auto bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs">
            {columns.map((c, i) => (
              <div key={i} className="mb-1">{String(i + 1).padStart(3, '0')} | {c}</div>
            ))}
          </div>

          <button 
            onClick={handleGenerateSchema}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg uppercase tracking-widest transition-colors shadow-md self-start"
          >
            Generar Schema Inicial (Auto-Mapping)
          </button>
        </div>
      )}

      {step === 3 && draftSchema && (
        <div className="flex flex-col gap-6">
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">¡Schema Generado! </strong>
            <span className="block sm:inline">El modelo inicial ha sido guardado en IndexedDB como Draft.</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2">Secciones Detectadas:</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {draftSchema.sections.map(s => <li key={s.id}>{s.title} ({s.groups.length} grupos)</li>)}
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-700 mb-2">Resumen de Mapeo:</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                <li>Cabeceras: {draftSchema.header[0]?.fields.length || 0}</li>
                <li>Multivalores ($): {draftSchema.sections.find(s => s.id === 'sec-multivalues')?.groups.length || 0} grupos</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={() => draftSchema && onComplete(draftSchema.id)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-lg uppercase tracking-widest transition-colors shadow-md self-start mt-4"
          >
            Continuar al Editor Visual (Form Designer) &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
