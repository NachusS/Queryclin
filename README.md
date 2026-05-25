# Queryclin — HCE Intelligence & Admin Studio (V7.0.0-STABLE) 🚀

Queryclin es una plataforma de exploración y análisis de **Historias Clínicas Electrónicas (HCE)** diseñada bajo principios de **privacidad absoluta y rendimiento local**. Permite al personal clínico navegar, buscar y segmentar grandes volúmenes de datos directamente en el navegador sin dependencias de red.

---

## 1. El Problema y Nuestro Propósito
El personal médico se ve frecuentemente forzado a lidiar con exportaciones masivas de HCE en formatos crudos (Texto plano o Excel). Interpretar estas sábanas de datos genera una inmensa fatiga visual y riesgo de errores. 

**Queryclin** nació con la misión de construir un motor que permitiera la navegación fluida y la búsqueda contextual profunda en vastos expedientes en milisegundos.

> [!IMPORTANT]
> **Privacidad Local-First:** Debido a la sensibilidad de los datos médicos, la arquitectura es estrictamente local. Los datos jamás abandonan la computadora; todo el procesamiento se realiza en la base de datos del cliente (IndexedDB) y la memoria del navegador.
>
> **Entorno Público:** Este repositorio y su despliegue son **PÚBLICOS**. Bajo ninguna circunstancia se debe subir información clínica real, datos de pacientes o secretos de infraestructura hospitalaria. Todos los ejemplos y datasets incluidos son 100% sintéticos.

---

## 2. Génesis del Proyecto
La visión original se basó en transformar la experiencia de auditoría clínica:
- **Simplicidad de Uso:** Un buscador central limpio que acepta la carga de archivos por arrastre.
- **Arquitectura de Escala (v3):** Capacidad para gestionar hasta **100.000 pacientes** de forma fluida mediante procesamiento paralelo (Web Workers).
- **Sintaxis Booleana Estricta:** Motor de búsqueda que soporta lógica natural (`diabetes AND asma NOT fumador`).
- **Navegación de Toma Única Activa (v4):** Rediseño del visor HCE para centrar la atención en una única sesión clínica, con timeline lateral para navegación cronológica rápida.
- **Admin Studio (v6):** Motor de diseño de formularios dinámicos con sistema de gobernanza y persistencia avanzada.

---

## 3. Arquitectura e Ingesta Inteligente

Tras las últimas refactorizaciones para asegurar la escalabilidad masiva y estabilidad ante la auditoría, el stack se compone de una **Arquitectura Limpia (Clean Architecture)** desacoplada:

- **React 19 + TypeScript:** Esquema de datos estricto para garantizar la integridad clínica.
- **Capa de Dominio (`src/core/`):** Modelos de datos y taxonomía clínica unificada.
- **Capa de Aplicación e Ingesta (`src/ingestion/`):** Workers de procesamiento paralelo y streaming de datos tabulares.
- **Capa de Infraestructura y Storage (`src/storage/`):** Persistencia en IndexedDB con fragmentación inteligente.
- **Motor de Búsqueda Clínico (`src/engine/`):** 
  - *`IndexerService.ts`*: Ingesta asíncrona con **Negation Shielding** y caché de sesión para evitar fugas de memoria (OOM).
  - *`QueryEngine.ts`*: Motor de recuperación basado en **Okapi BM25** con soporte para filtrado estructural y *Post-Score Field Boosting*.
  - *`SemanticProcessor.ts`*: Única fuente de verdad para tokenización clínica, *stemming* de lista blanca y expansión semántica.

---

## 4. Evolución de Características (Roadmap)

### Fase 23: Gobernanza Agéntica Institucional (V6.0.0 ✅)
- **Admin Studio**: Implementación integral del motor de diseño Drag-and-Drop.
- **Marco de Gobernanza**: Establecimiento de reglas inmutables para el desarrollo asistido por IA.

### Fase 24: Refactor Semántico y Búsqueda Estructural (V6.1.0 ✅)
- **Motor Semántico Centralizado**: Implementación de `SemanticProcessor`.
- **Negation Shielding**: Eliminación de falsos positivos en búsquedas clínicas (HTA: NO).

### Fase 25: Auditoría Integral y Estabilización (V6.2.2 ✅)
- **Optimización de Memoria**: Resolución definitiva de bloqueos por Out-Of-Memory (OOM) en archivos de gran escala.
- **Hardening de UI**: Implementación de guardas defensivas en la navegación y corrección de excepciones de renderizado.
- **Integridad de Mapeos**: Mapeado universal de campos clínicos y expansión de alias de robustez.
- **Unificación de Código**: Eliminación de redundancia funcional bajo estándares industriales.

### Fase 26: Production Freeze (V7.0.0-STABLE — ACTUAL 🚀)
- **Estabilización de Arquitectura**: Congelación de APIs semánticas y contratos de persistencia IndexedDB.
- **Tolerancia a Fallos**: Funciones de recuperación ante desastres (`HEALTHCHECK`, reinicios de emergencia).
- **Limpieza de Background**: Rutinas automatizadas de recolección de basura (Garbage Collection).

---

## 5. Instrucciones de Uso y Despliegue

### Entorno Local
1. Instalar dependencias: `npm install`
2. Iniciar servidor de desarrollo: `npm run dev`

---

## 6. Documentación y Gobernanza

Este repositorio sigue un estricto protocolo de **Gobernanza Agéntica** para garantizar la calidad y seguridad del desarrollo.

- **[TASKS.md](TASKS.md)**: Listado maestro de objetivos y fases técnicas.
- **[CHANGELOG.md](CHANGELOG.md)**: Registro cronológico detallado de modificaciones y auditorías.
- **[RULES.md](RULES.md)**: Constitución y reglas de desarrollo del sistema.

> [!NOTE]
> Los detalles estratégicos del marco de gobernanza y los planes maestros de auditoría son de uso **interno** y no se exponen en este repositorio público para proteger la integridad del proyecto.

---

> [!IMPORTANT]
> **Instrucciones para Agentes de IA:** Toda modificación debe registrarse en `CHANGELOG.md` y actualizar la tarea correspondiente en `TASKS.md` siguiendo el protocolo de estabilidad V6.2.

- **[Contribución Segura](security/SAFE_CONTRIBUTING.md)**: Reglas para colaboradores externos.

---

> [!IMPORTANT]
> **Instrucciones para Agentes de IA:** Es obligatorio consultar el directorio `.ag/` antes de iniciar cualquier tarea. Toda modificación debe registrarse en `CHANGELOG.md` y actualizar la tarea correspondiente en `/tasks`.
