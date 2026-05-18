# Historial de Tareas - Proyecto Queryclin

Este archivo mantiene el registro acumulativo de la evolución del sistema. Las tareas completadas permanecen aquí para referencia histórica y auditoría de desarrollo.

---

## 🟢 FASE 1: Cimientos y Motor Booleano (V1.0 - V2.0)
- [x] Implementación de interfaz "Clean Clinical" (Gris Niebla).
- [x] Desarrollo del motor de búsqueda Booleano (AND, OR, NOT).
- [x] Creación del parser de CSV básico (Comas).
- [x] Sistema de Temas (Modo Oscuro "Deep Slate").
- [x] **Logro**: Búsqueda instantánea en datasets pequeños (<5.000 registros).

## 🟢 FASE 2: Escalabilidad y Big Data (V2.1 - V2.3)
- [x] Migración a persistencia asíncrona con **IndexedDB**.
- [x] Delegación de procesamiento a **Web Workers** para evitar bloqueos de UI.
- [x] Implementación de **Fragmentación (Skeletons)** para manejar 100.000 registros.
- [x] Cambio de estándar de ingesta a **Pipeline (|)**.
- [x] Suite de Pruebas Automatizadas (Vitest + Playwright).
- [x] Centro de Ayuda y Guía Clínica Integrada.
- [x] **Logro**: El sistema no colapsa ante 34MB de datos clínicos.

## 🟢 FASE 3: Narrativa y Auditoría Clínica (V2.4 - V2.5)
- [x] Implementación de la vista de **Evolución del Proyecto**.
- [x] Extracción de demografía fija (Edad, Sexo, CP) fuera de pestañas.
- [x] Nueva vista de **Historia Clínica Completa** (Lectura Continua).
- [x] Limpieza de categorías "Otros" en el diccionario hospitalario.
- [x] Mecanismo de persistencia de sesión por seguridad (Cierre = Limpieza IDB).
- [x] **Logro**: Alineación con el estándar de visualización HCE-Comun.

## 🟢 FASE 4: Estabilización y Refinamiento (V2.5.3 ✅)
- [x] **A1. Resiliencia de Ingesta**: Manejo de BOM y finales de línea mixto.
- [x] **A2. Inicialización Dinámica**: Corrección de crashes por categorías faltantes.
- [x] **A3. Estructura Profesional**: Ubicación limpia en `/scripts`, `/tests/data` y `/docs`.
- [x] **A4. Consola Dashboard**: Rediseño premium con KPIs vivos en tiempo real.
- [x] **A5. Identidad Visual**: Avatares de género (Cian/Amatista) automatizados.
- [x] **Logro**: Sistema estéticamente alineado con su potencia técnica.

## 🔵 FASE 5: Inteligencia de Población y Motor V2.6 (COMPLETADA ✅)
- [x] **E3. Autocompletado Clínico**: Sugerencias inteligentes basadas en muestreo de 10k (V2.6.3).
- [x] **E5. Motor de Precisión Booleana**: Reconstrucción total de la lógica AND/OR/NOT para Big Data.
- [x] **E6. Gestión de Ruido**: Implementación de Stopwords clínicos.
- [x] **E4. Auditoría de Términos**: Lista de las palabras más frecuentes en el dataset (Optimizada en V2.7).

## 🟣 FASE 6: Arquitectura Solid-State y V3.0.0 (COMPLETADA ✅)
- [x] **E7. Ingesta por Streaming**: Refactorización de `streamCSV` para archivos ilimitados (V3.0.0).
- [x] **E8. Índice Fragmentado (Bucketing)**: Solución al error `Failed to read large IndexedDB value`.
- [x] **E9. Cumplimiento de Gobernanza**: Limpieza total de la raíz del proyecto (Regla 3).
- [x] **E10. Estabilización de UI**: Corrección de autocompletado en `Home.tsx`.
## 🟠 FASE 7: Auditoría Estructural y Motor de 2ª Generación (V3.8 - V3.9 ✅)
- [x] **A6. Refactorización a Clean Architecture**: Separación en capas (Core, Engine, Ingestion, Storage).
- [x] **A7. Escisión del God Object**: Fractura de `searchEngine.ts` en micro-servicios especializados.
- [x] **A8. Implementación de BM25**: Salto del TF-IDF lineal a **Okapi BM25** con saturación de frecuencia.
- [x] **A9. Clinical Synonym Mapper**: Diccionario de 23 patologías para expansión de consultas.
- [x] **A10. Limpieza de Deuda**: Purga total de código muerto y optimización de tipos.
- [x] **Logro**: Arquitectura de grado empresarial lista para escalado horizontal de funcionalidades.

---
## 🟣 FASE 8: Resiliencia y Soporte Legacy (V4.0.0 ✅)
- [x] **A11. Decodificación Multi-formato**: Soporte nativo para UTF-8, ISO-8859-1 y CP850 (Legacy DOS).
- [x] **A12. Motor de Normalización NFD**: Reconocimiento de caracteres especiales y tildes en cabeceras dinámicas.
- [x] **A13. Exportación Excel Nativa**: Integración de SheetJS para descarga de expedientes en formato .xlsx.
- [x] **Logro**: Compatibilidad total con exportaciones de sistemas hospitalarios de los años 90 y 2000.

## 🔴 FASE 9: Navegación Crítica y Ergonomía (V4.1.0 ✅)
- [x] **U1. Rediseño del Visor HCE**: Timeline lateral interactivo y navegación por tomas individuales.
- [x] **U2. Cabeceras Dinámicas**: Extracción automática de metadatos de proceso (Ámbito, Servicio, Facultativo).
- [x] **U3. Estética "Clinical Modern"**: Refinamiento de sombras, tipografías y contraste para entornos hospitalarios.

## 🟤 FASE 10: Ingesta Inteligente y Debug (V4.2.0 ✅)
- [x] **E12. Modos de Carga (Strict/Exploration)**: Control total sobre el mapeo de campos y auditoría de excedentes.
- [x] **E13. Gestión de Duplicados**: Sistema de registro marcado (`_is_duplicate`) para colisiones de tomas.
- [x] **E14. Trazabilidad Forense**: Registro del nombre de archivo original y marca de tiempo en cada expediente.

## 🟢 FASE 11: Modernización y Buscador Ubicuo (V4.2.1 ✅)
- [x] **U4. Buscador en Cabecera**: Integración centralizada para navegación global sin retroceder a Home.
- [x] **U5. Asistente de Carga (3 Pasos)**: Simplificación de la UX para personal no técnico.
- [x] **U6. Navegación por Teclado**: Soporte para flechas direccionales en la revisión de expedientes.

## 🟡 FASE 12: Estructura Determinista y Legibilidad (V4.2.1 ✅)
- [x] **A14. Orden Estricto de Mapping**: Forzado de la estructura visual según el modelo oficial ( mappings.ts).
- [x] **A15. Formateo Inteligente**: Conversión automática de espacios múltiples en saltos de línea legibles.
- [x] **A16. Subgrupo de Constantes Vitales**: Implementación de tabla inmutable para parámetros biométricos (IMC, Peso, etc).
- [x] **Logro**: El sistema alcanza un nivel de madurez visual y técnica industrial, listo para producción.

## 🔵 FASE 13: Trazabilidad Temporal en Navegación (V4.2.3 ✅)
- [x] **U7. Trazabilidad en Timeline**: Integración de fechas en cabeceras de Toma y horas en Orden_Toma.
- [x] **A17. Eliminación de Redundancia Demográfica**: Retirado el campo "Edad" de las categorías clínicas (Anamnesis) al estar ya presente en la cabecera.
- [x] **E16. Estabilización de Motor de Fechas**: Soporte nativo para MS-Excel (`cellDates: true`) and corrección del filtro cronológico (`getAllRecords`) con padding +24h.
- [x] **Logro**: Navegación cronológica intuitiva y motor de búsqueda de fechas 100% fiable.

## 🟢 FASE 14: Filtros Contextuales y UX Avanzada (V4.2.5 ✅)
- [x] **F21. Filtrado Bidireccional**: Sincronización de búsqueda por términos y categorías con exclusión estricta de hallazgos fuera de contexto.
- [x] **U18. Resaltado Selectivo**: Sistema de highlighting dinámico que solo actúa sobre las secciones filtradas en el visor de informe completo.
- [x] **U19. Rediseño Panel de Historial**: Implementación de grid simétrico (3x2) y Search Cards con métricas de resultados (`resultCount`).
- [x] **A18. Mejora de Narrativa Clínica**: Nueva regla de parseo de 3+ espacios seguidos como salto de línea para optimizar la lectura de informes.
- [x] **Logro**: Máxima precisión en la recuperación de información con visualización clínica íntegra y sin ruido visual.

## 🟢 FASE 15: Resaltado Ubicuo y UX Lateral (V4.2.6 ✅)
- [x] **U20. Resaltado en Navegador Lateral**: Implementación de lógica de detección de coincidencias en el sidebar.
- [x] **U21. Indicadores de Alerta (Amber Pulse)**: Sistema visual de notificación de hallazgos en tomas y versiones inactivas.
- [x] **U22. UX Adaptativa Sidebar**: Resaltado bicolor y metadatos con color de acento para coincidencias.
- [x] **Logro**: Navegación contextual completa; el clínico identifica hallazgos relevantes en todo el historial del paciente sin necesidad de exploración manual secuencial.

## 🟢 FASE 16: Persistencia de Filtros Históricos (V4.2.7 ✅)
- [x] **E17. Memoria de Filtros**: Inclusión de metadatos de filtrado en el objeto de persistencia de búsquedas recientes.
- [x] **U23. Restauración de Estado**: Sincronización de los componentes de filtro en Home al recuperar una búsqueda del historial.
- [x] **Logro**: Experiencia de usuario "Sin Fricción" al alternar entre múltiples líneas de investigación clínica.

## 🟢 FASE 17: Simplificación de Taxonomía (V4.2.8 ✅)
- [x] **U24. Depuración de Filtros**: Eliminada la categoría "General" del selector de filtros en Home.
- [x] **Logro**: Interfaz de búsqueda más limpia y enfocada exclusivamente en dominios de información clínica.

## 🟢 FASE 18: Filtrado Quirúrgico por Campos (V4.2.9 ✅)
- [x] **U25. Expansión de Categorías**: Implementada UI jerárquica para mostrar campos (sub-categorías) al seleccionar un dominio clínico.
- [x] **A19. Motor de Filtrado por Campo**: Refactorizado `applyFilters` para soportar discriminación por nombres de columna exactos.
- [x] **Logro**: Máximo nivel de granularidad en la recuperación de información; el clínico puede buscar términos exclusivamente en campos críticos como "Resultado analítica" o "Juicio Diagnóstico".

## 🟢 FASE 19: Arquitectura de Búsqueda Persistente (V4.3.0 ✅)
- [x] **U26. Cabecera Global Unificada**: Creación de `GlobalHeader.tsx` para centralizar identidad y herramientas de búsqueda.
- [x] **U27. Buscador Refinador**: Implementación de lógica de búsqueda persistente que mantiene y respeta los filtros activos entre vistas.
- [x] **U28. Indicadores de Contexto de Filtro**: Sistema visual (icono pulsante) para alertar sobre la segmentación activa en la búsqueda.
- [x] **U29. Centralización de Comandos**: Integración de botones de "Mostrar Todo", "Borrar Datos" y "Ayuda" en la cabecera persistente.
- [x] **Logro**: Transformación de la búsqueda en una experiencia de exploración continua y contextual; el clínico mantiene el control total de sus filtros sin importar su ubicación en el expediente.

## 🟢 FASE 21: Ergonomía de Navegación Profunda (V4.5.0 ✅)
- [x] **A20. Mapping "Resultado Analítica"**: Integrada visualización de analíticas en la categoría de Resultados Pruebas para HCE-MIR.
- [x] **A21. Normalización de Aliases HCE-MIR**: Implementado soporte para variantes de nombres con colon y diferentes mayúsculas para campos críticos.
- [x] **A22. Mapping Oxihemoglobina (O2 Hb)**: Vinculado el campo de saturación de oxígeno al bloque de constantes MIR.
- [x] **A23. Mapping Situación Basal (Otros)**: Posicionamiento estricto de la situación basal en la sección de Anamnesis.
- [x] **A24. Persistencia Discriminada**: Corregida la sobreescritura de búsquedas recientes con mismo término pero distintos filtros.
- [x] **A25. Depuración de Ruido Visual**: Eliminados 17 campos redundantes de las vistas HCE-MIR y Debug.
- [x] **A26. Mapping Detalles HTA/DM/DISL**: Implementada búsqueda agresiva de variantes de "Detalles" para patologías crónicas en el bloque de constantes.
- [x] **A27. Interfaz Contextual Unificada**: Rediseño del GlobalHeader con alineación de buscador al informe y metadatos de versión.
- [x] **Logro**: La interfaz alcanza un nivel de madurez profesional; la navegación es 100% contextual y el área de trabajo clínica está optimizada para la lectura de datos sin distracciones.

## 🟢 FASE 24: Desacoplamiento de Filtros y Visualización (V5.0.2 ✅)
- [x] **U30. Visualización de Historia Completa**: Eliminada la restricción de categorías en el visor HCE para garantizar el contexto clínico total.
- [x] **U31. Resaltado Global de Búsqueda**: Activado el resaltado de términos en todas las secciones del expediente, independientemente de los filtros de búsqueda activos.
- [x] **Logro**: Se cumple la premisa de "Buscar en Categoria, Visualizar en Completo", optimizando la navegación sin perder la integridad de la historia clínica.

---
## 🟡 PRÓXIMOS OBJETIVOS (2026+)
- [ ] **E11. Motor Semántico Híbrido**: Integración de embeddings locales con Transformers.js.
- [ ] **E15. IA Generativa Local**: Resúmenes automáticos de evolución clínica mediante LLM en el cliente.

---
## 🎓 FORMACIÓN TÉCNICA Y ESPECIALIZACIÓN
- [x] **Máster en Google Antigravity, IA y Vibe Coding**: Certificación oficial en desarrollo full-stack asistido por agentes (Udemy, 13/04/2026).
- [x] **Metodologías Agentes**: Implementación de Vibe Coding y Spec Driven Development como estándar de trabajo en el proyecto.
- [x] **Especialización en Machine Learning (Python/R)**: Finalización del programa *Machine Learning A-Z™* (Udemy, 07/05/2026).
- [x] **Dominio de Algoritmos**: Capacitación en Regresión, Clasificación, Clustering, NLP y Deep Learning.
- [x] **Preparación Predictiva**: Creación de plantillas de pre-procesamiento para futuros módulos de análisis inteligente en Queryclin.
- [x] **Logro**: Adquisición de la base científica necesaria para la evolución del buscador hacia un sistema de soporte a la decisión clínica (CDSS).

---
## 🟢 FASE 19: Gobernanza HCE-OBS y Renderizado Determinista (V4.6.0 ✅)
- [x] **A23. Implementación de Jerarquía HCE-OBS**: Integración de la taxonomía inmutable y mapeo categórico estricto.
- [x] **U25. Renderizado Multivalor ($)**: Desarrollo del motor de agrupación para visualización de campos clínicos como listas de viñetas.
- [x] **U26. Determinismo Visual Inmutable**: Eliminación de normalizaciones en etiquetas para preservar la nomenclatura técnica hospitalaria.
- [x] **A24. Cabecera HCE-COMUN Compartida**: Estandarización de la identidad visual de la cabecera demográfica para todos los modelos (MIR, ALG, OBS).
- [x] **Logro**: Queryclin se consolida como un sistema de visualización clínica de alta fidelidad, capaz de manejar estructuras jerárquicas complejas con total precisión diagnóstica.


## 🛡️ FASE 23: Gobernanza de Seguridad y Privacidad Pública (V5.0.0 — ACTUAL 🚀)
- [x] **G1. Estructura de Gobernanza (.ag)**: Creación de políticas de repositorio público, privacidad y límites de seguridad.
- [x] **G2. Hardening de Seguridad (/security)**: Implementación de guías de contribución segura, respuesta a incidentes y política de datos.
- [x] **G3. Plantillas de Repositorio Público**: Desarrollo de templates de Pull Request e Issues con advertencias de privacidad.
- [x] **G4. Refuerzo de .gitignore**: Bloqueo estricto de extensiones sensibles y definición de excepciones para mocks.
- [x] **G5. Sanitización de Documentación**: Actualización del README y manuales para alineación con principios privacy-first.
- [x] **G6. Refinamiento de Mensajes de Sistema**: Implementación de mensajes contextuales diferenciados para ingesta y borrado seguro de datos (V5.0.1).
- [x] **Logro**: Queryclin se transforma en un proyecto de código abierto profesional, seguro para su exposición pública y resistente a filtraciones de datos clínicos.

## 🟢 FASE 25: Optimización Multivariable y Resiliencia en Ingesta (V5.1.0 — ACTUAL 🚀)
- [x] **U32. Interfaz de Hallazgos Expandida**: Implementado el renderizado de campos `$` como listas permanentemente visibles en un contenedor estilizado.
- [x] **A28. Lógica de Agrupación Inteligente**: Refinada la gestión de valores redundantes como `(Variables)` y captura exhaustiva de hallazgos no booleanos.
- [x] **A29. Normalización de Cabeceras Proactiva**: Implementada tolerancia automática a variaciones de formato (espacios, colones) en el mapeo de campos durante la ingesta.
- [x] **Logro**: Mejora crítica en la ergonomía de visualización para obstetricia y ginecología (HCE-OBS), garantizando que ningún dato se pierda por inconsistencias de formato en el origen.

## 🟢 FASE 26: Estabilización de Entorno y Aseguramiento de Tests (V5.1.1 — ACTUAL 🚀)
- [x] **D35. Recuperación Post-Interrupción**: Diagnóstico y corrección de errores de sintaxis y tipado TypeScript (TS1117, TS2339) en `App.tsx`, `HCEView.tsx` y `Results.tsx`.
- [x] **D36. Refactorización de Resiliencia en Ingesta**: Corrección de la lógica de líneas vacías en `streamCSV` para asegurar la integridad de los datasets importados.
- [x] **D37. Estabilización de Suite de Tests**: Refactorización del mock de base de datos en `searchEngine.test.ts` para soportar la arquitectura de múltiples almacenes de la V5.
- [x] **Logro**: Restauración total de la integridad del código y de la suite de pruebas automatizadas, garantizando un entorno de desarrollo libre de regresiones.

## 🟢 FASE 27: Debug Mode y Refinamiento de Taxonomía Clínica (V5.2.0 — ACTUAL 🚀)
- [x] **U35. Modo Debug Persistente**: Implementación de toggle de depuración para visualización de campos no mapeados y datos vacíos.
- [x] **U36. Motor de Renderizado Híbrido**: Discriminación automática entre campos narrativos (texto libre) y tabulares (grids) para mejorar la densidad visual.
- [x] **A32. Post-Procesamiento de Secciones**: Lógica de deduplicación de campos y normalización de etiquetas en el visor HCE.
- [x] **A33. Refinamiento de Mappings**: Corrección de erratas técnicas y reestructuración de categorías visuales en `FORMS` (MIR, ALG, OBS).
- [x] **Logro**: Queryclin alcanza una madurez visual y técnica superior, permitiendo auditorías de datos precisas y una navegación clínica libre de redundancias.

## 🟢 FASE 28: Refactor Semántico y Búsqueda Estructural (V5.3.0 — FINALIZADA ✅)

## 🚀 FASE 29: Unificación Arquitectónica y Estabilización (V6.4.0 — ACTUAL 🚀)
- [x] Consolidación del Motor de Búsqueda en `src/engine/`.
- [x] Eliminación de código muerto y archivos redundantes (`src/lib`, `src/core/search`).
- [x] Resolución de conflictos de importación y estabilización de la suite de tests.
- [x] Unificación del sistema de visualización dinámica (`clinicalSchema`).
- [x] Sincronización global de versionado documental.
- [x] **A35. Implementación de SemanticProcessor**: Creación de la capa semántica centralizada y eliminación de `Tokenizer.ts`.
- [x] **A36. Índice Estructural (Postings con Contexto 'c')**: Modificación del `IndexerService` para inyectar metadatos categóricos en el índice invertido.
- [x] **A37. Post-Score Field Boosting**: Implementación de relevancia dinámica en `QueryEngine` sin distorsionar el TF de BM25.
- [x] **A38. Eliminación de Hidratación Masiva**: Refactor de `App.tsx` para delegar el filtrado de categorías al motor de búsqueda nativo.
- [x] **U37. Resaltado Determinista**: Sincronización de `HighlightedText` con la API de `SemanticProcessor`.
- [x] **Logro**: Mejora exponencial en el rendimiento de filtrado y coherencia semántica absoluta entre búsqueda y visualización.

---
## 🔵 MACRO-FASE 2: Queryclin Admin Studio & Governance (V6.0.0 ✅)
- [x] **A32. Admin Studio Core**: Motor de diseño declarativo con Drag-and-Drop bidireccional y feedback reactivo.
- [x] **A33. Motor de Plantillas**: Implementación de `TemplateGenerator` para clonación de estructuras canónicas (ALG, MIR, OBS).
- [x] **S10. Passcode Gate**: Seguridad por PIN (`admin123`) y alineación estética premium con el *Clinical Design System*.
- [x] **G1. Protocolo de Trazabilidad**: Repositorio jerárquico de prompts (`/generic` y `/metaprompts`) para control de instrucciones.
- [x] **A34. Integración Dinámica**: Motor de inyección de esquemas dinámicos (`DynamicSectionRenderer`) en el core de visualización `HCEView.tsx`.
- [x] **Logro**: Queryclin evoluciona de un visor estático a una plataforma de diseño clínico flexible, segura y totalmente trazable.
+
+## 🔵 FASE 22: Blindaje de Ingesta y Certificación de Búsqueda (V6.0.x — ACTUAL 🚀)
+- [x] **A35. Hardening de Tipos (Web Worker)**: Implementación de type-guards defensivos en `stringNormalizer` y `SemanticProcessor` para evitar crashes por datos malformados.
+- [x] **A36. Protección de Diccionarios**: Migración a objetos con prototipo nulo (`Object.create(null)`) para prevenir contaminación por términos clínicos.
+- [x] **T1. Restauración de Test-Suite**: Reconstrucción de la batería de pruebas semánticas y datasets sintéticos post-rollback.
+- [x] **T2. Validación de Negaciones**: Implementado "Negation Shield" en el indexador para eliminar falsos positivos (HTA: NO).
+- [x] **Logro**: Sistema estabilizado y blindado contra errores de tiempo de ejecución en la ingesta masiva de datos.

## Fase 23: Gobernanza Agéntica Institucional (V6.2.0)
- [x] **A37. Migración de Inteligencia**: Integración de especificaciones y metaprompts en `governance/agentic`.
- [x] **A38. Núcleo Agéntico**: Creación de `src/agentic` con los esqueletos de orquestación y validación.
- [x] **A39. Estandarización de Esquemas**: Implementación de esquemas JSON para la definición de tareas y parches.
- [x] **Logro**: Queryclin ahora posee un marco de gobernanza autogestionado para el desarrollo asistido por IA, garantizando la preservación de invariantes clínicos.

## Fase 24: Auditoría Integral y Estabilización Masiva (V6.2.2)
- [x] **A40. Optimización de Memoria**: Resolución definitiva de OOM en ingesta masiva mediante constantes estáticas en Indexer.
- [x] **A41. Hardening de UI**: Implementación de guardas de navegación y corrección de ReferenceError en `HCEView`.
- [x] **A42. Integridad de Mapeos**: Mapeado universal de "Pruebas solicitadas" y robustez de alias clínicos.
- [x] **A43. Unificación de Código**: Eliminada redundancia funcional mediante `normalizeString` global.
- [x] **T3. Batería de Pruebas**: Generación de test cases exhaustivos para validación continua.
- [x] **Logro**: Sistema certificado como estable, rápido y libre de redundancias críticas tras auditoría completa.

## 🚀 FASE 30: Admin Studio Precision & Resource Integration (V6.5.0)
- [x] **A44. Biblioteca de Recursos Canónicos**: Integración de cabeceras oficiales OBS, MIR y ALG como bases inmutables.
- [x] **A45. Motor de Generación con "Orphans"**: Refactor de `TemplateGenerator` para evitar la pérdida de campos no categorizados.
- [x] **U38. CRUD Estructural de Formulario**: Implementada capacidad de añadir/eliminar secciones y grupos en tiempo real.
- [x] **U39. Feedback Háptico-Visual**: Reingeniería del Drag-and-Drop con estados de colisión y overlays de alta fidelidad.
- [x] **A46. Sincronización de Protocolos**: Actualización de la capa de seguridad y metadatos a la V6.5.0.
- [ ] **A47. Validación de Persistencia Atómica**: Pruebas de integridad en IndexedDB tras cambios estructurales masivos.
- [Logro]: El Admin Studio alcanza la madurez operativa, permitiendo la creación de formularios desde cero o plantillas con precisión del 100%.

## 🚀 FASE 31: Consolidación y Protocolo de Congelación (V6.5.1 — ACTUAL 🚀)
- [x] **A48. Consistencia de Filtros**: Normalización de categorías y campos en `QueryEngine.ts` para resolver fallos por acentos.
- [x] **A49. Detección de Delimitadores**: Eliminado el forzado del delimitador `|` en `Home.tsx`.
- [x] **A50. Categorización por Mapping**: Actualizado `IndexerService.ts` para usar `visualCategories`.
- [x] **A51. Consistencia de Snapshots**: Alineada la lógica de desempate en `selectLatestSnapshots.ts` con `QueryEngine.ts` usando `idToma`.
- [x] **A52. Endurecimiento Multivalor (OBS)**: Fusión de registros duplicados en arrays de strings en `csv.worker.ts`.
- [x] **T4. Suite de Pruebas de Filtros y Multivalor**: Creados `QueryEngine.filters.test.ts` y `Multivalue.test.ts`.
- [x] **T5. Pruebas de Estrés Operativo**: Creado `stress.test.ts` y validada la estabilidad con 10k pacientes.
- [Logro]: Queryclin V6.5 queda consolidado como un sistema estable, determinista y listo para producción, libre de regresiones críticas.

## 🚀 FASE 32: Admin Studio UI/UX & Governance Hardening (V6.5.2 — ACTUAL 🚀)
- [x] **A53. Cabecera Unificada**: Rediseño de la cabecera de Admin Studio con Glassmorphism y logo integrado.
- [x] **A54. Modal de Ayuda**: Añadido modal de ayuda interactivo sobre plantillas y biblioteca.
- [x] **A55. Nombre Personalizable**: Permitido editar el nombre del formulario en el diseñador.
- [x] **A56. Sistema de Versiones**: Añadido botón para crear nuevas versiones en el historial.
- [x] **A57. Normalización de Reglas**: Actualizado `RULES.md` para estandarizar el versionado y cabeceras.
- [Logro]: Se consolida la experiencia de usuario en Admin Studio y se flexibiliza el sistema de versiones bajo una misma norma visual.

---
*Queryclin - Sistema de Análisis Clínico Local-First*
