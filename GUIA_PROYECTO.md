# Guía de Desarrollo y Mapa del Proyecto: Planificación Académica

Este documento sirve como un índice y guía para los desarrolladores que necesiten modificar o extender el proyecto. Su objetivo es localizar rápidamente la funcionalidad clave dentro del código.

---

## 1. Estructura de Directorios Principal

A alto nivel, el proyecto se organiza en las siguientes carpetas:

- **/backend/**: Contiene toda la lógica del servidor, scripts de base de datos, pruebas y la API. **Es el núcleo del proyecto y donde ocurre la mayor parte de la actividad.**
- **/frontend/**: Contiene la interfaz de usuario con la que interactúan los usuarios finales. (Se asume una estructura estándar de proyecto web, ej. React, Angular, Vue).
- **/Documentacion/**: Archivos de texto y Markdown con la documentación funcional y de arquitectura.
- **/scripts/**: Scripts de utilidad general para el proyecto.
- **Archivos raíz**: Contienen la configuración general del proyecto, dependencias (`package.json`) y variables de entorno (`.env`).

---

## 2. Guía por Tarea o Funcionalidad

A continuación se detallan las tareas comunes y dónde encontrar el código relevante.

### Tarea: Modificar la Estructura de la Base de Datos

*   **Objetivo**: Cambiar, añadir o eliminar tablas.
*   **Ubicación Principal**: `backend/`
*   **Archivos Clave**:
    *   `create-academic-table.js`: Creación de la tabla académica principal.
    *   `create-teachers-table.js`: Creación de la tabla de profesores.
    *   `recreate-academic-table.js`: Script para reconstruir la tabla académica, útil durante el desarrollo.

### Tarea: Modificar la Lógica de Negocio (Stored Procedures)

*   **Objetivo**: Cambiar la lógica de cómo se procesan, validan o insertan los datos en la base de datos.
*   **Ubicación Principal**: `backend/`
*   **Archivos Clave**:
    *   **Definiciones SQL**: Los archivos `.sql` contienen el código fuente de los procedimientos almacenados (SPs).
        *   `create-all-schedule-procedures.sql`: SPs relacionados con la programación.
        *   `create-validation-procedure.sql`: SP para la validación de datos.
        *   Archivos `fix-*.sql`: Contienen parches y correcciones a SPs existentes.
    *   **Ejecución de Scripts**: 
        *   `create-stored-procedures.js`: Script de Node.js que probablemente lee y ejecuta los archivos `.sql` en la base de datos.

### Tarea: Trabajar con Cargas Masivas de Datos (Excel/CSV)

*   **Objetivo**: Ajustar cómo se leen, procesan o validan los archivos de carga masiva.
*   **Ubicación Principal**: `backend/`
*   **Archivos Clave**:
    *   **Generación de Datos de Prueba**: 
        *   `create-test-excel.js`, `create-payment-codes-excel.js`: Generan los archivos Excel de ejemplo para las pruebas.
    *   **Lógica de Procesamiento y Validación**:
        *   `check-academic-structures-data.js`: Valida los datos de las estructuras académicas.
        *   `test-parse-excel.js`: Contiene la lógica para leer y convertir el contenido de un archivo Excel a un formato utilizable.
        *   `simulate-backend-processing.js`: Simula el flujo completo de procesamiento de una carga masiva en el backend.

### Tarea: Añadir o Modificar Pruebas

*   **Objetivo**: Asegurar la calidad del código y prevenir regresiones.
*   **Ubicación Principal**: `backend/`
*   **Archivos Clave**:
    *   **Pruebas de API/Endpoint**: `test-api-endpoint.js`, `test-auth-protection.js`.
    *   **Pruebas de Stored Procedures**: Múltiples archivos `test_sp_*.sql` y `test-sp-*.js` para probar los SPs directamente o a través de scripts.
    *   **Pruebas de Carga de Archivos**: `test-frontend-upload.js`, `test-payment-codes-upload.js`.
    *   **Scripts de Depuración**: Archivos `debug-*.js` y `debug_*.sql` son excelentes puntos de partida para entender y solucionar problemas complejos.

### Tarea: Modificar la Interfaz de Usuario (Frontend)

*   **Objetivo**: Cambiar la apariencia visual o la interacción del usuario.
*   **Ubicación Principal**: `frontend/`
*   **Archivos Clave**: (Asumiendo una estructura estándar)
    *   `src/components/`: Componentes reutilizables de la interfaz (botones, formularios, tablas).
    *   `src/pages/` o `src/views/`: Vistas completas de la aplicación (ej. página de carga de archivos, panel de control).
    *   `src/services/` o `src/api/`: Lógica para comunicarse con la API del `backend`.

### Tarea: Gestionar Dependencias y Configuración

*   **Objetivo**: Actualizar librerías, cambiar scripts de ejecución o configurar variables de entorno.
*   **Ubicación Principal**: Raíz del proyecto y `backend/`.
*   **Archivos Clave**:
    *   `package.json`: Define las dependencias de Node.js y los scripts de `npm` (ej. `npm test`, `npm start`). Hay uno en la raíz y otro en `backend/`.
    *   `.env`: Archivo **no versionado** para guardar variables de entorno como credenciales de la base de datos, puertos, etc.
    *   `.eslintrc.js`, `.prettierrc.js`: Configuración de las herramientas de calidad y formato de código. Es importante respetarlas para mantener la consistencia.
