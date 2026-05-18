import React, { useEffect, useState, useCallback } from 'react';
import { FormSchema, Field, Group, Section } from '../domain/schema';
import { schemaStore } from '../store/SchemaStore';
import { DndContext, useDraggable, useDroppable, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { Trash2, Plus, Settings2, Move, Layout, Eye, Search, Columns, ShieldAlert, Database, Clock } from 'lucide-react';
import { TaxonomyPanel } from './TaxonomyPanel';
import { PreviewPanel } from './PreviewPanel';
import { VersionSelector } from './VersionSelector';

interface FormDesignerProps {
  schemaId: string;
  onBack: () => void;
}

/**
 * Componente para campos en la paleta (izquierda)
 */
function DraggablePaletteField({ field }: { field: Field, key?: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${field.id}`,
    data: { field, source: 'palette' }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`group border border-[var(--border-clinical)] rounded-xl p-3 bg-[var(--surface-clinical)] text-[var(--text-primary)] text-[11px] font-bold uppercase tracking-wider cursor-grab hover:border-[var(--accent-clinical)] transition-all shadow-sm mb-2 ${isDragging ? 'opacity-30' : 'hover:shadow-md'}`}
      title={field.label}
    >
      <div className="flex items-center justify-between">
        <span className="truncate pr-2"><span className="text-[var(--accent-clinical)] mr-2 opacity-50">⋮⋮</span> {field.label}</span>
        {field.multivalue && <span className="shrink-0 bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded text-[8px] border border-purple-500/20">MV</span>}
      </div>
    </div>
  );
}

/**
 * Componente para campos en el lienzo (centro)
 */
function DraggableCanvasField({ field, isSelected, onClick }: { field: Field, isSelected: boolean, onClick: (e: React.MouseEvent) => void, key?: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `canvas-${field.id}`,
    data: { field, source: 'canvas' }
  });

  return (
    <div 
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`group relative text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all border cursor-pointer select-none ${isDragging ? 'opacity-0' : ''} ${isSelected ? 'bg-[var(--accent-clinical)] text-white border-[var(--accent-clinical)] ring-4 ring-[var(--accent-clinical)]/10' : 'bg-[var(--bg-clinical)] text-[var(--text-primary)] border-[var(--border-clinical)] hover:border-[var(--accent-clinical)]/50'}`}
    >
      <Move size={12} className={isSelected ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'} />
      <span className="truncate">{field.label}</span>
      {field.multivalue && <span className={`px-1 rounded text-[8px] ml-auto ${isSelected ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-500'}`}>MV</span>}
    </div>
  );
}

/**
 * Área de destino para grupos
 */
function DroppableGroup({ group, children, isSelected, onClick, onDelete }: { group: Group, children: React.ReactNode, isSelected: boolean, onClick: (e: React.MouseEvent) => void, onDelete: () => void, key?: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `group-${group.id}`,
    data: { groupId: group.id, type: 'group' }
  });

  return (
    <div 
      ref={setNodeRef} 
      onClick={onClick}
      className={`relative group bg-[var(--surface-clinical)] border-2 rounded-3xl p-6 mb-4 transition-all duration-300 ${isOver ? 'border-[var(--accent-clinical)] bg-[var(--accent-clinical)]/5 scale-[1.01] shadow-2xl' : isSelected ? 'border-[var(--accent-clinical)] bg-[var(--accent-clinical)]/5 ring-4 ring-[var(--accent-clinical)]/5' : 'border-[var(--border-clinical)]/50 hover:border-[var(--border-clinical)]'}`}
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[var(--accent-clinical)] text-white' : 'bg-[var(--bg-clinical)] text-[var(--text-secondary)]'}`}>
            <Layout size={12} />
          </div>
          <h4 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-wider">
            {group.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-[var(--text-secondary)] opacity-40 uppercase tracking-widest bg-[var(--bg-clinical)] px-2 py-0.5 rounded border border-[var(--border-clinical)]">{group.layout} {group.layout === 'grid' && `(${group.columns || 2} col)`}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-red-500/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className={`min-h-[60px] transition-all ${group.layout === 'grid' ? 'grid gap-3' : 'flex flex-wrap gap-3'}`} style={group.layout === 'grid' ? { gridTemplateColumns: `repeat(${group.columns || 2}, minmax(0, 1fr))` } : {}}>
        {children}
        {isOver && <div className="border-2 border-dashed border-[var(--accent-clinical)]/40 bg-[var(--accent-clinical)]/10 rounded-xl min-w-[120px] h-9 animate-pulse flex items-center justify-center text-[var(--accent-clinical)] text-[10px] font-black uppercase tracking-tighter">Soltar aquí</div>}
      </div>
    </div>
  );
}

/**
 * Área de destino para la paleta (para eliminar campos del lienzo)
 */
function DroppablePalette({ children, isOver }: { children: React.ReactNode, isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: 'palette-area',
    data: { type: 'palette' }
  });

  return (
    <aside 
      ref={setNodeRef}
      className={`w-80 border-r border-[var(--border-clinical)] shadow-sm flex flex-col z-0 transition-all duration-500 ${isOver ? 'bg-red-500/10 border-red-500/30' : 'bg-[var(--surface-clinical)]'}`}
    >
      {children}
    </aside>
  );
}


export function FormDesigner({ schemaId, onBack }: FormDesignerProps) {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [activeField, setActiveField] = useState<Field | null>(null);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [selectedElement, setSelectedElement] = useState<{ type: 'field' | 'group' | 'section', id: string, data: any } | null>(null);
  const [isOverPalette, setIsOverPalette] = useState(false);
  const [activeTab, setActiveTab] = useState<'props' | 'taxonomy' | 'preview' | 'history'>('props');

  useEffect(() => {
    loadSchema();
  }, [schemaId]);

  const loadSchema = async () => {
    const loaded = await schemaStore.getSchema(schemaId);
    setSchema(loaded);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveField(active.data.current?.field || null);
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    setIsOverPalette(over?.id === 'palette-area');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveField(null);
    setIsOverPalette(false);
    const { active, over } = event;
    if (!over || !schema) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    // Clonación profunda solo para D&D para evitar mutaciones directas molestas
    const newSchema = JSON.parse(JSON.stringify(schema)) as FormSchema;
    const fieldToMove = activeData.field as Field;
    
    if (!fieldToMove) {
      console.warn('[FormDesigner] No se encontró el campo a mover en activeData');
      return;
    }

    // Limpieza previa (si el campo ya estaba en el lienzo, lo quitamos de su grupo anterior)
    if (activeData.source === 'canvas' || (activeData.source === 'palette' && overData.type === 'group')) {
        newSchema.sections.forEach(section => {
            section.groups.forEach(group => {
                group.fields = group.fields.filter(f => f.id !== fieldToMove.id);
            });
        });
        newSchema.unassignedFields = newSchema.unassignedFields?.filter(f => f.id !== fieldToMove.id) || [];
    }

    // CASO 1: A un Grupo
    if (overData.type === 'group') {
      const targetGroupId = overData.groupId;
      for (const section of newSchema.sections) {
        const group = section.groups.find(g => g.id === targetGroupId);
        if (group) {
          group.fields.push(fieldToMove);
          break;
        }
      }
    }

    // CASO 2: A la Paleta (Desasignar)
    else if (overData.type === 'palette') {
      if (!newSchema.unassignedFields) newSchema.unassignedFields = [];
      newSchema.unassignedFields.push(fieldToMove);
      if (selectedElement?.id === fieldToMove.id) setSelectedElement(null);
    }

    setSchema(newSchema);
    await schemaStore.saveSchema(newSchema);
  };

  const handleAddGroup = async (sectionId: string) => {
    if (!schema) return;
    const newSchema = { ...schema, sections: [...schema.sections] };
    const sectionIndex = newSchema.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex !== -1) {
      const section = { ...newSchema.sections[sectionIndex] };
      section.groups = [...section.groups, {
        id: `grp-${Date.now()}`,
        title: 'Nuevo Grupo Dinámico',
        layout: 'stack',
        fields: []
      }];
      newSchema.sections[sectionIndex] = section;
      setSchema(newSchema);
      await schemaStore.saveSchema(newSchema);
    }
  };

  const handleDeleteGroup = async (sectionId: string, groupId: string) => {
    if (!schema || !window.confirm("¿Deseas eliminar este grupo? Los campos volverán a la paleta.")) return;
    const newSchema = JSON.parse(JSON.stringify(schema)) as FormSchema;
    const section = newSchema.sections.find(s => s.id === sectionId);
    if (section) {
      const group = section.groups.find(g => g.id === groupId);
      if (group) {
        newSchema.unassignedFields = [...(newSchema.unassignedFields || []), ...group.fields];
        section.groups = section.groups.filter(g => g.id !== groupId);
        setSchema(newSchema);
        await schemaStore.saveSchema(newSchema);
        if (selectedElement?.id === groupId) setSelectedElement(null);
      }
    }
  };

  const handleAddSection = async () => {
    if (!schema) return;
    const newSection: Section = {
      id: `sec-${Date.now()}`,
      title: 'Nueva Sección de Trabajo',
      order: schema.sections.length + 1,
      collapsible: true,
      groups: []
    };
    const newSchema = { ...schema, sections: [...schema.sections, newSection] };
    setSchema(newSchema);
    await schemaStore.saveSchema(newSchema);
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!schema || !window.confirm("¿Eliminar sección completa? Todos sus campos volverán a la paleta.")) return;
    const newSchema = JSON.parse(JSON.stringify(schema)) as FormSchema;
    const section = newSchema.sections.find(s => s.id === sectionId);
    if (section) {
        const orphanFields: Field[] = [];
        section.groups.forEach(g => orphanFields.push(...g.fields));
        newSchema.unassignedFields = [...(newSchema.unassignedFields || []), ...orphanFields];
        newSchema.sections = newSchema.sections.filter(s => s.id !== sectionId);
        setSchema(newSchema);
        await schemaStore.saveSchema(newSchema);
        if (selectedElement?.id === sectionId) setSelectedElement(null);
    }
  };

  const handleResetSchema = async () => {
    if (!schema || !window.confirm("¿Restablecer lienzo? Todos los campos volverán a la paleta y se eliminarán grupos y secciones.")) return;
    const newSchema = JSON.parse(JSON.stringify(schema)) as FormSchema;
    const allFields: Field[] = [...(newSchema.unassignedFields || [])];
    newSchema.sections.forEach(section => {
      section.groups.forEach(group => allFields.push(...group.fields));
    });
    newSchema.sections = [{ id: 'sec-1', title: 'Información Principal', order: 1, collapsible: false, groups: [] }];
    newSchema.unassignedFields = allFields;
    setSchema(newSchema);
    setSelectedElement(null);
    await schemaStore.saveSchema(newSchema);
  };

  const handlePublishSchema = async () => {
    if (!schema || !window.confirm("¿Publicar esquema oficialmente?")) return;
    const allSchemas = await schemaStore.getAllSchemas();
    for (const s of allSchemas) {
      if (s.name === schema.name && s.status === 'published' && s.id !== schema.id) {
        s.status = 'draft';
        await schemaStore.saveSchema(s);
      }
    }
    const newSchema = { ...schema, status: 'published' as const, updatedAt: Date.now() };
    setSchema(newSchema);
    await schemaStore.saveSchema(newSchema);
    alert("¡Esquema publicado con éxito!");
  };

  const updateElementProperty = async (property: string, value: any) => {
    if (!schema || !selectedElement) return;
    const newSchema = JSON.parse(JSON.stringify(schema)) as FormSchema;
    
    if (selectedElement.type === 'field') {
      newSchema.sections.forEach(s => s.groups.forEach(g => {
        const field = g.fields.find(f => f.id === selectedElement.id);
        if (field) (field as any)[property] = value;
      }));
    } else if (selectedElement.type === 'group') {
      newSchema.sections.forEach(s => {
        const group = s.groups.find(g => g.id === selectedElement.id);
        if (group) (group as any)[property] = value;
      });
    } else if (selectedElement.type === 'section') {
      const section = newSchema.sections.find(s => s.id === selectedElement.id);
      if (section) (section as any)[property] = value;
    }

    setSchema(newSchema);
    await schemaStore.saveSchema(newSchema);
    setSelectedElement({ ...selectedElement, data: { ...selectedElement.data, [property]: value } });
  };

  if (!schema) return <div className="p-8 text-center text-[var(--accent-clinical)] font-black animate-pulse uppercase tracking-[0.3em] text-xs h-screen flex items-center justify-center bg-[var(--bg-clinical)]">Iniciando Motor de Diseño...</div>;

  return (
    <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex flex-col h-screen bg-[var(--bg-clinical)] font-sans overflow-hidden">
        
        {/* Designer Header */}
        <header className="bg-[var(--surface-clinical)] border-b border-[var(--border-clinical)] px-6 py-4 flex justify-between items-center shadow-sm z-20 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack} 
              className="p-2.5 hover:bg-[var(--bg-clinical)] rounded-2xl transition-all text-[var(--text-secondary)] active:scale-90 border border-transparent hover:border-[var(--border-clinical)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                 <input
                   type="text"
                   value={schema.name}
                   onChange={(e) => setSchema({ ...schema, name: e.target.value })}
                   onBlur={async () => {
                     if (schema) await schemaStore.saveSchema(schema);
                   }}
                   className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase leading-none bg-transparent border-b border-transparent hover:border-[var(--border-clinical)] focus:border-[var(--accent-clinical)] focus:outline-none px-1 transition-colors"
                   title="Haz clic para editar el nombre del formulario"
                 />
                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${schema.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'} uppercase tracking-widest`}>
                    {schema.status}
                 </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                 <span className="text-[9px] text-[var(--accent-clinical)] font-bold font-mono tracking-widest opacity-60">REF: {schema.id.split('-').pop()?.toUpperCase()}</span>
                 <div className="w-1 h-1 bg-[var(--border-clinical)] rounded-full"></div>
                 <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">v{schema.version}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleResetSchema}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              Resetear Lienzo
            </button>
            <button 
              onClick={handlePublishSchema}
              className="bg-[var(--accent-clinical)] hover:bg-blue-700 text-white px-8 py-3 text-[10px] font-black rounded-2xl uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Publicar Cambios
            </button>
          </div>
        </header>

        {/* Designer Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Palette Panel */}
          <DroppablePalette isOver={isOverPalette}>
            <div className={`p-6 border-b border-[var(--border-clinical)] flex flex-col gap-5 transition-all ${isOverPalette ? 'bg-red-500/5' : 'bg-[var(--bg-clinical)]/30'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Database size={12} className="text-[var(--accent-clinical)]" />
                  <span>{isOverPalette ? 'SOLTAR PARA ELIMINAR' : 'CATÁLOGO DE CAMPOS'}</span>
                </h2>
                {!isOverPalette && <span className="text-[9px] font-bold bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] px-2 py-0.5 rounded-full">{schema.unassignedFields?.length || 0}</span>}
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)] opacity-40 group-focus-within:opacity-100 transition-opacity" />
                <input 
                  type="text" 
                  placeholder="Filtrar taxonomía..."
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  className="w-full bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] transition-all outline-none placeholder:opacity-30"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col hide-scrollbar space-y-2">
              {isOverPalette && (
                <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-red-500/20 rounded-3xl p-8 text-center animate-pulse">
                   <Trash2 className="w-12 h-12 text-red-500/30 mb-4" />
                   <p className="text-[10px] font-black text-red-500/50 uppercase tracking-widest">Suelta el campo aquí para quitarlo del formulario</p>
                </div>
              )}
              {!isOverPalette && schema.unassignedFields && schema.unassignedFields.length > 0 ? (
                schema.unassignedFields
                  .filter(f => f.label.toLowerCase().includes(paletteSearch.toLowerCase()) || f.sourceField.toLowerCase().includes(paletteSearch.toLowerCase()))
                  .map(field => (
                    <DraggablePaletteField key={field.id} field={field} />
                  ))
              ) : !isOverPalette && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20 border-2 border-dashed border-[var(--border-clinical)] rounded-3xl">
                  <Database className="w-10 h-10 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No hay más campos disponibles</p>
                </div>
              )}
            </div>
          </DroppablePalette>

          {/* Clinical Canvas */}
          <main className="flex-1 overflow-y-auto bg-[var(--bg-clinical)] p-12 hide-scrollbar">
            <div className="max-w-4xl mx-auto space-y-10 pb-20">
              
              {schema.sections.map(section => (
                <section 
                  key={section.id} 
                  onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'section', id: section.id, data: section }); }}
                  className={`group/sec relative bg-[var(--surface-clinical)] border-2 rounded-[2.5rem] p-10 transition-all duration-500 ${selectedElement?.id === section.id ? 'border-[var(--accent-clinical)] shadow-2xl shadow-blue-500/10' : 'border-[var(--border-clinical)] hover:border-[var(--accent-clinical)]/30'}`}
                >
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${selectedElement?.id === section.id ? 'bg-[var(--accent-clinical)] text-white' : 'bg-[var(--bg-clinical)] text-[var(--text-secondary)]'}`}>
                          {section.order}
                       </div>
                       <h3 className="font-black text-[var(--text-primary)] tracking-tighter uppercase text-base">{section.title}</h3>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                        className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover/sec:opacity-100"
                        title="Eliminar Sección"
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {section.groups.map(group => (
                      <DroppableGroup 
                        key={group.id} 
                        group={group}
                        isSelected={selectedElement?.id === group.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'group', id: group.id, data: group }); }}
                        onDelete={() => handleDeleteGroup(section.id, group.id)}
                      >
                        {group.fields.filter(Boolean).map((f, idx) => (
                          <DraggableCanvasField 
                            key={`${f.id}-${idx}`} 
                            field={f} 
                            isSelected={selectedElement?.id === f.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedElement({ type: 'field', id: f.id, data: f }); }}
                          />
                        ))}
                      </DroppableGroup>
                    ))}
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAddGroup(section.id); }}
                    className="w-full mt-6 py-5 border-2 border-dashed border-[var(--border-clinical)]/40 text-[var(--text-secondary)] opacity-40 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:opacity-100 hover:border-[var(--accent-clinical)] hover:text-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/5 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus size={14} />
                    Añadir Grupo de Datos
                  </button>
                </section>
              ))}

              <button 
                onClick={handleAddSection}
                className="w-full py-8 border-4 border-dashed border-[var(--border-clinical)]/20 text-[var(--text-secondary)] opacity-30 rounded-[3rem] font-black text-xs uppercase tracking-[0.5em] hover:opacity-100 hover:border-[var(--accent-clinical)] hover:text-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/5 transition-all flex flex-col items-center gap-4"
              >
                <div className="p-4 bg-[var(--surface-clinical)] rounded-full shadow-lg border border-[var(--border-clinical)]">
                   <Plus size={24} />
                </div>
                Nueva Sección Maestra
              </button>

            </div>
          </main>

          {/* Properties Panel */}
          <aside className="w-80 bg-[var(--surface-clinical)] border-l border-[var(--border-clinical)] flex flex-col z-10 shadow-2xl">
            <div className="flex border-b border-[var(--border-clinical)] bg-[var(--bg-clinical)]/50 text-[9px] font-black uppercase tracking-widest">
              <button onClick={() => setActiveTab('props')} className={`flex-1 p-3 text-center ${activeTab === 'props' ? 'bg-[var(--surface-clinical)] text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] opacity-50'}`}>Propiedades</button>
              <button onClick={() => setActiveTab('taxonomy')} className={`flex-1 p-3 text-center ${activeTab === 'taxonomy' ? 'bg-[var(--surface-clinical)] text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] opacity-50'}`}>Taxonomía</button>
              <button onClick={() => setActiveTab('preview')} className={`flex-1 p-3 text-center ${activeTab === 'preview' ? 'bg-[var(--surface-clinical)] text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] opacity-50'}`}>Preview</button>
              <button onClick={() => setActiveTab('history')} className={`flex-1 p-3 text-center ${activeTab === 'history' ? 'bg-[var(--surface-clinical)] text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] opacity-50'}`}>Historial</button>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {activeTab === 'props' && (
                selectedElement ? (
                  <div className="flex flex-col gap-10 p-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    
                    {/* Visual Header for Property */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-[var(--accent-clinical)] uppercase tracking-widest opacity-60">Configuración de {selectedElement.type}</span>
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase truncate">{selectedElement.data.label || selectedElement.data.title}</h3>
                    </div>

                    {/* LABEL / TITLE */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-40">
                        <Layout size={10} /> Etiqueta Visual
                      </label>
                      <input 
                        type="text" 
                        value={selectedElement.data.label || selectedElement.data.title || ""} 
                        onChange={(e) => updateElementProperty(selectedElement.type === 'field' ? 'label' : 'title', e.target.value)}
                        className="w-full bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-2xl p-4 text-xs font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] outline-none transition-all shadow-inner"
                      />
                    </div>

                    {selectedElement.type === 'field' && (
                      <>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-40">
                            <Eye size={10} /> Formato Clínico
                          </label>
                          <select 
                            value={selectedElement.data.type}
                            onChange={(e) => updateElementProperty('type', e.target.value)}
                            className="w-full bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-2xl p-4 text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer hover:border-[var(--accent-clinical)]/50 transition-colors"
                          >
                            <option value="text">Input: Texto Corto</option>
                            <option value="textarea">Narrativa: Área de Texto</option>
                            <option value="number">Métrica: Numérico</option>
                            <option value="boolean">Estado: Booleano</option>
                            <option value="date">Temporal: Fecha</option>
                            <option value="multivalue">Taxonómico: Multivalor ($)</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 bg-[var(--bg-clinical)]/50 p-6 rounded-[2rem] border border-[var(--border-clinical)]/50">
                          <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">Visible en HCE</span>
                            <input 
                              type="checkbox" 
                              checked={selectedElement.data.visible !== false}
                              onChange={(e) => updateElementProperty('visible', e.target.checked)}
                              className="w-5 h-5 rounded-lg border-[var(--border-clinical)] text-[var(--accent-clinical)] focus:ring-[var(--accent-clinical)]/20 transition-all cursor-pointer"
                            />
                          </label>
                          <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">Indexar para Búsqueda</span>
                            <input 
                              type="checkbox" 
                              checked={selectedElement.data.searchable !== false}
                              onChange={(e) => updateElementProperty('searchable', e.target.checked)}
                              className="w-5 h-5 rounded-lg border-[var(--border-clinical)] text-[var(--accent-clinical)] focus:ring-[var(--accent-clinical)]/20 transition-all cursor-pointer"
                            />
                          </label>
                        </div>

                        <div className="p-5 bg-slate-900 rounded-3xl border border-white/5 shadow-2xl">
                          <div className="flex items-center gap-2 mb-3">
                             <ShieldAlert size={10} className="text-amber-500" />
                             <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Clinical Data Source</p>
                          </div>
                          <code className="text-[10px] text-[var(--accent-clinical)] font-mono break-all font-bold block bg-black/30 p-3 rounded-xl border border-white/5">{selectedElement.data.sourceField}</code>
                        </div>
                      </>
                    )}

                    {selectedElement.type === 'group' && (
                      <>
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-40">
                            <Columns size={10} /> Organización (Layout)
                          </label>
                          <select 
                            value={selectedElement.data.layout}
                            onChange={(e) => updateElementProperty('layout', e.target.value)}
                            className="w-full bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-2xl p-4 text-xs font-bold text-[var(--text-primary)] outline-none"
                          >
                            <option value="stack">Vertical: Columna única</option>
                            <option value="grid">Rejilla: Multicolumna</option>
                          </select>
                        </div>
                        {selectedElement.data.layout === 'grid' && (
                          <div className="space-y-3">
                            <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-40">Número de Columnas</label>
                            <input 
                              type="range" 
                              min="1" max="4"
                              value={selectedElement.data.columns || 2} 
                              onChange={(e) => updateElementProperty('columns', parseInt(e.target.value))}
                              className="w-full accent-[var(--accent-clinical)]"
                            />
                            <div className="flex justify-between text-[9px] font-bold text-[var(--text-secondary)] px-1">
                               <span>1 Col</span>
                               <span>2 Col</span>
                               <span>3 Col</span>
                               <span>4 Col</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-secondary)] opacity-10 gap-8">
                    <Settings2 size={64} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] max-w-[180px] leading-relaxed">Selecciona un elemento del lienzo para editar su taxonomía visual</p>
                  </div>
                )
              )}
              {activeTab === 'taxonomy' && schema && (
                <TaxonomyPanel schema={schema} onUpdate={setSchema} />
              )}
              {activeTab === 'preview' && schema && (
                <PreviewPanel schema={schema} />
              )}
              {activeTab === 'history' && schema && (
                <VersionSelector currentSchema={schema} onSelectVersion={setSchema} />
              )}
            </div>
          </aside>

        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeField ? (
          <div className="border-2 border-[var(--accent-clinical)] rounded-2xl p-4 bg-[var(--surface-clinical)] text-[var(--accent-clinical)] text-[11px] font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(var(--accent-clinical-rgb),0.3)] opacity-95 w-72 flex items-center gap-4 cursor-grabbing animate-in zoom-in-95 duration-200">
            <div className="w-8 h-8 bg-[var(--accent-clinical)]/10 rounded-lg flex items-center justify-center">
               <Move size={14} />
            </div>
            <span className="truncate">{activeField.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
