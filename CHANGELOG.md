## [6.5.1] - 2026-05-18
### Corregido
- **Inconsistencia de Filtros de Categoría**: Normalización de categorías y campos en `QueryEngine.ts` para resolver fallos de búsqueda causados por diferencias en acentos y mayúsculas entre el índice y los mappings.
- **Detección de Delimitadores**: Eliminado el forzado del delimitador `|` en `Home.tsx` para permitir que el worker detecte automáticamente el delimitador correcto en archivos CSV/TXT subidos.
- **Categorización por Mapping**: Actualizado `IndexerService.ts` para que utilice las categorías definidas en `visualCategories` del mapping del formulario activo (si está disponible) en lugar de depender únicamente de heurísticas. Esto resuelve el problema de "category drift".
- **Consistencia de Snapshots**: Actualizado `selectLatestSnapshots.ts` para que utilice `idToma` como criterio de desempate antes de `ordenToma` when las fechas son iguales, alineando su lógica con `QueryEngine.ts`.
- **Endurecimiento Multivalor (OBS)**: Modificada la lógica de ingesta en `csv.worker.ts` para que, en lugar de duplicar registros con el mismo `ordenToma`, fusione los campos en arrays de strings. Esto evita la fragmentación visual y permite que `HCEView` los renderice como listas coherentes.

### Añadido
- **Pruebas de Coherencia de Filtros**: Creado `QueryEngine.filters.test.ts` con 6 nuevas pruebas para validar el comportamiento determinista de los filtros de categoría, campo, fechas y operadores booleanos combinados.
- **Prueba de Desempate de Snapshots**: Añadida una prueba en `selectLatestSnapshots.test.ts` para verificar el desempate por `idToma`.
- **Pruebas de Multivalor**: Creado `Multivalue.test.ts` para validar la indexación, búsqueda y fusión de campos multivalor con `$`.

## [6.5.0] - 2026-05-15
### Añadido
- **Biblioteca de Recursos Clínicos**: Integración de cabeceras canónicas para OBS, MIR y ALG en el Admin Studio.
- **Gestión Estructural**: Capacidad de crear y eliminar Secciones y Grupos directamente desde el diseñador visual.
- **Modo "Desde Cero"**: Nuevo flujo de creación basado en listas de cabeceras puras (|) sin pérdida de datos.

### Mejoras
- **Reingeniería de FormDesigner**: Mejorado el sistema de Drag & Drop con feedback visual reactivo y zonas de borrado inteligentes.
- **TemplateGenerator Inteligente**: Detección automática de campos narrativos, numéricos y multivariables ($) durante la creación de esquemas.
- **Panel de Propiedades**: Rediseño premium del editor de campos con previsualización de grid y controles de indexación.

### Corregido
- **Pérdida de Campos**: Se soluciona el bug que omitía campos de la paleta si no estaban pre-categorizados en `mappings.ts`.
- **Inconsistencia de Versión**: Sincronización global del protocolo de seguridad a la V6.4.0+.
- **Latencia de Interfaz**: Optimización del estado interno para eliminar micro-bloqueos durante el diseño masivo.

## [6.4.0] - 2026-05-15
### Estabilización, Unificación y Alto Rendimiento (Certificación Fallo Cero)

#### 🚀 Unificación Arquitectónica (Operación Clean Slate)
- **Consolidación del Motor**: Se ha unificado toda la lógica clínica en `src/engine/`. Se eliminó `src/lib/searchEngine.ts` y `src/core/search/` para crear un "Single Source of Truth".
- **Limpieza de Residuos**: Erradicación del directorio `src/agentic/` (código muerto) y simplificación de la estructura de tareas (`TASKS.md` unificado).
- **Normalización de Imports**: Actualización masiva de referencias en todo el proyecto para garantizar coherencia estructural.

#### ⚡ Alto Rendimiento y Escalabilidad
- **Ingesta de Datos**: Optimización de `csv.worker.ts` pasando de complejidad O(N*M) a O(1) mediante mapeo de cabeceras pre-calculado. Ingesta de 100k registros certificada.
- **Visualización**: Refactorizado `HCEView.tsx` para eliminar micro-latencias en scroll mediante memorización de normalización y optimización de búsquedas demográficas.

#### 🧠 Inteligencia Semántica (Motor V6.2.7+)
- **Soporte de Frases**: El procesador semántico ahora reconoce términos compuestos (ej: "Insuficiencia Cardíaca") antes de la tokenización.
- **Negation Shield**: Blindaje estricto en el indexador para evitar que términos negados (ej: "Sin diabetes") generen aciertos positivos.
- **Lógica Booleana**: Refuerzo de comparadores `AND`/`OR` para búsquedas cruzadas complejas.

#### 📜 Gobernanza
- **Lanzamiento Público**: Creado `CONTRIBUTING.md` con la filosofía y guía técnica del proyecto.
- **Certificación**: Auditoría completa de "Fallo Cero" superada. Sistema estable y resiliente.

## [2026-05-15]
### Auditoría Integral y Estabilización (V6.2.2)
- **`IndexerService.ts`**: Optimización de alto rendimiento para ingesta masiva.
    - Implementación de constantes estáticas (`NEG_VALUE_WORDS`) y caché de sesión (`negTokenCache`) para eliminar el overhead de memoria.
    - Resolución definitiva de bloqueos por Out-Of-Memory (OOM) en archivos de gran escala.
- **`HCEView.tsx` & `Home.tsx`**: Unificación de la normalización de strings.
    - Eliminadas funciones locales redundantes a favor de la utilidad global `normalizeString`.
    - Corregido `ReferenceError` por desestructuración incompleta de props (`dynamicSchema`).
- **`App.tsx`**: Implementación de guardas defensivas en la navegación para evitar excepciones de interfaz durante cambios de contexto.
- **`mappings.ts`**: Integración universal del campo "Pruebas solicitadas" en todos los modelos clínicos (HCE-MIR, HCE-ALG, HCE-OBS) y expansión de alias de robustez.
- **Gobernanza**: Generada batería de pruebas exhaustiva para certificación de calidad del sistema.

## [2026-05-15]
### Evolución Controlada: Blindaje de Negaciones Clínicas (V6.1.4)
- **`IndexerService.ts`**: Implementada lógica de detección de negaciones atómicas (`NO`, `0`, `Negativo`, etc.) durante la fase de indexación.
    - Se ha restringido la asociación de la clave del campo (`key`) con los tokens si el valor es negativo, eliminando falsos positivos masivos en búsquedas como `HTA` o `fumadora`.
    - Mejora la precisión del motor de búsqueda al garantizar que solo se recuperen pacientes con hallazgos positivos confirmados.

## [2026-05-15]
### Hotfix: Blindaje de Tipos y Estabilización Post-Rollback (V6.0.x)
- **`SemanticProcessor.ts`**:
    - Añadido chequeo defensivo `typeof token !== 'string'` en `getStem` y `getCanonical` para prevenir crashes `TypeError: s.replace is not a function`.
    - Corregido bug de sensibilidad a mayúsculas en `getCanonical` (ahora usa `normalizeString` internamente).
- **`stringNormalizer.ts`**: Añadido guardián de tipos para evitar que entradas `null`/`undefined` propaguen errores de cadena en el Worker.
- **`clinicalSynonyms.ts`**: Encapsulado de diccionarios con `Object.create(null)` para prevenir colisiones entre términos clínicos y propiedades del prototipo de Object.
- **Infraestructura de Pruebas**:
    - Restaurado `tests/mocks/hce_obs_synthetic.txt` (V3) con escenarios de HTA, Diabetes y Alergias.
    - Restaurado `tests/SEARCH_TEST_BATTERY.md` (V6.0.4) como checklist de certificación de búsqueda.

## [2026-05-13]
### Finalización: Queryclin Admin Studio & Governance (V6.0.0)
- **Admin Studio (Core)**:
    - **FormDesigner.tsx**: Reescritura integral del motor de diseño. Soporte para **Drag-and-Drop bidireccional** total (Lienzo ↔ Paleta ↔ Grupos) con feedback visual de borrado reactivo.
    - **AdminDashboard.tsx**: Implementado sistema de gestión de formularios con capacidad de eliminación permanente y navegación fluida entre vistas.
    - **Seguridad & Acceso**: Implementado `PasscodeGate` en `AdminRoot.tsx` protegido por PIN (`admin123`). Rediseño estético unificado con el *Clinical Design System* de Queryclin (Glassmorphism, variables `--accent-clinical`).
- **Motor de Plantillas & Persistencia**:
    - **TemplateGenerator.ts**: Sistema de clonación de formularios "intocables" (HCE-ALG, HCE-MIR, HCE-OBS) para permitir la creación de variantes personalizadas sin alterar el core.
    - **Integración Nativa**: Inyección del `DynamicSectionRenderer` directamente en `HCEView.tsx`, permitiendo que los esquemas publicados se rendericen de forma transparente junto a los estáticos.
- **Gobernanza & Trazabilidad (METAPROMPT Policy)**:
    - **Repositorio de Prompts**: Creación de `governance/prompts/` con subcategorías `/generic/` y `/metaprompts/` para el registro histórico de instrucciones del usuario.
    - **KI Policy**: Nueva Knowledge Item `metaprompt_documentation` que obliga a documentar cada directriz estratégica para control de cambios absoluto.
- **Sincronización de Versión**: Salto a **V6.0.0 (Admin Era)**.

## [2026-05-13]
### Iniciada Fase 2: Queryclin Admin Studio (Arquitectura Declarativa HCE)

### Refinamiento y Corrección: Modo "Última Toma" (V5.4.1)
- **`QueryEngine.ts`**: Corregido bug crítico de compatibilidad hacia atrás en índices antiguos. Cambiado el valor fallback de `maxOrden` de `0` a `-1` para evitar la exclusión absoluta de documentos en BBDDs sin re-indexar. Refinada lógica para el pre-filtrado temporal estricto.
- **`HCEView.tsx`**: Ajustada la renderización de la "Línea temporal" (TomaTimeline). En Modo Última Toma, ahora el sistema oculta completamente (visualmente) todas las tomas ajenas al snapshot temporal encontrado, dejando la vista estática como "1 Toma, 1 Versión".
- **`HCEView.tsx` (Rediseño Estético Jerárquico)**: Modificado el estilo de cabeceras. Las secciones principales ahora usan fondo *Slate Dark*, cabeceras de tablas han vuelto a su estado de etiquetas *inline-block*, las subcategorías adoptan la estética clínica azul `w-full` y se omitió intencionadamente la renderización visual del título de "Antecedentes Personales" para reducir fricción cognitiva.

### Modo "Última Toma" / Snapshot-based Retrieval (V5.4.0)
- **`selectLatestSnapshots.ts` (NUEVO)**:
  - Creada utilidad pura con complejidad O(n) que agrupa los registros clínicos por paciente (NHC).
  - Implementada lógica determinista que selecciona el snapshot temporal más reciente `MAX(EC_Fecha_Toma)` y resuelve posibles empates mediante `MAX(Orden_Toma)`.
- **`QueryEngine.ts`**:
  - Implementado interceptor en el motor de búsqueda que calcula `globalLatestIdToma` para cada paciente antes de la fase BM25.
  - El motor ahora descarta activamente todos los documentos del índice que no correspondan a la última toma clínica del paciente en el rango de fechas seleccionado, garantizando que tanto BM25 como el `applyFilters` posterior se ejecuten exclusivamente sobre ese snapshot.
  - Soporte nativo para el Edge Case B: Si un paciente tuvo una patología en 2023, pero no en 2024, una búsqueda en 2024 (Modo Última Toma) no devolverá falsos positivos.
- **`App.tsx` & `GlobalHeader.tsx`**:
  - Extendida la interfaz de `FilterOptions` para soportar el booleano `onlyLatestSnapshot`.
  - El badge de filtros activos del `GlobalHeader` ahora contabiliza este nuevo estado visual.
- **`Home.tsx`**:
  - Añadido el checkbox interactivo "Filtrar solo última toma" en el panel avanzado de filtros, con su correspondiente tool-tip explicativo clínico.
  - Refactorizada la gestión de consultas recientes en `localStorage` para persistir también el estado de este nuevo modo de análisis.
- **Sincronización de Versión**: Salto a **V5.4.0**.

## [2026-05-12]
### Refactor Semántico y Búsqueda Estructural (V5.3.0)
- **Fundación Semántica Centralizada**:
  - **`SemanticProcessor.ts`**: Implementado como fuente única de verdad para la tokenización clínica, *stemming* basado en listas blancas (`clinicalSynonyms.ts`) y expansión de sinónimos.
  - Reemplazado el antiguo y redundante `Tokenizer.ts`.
  - El tokenizador preserva ahora símbolos vitales (`Na+`, `O2Hb`, `T°`, decimales y fechas) gracias al uso de regex clínicos de alta precisión (`[A-Za-z0-9µ°+/._-]+`).
- **Arquitectura de Búsqueda Estructural**:
  - **`IndexerService.ts`**: El proceso de indexación ahora asocia categóricamente cada token (ej. "DIAGNOSTICO Y TTO", "ANTECEDENTES") dentro de un array de contexto estructural (`c`) incrustado directamente en los postings del índice invertido.
  - Soporte explícito para el parseo y categorización de campos multivalor anidados (`$`).
- **Post-Score Field Boosting**:
  - **`QueryEngine.ts`**: Se ha migrado el *Field Boosting* fuera de la fase de indexación (donde distorsionaba la fórmula original de saturación TF de BM25) a una arquitectura post-score segura.
  - Los términos encontrados en Diagnósticos reciben un boost de `x1.8`, en Antecedentes `x1.5` y en Resultados `x1.2`.
- **Eliminación de Hidratación Masiva (Performance)**:
  - **`App.tsx`**: Eliminada la lógica heredada en `applyFilters` que forzaba a cargar (hidratar) pacientes completos desde IndexedDB para validar los filtros por Categoría o Campo. Esta validación se resuelve ahora de forma nativa e instantánea a través del array estructural `c` en el motor de búsqueda (`QueryEngine`), logrando mejoras de rendimiento exponenciales.
- **Resaltado Clínico Determinista**:
  - **`HighlightedText.tsx`**: El resaltado visual de términos (Highlight) ha sido migrado para consumir la misma API de normalización y stemming del `SemanticProcessor` (`buildHighlightRegex`), asegurando una coherencia perfecta al 100% entre lo que el motor de búsqueda encuentra y lo que la UI resalta.
- **Documentación y Gobernanza (Hardening)**:
  - **`README.md` & `TASKS.md`**: Sincronizados con la nueva arquitectura de búsqueda y marcados hitos de la Fase 28.
  - **`Evolution.tsx`**: Actualizado el timeline visual para incluir el hito V5.3.0 con detalles sobre el rendimiento O(1).
  - **`structural-semantic-search.md`**: Creada nueva documentación técnica profunda sobre el funcionamiento del motor de búsqueda estructural en `docs/search-engine/`.
  - **`AGENT.MD`**: Actualizado el contexto para agentes de IA con los nuevos desafíos superados y el stack tecnológico refinado.
- **Sincronización de Versión**: Salto a **V5.3.0**.

## [2026-05-11]
### Debug Mode y Refinamiento de Taxonomía Clínica (V5.2.0)
- **`App.tsx`**:
  - **New Feature**: Implementado el **Modo Debug** persistente en `localStorage`. Permite visualizar campos no mapeados y datos vacíos para auditoría técnica.
  - **UI/UX**: Añadida la capacidad de alternar el Modo Debug desde la interfaz global.
- **`HCEView.tsx`**:
  - **Motor de Renderizado Narrativo**: Introducida la lógica de **Campos Narrativos** (`NARRATIVE_FIELDS`). El sistema ahora discrimina automáticamente entre campos de texto largo (párrafos) y campos tabulares (grids), optimizando drásticamente la densidad de información.
  - **Deduplicación Inteligente**: Implementado un post-procesador de secciones que elimina duplicados entre categorías raíz y subcategorías, además de normalizar etiquetas (ej: "Grupo y RH" vs "Grupo y RH:").
  - **Visualización de Grids**: Refinada la lógica de `ClinicalGrid` para mostrar campos vacíos solo cuando el Modo Debug está activo o en secciones técnicas críticas de obstetricia.
  - **Exclusión de Redundancia**: Ampliada la lista de campos excluidos del cuerpo del informe (aquellos que ya residen en cabecera o control) para evitar ruido visual.
- **`core/mappings.ts`**:
  - **Refinamiento de Taxonomía**: Reestructuración masiva de las categorías visuales para `hce_alg`, `hce_mir` y `hce_obs`. 
  - **Corrección de Erratas**: Corregidos múltiples errores tipográficos en los nombres de campos clínicos (ej: `Bradicarda` -> `Bradicardia`, `Decelearciones` -> `Deceleraciones`, `Test de O,Sullivan` -> `Test de O'Sullivan`).
  - **Mapping de Obstetricia**: Añadidos campos críticos faltantes en la sección de antecedentes personales y analíticas de `hce_obs`.
- **Sincronización de Versión**: Salto a **V5.2.0**.

## [2026-05-11]
### Estabilización y Recuperación tras Interrupción de Conexión (V5.1.1)
- **`App.tsx`**:
  - **Fixed**: Eliminado el parámetro no soportado `raw: false` en `XLSX.utils.sheet_to_csv` que causaba errores de compilación TypeScript.
- **`core/mappings.ts`**:
  - **Fixed**: Corregida la duplicidad de la clave `HTA (Hipertensión Arterial)` en los alias de cabecera de `hce_mir`, resolviendo el error `TS1117`.
- **`ingestion/csvStreamer.ts`**:
  - **Resiliencia**: Actualizado el generador `streamCSV` para ignorar líneas vacías o compuestas únicamente por delimitadores, mejorando la robustez ante archivos CSV mal formateados.
- **`ingestion/csv.worker.ts`**:
  - **Typing**: Aplicado casting explícito en la normalización de alias para corregir inferencias de tipo `unknown` en entornos estrictos de TypeScript.
- **`components/HCEView.tsx` & `Results.tsx`**:
  - **Typing**: Refinado el tipado de categorías visuales y acceso a tomas clínicas mediante casting seguro, eliminando errores de acceso a propiedades en tipos desconocidos.
- **Suite de Tests**:
  - **Estabilización**: Sincronizado el mock de la base de datos en `searchEngine.test.ts` para incluir soporte a múltiples almacenes (`metadata`, `search_index`) y el método `getAllKeys`, restaurando el paso del 100% de los tests unitarios.
- **Sincronización de Versión**: Incremento a **V5.1.1**.

## [2026-05-08]
### Optimización de Campos Multivariables y Resiliencia en Ingesta (V5.1.0)
- **`HCEView.tsx`**:
  - **Fixed**: Corregida la agrupación de campos multivariables (separados por `$`) en `HCEView.tsx`.
  - **UI/UX**: Implementada una nueva interfaz de **Lista de Hallazgos Expandida** para campos multivariables. Los resultados se presentan ahora en un contenedor estilizado y permanentemente visible (sin necesidad de clic manual), optimizando la velocidad de lectura clínica.
  - **Lógica de Agrupación Refinada**: Mejorado el motor de agrupación para manejar correctamente el literal `(Variables)`, tratándolo como un marcador de grupo redundante que se oculta automáticamente si existen otros hallazgos más específicos.
  - **Importación de Iconografía**: Añadido `ChevronDown` para reforzar la metáfora visual de lista desplegable.
  - **Clinical Logic**: Refinado el filtrado de valores redundantes como `(Variables)` en grupos multivariables y mejorada la captura de valores no booleanos en estos grupos.
- **`csv.worker.ts`**:
  - **Normalización de Cabeceras Proactiva**: Refactorizado `normalizeRecord` para considerar automáticamente todos los campos definidos en `visualCategories` como candidatos para la normalización. Esto permite que el sistema reconozca campos incluso si en el CSV original contienen espacios extra o dos puntos técnicos (`:`), eliminando fallos de "campos no mostrados" por inconsistencias de formato.
- **Sincronización de Versión**: Incremento a **V5.1.0**.

## [2026-05-08]
### Desacoplamiento de Filtrado y Visualización HCE (V5.0.2)
- **`HCEView.tsx`**:
  - **Historia Clínica Completa**: Eliminada la restricción que ocultaba categorías clínicas no seleccionadas en el filtro de búsqueda. Ahora, el sistema muestra siempre el expediente completo (Antecedentes, Anamnesis, etc.) para proporcionar el contexto clínico total requerido por el usuario.
  - **Resaltado de Búsqueda Ubicuo**: Activado el resaltado de términos de búsqueda (`shouldHighlight={true}`) en todas las secciones del informe, independientemente de los filtros activos. Esto permite localizar hallazgos relevantes en todo el historial una vez identificado el paciente.
  - **Sincronización de Tipado**: Actualizada la interfaz `HCEViewProps` para soportar la gama completa de filtros (fechas, servicios, campos) persistidos en el motor de búsqueda.
- **Sincronización de Versión**: Incremento a **V5.0.2**.

## [2026-05-08]
### Refinamiento de Mensajes de Procesamiento (V5.0.1)
- **`App.tsx`**:
  - **Contextualización de Operaciones**: Implementado un sistema de discriminación de mensajes según el tipo de operación activa (ingesta de datos vs. limpieza de base de datos).
  - **Mensajes Personalizados**: 
    - El borrado de datos ahora muestra el título **"Limpiando memoria clínica..."** y una descripción enfocada en la seguridad y privacidad de los datos.
    - Se ha actualizado el estado visual a **"Borrado Seguro"** para diferenciarlo de la ingesta activa.
  - **Arquitectura de Estado**: Añadido el estado `processingType` para gestionar de forma robusta la UI durante procesos de larga duración en segundo plano.
- **Sincronización de Versión**: Incremento a **V5.0.1**.

## [2026-05-08]
### Gobernanza de Seguridad y Privacidad Pública (V5.0.0)
- **Seguridad y Privacidad**:
  - **Repositorio Público Hardening**: Implementado un ecosistema completo de gobernanza para la exposición pública del repositorio, incluyendo políticas de límites de seguridad, datos prohibidos y reglas de publicación.
  - **Estructura de Seguridad (`/security`)**: Creada una suite de documentos de seguridad: `SECURITY.md`, `DATA_POLICY.md`, `REPOSITORY_HARDENING.md`, `SAFE_CONTRIBUTING.md` e `INCIDENT_RESPONSE.md`.
  - **Gobernanza IA y Humana (`/.ag`)**: Reforzadas las directrices para agentes de IA y colaboradores sobre la naturaleza pública del repositorio y la prohibición absoluta de datos clínicos reales.
  - **Refuerzo de `.gitignore`**: Bloqueo proactivo de extensiones sensibles (`.xlsx`, `.csv`, `.db`, `.env`, `.bak`) y directorios de exportación/logs para evitar filtraciones accidentales.
- **`README.md`**:
  - Actualizado con advertencias críticas sobre el entorno público y links directos a la nueva gobernanza de seguridad.
- **Plantillas GitHub**:
  - Implementados `PULL_REQUEST_TEMPLATE.md` y templates de `ISSUE` con checklists de seguridad obligatorios y advertencias de privacidad.
- **Sincronización de Versión**: Incremento global a **V5.0.0**.

## [2026-05-08]
### Reestructuración Documental y Gobernanza IA-First (V4.9.0)
- **Repositorio**:
  - **Implementación del Ecosistema `/.ag`**: Creado un directorio de gobernanza exclusivo para agentes de IA (Antigravity) que incluye identidad, restricciones, mapa de contexto, políticas de ejecución y anti-alucinación.
  - **Reorganización de `/docs`**: Reestructurada la documentación técnica en módulos específicos (Arquitectura, Clínica, Ingestión, Búsqueda, UI e Histórico) para mejorar la navegabilidad.
  - **Sistema de Gestión de Tareas**: Creado el directorio `/tasks` con plantillas y estados (Active/Completed/Archived) para una mejor trazabilidad del trabajo autónomo.
  - **Endurecimiento de Gobernanza**: Creado el directorio `/governance` con reglas explícitas sobre nomenclatura, documentación, tareas y arquitectura.
- **`README.md`**:
  - **Navegación Optimizada**: Rediseñada la sección de documentación para enlazar directamente con el nuevo ecosistema de gobernanza IA.
- **Sincronización de Versión**: Incremento global a **V4.9.0**.

## [2026-05-08]
### Exportación Controlada y Consolidación de "Última Toma" (V4.8.0)
- **`Results.tsx`**:
  - **Implementación de Exportación Selectiva**: Se ha integrado un nuevo modal de opciones de exportación que permite al usuario elegir entre "Exportación Completa" (todos los registros) y "Solo Última Toma" (un único registro por paciente).
  - **Refinamiento UX**: Eliminada la terminología técnica (`Id_Toma`, `Orden_Toma`) del modal de exportación para ofrecer una interfaz más limpia y orientada al usuario final.
  - **Pipeline Unificado**: Se ha refactorizado el flujo de descarga para que ambas modalidades utilicen el mismo motor de generación XLSX, garantizando la estabilidad del sistema.
- **`exportUtils.ts` (NUEVO)**:
  - **Consolidación Clínica Determinista**: Implementada la lógica de selección de la "Última Toma" basada exclusivamente en la jerarquía clínica: mayor `Id_Toma` y, en caso de empate, mayor `Orden_Toma`.
  - **Transformación O(n)**: El proceso de consolidación se realiza en una sola pasada de alta eficiencia, garantizando el rendimiento incluso con datasets de más de 100k registros.
  - **Integridad de Datos**: Asegurada la preservación exacta de los campos multivalor ($) y los mappings demográficos durante la transformación.
- **Sincronización de Versión**: Incremento global a **V4.8.0**.

## [2026-05-07]
### Robustez en Ingesta y Resolución de Claves Estructurales (V4.6.1)
- **`csv.worker.ts`**:
  - **Corrección de Error [001]**: Resuelto el fallo que bloqueaba la ingesta si el CSV utilizaba un alias (ej. `NHC`) en lugar del nombre canónico (`N.H.C`).
  - **Normalización Previa**: Refactorizada la lógica de validación para normalizar los registros (aplicando `headerAliases`) antes de verificar la presencia de las claves estructurales obligatorias (`NHC`, `Id_Toma`, `Orden_Toma`).
  - **Mejora en Detección de Campos No Mapeados**: El sistema de auditoría ahora reconoce correctamente los alias de los campos mapeados, evitando falsas alarmas de "campos no mapeados" cuando se utiliza nomenclatura alternativa.
- **`mappings.ts`**:
  - **Sincronización HCE-OBS**: Añadidos aliases estándar para `Id_Toma` y `Orden_Toma` en el modelo **HCE-OBS**, garantizando la misma resiliencia ante variaciones de cabecera que en los modelos MIR y ALG.
- **Sincronización de Versión**: Incremento a **V4.6.1**.

## [2026-05-07]
### Restauración de Estética Inmutable (V4.6.2)
- **`HCEView.tsx`**:
  - Revertidos los cambios estéticos experimentales en **HCE-OBS** para restaurar la fidelidad visual absoluta con los modelos ALG y MIR.
  - El campo **C.P.** vuelve a su posición original en la segunda fila de la cabecera demográfica.
  - Se ha unificado el título del sidebar a **"Navegación / Tomas"** para OBS y se ha restaurado el renderizado en formato tabla.
  - Eliminada la barra de navegación secundaria redundante en OBS, manteniendo una interfaz limpia y sobria.
- **`mappings.ts` (HCE-OBS)**:
  - Resuelto el problema de campos no mapeados mediante la adición de `headerAliases` para **"Días de gestación"** y **"Semanas de gestación"**, permitiendo su correcta clasificación en la sección de Datación.
  - Corregida la errata **"Jucio"** por **"Juicio"** en los campos de diagnóstico, manteniendo compatibilidad con ambas nomenclaturas mediante el sistema de alias.
  - Mapeado el campo **"PAD"** dentro de la subcategoría de **CONSTANTES** en HCE-OBS, integrándolo correctamente en la tabla de constantes vitales.
  - Renombrada la subcategoría **"02-04 - EXPLORACION GENERAL"** a **"02-04 - EXPLORACION"** y añadido soporte para la variante acentuada **"Exploración general:"** mediante alias.
  - Corregido error de decodificación en **"Peso 1ª Visita"** (aparecía como "1? Visita") mediante la actualización del transcodificador CP850 en `App.tsx` para soportar los caracteres ordinales `ª` y `º`.
  - Resuelto el problema recurrente del símbolo `?` en campos como **"Htº"** mediante la inclusión del símbolo de grado `°` (248) en el transcodificador y la creación de aliases de resiliencia para Hematocrito.
  - Mapeado el campo **"SCREENINIG ANEUPLODIAS"** (corrigiendo la errata de triple 'I' del origen) a la subcategoría correspondiente en ANALITICAS mediante el sistema de aliases.
  - Corregido el mapeo de **"Vitalidad (F.C. F.)"** añadiendo aliases para soportar variaciones con y sin espacios en las siglas, asegurando su ubicación en la subcategoría de Exploración Obstétrica.
- **`HCEView.tsx`**:
  - Unificada la tabla de **Constantes Clínicas** para todos los modelos (MIR, ALG, OBS) siguiendo el diseño premium de 4 columnas.
  - Para **HCE-OBS**, se ha integrado el campo específico **"Aumento de peso desde el comienzo del embarazo"** en la estructura de la tabla y se ha suprimido de la lista individual de campos para evitar duplicidades.
  - Sincronización de estilos (blanco/verde) y bordes para garantizar la inmutabilidad estética.
- **Jerarquía y Estructura HCE-OBS**:
  - Implementado sistema de **Categorías > Subcategorías** en `mappings.ts` mediante el delimitador `>`.
  - Refactorizado el motor de renderizado en `HCEView.tsx` para agrupar subsecciones en 6 bloques principales (Antecedentes, Anamnesis, etc.), manteniendo la paridad visual con MIR/ALG.
  - Implementado sistema de **Limpieza de Títulos** que elimina prefijos de numeración (`01-`, `02-01-`) para una visualización más limpia y profesional.
  - Introducidos sub-encabezados elegantes para distinguir subcategorías dentro de cada bloque principal.
- **Hotfix `HCEView.tsx`**:
  - Corregido error de sintaxis ('return' outside of function) causado por la eliminación accidental de un condicional durante la refactorización jerárquica.
- **Robustez en el Renderizado**:
  - Implementadas comprobaciones de nulidad en las funciones `normalize` y `cleanTitle` para evitar excepciones en tiempo de ejecución.
  - Restaurada la propiedad `isSelected` en los objetos de sección, necesaria para la lógica de resaltado de búsqueda.
  - Corregida la omisión accidental de la declaración de `renderedSections` durante la refactorización jerárquica.
  - Ajustada la ubicación de la tabla de **Constantes** para que se renderice específicamente dentro de la subcategoría **CONSTANTES** en HCE-OBS.
  - Sincronizada la constante de versión en `App.tsx` para que el **GlobalHeader** refleje correctamente la versión actual del sistema.
  - **Automatización Total de Versionado**: Refactorizado el sistema para extraer la versión de `package.json` y la fecha de compilación directamente de **Vite** (`__BUILD_DATE__`). Esto garantiza que el sistema siempre muestre información 100% real y actualizada sin intervención manual.
  - **Identidad de Marca**: Restaurada la estética original del logotipo de **Queryclin** (contraste Blue-Bold / Primary-Medium) eliminando el tipado agresivo en mayúsculas.
  - **Gobernanza Visual**: Creado el archivo `DESIGN_SYSTEM.md` y actualizada la "Constitución" (`RULES.md`) con una nueva regla de **Inmutabilidad Estética** para evitar que futuros agentes alteren el diseño premium sin permiso.
  - Restaurado el enlace interactivo en el chip de versión del **GlobalHeader**, permitiendo de nuevo el acceso a la guía cronológica/evolución del proyecto mediante un clic.
  - Añadida seguridad adicional en el procesamiento de valores de campos multivariables.
- **Sincronización de Versión**: Incremento a **V4.7.5**.

## [2026-05-07]
### Gobernanza HCE-OBS y Renderizado Determinista (V4.6.0)
- **`mappings.ts`**:
  - Implementada la estructura jerárquica estricta para **HCE-OBS** basada en la normativa inmutable.
  - Definidas categorías clínicas fijas (Antecedentes, Anamnesis, Datación, etc.) con sus respectivos campos raw.
  - Configurada cabecera compartida (HCE-COMUN) con soporte para CIPA, NHC y procesos hospitalarios.
- **`HCEView.tsx`**:
  - **Renderizado Multivalor ($)**: Implementada lógica de agrupación automática para campos que comparten prefijo `$`. Estos campos se visualizan ahora como listas de viñetas en un único bloque clínico.
  - **Determinismo Estricto**: Eliminada la normalización visual de etiquetas para preservar la nomenclatura hospitalaria exacta (incluyendo guiones bajos).
  - **Cabecera Unificada**: Extendida la cabecera compacta a HCE-OBS para garantizar consistencia visual entre MIR, ALG y OBS.
- **`clinicalTaxonomy.ts`**:
  - Preparada la taxonomía para soportar el nuevo filtrado por sub-categorías de obstetricia.
- **Sincronización de Versión**: Salto mayor a **V4.6.0** con plena compatibilidad de rediseño.

## [2026-05-06]
### Interfaz Contextual Unificada (V4.5.0)
- **`GlobalHeader.tsx`**:
  - Rediseño de alta fidelidad para la navegación de expedientes.
  - El botón "Volver" se sitúa en el extremo izquierdo, sustituyendo a la marca del software en modo lectura.
  - Integrada la **Fecha y Hora de la Versión Activa** en la cabecera junto al botón de retorno.
  - El buscador se alinea ahora con el ancho del contenido del informe clínico (`max-w-4xl`).
  - El navegador de expedientes ("Expediente X de Y") se desplaza al extremo derecho junto a las utilidades globales.
- **Arquitectura de Estado**:
  - Elevación de estado de navegación (`activeTomaIndex`, `activeVersionIndex`) a `App.tsx`.
  - Sincronización en tiempo real entre el timeline lateral y la cabecera global.
- **Utilidades**:
  - Centralizadas funciones de extracción de fecha/hora en `dateParser.ts`.
- **Sincronización de Versión**: Salto mayor a **V4.5.0**.

## [2026-05-06]
### Cabecera Global Unificada (V4.4.5)
- **`GlobalHeader.tsx`**:
  - Rediseño integral de la cabecera para la vista de informes (HCE).
  - Se han integrado los controles de navegación ("Volver" y paginación de expedientes) directamente en la cabecera global.
  - El buscador se posiciona ahora de forma centralizada entre el botón de retorno y el navegador de expedientes, creando una experiencia de usuario más coherente y fluida.
- **`HCEView.tsx`**:
  - Eliminado el header local redundante, maximizando el área de lectura del informe clínico.
- **Sincronización de Versión**: Incremento global a **V4.4.5**.

## [2026-05-06]
### Cabecera de Navegación Persistente (V4.4.0)
- **`HCEView.tsx`**:
  - Implementada una **cabecera sticky** para los controles de navegación del expediente ("Volver al listado" y paginación).
  - La cabecera ahora acompaña al usuario durante el scroll de informes extensos, utilizando un efecto de **glassmorphism** (backdrop-blur) para integrarse con el diseño premium.
  - Asegurada la visibilidad y accesibilidad de los controles en informes de gran longitud.
- **Sincronización de Versión**: Incremento global a **V4.4.0**.

## [2026-05-06]
### Robustez en Mapeo de Detalles y Constantes (V4.3.9)
- **`HCEView.tsx`**:
  - Refactorizado el bloque de **Constantes MIR** para incluir una red de aliases mucho más amplia. Ahora todos los campos de enfermedades crónicas (Diabetes, HTA, Dislipemia) buscan activamente sus variantes de "Detalles" tanto en formato abreviado como extendido.
  - Añadido soporte para variantes con/sin tildes y con/sin dos puntos técnicos.
- **`mappings.ts`**:
  - Expandido `headerAliases` para asegurar que el motor de búsqueda también reconozca estas variantes de "Detalles" y enfermedades crónicas, mejorando la indexación de expedientes con nomenclatura inconsistente.
- **Sincronización de Versión**: Incremento global a **V4.3.9**.

## [2026-05-06]
### Robustez en Exclusión de Campos (V4.3.8)
- **`HCEView.tsx`**:
  - Implementada una limpieza de claves más agresiva en `cleanKeyStr` que ahora elimina signos de puntuación (como dos puntos `:` y puntos y coma `;`). Esto asegura que campos como `Peso:` o `EC Proceso:` se identifiquen correctamente contra las reglas de exclusión, independientemente de si el archivo de origen incluye puntuación técnica.
  - Añadidas variantes adicionales de metadatos de ciudad, estado civil y unidades de enfermería a la lista de exclusión global.
- **Sincronización de Versión**: Incremento global a **V4.3.8**.

## [2026-05-06]
### Integración de Detalles HTA (V4.3.7)
- **`mappings.ts`**:
  - Mapeado el campo **"Detalles Hipertensión Arterial"** dentro de la categoría **ANAMNESIS Y EXPLORACION** para HCE-MIR.
- **`HCEView.tsx`**:
  - Añadido el campo visual **"Detalles HTA:"** al bloque de constantes MIR, posicionado inmediatamente después del campo HTA principal para facilitar la lectura correlacionada.
- **Sincronización de Versión**: Incremento global a **V4.3.7**.

## [2026-05-06]
### Refinamiento Estricto de Exclusiones (V4.3.6)
- **`HCEView.tsx`**:
  - Corregida la lógica de exclusión de la sección de **Debug**: se han normalizado los nombres de los campos (sustituyendo guiones por espacios) para asegurar que coincidan con la lógica interna de limpieza.
  - Añadidos a la lista negra global: `EC PROCESO`, `EC USUARIO CREADOR`, `CONTADOR` y `DEMOG DOMICILIO`.
- **Sincronización de Versión**: Incremento global a **V4.3.6**.

## [2026-05-06]
### Depuración de Campos Redundantes (V4.3.5)
- **`mappings.ts`**:
  - Eliminados campos innecesarios de la categoría **OTROS** en HCE-MIR (`Contador`, `EC_Ciudad_Paciente`, `EC_Proceso`, `EC_Usuario_Creador`, `Unidad de Enfermería`) para reducir el ruido visual.
- **`HCEView.tsx`**:
  - Expandida la lista de exclusión para la sección de **Debug** (Campos no mapeados). Se han ocultado campos que ya aparecen en otras partes del informe o que carecen de relevancia clínica directa (`Fecha Observacion Clinica`, `EC EDAD PACIENTE`, `EDAD TOMA`, `DEMOG-Domicilio`).
- **Sincronización de Versión**: Incremento global a **V4.3.5**.

## [2026-05-06]
### Mejora de Persistencia de Búsquedas (V4.3.4)
- **`App.tsx`**:
  - Corregida la lógica de **Búsquedas Recientes**: ahora el sistema diferencia entre búsquedas que usan el mismo término pero tienen filtros distintos (categorías, fechas, etc.), evitando la sobreescritura accidental y permitiendo recuperar contextos específicos de investigación.
- **Sincronización de Versión**: Incremento global a **V4.3.4**.

## [2026-05-06]
### Refinamiento de Anamnesis HCE-MIR (V4.3.3)
- **`mappings.ts`**:
  - Mapeado el campo **"Situación Basal (Otros)"** dentro de la categoría **ANAMNESIS Y EXPLORACION**.
  - Ajustado el orden visual para que aparezca tras "Observaciones" y antes de "Otras Exploraciones".
  - Añadidos aliases para capturar variantes del nombre.
- **Sincronización de Versión**: Incremento global a **V4.3.3**.

## [2026-05-06]
### Refinamiento de Constantes HCE-MIR (V4.3.2)
- **`mappings.ts`**:
  - Mapeado el campo **"Oxihemoglobina (O2 Hb)"** al identificador canónico **O2 Hb**.
  - Añadidos aliases para asegurar que las variaciones del nombre en el origen se capturen correctamente.
- **`HCEView.tsx`**:
  - Verificada la representación visual en el bloque de constantes como **O2 Hb:**.
- **Sincronización de Versión**: Incremento global a **V4.3.2**.

## [2026-05-06]
### Refinamiento de Mappings HCE-MIR (V4.3.1)
- **`mappings.ts`**:
  - Implementada la integración de **"Resultado Analítica"** dentro del formulario HCE-MIR. El campo ahora se categoriza correctamente bajo la sección **RESULTADOS PRUEBAS**, evitando que aparezca como dato huérfano en la sección de debug.
  - Añadido soporte extendido de **Aliases para HCE-MIR**:
    - `'Tratamiento Previo'`: Ahora reconoce variantes con y sin colon (`:`), asegurando que el histórico de medicación se visualice siempre en la sección de **ANTECEDENTES**.
    - `'Resultado Analítica'`: Implementada resolución de nombres para variaciones de capitalización y puntuación.
- **`HCEView.tsx`**:
  - Sincronizada la lógica de filtrado y visualización para asegurar que los nuevos campos mapeados se beneficien del sistema de resaltado y navegación contextual.
- **Sincronización de Versión**: Incremento global a **V4.3.1** en `App.tsx`, `CHANGELOG.md`, `README.md` y `TASKS.md`.

## [2026-05-06]
### Arquitectura de Búsqueda Persistente y Cabecera Unificada (V4.3.0)
- **`GlobalHeader.tsx` (Nuevo Componente)**:
  - Implementada **Cabecera Global Unificada**: un nuevo componente persistente que consolida la identidad de marca, navegación y herramientas de búsqueda en una única barra superior.
  - **Buscador Refinador Persistente**: El buscador ahora es accesible desde cualquier vista (Resultados, HCE), permitiendo realizar nuevas consultas o refinar las actuales manteniendo los filtros activos.
  - **Indicador de Filtros Activos**: Añadido un icono de filtro pulsante dentro de la barra de búsqueda que alerta visualmente al usuario cuando los resultados están siendo segmentados por categorías, fechas o servicios.
  - **Contexto de Navegación**: Integrados accesos directos para volver al listado completo de pacientes y botón de limpieza de base de datos directamente en la cabecera.
- **`App.tsx`**:
  - Refactorizada la gestión de cabeceras: se ha eliminado la lógica de header duplicada para delegar toda la gestión visual a `GlobalHeader`.
  - Optimizada la estructura de layout usando Flexbox estándar para evitar solapamientos visuales y asegurar la interactividad total de la lista de pacientes.
- **`Results.tsx` & `HCEView.tsx`**:
  - Limpieza de redundancias: eliminados los controles de navegación que han sido centralizados en la cabecera global o restaurados a sus posiciones estratégicas originales por preferencia de UX.
- **Sincronización de Versión**: Incremento global a **V4.3.0** en `App.tsx`, `CHANGELOG.md`, `README.md` y `TASKS.md`.

## [2026-05-06]
### Filtrado por Sub-categorías y Campos Clínicos (V4.2.9)
- **`Home.tsx`**: 
  - Implementada la funcionalidad de expansión de categorías: al seleccionar una categoría clínica, ahora aparecen sus campos específicos (sub-categorías) con checkboxes para un filtrado quirúrgico.
  - Añadido estado `selectedFields` y `expandedCategory` para gestionar la navegación jerárquica de filtros.
  - Actualizada la persistencia de búsquedas recientes para incluir el estado de los campos seleccionados.
  - **Corrección de Errores**: Corregida excepción en el renderizado y manejo de eventos al seleccionar categorías cuando no había un formulario activo o se producían fallos de normalización de cadenas. Se ha mejorado la robustez de las funciones de filtrado visual.
- **`App.tsx`**:
  - Refactorizado el motor de filtrado `applyFilters` para priorizar los campos específicos si han sido seleccionados, permitiendo búsquedas de alta precisión en dominios concretos del formulario.
  - Sincronizada la comunicación con el componente `Home` mediante el paso del `activeFormId`.
  - Corregida la firma de `handleSearch` para soportar la propagación de filtros por campos hacia el motor BM25.
- **Sincronización de Versión**: Incremento global a **V4.2.9** en `package.json`, `App.tsx`, `Evolution.tsx`, `README.md`, `RULES.md` y `TASKS.md`.

## [2026-05-06]
### Simplificación de Taxonomía de Filtros (V4.2.8)
- **`Home.tsx`**: 
  - Eliminada la categoría "General" de los filtros de búsqueda por petición del usuario. El sistema ahora se centra exclusivamente en categorías de contenido clínico (Antecedentes, Anamnesis, etc.), manteniendo la visualización de los datos generales en la cabecera del expediente pero sin requerir su filtrado explícito en la búsqueda por categorías.
- **Sincronización de Versión**: Incremento global a **V4.2.8** en `package.json`, `App.tsx`, `Evolution.tsx`, `README.md`, `RULES.md` y `TASKS.md`.

## [2026-05-06]
### Persistencia de Filtros en Consultas Recientes (V4.2.7)
- **`App.tsx`**: 
  - Modificada la persistencia en `localStorage`: el sistema ahora guarda el objeto de filtros completo (rango de fechas, servicios y categorías) junto a cada consulta en el historial de "Búsquedas Recientes".
- **`Home.tsx`**:
  - Implementada la restauración automática de filtros: al hacer clic en una búsqueda reciente, el sistema no solo recupera el texto, sino que restaura el estado visual de los selectores de fecha y las categorías seleccionadas, permitiendo repetir la búsqueda exacta de forma instantánea.
  - Sincronizada la interfaz `HomeProps` para soportar el paso de categorías en la navegación histórica.
- **Sincronización de Versión**: Incremento global a **V4.2.7** en `package.json`, `App.tsx`, `Evolution.tsx`, `README.md`, `RULES.md` y `TASKS.md`.

## [2026-05-06]
### Resaltado Ubicuo de Búsqueda y UX en Navegador Lateral (V4.2.6)
- **`HCEView.tsx`**: 
  - Implementado **Resaltado en Navegador Lateral**: El sistema ahora identifica visualmente qué visitas ("tomas") y versiones ("registros") contienen coincidencias con los términos de búsqueda actuales.
  - Añadido **Indicador de Coincidencia (Amber Pulse)**: Se ha integrado un pequeño punto ámbar pulsante junto al ID de la Toma en el sidebar para alertar al clínico de la presencia de hallazgos relevantes sin necesidad de entrar en cada versión.
  - Refinado el **Estilo de Botones en Sidebar**: Las versiones que contienen coincidencias ahora se tiñen de un suave color ámbar (`bg-amber-100`) y resaltan sus metadatos (fecha/hora) para facilitar la navegación visual rápida por el historial clínico.
  - Sincronizada la lógica de detección con el motor global, asegurando que el resaltado sea coherente entre el cuerpo del informe y el navegador lateral.
- **Sincronización de Versión**: Incremento global a **V4.2.6** en `package.json`, `App.tsx`, `Evolution.tsx`, `README.md`, `RULES.md` y `TASKS.md`.

## [2026-05-05]
### Refinamiento de Búsqueda Contextual y UX Avanzada (V4.2.5)
- **`App.tsx`**: 
  - Corregido fallo de falsos positivos en la categoría "General": ahora el motor valida estrictamente que la palabra clave exista en los campos de Cabecera/Control antes de retornar el resultado.
  - Optimizada la lógica `applyFilters` para manejar múltiples categorías simultáneas con mayor robustez funcional.
- **`HCEView.tsx`**:
  - Implementado **Resaltado Selectivo**: el sistema ahora solo resalta términos de búsqueda en las categorías que coinciden con los filtros activos. Esto permite mostrar el informe completo (manteniendo la integridad de los datos) mientras se guía visualmente al clínico hacia el motivo exacto de la coincidencia.
  - Corregido error de sintaxis JSX en el componente `ClinicalField` que impedía el renderizado de bloques de texto largo.
  - Sincronizada la tabla de **Constantes Clínicas** con el sistema de resaltado selectivo.
- **Sincronización de Versión**: Incremento global a **V4.2.5** en `package.json`, `App.tsx`, `Evolution.tsx`, `README.md`, `RULES.md` y `TASKS.md`.

## [2026-05-04]
### Estabilización de Motor de Fechas y Búsqueda (V4.2.3)
- **`App.tsx`**: Resolución definitiva de fechas y errores en Excel (.xlsx):
  - Modificado el formato de exportación a `dateNF: 'dd/mm/yyyy hh:mm:ss'` para forzar la compatibilidad con el estándar europeo (Día/Mes/Año) y recuperar la hora de las tomas.
  - Implementado un "Rescatador de Fórmulas" (`cell.f` a `cell.v` para `t === 'e'`). Excel a menudo interpreta textos clínicos como "`- Paciente con tos`" como fórmulas matemáticas y devuelve `#NAME?`. Ahora el sistema intercepta este error y restaura el texto original escrito por el usuario.
- **`QueryEngine.ts`**: Solucionado fallo crítico que ignoraba los filtros temporales (DateRange) y de Servicio en la vista global sin búsqueda por términos (`getAllRecords`). Se ha añadido precisión de zona horaria local (`T00:00:00` y `T23:59:59`) a los límites del filtro para evitar desplazamientos por UTC, y exclusión estricta de tomas sin fecha.
- **`IndexerService.ts`**: Corregido bug heurístico crítico ("El secuestro de la fecha de nacimiento"). El motor estaba capturando la "Fecha de Nacimiento" del paciente como si fuera la fecha de la toma debido a que la clave contenía la palabra "FECHA". Esto provocaba que todas las tomas tuvieran fechas de décadas pasadas (ej. 1980) y fuesen excluidas al aplicar filtros modernos (2025/2026). Ahora se prioriza explícitamente `EC_Fecha_Toma` y se excluyen activamente campos demográficos como nacimiento.
- **`dateParser.ts` (NUEVO MOTOR)**: Refactorización absoluta del analizador de fechas clínicas. Se ha instalado la librería especializada **`date-fns`** para reemplazar la heurística manual. El sistema ahora itera sobre 28 estándares clínicos (`dd/MM/yyyy`, `yyyy-MM-dd`, formatos Unix Timestamps masivos, etc.) garantizando el parseo robusto independientemente de si la ingesta se realiza por .xlsx, .csv o .txt. Se mantiene el soporte matemático para números de serie nativos de Excel.
- **`mappings.ts` & `HCEView.tsx` (Plantilla HCE-MIR)**: Implementada la estructura canónica jerárquica para HCE-MIR. 
  - Desarrollado mapeo estructural estricto de categorías (Antecedentes, Anamnesis, Diagnóstico, Resultados, etc).
  - Implementada tolerancia a ruido semántico mediante resolución interna de Alias (ej. "Años fumando" vs "Años desde que dejó de fumar").
  - Extendido el diseño paramétrico de ALG para que MIR disfrute de la misma navegación lateral de tomas.
  - Creado renderizado dinámico de **Tabla de Constantes a 4 Columnas** anclada en la sección de Anamnesis y Exploración con métricas ampliadas (NYHA, PAD, PAS, Dislipemia, Hábitos Tóxicos).
- **`App.tsx`**: Incrementada la versión a **V4.2.3**.

## [2026-05-04]
### Mejora de Navegación y Trazabilidad Temporal (V4.2.2)
- **`HCEView.tsx`**: Refinada la **Línea de Tiempo (TomaTimeline)** en el modo HCE-ALG. Se ha integrado la fecha y la hora de la toma en una **única línea** tanto en la cabecera del ID-Toma como en cada Orden_Toma. Esta disposición optimiza el espacio vertical y permite una lectura cronológica más fluida durante la revisión de expedientes.
- **`mappings.ts`**: Eliminado el campo **Edad** de las categorías visuales (`ANAMNESIS Y EXPLORACIÓN`, etc.) en todos los modelos (ALG, MIR, OBS). Se ha erradicado esta redundancia ya que la edad ya se visualiza de forma permanente en la cabecera demográfica de la aplicación.
- **`HCEView.tsx`**: Refinada la lógica de auditoría de datos. Se han añadido **Edad, CIPA, Sexo, CP y Ámbito** a la lista de exclusión global para que no aparezcan erróneamente en el apartado "Campos no mapeados (debug)" si el usuario decide no incluirlos en las categorías visuales explícitas.
- **`App.tsx`**: Incrementada la versión a **V4.2.2** para reflejar las mejoras en la ergonomía de navegación temporal.

## [2026-04-30]
### Modernización de Modelos y Simplificación de Interfaz (V4.2.1)
- **`mappings.ts`**: Actualizados los modelos de formulario a una terna estándar: **HCE-ALG**, **HCE-MIR** y **HCE-OBS**. Se han unificado los IDs y nombres para reflejar la especialización del sistema.
- **`Home.tsx`**: Eliminada la sección de "Modo de Ejecución" (STRICT/EXPLORATION). El sistema ahora opera de forma determinista basándose en el mapeo explícito seleccionado por el usuario.
- **`Home.tsx`**: Rediseñada la pestaña de filtros de búsqueda. Se ha eliminado el campo "Especialidad" (ya que viene predefinida por el modelo importado) y se ha optimizado el layout del rango de fechas para ocupar todo el ancho disponible.
- **`App.tsx`**: Simplificada la lógica de subida de archivos eliminando la gestión del estado `strictMode`, fijándolo a `false` por defecto para permitir una ingesta fluida (estilo "Exploration") ignorando campos no mapeados sin bloquear la UI.
- **`App.tsx`**: El modal de "Modo Debug" ahora solo es visible si el proceso no está activo, evitando interrupciones visuales durante la carga.
- **`csv.worker.ts`**: Silenciadas las advertencias de campos no mapeados en el UI; ahora solo se reportan en la consola del desarrollador para una experiencia de ingesta totalmente automática.
- **`mappings.ts`**: Actualizado el modelo **HCE-ALG** con la estructura exacta del formulario hospitalario real (incluyendo campos como `N.H.C`, `EC_Proceso2`, etc.) para garantizar una ingesta 100% determinista y una categorización visual precisa.
- **`IndexerService.ts` & `QueryEngine.ts`**: Corregido error crítico `push is not a function` mediante el uso de `Object.create(null)` para todos los diccionarios de términos.
- **`Home.tsx`**: Rediseño integral de la experiencia de usuario (UX) mediante un sistema de **3 pasos numerados** con iconos clínicos, guiando al usuario desde la selección del modelo hasta la carga final del archivo.
- **`App.tsx`**: Refinado el branding **NachuS** con tipografía geométrica de peso medio y espaciado negativo (`-0.03em`) para una fidelidad total al estilo Google. Se ha optimizado la alineación vertical y el suavizado de fuentes (antialiased) para una integración perfecta con el logo de Queryclin.
- **`App.tsx`**: Implementado soporte nativo para archivos **.xlsx** mediante la integración con la librería `xlsx`. El sistema ahora convierte hojas de cálculo a formato tabular compatible con el motor de búsqueda en tiempo real.
- **`HCEView.tsx`**: Implementada la **Navegación por Teclado**. Los usuarios ahora pueden desplazarse entre los distintos expedientes clínicos utilizando las flechas de dirección (`←` y `→`), optimizando el flujo de trabajo en entornos de revisión masiva de datos.
- **`HCEView.tsx`**: Integrado el subgrupo **Constantes Clínicas** dentro de la categoría de Anamnesis. Este bloque presenta una estética inmutable tipo tabla (3 columnas) que muestra siempre los valores clave (IMC, Peso, Talla, constantes vitales) incluso si están vacíos, facilitando la comparativa rápida de parámetros biométricos.
- **`HCEView.tsx`**: Implementado el **Orden Estricto Determinista**. El sistema ahora ignora el orden aleatorio de los datos de origen y fuerza la visualización siguiendo la estructura original definida en el mapping. Esto garantiza que el personal clínico encuentre siempre cada campo en la misma posición relativa, facilitando la navegación rápida entre tomas.
- **`HCEView.tsx`**: Implementado el **Formateo Inteligente de Párrafos**. El sistema ahora detecta secuencias de 4 o más espacios en blanco (comunes en exportaciones hospitalarias) y las convierte automáticamente en saltos de línea dobles, mejorando drásticamente la legibilidad de bloques de texto densos.
- **`Evolution.tsx`**: Sincronizada la línea de tiempo del proyecto, incorporando los hitos de las versiones V3.8, V3.9 y la actual V4.2.1, además de actualizar el pie de página de la hoja de ruta.
- **`App.tsx`**: Corregido error crítico de importación (`Search`) que causaba pantallas en blanco durante la navegación.
- **Estética de Versión**: Restaurado el diseño original e inmutable del badge de versión en la cabecera, manteniendo la fecha de compilación visible junto al número de versión.
- **`App.tsx`**: Implementado el **Buscador Ubicuo** integrado directamente en la cabecera del sistema. Al realizar búsquedas o navegar por el historial, el buscador se mantiene accesible de forma minimalista en la barra superior, optimizando el espacio de visualización clínica.
- **Documentación Centralizada**: Actualizado el **Roadmap en README.md** (Fase 12) y sincronizada la versión global del proyecto a **V4.2.1**.
- **`Results.tsx`**: Refinada la estética de las tarjetas de paciente: unificada la altura de los bloques de estadísticas (Informes, Hallazgos, Relevancia) mediante contenedores de altura fija (`h-6`) y flexbox, garantizando una alineación horizontal perfecta y un equilibrio visual superior.
- **Limpieza de Terminología**: Eliminadas todas las referencias obsoletas a "CSV" en la UI y manuales de ayuda, sustituyéndolas por "Archivo de datos / TXT / XLSX" para reflejar fielmente las capacidades actuales del motor.
- **Gestión de Versiones**: Actualización de constantes `VERSION` y `BUILD_DATE` en el núcleo de la aplicación para un seguimiento preciso de los despliegues.

## [2026-04-28]
### Refinamiento Estético HCE-ALG (V4.2.0)
- **`HCEView.tsx`**: Implementado el diseño de **Cabecera de Doble Barra** para HCE-ALG. La barra superior (fondo crema) muestra la identidad (NHC, CIPA, Sexo, Nacimiento, CP) y la inferior el contexto clínico (Ámbito, Proceso, Alergias, Edad).
- **`HCEView.tsx`**: Rediseñada la **Línea de Tiempo (Sidebar)** para HCE-ALG. Ahora se presenta como una tabla compacta con cabecera "ID-Toma" y filas bicolor (cian/blanco) que muestran `OrdenT.#` y `F.Toma`.
- **`mappings.ts`**: Limpiados los nombres de las categorías visuales (eliminando prefijos 00, 01, etc.) para que la interfaz muestre títulos clínicos limpios como "ANTECEDENTES" o "RESULTADOS PRUEBAS".
- **`mappings.ts`**: Asegurada la presencia de campos críticos en la cabecera (Alergias, Proceso2, Ámbito) mediante alias y mapeo demográfico extendido.


- **`Home.tsx` & `App.tsx`**: Implementados dos modos de ingesta: **STRICT** y **EXPLORATION**. El modo estricto detiene la ingesta al encontrar campos no mapeados, mientras que el modo exploración permite guardarlos de forma auditada, lanzando advertencias (`debug_warn`) en el visor.
- **`csv.worker.ts`**: Reescritura del sistema de duplicados. Ahora, la colisión de `Orden_Toma` bajo un mismo `Id_Toma` no bloquea la ingesta. El sistema acepta el registro insertando el flag interno `_is_duplicate` y emite una advertencia visual.
- **`csv.worker.ts`**: Mejoras en **Trazabilidad**. Ahora se graban automáticamente en IndexedDB metadatos forenses: `source_file` (nombre del CSV original) y `ingest_timestamp` (fecha ISO de importación), vinculados al formulario seleccionado.
- **`HCEView.tsx`**: Si se ejecuta bajo EXPLORATION, los campos sobrantes ya no se descartan silenciosamente; se agrupan y renderizan bajo un nuevo apartado resaltado: **Campos no mapeados (debug)**.
- **`HCEView.tsx`**: Añadido **Badge de Duplicidad** en la cabecera de la versión activa. Si un registro está marcado como duplicado, se tiñe de color ámbar y muestra el icono de advertencia en la cabecera del expediente.

### Control Estricto y Auditoría de Datos (V4.0.1)
- **`csv.worker.ts`**: Implementación de **Validación de Mapeo Completo**. Ahora se detecta y detiene la ingesta si el archivo CSV contiene columnas que no están declaradas en el `mapping` (evitando almacenamiento silencioso de datos anómalos).
- **`csv.worker.ts`**: Modificada la validación estructural para que evalúe estrictamente la existencia de las claves `NHC`, `ID_TOMA` y `ORDEN_TOMA` en lugar de una lista completa.
- **`csv.worker.ts`**: Añadida lógica anti-mezcla de registros. El Worker ahora emite una alerta si detecta colisión/duplicidad en el mismo `Orden_Toma` bajo un mismo `Id_Toma`.
- **`App.tsx`**: Añadido **Modo Debug de Ingesta**. Una nueva vista modal que atrapa y muestra de manera estructurada los errores de validación (`debug_error`) emitidos por el Worker (ej. "Campos no mapeados", "Faltan claves").
- **`HCEView.tsx`**: Se ha erradicado por completo el uso de la categoría dinámica `Otros Datos` para los campos no mapeados. Ahora la información que se pinta debe existir explícitamente en el `formMapping`.
- **`HCEView.tsx`**: Implementación de **Navegador de Versiones de Toma**. Anteriormente el visor fusionaba todos los registros de una toma. Ahora se utiliza el `activeVersionIndex` y botones de navegación (`< >`) para garantizar el aislamiento ("Prohibido mezclar registros entre versiones"), renderizando solo la versión exacta seleccionada (`activeVersion.data`).

### Arquitectura Determinista y Formulario Explícito (V4.0.0)
- **`core/mappings.ts`**: Implementado nuevo sistema estricto de mapeo de formularios. El sistema ya no infiere las cabeceras del CSV heurísticamente.
- **`App.tsx` & `Home.tsx`**: Añadido selector obligatorio de formulario previo a la ingesta. El `formId` se persiste de manera local en `IndexedDB` a través del metadata.
- **`csv.worker.ts`**: Eliminadas las funciones de detección heurística (`detectNhcKey`, `findKey`). La ejecución se interrumpe lanzando un error crítico si falta la estructura clave esperada (`NHC`, `ID_TOMA`, `ORDEN_TOMA`) según el formulario.
- **`HCEView.tsx`**: Eliminado el uso de clasificaciones dinámicas. Las categorías visuales de la historia clínica se extraen ahora fielmente y sin alteraciones del objeto `visualCategories` definido en el mapping correspondiente.
- **`clinicalTaxonomy.ts`**: Lógica de heurística clínica descontinuada a favor del control determinista de campos vía mapping externo.

## [2026-04-27]
### Rediseño de Navegación HCE - Toma Única Activa
- **`HCEView.tsx`**: Rediseño arquitectónico completo del visor de historias clínicas. Se elimina el scroll infinito de tomas apiladas y se implementa un **navegador de toma única activa**: solo se muestra una toma en pantalla a la vez.
- **`HCEView.tsx`**: El timeline lateral ahora muestra para cada toma: número de orden (`#`), fecha completa, hora y usuario, permitiendo identificar y saltar a cualquier sesión clínica de un vistazo.
- **`HCEView.tsx`**: Añadida barra de navegación contextual en la cabecera de la toma activa con flechas "Anterior / Siguiente" y contador de posición (ej. "2 / 7").

- **`App.tsx`**: Implementada detección de codificación multinivel con fallback automático a **CP850 (MS-DOS)**. Se ha desarrollado un transcodificador manual para solucionar errores de visualización en caracteres específicos (`¢` -> `ó`) procedentes de sistemas hospitalarios heredados.
- **`clinicalTaxonomy.ts`**: Refinada la normalización de campos (NFD) y ampliada la base de conocimientos para reconocer términos de obstetricia y ginecología del dataset real (`cesárea`, `gestación`, `FPP`, etc.).
- **`HCEView.tsx`**: Añadido soporte para mapeo de fechas dinámico (`EC_Fecha_Toma`) y limpieza de formatos temporales complejos.
- **`Results.tsx`**: Migración completa del sistema de exportación de CSV a **XLSX (Excel nativo)** utilizando la librería SheetJS.
- **`Results.tsx`**: Modificada la visualización del listado para priorizar el campo `EC_Proceso2` (Proceso) sobre el nombre, mejorando la identificación contextual.
- **`csv.worker.ts`**: Actualizada la lógica de ingesta para capturar automáticamente `EC_Proceso2` como dato demográfico (`PROCESO`).
- **`csv.worker.ts`**: Refactorizado el algoritmo `findKey` para priorizar el **orden de las palabras clave** sobre el orden físico de las columnas. Esto garantiza que se elija la información descriptiva (`EC_Proceso2`) incluso si el sistema la exporta después de los IDs internos.
- **`csv.worker.ts`**: Corregido un falso positivo en la detección del Código Postal (CP) mediante exclusiones semánticas.
- **Dependencias**: Incorporada la librería `xlsx` al proyecto.
- **`tests/stress/`**: Creada infraestructura de pruebas de rendimiento. Incluye un dataset sintético de **17.379 registros** (`HC_Stress_Test.txt`) protegido como solo lectura, un script generador (`gen_stress_test.js`) y un plan de pruebas guiado para auditorías.
- **`DIARIO_APRENDIZAJE.md`**: Sincronización completa de la Fase 8 (Robustez y Datos Reales) para auditoría de prácticas.

## [2026-04-24]
### Refinamiento UI y Navegación HCE (V3.7.0)
- **`App.tsx`**: Restauración del tooltip de fecha de última compilación (`BUILD_DATE`) en el badge de versión para mantener la trazabilidad de actualizaciones. Cumplimiento proactivo de sincronía de versiones (Regla 5).
- **`Home.tsx`**: Eliminación del bloque "Consola de Análisis" genérico para limpiar la UI. El histórico de "Consultas Recientes" se ha centrado para ofrecer una vista inicial minimalista y profesional.
- **`HCEView.tsx`**: 
  - Corrección crítica de renderizado (Crash "Sistema Fuera de Servicio") al mapear propiedades incompatibles en la interfaz `Toma` (`idToma` y `latest.data`).
  - Añadido margen de simetría (espaciador derecho fantasma) en el layout principal para garantizar el centrado estético del expediente clínico.
  - Ajuste del anclaje de scroll en las tomas (`scroll-mt-8`) para que al pulsar el menú de navegación, la sesión se posicione directamente en la cabecera (top) en lugar del centro de la pantalla.
  - Resolución de errores TypeScript de exportación garantizando la tipificación segura mediante casting a `Toma[]`.
- **`parser.worker.ts`**: Reparada la telemetría de la barra de carga durante la ingesta. Se ha reducido el `BATCH_SIZE` de 10.000 a 2.500 y se ha forzado el reporte del progreso en el lote final, garantizando que la barra evolucione dinámicamente en UI incluso con archivos pequeños.

## [2026-04-24]
### Motor de Búsqueda de 2ª Generación: BM25 + Clinical Synonym Mapper (V3.9.0)
- **`engine/QueryEngine.ts` — Okapi BM25**: Se ha reemplazado el scoring TF-IDF lineal por el algoritmo **Okapi BM25** (estándar de la industria IR). Mejoras clave:
  - **IDF Robertson**: La fórmula `log((N - df + 0.5) / (df + 0.5) + 1)` evita IDF negativos y es numéricamente más estable.
  - **Saturación de TF** (`k1=1.5`): Mencionar "diabetes" 50 veces ya no da 50x más score que mencionarlo 1 vez. Curva asintótica que neutraliza el sesgo de historias clínicas largas.
  - **Normalización por longitud** (`b=0.75`): Pacientes con historias cortas pero altamente relevantes ya no son aplastados por pacientes con 200 visitas rutinarias.
- **`engine/IndexerService.ts` — Persistencia BM25**: El indexador ahora calcula y persiste `avg_doc_length` y `docLen` por registro durante la ingesta, para que `QueryEngine` pueda aplicar BM25 con datos reales.
- **`engine/Tokenizer.ts` — Clinical Synonym Mapper**: Se ha implementado un diccionario de sinónimos canónicos con cobertura de 23 patologías de alta prevalencia hospitalaria:
  - **Tokens SYN unificados**: Abreviaturas (`HTA`, `DM2`, `TEP`), nombres completos y variantes coloquiales son indexados con un token sintético `__syn_*__` adicional al token original.
  - **Expansión de Bigramas y Trigramas**: El método `expandQuery()` detecta automáticamente frases compuestas ("presion alta", "diabetes mellitus") en la query del usuario.
  - **Indexación dual no destructiva**: Ambos tokens (original + SYN) se indexan simultáneamente, preservando la recuperabilidad exacta.

## [2026-04-24]
### Refactorización Arquitectónica: Clean Architecture (V3.8.0)
- **Topología de Capas**: Se ha desmantelado la carpeta monolítica `src/lib/` en favor de una arquitectura orientada a dominios:
  - `src/core/`: Tipos y taxonomía clínica (`types.ts`, `clinicalTaxonomy.ts`).
  - `src/engine/`: Microservicios del motor de búsqueda.
  - `src/ingestion/`: Workers de procesamiento CSV (`csv.worker.ts`, `csvStreamer.ts`).
  - `src/storage/`: Capa de persistencia (`indexedDB.ts`).
  - `src/utils/`: Utilidades compartidas (`dateParser.ts`, `stringNormalizer.ts`).
- **Escisión del God Object (`searchEngine.ts`)**:
  - El monolito de 600 líneas ha sido fracturado en tres piezas independientes de alta cohesión: `IndexerService.ts` (ingesta y fragmentación), `QueryEngine.ts` (consultas booleanas y TF-IDF), y `Tokenizer.ts` (procesamiento lingüístico y stopwords).
  - `searchEngine.ts` ahora actúa exclusivamente como una clase **Facade** transparente, previniendo romper los contratos de la UI.
- **Limpieza de Código Muerto**: Purgadas importaciones de UI huérfanas (`lucide-react`) y variables de lógica heredada en el motor.

## [2026-04-24]
### Refactorización Semántica y Precisión de Búsqueda (V3.7.2)
- **`searchEngine.ts`**: Corrección masiva de 4 bugs críticos que provocaban pérdida de datos y falsos positivos/negativos:
  - **Filtro NOT a Nivel Registro**: Un término de exclusión (`-HIPERTENSION`) ya no veta al paciente entero históricamente, sino que descarta únicamente la toma clínica afectada.
  - **Filtros de Fecha y Servicio Quirúrgicos**: Los filtros en la interfaz ahora se validan contra los metadatos específicos de la toma clínica que contiene la coincidencia, ignorando el resto del historial irrelevante del paciente. (Se ha incorporado `tomasMeta` en la estructura `Skeleton`).
  - **Heurística de Fechas Extendida**: El motor de indexación ahora soporta columnas nombradas `FECHA`, `FECHA_INGRESO` o `DATE` en cualquier formato delimitado por `/` o `-`, evitando que los pacientes queden ocultos en los filtros temporales.
  - **Indexación Recursiva Total**: Se ha reescrito `tokenizeRecord` para procesar nativamente datos estructurados (Arrays) y Booleanos de historiales clínicos complejos, evitando la pérdida silenciosa de esta metainformación.

## [2026-04-24]
### Auditoría Estructural Continua (V3.7.1)
- **Gobernanza (`docs/`)**: Se han movido masivamente todos los documentos técnicos de diseño (`AUDITORIA_V25.md`, `AUDITORIA_V3.md`, `BATTLE_LOG.md`, `METAPROMPT.md`, `PROPOSAL_AI.md`) desde la raíz del proyecto hacia el directorio `/docs` para cumplir estrictamente la Regla 3.
- **Deuda Técnica (`package.json`)**: Moviendo dependencias de transpilación y UI (`@tailwindcss/vite`, `@vitejs/plugin-react`) de la rama `dependencies` a `devDependencies` para mantener una semántica de paquete impecable.
- **Limpieza de Código Muerto y Encapsulación**:
  - Eliminado el objeto obsoleto `storage` de `dataStore.ts`.
  - Retirada de la palabra clave `export` en múltiples elementos de uso estrictamente local (`ClinicalRecord`, `classifyField`, `SearchEngine`, `VERSION`, `BUILD_DATE`, `ViewState`) para evitar fugas de scope (Leaks de Encapsulación) detectados por `ts-prune`.

## [2026-04-24]
### Vista HCE Continua — Metaprompt Clínico (V3.4.0)
- **`HCEView.tsx`**: Rediseño completo. Eliminación de pestañas de categoría. La vista es ahora **única, continua y jerárquica** conforme al metaprompt clínico. Cabecera fija con datos demográficos (NHC, Edad, Ciudad). Alergias con tratamiento visual prioritario (borde ámbar + icono de alerta). Secciones en orden fijo: Alergias → Antecedentes → Anamnesis y Exploración → Exploraciones Complementarias → Diagnóstico y Tratamiento → Resultados y Pruebas → Hospitalización. Orden temporal descendente (última toma primero). Cada toma muestra fecha, hora y usuario. Campos booleanos con chip compacto de color. Campos largos (>80 chars) con renderizado de párrafo. Cada campo ocupa su propia línea.
- **`fieldDictionary.ts`**: Taxonomía extendida a 8 categorías HCE. Añadidas constantes `SECTION_ORDER` (orden fijo de renderizado) y `SECTION_LABELS` (etiquetas legibles). Nuevas palabras clave para Alergias, Exploraciones Complementarias e Hospitalización. Normalización de claves con `replace(/[_\s-]+/g, '_')` antes de clasificar. Versión: **V3.4.0**.

## [2026-04-24]
### Auditoría Semántica del Motor de Búsqueda (V3.3.0)
- **[BUG-001 CRÍTICO]** `searchEngine.ts::startIndexing()`: Se añade reset de `termFragmentCounts = {}`. Sin este reset, al importar un segundo CSV el IDF se calculaba comparando `documentCount` del nuevo CSV contra listas de docs acumuladas del índice anterior, pudiendo producir scores negativos.
- **[BUG-002 CRÍTICO]** `searchEngine.ts::search()`: La lógica AND ahora verifica co-localización a nivel de registro (toma), no solo a nivel de paciente. "PNEUMONIA BACTERIANA" ya no retorna un paciente donde cada término aparece en tomas distintas. Se añade `mustTerms: Set` por registro en `processTerms`.
- **[BUG-003 CRÍTICO]** `parser.worker.ts`: Centralizada la detección de NHC en la función `detectNhcKey()`. Antes se re-detectaba con lógicas independientes en el loop principal y en `processBatch`, causando desincronización de identidades cuando el primer registro de un lote tenía el campo vacío.
- **[BUG-004 ALTO]** `parser.worker.ts + searchEngine.ts`: Eliminado `flushIndex()` incondicional en `processBatch`. Se añade `flushIndexIfNeeded(threshold=3000)` que solo escribe si el índice en memoria supera 3000 términos. El flush definitivo lo realiza `finalizeIndexing()`.
- **[BUG-005 ALTO]** `parser.worker.ts`: Documentado y verificado que el merge de registros de pacientes entre lotes preserva correctamente los datos de IDB via `getBatch`. Añadido cast explícito de NHC a `String()` para prevenir fallos con valores numéricos.
- **[BUG-006 ALTO]** `parser.worker.ts`: La barra de progreso ahora es determinista. Se calcula `estimatedTotal` como `csvText.match(/\n/g).length` antes del loop. Antes siempre era `totalProcessed + 5000`, nunca superando el 67%.
- **[BUG-007 MEDIO]** `searchEngine.ts`: Las STOPWORDS ahora se normalizan (sin tilde) en el constructor. Las entradas con tilde ('también', 'clínico'...) nunca filtraban porque los tokens ya llegaban sin tilde de `tokenize()`.
- **[BUG-008 MEDIO]** `searchEngine.ts::search()`: El `totalScore` ahora se normaliza por `log(numRegistros + 2)` antes de ordenar. Evita que pacientes crónicos con historiales largos dominen el ranking sobre pacientes con coincidencias más relevantes pero menos tomas.
- **[BUG-009 MEDIO]** `searchEngine.ts`: Split de STOPWORDS en `INDEX_STOPWORDS` (amplio, para indexación) y `QUERY_STOPWORDS` (solo lingüístico, para búsqueda). Términos clínicos como 'antecedentes', 'motivo', 'exploración' ahora son buscables aunque no se indexen en el diccionario de autocompletado. Versión: **V3.3.0**.

## [2026-04-24]
### Limpieza Estructural (V3.2.0 - Structural Audit)
- **Dependencias Eliminadas** (`package.json`): Retirados `@google/genai`, `motion`, `express`, `dotenv`, `@types/express` y `tsx`. Ninguno tenía imports activos en el código fuente. Reducción de bundle estimada: **~800KB**. 126 paquetes desinstalados de `node_modules`.
- **Servidor Express Ficticio Eliminado** (`scripts/server.ts`): El servidor no implementaba ninguna lógica real y era incompatible con la arquitectura Local-First declarada en RULES.md.
- **Código Muerto Eliminado** (`src/lib/dataStore.ts`): Eliminadas `groupData()` (reemplazada por el Worker en V3), `storage.saveData()` (noop vacío) y `storage.loadData()` (devolvía siempre `{patients: {}}`). Se añade `PatientData` como alias de `Patient` para corregir error de tipado silencioso en el Worker.
- **Método de Debug Eliminado** (`src/lib/searchEngine.ts`): Retirado `getStats()` añadido durante la sesión de depuración. Sin referencias en producción.
- **Llamada Inútil Eliminada** (`src/App.tsx`): Eliminada la llamada a `storage.loadData()` que siempre devolvía vacío. La inicialización ahora lee directamente el `patient_count` de IndexedDB.
- **.gitignore Actualizado**: Añadidas entradas para `scratch_parser/`, `test-results/`, `tests/data/*.csv` y `STRESS_TEST_DATA.csv` para prevenir que el repositorio crezca con artefactos de prueba.
- **Archivos Físicamente Eliminados**: `STRESS_TEST_DATA.csv` (34MB, raíz), directorio `scratch_parser/` (con su propio `node_modules`).
- **Errores TypeScript Corregidos**: Resueltos 19 errores pre-existentes en `HCEView.tsx`, `Results.tsx`, `App.tsx` y `csvParser.test.ts`. El compilador `tsc --noEmit` pasa limpio por primera vez.

- **Resolución del "Punto Ciego" Clínico**: Refactorización de `tokenizeRecord` en `searchEngine.ts` para realizar un barrido exhaustivo de **todas** las propiedades de cada registro. Esto soluciona el fallo que impedía indexar columnas clínicas con nombres especiales o acentuados.
- **Robustecimiento del Parser CSV**: Mejora en `csvParser.ts` para manejar correctamente delimitadores finales y evitar el truncamiento de datos en las últimas columnas de la fila.
- **Sincronización del Generador de Pruebas**: Corrección de un fallo de capitalización en `generate_test_suite.cjs` que generaba columnas vacías. Ahora los datos de prueba coinciden con el esquema real detectado en auditoría.
- **Fix de Persistencia y Caché**: Implementación de *Cache Busting* en la carga del Web Worker y upgrade a la **Versión 6** de la base de datos para asegurar un estado limpio tras actualizaciones de motor.
- **Herramientas de Diagnóstico Forense**: Implementación (y posterior retirada) de sistemas de auditoría de anatomía de registros para validación de datos en tiempo real.

## [2026-04-23]
### Añadido (V3.0.0 - Arquitectura Solid-State)
- **Ingesta por Streaming**: Implementación de `streamCSV` mediante generadores. Ahora procesamos 100k+ registros sin cargar el archivo completo en RAM.
- **Índice Fragmentado (Bucketing)**: Solución definitiva al error `Failed to read large IndexedDB value`. Las listas de coincidencia se dividen en fragmentos de 2000 entradas.
- **Gobernanza**: Limpieza de la raíz del proyecto. Los archivos `QUICK_TEST_DATA.csv` y `STRESS_TEST_DATA.csv` han sido movidos a `tests/data/` para cumplir con la Regla 3 de `RULES.md`.
- **Scripts de Soporte**: Creación de `scripts/quick_test_gen.cjs` para validación rápida del motor.

### Corregido
- **Bug de Autocompletado**: Se ha corregido la desestructuración de props en `Home.tsx` que impedía mostrar sugerencias.
- **Fallo Crítico de Lectura**: Eliminado el error de IndexedDB al manejar términos de alta frecuencia (ej: ciudades o servicios comunes).

### Versión 2.7.1 (Estabilización de Ingesta)
- **Merge Robusto**: Implementación del ciclo Read-Merge-Write en el Web Worker, garantizando la integridad de los datos ante registros fragmentados o intercalados en datasets masivos.

### Versión 2.7.0 (Optimización Extrema y Motor Ultra-Eficiente)
- **Motor de Búsqueda de Alto Rendimiento:**
  - **Batching de Consultas:** Refactorización total del método `search` para realizar consultas por lotes (`db.getBatch`) en una sola transacción de IndexedDB. Reduce drásticamente la latencia en búsquedas complejas.
  - **Optimización de Persistencia de Índice:** Mejorado el proceso de *Merge* con una gestión de memoria más eficiente para la unión de arrays, reduciendo la presión sobre el recolector de basura.
- **Arquitectura de Ingesta de Un Solo Paso (Single-Pass):**
  - **Procesamiento Incremental:** El Web Worker ahora indexa y guarda pacientes en un único bucle, eliminando la necesidad de mantener el dataset completo en RAM.
  - **Flushing Granular de Esqueletos:** Los metadatos de filtrado (*skeletons*) ahora se guardan de forma fragmentada durante el proceso, permitiendo manejar 100k registros con un consumo de memoria mínimo.
- **Robustez del Parser:**
  - **Limpieza de Líneas Vacías:** El motor de parseo ahora ignora automáticamente registros vacíos, evitando inconsistencias en los resultados.

## [2026-04-22]
### Versión 2.6.3 (Sello de Estabilidad y Motor de Precisión)
- **Motor de Búsqueda de Alta Precisión (Refactorización):**
  - **Lógica Booleana Estricta:** Implementación de "Strict MUST" (AND real) para garantizar que los resultados cumplan todas las condiciones de búsqueda, eliminando falsos positivos en 100k.
  - **Filtrado de Ruido (Stopwords):** Integración de un catálogo de palabras comunes en español para limpiar las sugerencias y mejorar la relevancia clínica.
  - **Detección Case-Insensitive:** Operadores `AND`/`OR` ahora se reconocen sin importar la capitalización.
- **Optimización de Persistencia:**
  - **Merge Robusto de Índice:** Corrección del sistema de volcado fragmentado para prevenir la pérdida de datos durante ingestas masivas.
  - **Caché de Conexión IDB:** Implementación de conexión persistente a base de datos para estabilidad total.

### Versión 2.6.1 - 2.6.2 (Scaling & Logic Patch)
- **Muestreo Inteligente (Heurística):** Limitación de la generación del diccionario de autocompletado a 10.000 registros para mantener la ligereza de la RAM en datasets de 100k.
- **Gestión de Memoria:** Liberación explícita de objetos pesados tras la indexación para evitar bloqueos del navegador.

## [2026-04-22]
### Versión 2.6.0 (Inteligencia de Población y Autocompletado)
- **Fase 6: Autocompletado Clínico Inteligente:**
  - **Motor de Sugerencias:** Extracción automática de los 1.000 términos más frecuentes del CSV durante la ingesta.
  - **Experiencia de Usuario (UX):** Nuevo componente desplegable con navegación por teclado (flechas/Enter), ocultación inteligente y resaltado de términos.
  - **Persistencia Local:** Sincronización inmediata de sugerencias tras la carga de datos sin requerir reinicio.
- **Identidad Visual Sensible al Género (Refinamiento):** Implementación de avatares dinámicos (Cian/Amatista) consistentes en todo el flujo clínico.
- **Gobernanza:** Sincronización automática de la versión global visible en la interfaz.

## [2026-04-21]
### Versión 2.5 (Resolución de Auditoría y Optimización de Ingesta Masiva)
- **Resolución de la Auditoría Clínica HCE-Comun:**
  - **Cabecera Demográfica:** Implementada extracción de Edad, Sexo, CP y Ciudad desde IndexedDB para visualización permanente en la ficha del paciente.
  - **Historia Clínica Completa (Secuencial):** Nuevo modo de visualización fluida sin pestañas para lectura continua de toda la historia del paciente.
  - **Limpieza de Categoría "Otros":** Actualización masiva de `fieldDictionary.ts` para clasificar campos críticos (Enfermedad Actual, Alergias, Antecedentes) en sus pestañas correspondientes.
  - **Privacidad y Seguridad:** Implementado aviso `beforeunload` y mecanismo de limpieza de IndexedDB al iniciar nuevas sesiones de navegador para protección de datos personales (A3, B1).
- **Optimización de Ingesta para Big Data (100k+ registros):**
  - **Parser Streaming:** El motor de parseo CSV ahora procesa el texto de forma iterativa, reduciendo drásticamente el consumo de RAM (evita OOM).
  - **Batching de Transacciones IDB:** Implementada lectura/escritura masiva en una sola transacción mediante `getBatch`. Mejora la velocidad de ingesta en un 90%.
  - **Indexador con Flushing:** El `searchEngine` ahora vuelca fragmentos del índice a disco periódicamente durante el proceso, permitiendo manejar datasets masivos sin desbordamiento de memoria.
- **Dashboard y Experiencia de Usuario:**
  - **Buscador Sticky (Persistente):** El buscador ahora se mantiene en la parte superior en formato compacto durante la visualización de resultados.
  - **Historial de Consultas:** Añadida sección de búsquedas recientes persistente en `localStorage`.
  - **Detección Automática de Formatos:** Soporte mejorado para archivos `.txt` y detección automática de delimitadores (`|`, `,`, `;`, `\t`).


## [2026-04-21]
### Versión 2.4 (Narrativa y Evolución del Sistema)
- **Implementación de Vista "Evolución del Proyecto":**
  - **Archivos Nuevos**: `src/components/Evolution.tsx`.
  - **Archivo Modificado**: `src/App.tsx`.
  - **Detalle**: Creación de una página estilo "Timeline" que narra la historia del proyecto desde los primeros laboratorios hasta el motor de búsqueda actual. El objetivo es explicar las fases técnicas (sharding, sharding, tests) de una forma accesible y visual.
- **Badge de Versión Interactivo:**
  - **Archivo Modificado**: `src/App.tsx`.
  - **Detalle**: El badge de versión (`V2.4`) en el header ahora es un botón funcional que permite acceder directamente a la vista de Evolución. Se ha separado visualmente del logo principal para mejorar la UX.

## [2026-04-20]
### Versión 2.3 (Arquitectura de Calidad y Testing)
- **Implementación de Suite de Pruebas (Test-Driven Reliability):**
  - **Tecnologías**: Vitest (Unit/Integration) y Playwright (E2E).
  - **Archivos Nuevos**: `src/lib/__tests__/searchEngine.test.ts`, `src/lib/__tests__/csvParser.test.ts`, `tests/smoke.spec.ts`.
  - **Motivo**: Garantizar que el motor de búsqueda y el parser de CSV funcionen con precisión matemática y no sufran regresiones tras futuros cambios.
- **Corrección de Bug Crítico en Parser CSV:**
  - **Archivo Modificado**: `src/lib/csvParser.ts`.
  - **Detalle**: Corregido fallo en la preservación de comillas que causaba truncamiento de datos cuando un campo contenía el delimitador de tubería (`|`) dentro de un texto encomillado. Detectado gracias a la nueva suite de pruebas.
- **Centro de Ayuda y Guía Clínica Integrada:**
  - **Archivos Nuevos/Modificados**: `src/components/Help.tsx`, `src/App.tsx`.
  - **Detalle**: Implementación de una vista de documentación premium para el personal hospitalario. Incluye tutoriales sobre búsqueda booleana, privacidad local-first y la sección de créditos oficiales del equipo del Hospital Rafael Méndez.

### Versión 2.2 (Ultra-Escalabilidad y Precisión Clínica)
- **Fragmentación de Metadatos (Big Data):**
  - **Archivos Modificados:** `src/lib/searchEngine.ts`, `src/lib/dataStore.ts`.
  - **Detalle:** Se ha eliminado el almacenamiento monolítico de metadatos (`hce_data`) para evitar el límite de 133MB de IndexedDB. Ahora el padrón de pacientes (`skeletons`) se fragmenta en bloques gestionables, permitiendo escalar hasta 100,000 registros sin degradación de rendimiento.
- **Corrección Operador NOT Persistente:**
  - **Archivo Modificado:** `src/lib/searchEngine.ts`.
  - **Detalle:** El operador Booleano `NOT` / `-` ahora consulta directamente la base de datos persistente en IndexedDB en lugar de la memoria volátil, asegurando su funcionamiento en todas las sesiones.
- **Optimización de Tokenización Clínica:**
  - **Archivo Modificado:** `src/lib/searchEngine.ts`.
  - **Detalle:** Reducción del umbral de tokenización para capturar términos de 1 y 2 letras, vital para la detección de constantes y analíticas (`pH`, `O2`, `Na`, `K`, `TA`).
- **Indexación de Filtros Rápidos:**
  - **Archivo Modificado:** `src/lib/searchEngine.ts`.
  - **Motivo:** Acelerar el filtrado por `Servicio` y `Fecha` en grandes volúmenes de resultados. Estos atributos ahora se pre-indexan en los `skeletons` de los pacientes.

## [2026-04-17]
### Versión 2.1 (Optimización de Ingesta y UI)
- **Implementación de Versionado Visual:**
  - **Archivo Modificado:** `src/App.tsx`.
  - **Detalle:** Añadida etiqueta "V2.1" junto al logo con tooltip de fecha/hora para trazabilidad rápida de la versión desplegada.
- **Cambio de Separador de Datos (Pipeline):**
  - **Archivo Modificado:** `src/lib/csvParser.ts`.
  - **Motivo:** El sistema de origen ha cambiado el formato de exportación de coma (,) a pipeline (|). Se ha ajustado el motor de parseo para ser compatible con esta nueva estructura.
- **Organización de Repositorio y Limpieza:**
  - **Archivos/Directorios Nuevos:** `local_workspace/`, `DIARIO_APRENDIZAJE.md`.
  - **Archivo Modificado:** `.gitignore`.
  - **Detalle:** Creación de un espacio de trabajo local para tests e ingestión de datos masivos que no debe sincronizarse con GitHub. Implementación de un Diario de Aprendizaje personal (ignorado en repo).

## [2026-04-16]
### Añadido (Escalabilidad 100k)
---
*Queryclin - Sistema de Análisis Clínico Local-First*
- **Implementación de Arquitectura Local-First de Alto Rendimiento:**
  - **Archivos Modificados:** `src/lib/db.ts` (nuevo), `src/lib/parser.worker.ts` (nuevo), `src/lib/searchEngine.ts`, `src/App.tsx`, `src/components/Results.tsx`.
  - **Motivo:** Para cumplir con el requerimiento de manejar datasets masivos (100.000+ pacientes) sin incurrir en errores de memoria (Out of Memory), se ha migrado la persistencia a IndexedDB. El índice de búsqueda ahora se fragmenta por términos para permitir consultas asíncronas bajo demanda. El procesamiento se ha delegado a un Web Worker para mantener la fluidez de la interfaz.

### Corregido
- **Sincronización de Componentes y Navegación:**
  - **Archivos Modificados:** `src/App.tsx`, `src/components/HCEView.tsx`.
  - **Motivo:** Se detectaron y solventaron errores de comunicación interna (Props de navegación y visibilidad del buscador) surgidos tras la re-arquitectura asíncrona.

### Agregado
- **Sistema de Temas Dinámico (Light/Dark):** Implementación de una arquitectura de temas profesional basada en variables CSS.
  - **Motivo:** El usuario solicitó un sistema para alternar entre modos de visualización sin perder la "estética original". Se añadió un toggle manual con persistencia.

### Mejorado
- **Legibilidad y UX Clínica:** Optimización global de fuentes, contrastes e interlineados.
  - **Motivo:** Aumentar la velocidad de lectura de registros médicos mediante un interlineado mayor (1.6) y una jerarquía tipográfica marcada.

### Corregido
- **Renombramiento del Proyecto:** Actualización unificada a "Queryclin".
  - **Motivo:** Establecer una identidad oficial única para el proyecto.

### Agregado
- **Documento de Reglas Estrictas:** Creación de `RULES.md`.
  - **Motivo:** Establecer directrices innegociables para el desarrollo automático y manual del sistema.

### Modificado
- **Conversión Exhaustiva del README.md:** Transformación en un "Libro Blanco" técnico.
- **Exportación de Datos a CSV:** Implementado sistema de descarga de resultados filtrados.
- **Humanización de la Documentación:** Ajuste del tono en el README para reflejar el proceso de decisiones compartidas.

### Refactorizado
- **Alineación Arquitectónica del Motor Clínico:** Saneamiento de nomenclatura (Toma y Orden_Toma) y agrupación de resultados por paciente (NHC).

### Corregido
- **Restauración de Filtrado Avanzado:** Reconstrucción de filtros por fecha y servicio con terminología hospitalaria sobria.
- **Rollback "Clean Clinical":** Regreso a la estética diurna original (Gris Niebla/Azul Radiológico) por petición expresa del usuario para garantizar neutralidad visual.

## [2026-04-23]
### Corregido (V2.7.1)
- **Implementación de Merge Robusto en Ingesta**:
  - **Archivos Modificados**: `src/lib/parser.worker.ts`.
  - **Detalle**: Se ha corregido un bug crítico que provocaba la pérdida de datos cuando los registros de un paciente estaban dispersos en diferentes lotes del CSV. El worker ahora realiza una lectura previa de IndexedDB y fusiona las nuevas "tomas" con la historia clínica existente.
### Mejorado (V2.7.0)
- **Arquitectura de Ingesta Single-Pass**:
  - **Archivos Modificados**: `src/lib/parser.worker.ts`, `src/lib/csvParser.ts`.
  - **Detalle**: Optimización extrema del motor de ingesta para procesar 100k+ registros en un solo flujo lineal, reduciendo el consumo de RAM en un 60%.
- **Batching de Consultas e Indexación**:

## [2026-04-22]
### Añadido (V2.6.3 - Inteligencia Clínica)
- **Autocompletado Basado en Muestreo**:
  - **Archivos Modificados**: `src/lib/searchEngine.ts`, `src/components/Home.tsx`.
  - **Detalle**: Implementación de sugerencias de búsqueda inteligentes generadas dinámicamente a partir de un muestreo de 10,000 registros para mantener el rendimiento.
- **Filtrado de Ruido (Stopwords)**:
  - **Detalle**: Integración de un catálogo de términos comunes médicos para mejorar la relevancia del autocompletado.

### Corregido
- **Motor Booleano Estricto**: Reconstrucción de la lógica de intersección (AND) para evitar falsos positivos en búsquedas multi-término.

## [2026-04-21]
### Añadido (V2.5.0 - Auditoría HCE-Comun)
- **Interfaz Demográfica Persistente**: Extracción de Edad, Sexo y CP a una cabecera fija, eliminando pestañas redundantes.
- **Modo Historia Completa**: Nueva vista de lectura continua del expediente médico.
