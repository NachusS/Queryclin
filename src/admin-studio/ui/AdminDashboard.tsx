import React, { useEffect, useState } from 'react';
import { ClinicalFormSchema } from '../domain/types';
import { schemaStore } from '../store/SchemaStore';
import { ImportWizard } from '../importer/ImportWizard';
import { TemplateGenerator } from '../mapper/TemplateGenerator';
import { CLINICAL_RESOURCES } from '../domain/resources';

export function AdminDashboard({ onSelectSchema }: { onSelectSchema: (id: string) => void }) {
  const [schemas, setSchemas] = useState<ClinicalFormSchema[]>([]);
  const [view, setView] = useState<'list' | 'import' | 'templates' | 'resources'>('list');

  useEffect(() => {
    loadSchemas();
  }, [view]);

  const loadSchemas = async () => {
    const allSchemas = await schemaStore.getAllSchemas();
    setSchemas(allSchemas.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleDeleteSchema = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("¿Estás seguro de que deseas eliminar permanentemente este formulario? Esta acción no se puede deshacer.")) return;
    await schemaStore.deleteSchema(id);
    loadSchemas();
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    const newSchema = TemplateGenerator.generateFromTemplate(templateId);
    if (newSchema) {
      await schemaStore.saveSchema(newSchema);
      onSelectSchema(newSchema.id);
    }
  };

  const handleCreateFromResource = async (resourceKey: keyof typeof CLINICAL_RESOURCES) => {
    const name = prompt(`Nombre para el nuevo formulario ${resourceKey}:`, `Nuevo Formulario ${resourceKey}`);
    if (!name) return;

    const rawHeaders = CLINICAL_RESOURCES[resourceKey];
    const newSchema = TemplateGenerator.generateFromRawHeaders(name, rawHeaders);
    await schemaStore.saveSchema(newSchema);
    onSelectSchema(newSchema.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <span className="bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success-border)] text-[10px] font-black px-2 py-1 rounded uppercase">Publicado</span>;
      case 'draft': return <span className="bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning-border)] text-[10px] font-black px-2 py-1 rounded uppercase">Borrador</span>;
      default: return <span className="bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-[10px] font-black px-2 py-1 rounded uppercase">{status}</span>;
    }
  };

  if (view === 'import') {
    return (
      <div className="p-8">
        <button 
          onClick={() => setView('list')}
          className="mb-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm uppercase tracking-wider flex items-center gap-2"
        >
          &larr; Volver al Dashboard
        </button>
        <ImportWizard onComplete={(id) => onSelectSchema(id)} />
      </div>
    );
  }

  if (view === 'templates') {
    return (
      <div className="max-w-4xl mx-auto p-8 font-sans">
        <button 
          onClick={() => setView('list')}
          className="mb-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm uppercase tracking-wider flex items-center gap-2"
        >
          &larr; Volver al Dashboard
        </button>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">Elegir Plantilla Base</h2>
        <p className="text-[var(--text-secondary)] mb-8 font-medium">Clona la estructura de un formulario oficial para personalizarlo.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TemplateGenerator.getAvailableTemplates().map(tpl => (
            <button 
              key={tpl.id}
              onClick={() => handleCreateFromTemplate(tpl.id)}
              className="bg-[var(--surface-clinical)] border-2 border-[var(--border-clinical)] hover:border-[var(--accent-clinical)] rounded-2xl p-8 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-[var(--bg-clinical)] rounded-xl flex items-center justify-center text-[var(--text-secondary)] mb-6 group-hover:bg-[var(--accent-clinical)]/10 group-hover:text-[var(--accent-clinical)] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V7m-4 4h1m-5 4h5" /></svg>
              </div>
              <h3 className="font-black text-[var(--text-primary)] text-lg uppercase tracking-tight">{tpl.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-widest opacity-60">Estructura Oficial</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'resources') {
    return (
      <div className="max-w-4xl mx-auto p-8 font-sans">
        <button 
          onClick={() => setView('list')}
          className="mb-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm uppercase tracking-wider flex items-center gap-2"
        >
          &larr; Volver al Dashboard
        </button>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">Biblioteca de Recursos</h2>
        <p className="text-[var(--text-secondary)] mb-8 font-medium">Crea un formulario nuevo usando las cabeceras canónicas (sin diseño previo).</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(CLINICAL_RESOURCES) as Array<keyof typeof CLINICAL_RESOURCES>).map(resKey => (
            <button 
              key={resKey}
              onClick={() => handleCreateFromResource(resKey)}
              className="bg-[var(--surface-clinical)] border-2 border-emerald-100/20 dark:border-emerald-500/20 hover:border-emerald-500 rounded-2xl p-8 text-left transition-all hover:shadow-xl group"
            >
              <div className="w-12 h-12 bg-[var(--status-success-bg)] rounded-xl flex items-center justify-center text-[var(--status-success-text)] mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-black text-[var(--text-primary)] text-lg uppercase tracking-tight">Base {resKey}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-widest opacity-60">Todos los campos disponibles</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2">Admin Studio</h1>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-[var(--accent-clinical)] rounded-full animate-pulse"></span>
             <p className="text-[var(--text-secondary)] font-bold uppercase text-[10px] tracking-[0.3em]">Governance & Taxonomy Control</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setView('resources')}
            className="flex items-center gap-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] hover:border-emerald-500 text-[var(--text-primary)] font-bold py-3 px-6 rounded-2xl shadow-sm transition-all text-xs uppercase tracking-widest active:scale-95"
          >
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            Biblioteca
          </button>
          <button 
            onClick={() => setView('templates')}
            className="flex items-center gap-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] hover:border-[var(--accent-clinical)] text-[var(--text-primary)] font-bold py-3 px-6 rounded-2xl shadow-sm transition-all text-xs uppercase tracking-widest active:scale-95"
          >
            <svg className="w-4 h-4 text-[var(--accent-clinical)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Usar Plantilla
          </button>
          <button 
            onClick={() => setView('import')}
            className="flex items-center gap-2 bg-[var(--accent-clinical)] hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all text-xs uppercase tracking-widest active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Importar Datos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {schemas.map(schema => (
          <div 
            key={schema.id} 
            className="relative bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-3xl shadow-sm hover:shadow-xl hover:border-[var(--accent-clinical)]/30 transition-all p-8 flex flex-col group cursor-pointer overflow-hidden" 
            onClick={() => onSelectSchema(schema.id)}
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-clinical)]/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-12 h-12 bg-[var(--bg-clinical)] rounded-2xl flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent-clinical)] group-hover:text-white transition-all duration-300 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(schema.status)}
                <button 
                  onClick={(e) => handleDeleteSchema(e, schema.id)}
                  className="p-2 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-600 rounded-xl transition-all"
                  title="Eliminar Formulario"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 leading-tight group-hover:text-[var(--accent-clinical)] transition-colors relative z-10">{schema.name}</h3>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] opacity-40 mb-8 font-mono tracking-widest relative z-10">ID: {schema.id.toUpperCase()} | VER: {schema.version}</p>
            
            <div className="mt-auto pt-6 border-t border-[var(--border-clinical)] flex justify-between items-center text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] relative z-10">
              <span className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                 {schema.sections.length} Secciones
              </span>
              <span>{new Date(schema.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {schemas.length === 0 && (
          <div className="col-span-full text-center py-20 bg-[var(--bg-clinical)] rounded-xl border-2 border-dashed border-[var(--border-clinical)]">
            <h3 className="text-[var(--text-secondary)] font-bold text-lg mb-2">No hay formularios clínicos</h3>
            <p className="text-[var(--text-secondary)]/70 mb-6">Importa un archivo XLSX/CSV para generar el primer esquema automáticamente.</p>
            <button 
              onClick={() => setView('import')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-md shadow-sm transition-colors text-sm uppercase tracking-wider"
            >
              Iniciar Asistente de Importación
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
