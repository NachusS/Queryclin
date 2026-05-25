import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Save, Database, Trash2, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { 
  CanonicalHeaderRegistry, 
  CanonicalFieldDefinition, 
  AliasResolver, 
  MappingConfidenceEngine, 
  PersistentMappingProfiles, 
  MappingProfile, 
  SchemaCompiler, 
  DynamicCategoryInference,
  SemanticHeaderNormalizer
} from '../ingestion/UniversalImportEngine';

interface ManualMappingWizardProps {
  fileName: string;
  rawHeaders: string[];
  onCancel: () => void;
  onImportComplete: (compiledMapping: any) => void;
}

export default function ManualMappingWizard({ 
  fileName, 
  rawHeaders, 
  onCancel, 
  onImportComplete 
}: ManualMappingWizardProps) {
  
  const [profileName, setProfileName] = useState<string>(
    fileName.replace(/\.[^/.]+$/, "") + " Profile"
  );
  const [profiles, setProfiles] = useState<MappingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  
  // mappings: sourceHeader -> canonicalFieldId
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  // demographics structural keys
  const [nhcHeader, setNhcHeader] = useState<string>('');
  const [idTomaHeader, setIdTomaHeader] = useState<string>('');
  const [ordenTomaHeader, setOrdenTomaHeader] = useState<string>('');
  const [fechaTomaHeader, setFechaTomaHeader] = useState<string>('');

  useEffect(() => {
    loadProfiles();
    runAutoMatch();
  }, [rawHeaders]);

  const loadProfiles = async () => {
    const list = await PersistentMappingProfiles.getAllProfiles();
    setProfiles(list);
  };

  // Run auto-match confidence engine for all raw headers
  const runAutoMatch = () => {
    const initialMappings: Record<string, string> = {};
    let detectedNhc = '';
    let detectedIdToma = '';
    let detectedOrden = '';
    let detectedFecha = '';

    rawHeaders.forEach(header => {
      // 1. Resolve using AliasResolver
      const canonical = AliasResolver.resolve(header);
      if (canonical) {
        initialMappings[header] = canonical.id;
        
        // Match core keys
        if (canonical.id === 'nhc') detectedNhc = header;
        if (canonical.id === 'idToma') detectedIdToma = header;
        if (canonical.id === 'ordenToma') detectedOrden = header;
        if (canonical.id === 'fechaToma') detectedFecha = header;
      } else {
        // Fallback to "custom"
        initialMappings[header] = 'custom';
      }
    });

    setMappings(initialMappings);
    setNhcHeader(detectedNhc);
    setIdTomaHeader(detectedIdToma);
    setOrdenTomaHeader(detectedOrden);
    setFechaTomaHeader(detectedFecha);
  };

  // When user selects an existing profile, apply it
  const handleApplyProfile = async (profileId: string) => {
    setSelectedProfileId(profileId);
    if (!profileId) return;
    
    const profile = await PersistentMappingProfiles.getProfile(profileId);
    if (profile) {
      setProfileName(profile.name);
      
      const newMappings = { ...mappings };
      // Aplicar mappings guardados que coincidan con los headers actuales
      Object.entries(profile.mappings).forEach(([hdr, canonicalId]) => {
        if (rawHeaders.includes(hdr)) {
          newMappings[hdr] = canonicalId;
        }
      });
      setMappings(newMappings);
      
      if (rawHeaders.includes(profile.demographics.nhc)) setNhcHeader(profile.demographics.nhc);
      if (rawHeaders.includes(profile.demographics.idToma)) setIdTomaHeader(profile.demographics.idToma);
      if (rawHeaders.includes(profile.demographics.ordenToma)) setOrdenTomaHeader(profile.demographics.ordenToma);
      if (rawHeaders.includes(profile.demographics.fechaToma)) setFechaTomaHeader(profile.demographics.fechaToma);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      alert("Por favor ingrese un nombre para el perfil de mapping.");
      return;
    }

    if (!nhcHeader || !idTomaHeader || !ordenTomaHeader || !fechaTomaHeader) {
      alert("Debe asignar primero las 4 claves estructurales requeridas.");
      return;
    }

    const profileId = selectedProfileId || `profile-${Date.now()}`;
    const newProfile: MappingProfile = {
      id: profileId,
      name: profileName,
      mappings,
      demographics: {
        nhc: nhcHeader,
        idToma: idTomaHeader,
        ordenToma: ordenTomaHeader,
        fechaToma: fechaTomaHeader
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await PersistentMappingProfiles.saveProfile(newProfile);
    alert("Perfil de mapping guardado correctamente.");
    loadProfiles();
    setSelectedProfileId(profileId);
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!window.confirm("¿Seguro que desea eliminar este perfil?")) return;
    await PersistentMappingProfiles.deleteProfile(profileId);
    loadProfiles();
    setSelectedProfileId('');
  };

  // Compile schema and complete import
  const handleProceed = async () => {
    if (!nhcHeader || !idTomaHeader || !ordenTomaHeader || !fechaTomaHeader) {
      alert("Error: Faltan claves estructurales requeridas.");
      return;
    }

    const profileId = selectedProfileId || `profile-${Date.now()}`;
    const activeProfile: MappingProfile = {
      id: profileId,
      name: profileName,
      mappings,
      demographics: {
        nhc: nhcHeader,
        idToma: idTomaHeader,
        ordenToma: ordenTomaHeader,
        fechaToma: fechaTomaHeader
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Compilar schema final
    const compiledSchema = SchemaCompiler.compile(activeProfile, rawHeaders);
    
    // Compilar FormMapping compatible con core
    const compiledMapping = SchemaCompiler.compileToMapping(compiledSchema);

    // Guardar en la base de datos de schemas
    const { schemaStore } = await import('../admin-studio/store/SchemaStore');
    const { schemaRuntimeSync } = await import('../admin-studio/store/schemaRuntimeSync');
    
    // Guardar schema y runtime map
    await schemaStore.saveSchema(compiledSchema);
    await schemaRuntimeSync.syncRuntimeMapping(compiledMapping.id, '1.0');

    // Retornar mapping compilado para iniciar ingesta
    onImportComplete(compiledMapping);
  };

  const getConfidenceBadge = (header: string, canonicalId: string) => {
    if (canonicalId === 'ignore') {
      return <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">Ignorado</span>;
    }
    if (canonicalId === 'custom') {
      const category = DynamicCategoryInference.inferSection(header).split('-')[1] || "Otros";
      return (
        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded" title={`Autocategorizado en ${category}`}>
          Personalizado ({category})
        </span>
      );
    }
    
    const canonical = CanonicalHeaderRegistry.find(c => c.id === canonicalId);
    if (!canonical) return null;

    const score = MappingConfidenceEngine.calculateScore(header, canonical);
    if (score >= 0.8) {
      return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Confianza Alta ({(score*100).toFixed(0)}%)</span>;
    }
    if (score >= 0.5) {
      return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Confianza Media ({(score*100).toFixed(0)}%)</span>;
    }
    return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">Confianza Baja ({(score*100).toFixed(0)}%)</span>;
  };

  const isStructuralMapped = nhcHeader && idTomaHeader && ordenTomaHeader && fechaTomaHeader;

  return (
    <div className="max-w-5xl mx-auto bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-3xl p-8 shadow-2xl font-sans mt-8 text-[var(--text-primary)]">
      
      {/* CABECERA */}
      <div className="flex items-center justify-between border-b border-[var(--border-clinical)] pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-[var(--accent-clinical)]">
            Asistente de Mapping Universal
          </h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">
            Archivo detectado: <span className="font-bold text-[var(--text-primary)]">{fileName}</span> ({rawHeaders.length} columnas)
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--border-clinical)] hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* PERFILES DE MAPPING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--bg-clinical)] p-6 rounded-2xl border border-[var(--border-clinical)] mb-8">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Cargar Perfil Existente
          </label>
          <div className="flex gap-2">
            <select
              value={selectedProfileId}
              onChange={(e) => handleApplyProfile(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none text-xs font-bold"
            >
              <option value="">-- Seleccionar perfil guardado --</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProfileId && (
              <button 
                onClick={() => handleDeleteProfile(selectedProfileId)}
                className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                title="Eliminar perfil"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2">
            Guardar Configuración de Mapping
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Nombre del perfil..."
              className="flex-1 px-4 py-2.5 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none text-xs font-bold text-[var(--text-primary)]"
            />
            <button 
              onClick={handleSaveProfile}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-600/10"
            >
              <Save size={14} /> Guardar
            </button>
          </div>
        </div>
      </div>

      {/* CLAVES ESTRUCTURALES MANDATORIAS */}
      <div className="bg-blue-950/10 border border-blue-500/20 p-6 rounded-2xl mb-8">
        <h3 className="text-sm font-black uppercase tracking-wider text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2">
          <ShieldCheck size={18} /> Claves Estructurales de Ingesta (Requeridas)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              1. Identificador Paciente (NHC)
            </label>
            <select
              value={nhcHeader}
              onChange={(e) => {
                const val = e.target.value;
                setNhcHeader(val);
                if (val) setMappings(prev => ({ ...prev, [val]: 'nhc' }));
              }}
              className="w-full px-3 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl text-xs font-bold focus:border-[var(--accent-clinical)] focus:outline-none"
            >
              <option value="">-- Seleccionar columna --</option>
              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              2. Identificador Toma / Visita
            </label>
            <select
              value={idTomaHeader}
              onChange={(e) => {
                const val = e.target.value;
                setIdTomaHeader(val);
                if (val) setMappings(prev => ({ ...prev, [val]: 'idToma' }));
              }}
              className="w-full px-3 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl text-xs font-bold focus:border-[var(--accent-clinical)] focus:outline-none"
            >
              <option value="">-- Seleccionar columna --</option>
              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              3. Secuencia / Orden Toma
            </label>
            <select
              value={ordenTomaHeader}
              onChange={(e) => {
                const val = e.target.value;
                setOrdenTomaHeader(val);
                if (val) setMappings(prev => ({ ...prev, [val]: 'ordenToma' }));
              }}
              className="w-full px-3 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl text-xs font-bold focus:border-[var(--accent-clinical)] focus:outline-none"
            >
              <option value="">-- Seleccionar columna --</option>
              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
              4. Fecha de Consulta
            </label>
            <select
              value={fechaTomaHeader}
              onChange={(e) => {
                const val = e.target.value;
                setFechaTomaHeader(val);
                if (val) setMappings(prev => ({ ...prev, [val]: 'fechaToma' }));
              }}
              className="w-full px-3 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl text-xs font-bold focus:border-[var(--accent-clinical)] focus:outline-none"
            >
              <option value="">-- Seleccionar columna --</option>
              {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

        </div>
      </div>

      {/* COLA DE MAPEO MANUAL / UNMAPPED FIELD QUEUE */}
      <div className="border border-[var(--border-clinical)] rounded-2xl overflow-hidden mb-8">
        <div className="bg-[var(--bg-clinical)] px-6 py-4 border-b border-[var(--border-clinical)] flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
            Asignación de Campos Clínicos (UnmappedFieldQueue)
          </h3>
          <span className="text-[10px] font-bold bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] px-3 py-1 rounded-full border border-[var(--accent-clinical)]/20">
            {rawHeaders.length} Columnas Detectadas
          </span>
        </div>

        <div className="divide-y divide-[var(--border-clinical)] max-h-96 overflow-y-auto">
          {rawHeaders.map((header, index) => {
            const canonicalId = mappings[header] || 'custom';
            return (
              <div key={header} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-[var(--bg-clinical)]/20 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-500 font-mono">#{String(index+1).padStart(2, '0')}</span>
                    <span className="text-sm font-bold truncate text-[var(--text-primary)]" title={header}>{header}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold font-mono text-[var(--text-secondary)] opacity-60 uppercase">Normalizado: {SemanticHeaderNormalizer.normalize(header)}</span>
                    {getConfidenceBadge(header, canonicalId)}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ArrowRight size={14} className="text-[var(--text-secondary)] opacity-40 hidden md:block" />
                  
                  <select
                    value={canonicalId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMappings(prev => ({ ...prev, [header]: val }));
                      
                      // Si era clave estructural y cambia, liberar la variable
                      if (header === nhcHeader && val !== 'nhc') setNhcHeader('');
                      if (header === idTomaHeader && val !== 'idToma') setIdTomaHeader('');
                      if (header === ordenTomaHeader && val !== 'ordenToma') setOrdenTomaHeader('');
                      if (header === fechaTomaHeader && val !== 'fechaToma') setFechaTomaHeader('');

                      // Si se selecciona un structural, asignarlo
                      if (val === 'nhc') setNhcHeader(header);
                      if (val === 'idToma') setIdTomaHeader(header);
                      if (val === 'ordenToma') setOrdenTomaHeader(header);
                      if (val === 'fechaToma') setFechaTomaHeader(header);
                    }}
                    className="px-3 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl text-xs font-bold focus:border-[var(--accent-clinical)] focus:outline-none w-56"
                  >
                    <option value="custom">Campo Clínico Personalizado</option>
                    <option value="ignore">Ignorar e Ingerir Vacío</option>
                    <hr />
                    <optgroup label="Claves Core">
                      <option value="nhc">Identificador de Paciente (NHC)</option>
                      <option value="idToma">Identificador de Toma (Id_Toma)</option>
                      <option value="ordenToma">Secuencia (Orden_Toma)</option>
                      <option value="fechaToma">Fecha de Toma</option>
                    </optgroup>
                    <optgroup label="Demografía">
                      <option value="sexo">Sexo</option>
                      <option value="edad">Edad</option>
                      <option value="fechaNacimiento">Fecha de Nacimiento</option>
                      <option value="cp">Código Postal</option>
                      <option value="ambito">Ámbito</option>
                      <option value="ciudad">Ciudad</option>
                      <option value="estadoCivil">Estado Civil</option>
                      <option value="unidadEnfermeria">Unidad de Enfermería</option>
                    </optgroup>
                    <optgroup label="Historia Clínica (Canonical)">
                      {CanonicalHeaderRegistry.filter(c => c.category !== 'Cabecera' && c.category !== 'Demografía').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER DE PROCEDIMIENTO */}
      <div className="flex flex-col md:flex-row items-center justify-between border-t border-[var(--border-clinical)] pt-6 gap-4">
        <div className="flex items-center gap-2.5">
          {isStructuralMapped ? (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 size={16} /> Estructura de ingesta validada con éxito
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
              <AlertCircle size={16} /> Faltan claves estructurales requeridas para la ingesta
            </div>
          )}
        </div>
        
        <button
          onClick={handleProceed}
          disabled={!isStructuralMapped}
          className="px-6 py-4 bg-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/90 disabled:opacity-30 disabled:grayscale text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-95 flex items-center gap-2 self-end"
        >
          <Play size={16} fill="white" /> Compilar Esquema e Iniciar Ingesta
        </button>
      </div>

    </div>
  );
}
