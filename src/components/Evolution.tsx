import React from 'react';
import { ArrowLeft, Code, Lightbulb, Database, Activity, FileCheck, Zap, Shield, Microscope } from 'lucide-react';
import { SYSTEM_VERSION } from '../core/version';

interface EvolutionProps {
  onBack: () => void;
}

export default function Evolution({ onBack }: EvolutionProps) {
  const milestones = [
    {
      date: '08 de Abril, 2026',
      title: 'Génesis y Fundamentos',
      description: 'El proyecto nace como una serie de laboratorios de lógica intensiva. Se establecen los estándares de codificación y la estructura profesional que servirá de base para todo el ecosistema.',
      icon: <Code className="text-blue-500" />,
      color: 'blue'
    },
    {
      date: '13-15 de Abril, 2026',
      title: 'El Concepto Queryclin',
      description: 'Se conceptualiza un buscador clínico que prioriza la privacidad absoluta (Local-First). Se realiza una auditoría técnica para asegurar que los datos médicos nunca abandonen el equipo del usuario.',
      icon: <Lightbulb className="text-yellow-500" />,
      color: 'yellow'
    },
    {
      date: '16 de Abril, 2026',
      title: 'Arquitectura de Acero',
      description: 'Nace la primera versión funcional. Se implementa IndexedDB para persistencia y se diseña el "Deep Slate Dark Mode", una interfaz premium enfocada en reducir la fatiga visual del personal clínico.',
      icon: <Database className="text-cyan-500" />,
      color: 'cyan'
    },
    {
      date: '17-20 de Abril, 2026',
      title: 'Salto a la Escala (Big Data)',
      description: 'Se rompen los límites del navegador. Implementación de sharding local para gestionar más de 100,000 registros con tiempos de respuesta de milisegundos. El motor de búsqueda evoluciona para entender abreviaturas médicas.',
      icon: <Zap className="text-orange-500" />,
      color: 'orange'
    },
    {
      date: '21-22 de Abril, 2026',
      title: 'Ecosistema de Calidad Clínica',
      description: 'Se consolida el sistema con una suite de pruebas industriales (Vitest/Playwright). Se inaugura el Centro de Ayuda técnico y se oficializa la coordinación con el Hospital Rafael Méndez.',
      icon: <FileCheck className="text-green-500" />,
      color: 'green'
    },
    {
      date: '23 de Abril, 2026',
      title: 'Motor V2.7: Optimización Extrema',
      description: 'Refactorización total del motor para un rendimiento ultra-eficiente. Implementación de búsqueda por lotes (Batching) e ingesta de un solo paso (Single-Pass).',
      icon: <Zap className="text-purple-500" />,
      color: 'purple'
    },
    {
      date: '23-25 de Abril, 2026',
      title: 'V3.8: Arquitectura Solid-State',
      description: 'Salto generacional: Ingesta por Streaming (sin límite de RAM) e Índice Fragmentado por Bucketing. Migración a Clean Architecture para una estabilidad total.',
      icon: <Shield className="text-indigo-500" />,
      color: 'indigo'
    },
    {
      date: '26-28 de Abril, 2026',
      title: 'V3.9: Motor BM25 & Synonyms',
      description: 'Implementación del algoritmo de relevancia Okapi BM25 y el Clinical Synonym Mapper para una precisión de búsqueda de nivel hospitalario.',
      icon: <Microscope className="text-emerald-500" />,
      color: 'emerald'
    },
    {
      date: '06 de Mayo, 2026',
      title: 'V4.5.0: Interfaz Contextual Unificada',
      description: 'Rediseño integral de la cabecera global con navegación de expedientes integrada. Sincronización de estado entre vistas y optimización de la ergonomía de lectura para informes extensos.',
      icon: <Zap className="text-blue-500" />,
      color: 'blue'
    },
    {
      date: '07 de Mayo, 2026',
      title: 'V4.7.5: Jerarquía Clínica y Gobernanza HCE-OBS',
      description: 'Implementación de la taxonomía jerárquica (Categoría > Subcategoría) y motor de renderizado determinista para obstetricia. Integración de limpieza de títulos dinámica y ubicación contextual de constantes vitales.',
      icon: <Microscope className="text-emerald-500" />,
      color: 'emerald'
    },
    {
      date: '08 de Mayo, 2026',
      title: 'V5.0.0: Gobernanza de Seguridad y Privacidad Pública',
      description: 'Salto a la madurez industrial. Implementación de un ecosistema completo de gobernanza para repositorios públicos, endurecimiento de seguridad (Local-First) y motor de exportación de "Última Toma" consolidada.',
      icon: <Shield className="text-indigo-500" />,
      color: 'indigo'
    },
    {
      date: '08 de Mayo, 2026',
      title: 'V5.1.0: Optimización Multivariable y Resiliencia',
      description: 'Rediseño del renderizado de hallazgos ($) como listas expandidas y mejora de la resiliencia en la ingesta mediante normalización proactiva de cabeceras técnicas.',
      icon: <Zap className="text-orange-500" />,
      color: 'orange'
    },
    {
      date: '11 de Mayo, 2026',
      title: 'V5.2.0: Debug Mode y Refinamiento de Taxonomía',
      description: 'Implementación del Modo Debug persistente, motor de renderizado híbrido (Narrativo/Tabular) y corrección masiva de la taxonomía clínica para una precisión diagnóstica absoluta.',
      icon: <Microscope className="text-emerald-500" />,
      color: 'emerald'
    },
    {
      date: '12 de Mayo, 2026',
      title: 'V5.3.0: Motor Semántico y Búsqueda Estructural',
      description: 'Implementación de la capa semántica centralizada (SemanticProcessor) y filtrado estructural nativo en el índice. Se logra un rendimiento O(1) en búsquedas categorizadas.',
      icon: <Zap className="text-blue-500" />,
      color: 'blue'
    },
    {
      date: '13 de Mayo, 2026',
      title: 'V6.0.0: Era Admin & Governance',
      description: 'Implementación integral del Queryclin Admin Studio con motor Drag-and-Drop y sistema de gobernanza agéntica. Nace la capacidad de diseñar formularios clínicos dinámicos con persistencia en IndexedDB.',
      icon: <Shield className="text-indigo-500" />,
      color: 'indigo'
    },
    {
      date: '15 de Mayo, 2026 (Mañana)',
      title: 'V6.1.4: Negation Shielding',
      description: 'Implementación del escudo de negaciones clínicas para eliminar falsos positivos en búsquedas críticas (HTA: NO). Refactorización del motor de indexación para alta precisión semántica.',
      icon: <Microscope className="text-emerald-500" />,
      color: 'emerald'
    },
    {
      date: '15 de Mayo, 2026 (Actual)',
      title: 'V6.2.2: Auditoría Integral & Estabilidad',
      description: 'Certificación total del sistema tras auditoría masiva. Optimización extrema de memoria (OOM Fix), hardening de la interfaz y unificación de la arquitectura de normalización bajo estándares industriales.',
      icon: <Zap className="text-blue-500" />,
      color: 'blue'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-[11px]">Volver al buscador</span>
      </button>

      <div className="mb-16">
        <h1 className="text-4xl font-black mb-4 tracking-tight">Evolución de <span className="text-[var(--accent-clinical)]">Queryclin</span></h1>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-2xl">
          Un viaje desde el código base hasta una plataforma de análisis clínico de alto rendimiento.
        </p>
      </div>

      <div className="relative border-l-2 border-[var(--border-clinical)] ml-4 pl-10 space-y-16 py-4">
        {milestones.map((milestone, idx) => (
          <div key={idx} className="relative group">
            {/* Dot */}
            <div className={`absolute -left-[51px] top-0 w-5 h-5 rounded-full border-4 border-[var(--bg-clinical)] bg-${milestone.color}-500 shadow-lg group-hover:scale-125 transition-transform z-10`} />
            
            <div className="bg-[var(--glass-bg)] p-8 rounded-3xl border border-[var(--border-clinical)] hover:border-[var(--accent-clinical)]/30 transition-all hover:shadow-xl hover:shadow-[var(--accent-clinical)]/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-${milestone.color}-500/10 flex items-center justify-center p-2.5`}>
                    {milestone.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{milestone.date}</span>
                    <h2 className="text-xl font-black text-[var(--text-primary)]">{milestone.title}</h2>
                  </div>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {milestone.description}
              </p>
            </div>
          </div>
        ))}
        
        {/* Progress Line Cover at bottom */}
        <div className="absolute bottom-0 -left-[2px] w-[2px] h-32 bg-gradient-to-t from-[var(--bg-clinical)] to-transparent" />
      </div>

      <div className="mt-20 p-10 bg-[var(--glass-bg)] rounded-[40px] border border-[var(--border-clinical)] text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <Activity size={300} className="absolute -top-20 -right-20" />
        </div>
        
        <h3 className="text-2xl font-black mb-4">Misión Continua</h3>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed italic">
          "Nuestra meta es proporcionar una herramienta que sea invisible en su complejidad pero indispensable en su precisión, devolviéndole al clínico el tiempo que los datos fragmentados le arrebatan."
        </p>
        <div className="mt-8 flex justify-center items-center gap-3">
          <Microscope size={20} className="text-[var(--accent-clinical)]" />
          <span className="text-[11px] font-black uppercase tracking-[4px] text-[var(--text-secondary)]">Próxima Fase: Integración de Modelos de Lenguaje Clínico</span>
        </div>
      </div>

        <div className="text-center mt-12 text-[var(--text-secondary)] text-[10px] font-medium tracking-widest uppercase opacity-50">
          Hoja de Ruta 2026 - Queryclin {SYSTEM_VERSION}
        </div>
    </div>
  );
}
