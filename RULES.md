# Reglas Estrictas del Proyecto (Queryclin)

Este documento contiene las directrices fundamentales e inviolables para el desarrollo de este proyecto. Ningún agente ni desarrollador debe ignorar estas reglas. Este archivo actúa como la "Constitución" del repositorio.

---

## 1. Actualización Continua del Changelog
- **Regla:** Todo cambio procesado (bugs, features, refactorizaciones) **DEBE** registrarse de manera autónoma en `CHANGELOG.md`.
- **Formato:** Los registros deben ser cronológicos, detallando archivos modificados y el motivo técnico/clínico de la decisión.

## 2. Persistencia Histórica en TASKS.md
- **Regla:** **PROHIBIDO** borrar tareas completadas en `TASKS.md`. Este archivo debe ser un historial acumulativo de todas las fases del proyecto.
- **Formato**: Se deben mantener las secciones por versiones (V1, V2, etc.) para trazabilidad de auditoría.

## 3. Integridad Estructural y Orden
- **Regla:** Ningún archivo de prueba, script de generación o dataset CSV puede residir en la raíz del proyecto.
- **Ubicación:** 
    - Scripts auxiliares: `/scripts`
    - Datos de prueba: `/tests/data`
    - Documentación técnica: `/docs`

## 4. Identidad del Proyecto (Queryclin)
- **Regla:** El proyecto tiene el nombre oficial y exclusivo de **Queryclin**. No se deben usar nombres anteriores (HCE Core, etc.) en código, comentarios o documentación.

## 5. Sincronía de Versión (WebApp)
- **Regla:** Tras cada cierre de fase o solución de fallo crítico, la versión visible en la interfaz (Header) debe incrementarse. La versión se centralizará en `App.tsx`.

## 6. Fidelidad del Dato Clínico
- **Regla:** Se prohíbe renombrar, traducir o normalizar destructivamente los campos originales del CSV. El sistema debe ser un reflejo exacto de la fuente de datos.
- **Lenguaje:** La comunicación debe ser siempre sobria, profesional y técnica.

## 7. Inmutabilidad Estética (UI Preservation)
- **Regla:** Queda terminantemente prohibido modificar el diseño, colores, tipografías o disposición de los elementos "Core" definidos en `DESIGN_SYSTEM.md`.
- **Procedimiento:** Antes de añadir o mover componentes en el Header, Sidebar o Visor HCE, se debe asegurar la integridad de la marca (Logo, Colores NachuS, etc).
- **Admin Studio:** La cabecera de Admin Studio debe mantener la misma línea estética que la cabecera principal de Queryclin (Glassmorphism, logo integrado y pastilla de versión con fecha), siendo esto inmutable para preservar la coherencia visual.

## 8. Estandarización de Versionado y Cabeceras
- **Regla:** Cada producto o servicio (Queryclin y Admin Studio) puede mantener su propio número de versión independiente.
- **Coherencia en UI:** Ambos productos están obligados a mostrar su versión y fecha/hora de actualización en la cabecera siguiendo el mismo patrón visual (V.X.X.X | Fecha, Hora).
- **Mantenimiento:** Es obligatorio mantener actualizados estos valores tras cada despliegue o cambio significativo en el módulo correspondiente.

---
*Gobernanza Queryclin - V6.5.1*
