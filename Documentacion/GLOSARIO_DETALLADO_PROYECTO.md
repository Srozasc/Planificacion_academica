# Glosario Detallado del Proyecto: Planificación Académica

Este documento es un inventario exhaustivo de cada archivo y directorio dentro del proyecto. El objetivo es proporcionar una referencia detallada para que cualquier desarrollador pueda entender la función de cada componente.

---

## Directorio Raíz: `Planificacion_academica/`

Contiene la configuración principal del proyecto y los directorios de alto nivel.

*   **`.git/`**: Directorio interno de Git para el control de versiones.
*   **`.gitignore`**: Define los archivos y carpetas que Git debe ignorar.
*   **`node_modules/`**: Almacena las dependencias del proyecto definidas en `package.json`.
*   **`backend/`**: Directorio principal que contiene toda la lógica del servidor. Ver sección detallada más abajo.
*   **`frontend/`**: Directorio destinado a la interfaz de usuario.
*   **`Documentacion/`**: Contiene documentación funcional y de arquitectura.
*   **`scripts/`**: Scripts de utilidad para tareas generales del proyecto.
*   **`pantallas/`**: Probablemente contiene capturas de pantalla o mockups de la interfaz.
*   **`create-test-excel.js`**: Script para generar un archivo Excel de prueba.
*   **`ESTRUCTURA_PROYECTO.md`**: Documento Markdown que describe la estructura general del proyecto.
*   **`log.txt`**: Archivo de texto para registros (logs).
*   **`package-lock.json`**: Registra la versión exacta de cada dependencia instalada.
*   **`package.json`**: Define las dependencias del proyecto y los scripts de ejecución (npm).
*   **`SERVER_REQUIREMENTS*.md`**: Varios archivos que detallan los requisitos del servidor en diferentes configuraciones (mínima, optimizada, etc.).
*   **`test-academic-structure.csv` / `.xlsx`**: Archivos de datos de prueba para la carga de estructuras académicas.

---

## Directorio: `frontend/`

Contiene la interfaz de usuario con la que interactúan los usuarios. Es una aplicación moderna de JavaScript, probablemente construida con React, Vite y TypeScript.

### Archivos de Configuración y Raíz

*   **`node_modules/`**: Dependencias del frontend.
*   **`dist/`**: Directorio donde se guarda la versión compilada y optimizada para producción.
*   **`public/`**: Archivos estáticos que se sirven directamente (imágenes, fuentes, etc.).
*   **`.env`**: Variables de entorno específicas del frontend (ej. URL de la API del backend).
*   **`index.html`**: Punto de entrada de la aplicación web.
*   **`package.json`**: Dependencias y scripts del frontend (ej. `dev`, `build`, `preview`).
*   **`vite.config.ts`**: Configuración de Vite, el empaquetador y servidor de desarrollo.
*   **`tailwind.config.js`**: Configuración de Tailwind CSS, el framework de CSS.
*   **`tsconfig.json`**: Configuración del compilador de TypeScript.
*   **`postcss.config.js`**: Configuración de PostCSS, una herramienta para transformar CSS con plugins.

### Directorio: `src/`

Contiene todo el código fuente de la aplicación frontend.

*   **`main.tsx`**: Punto de entrada de la aplicación React. Aquí se renderiza el componente principal `App`.
*   **`App.tsx`**: Componente raíz de la aplicación. Define la estructura general y el enrutamiento.
*   **`styles/`**: Archivos de estilos globales (CSS, SCSS, etc.).
*   **`components/`**: Componentes de UI reutilizables y genéricos (botones, inputs, modales, etc.).
*   **`pages/`**: Componentes que representan páginas completas de la aplicación (ej. `HomePage`, `LoginPage`, `DashboardPage`).
*   **`features/`**: Lógica de negocio y componentes específicos de una funcionalidad concreta (ej. `features/academic-upload/`, `features/user-management/`).
*   **`services/`**: Lógica para comunicarse con servicios externos, principalmente la API del backend. Aquí se definen las llamadas a los endpoints.
*   **`hooks/`**: Hooks personalizados de React para reutilizar lógica con estado (ej. `useFetch`, `useAuth`).
*   **`store/`**: Lógica de manejo de estado global (ej. Redux, Zustand, Context API). Almacena datos que se comparten en toda la aplicación.
*   **`routes/`**: Configuración del enrutamiento de la aplicación. Define qué componente se muestra para cada URL.
*   **`types/`**: Definiciones de tipos de TypeScript que se usan en todo el proyecto.
*   **`utils/`**: Funciones de utilidad genéricas que no encajan en otra categoría (formateo de fechas, validaciones, etc.).
*   **`test/`**: Archivos de prueba para el frontend.


### Archivos de Configuración y Documentación

*   **`.env`**: Variables de entorno (credenciales de BD, secretos, etc.).
*   **`.eslintrc.js`**: Reglas para el linter de JavaScript (ESLint).
*   **`.gitignore`**: Reglas de Git específicas para el backend.
*   **`.prettierrc.js`**: Reglas para el formateador de código (Prettier).
*   **`nest-cli.json`**: Fichero de configuración para el framework NestJS.
*   **`package.json` / `package-lock.json`**: Gestión de dependencias y scripts específicos del backend.
*   **`README.md`**: Instrucciones y descripción del módulo de backend.
*   **`CHANGELOG.md`**: Registro de cambios a lo largo del tiempo.
*   **`PROJECT_STATUS.md`**: Estado general del proyecto.
*   **`REFACTORING_SUMMARY.md`**: Resumen de las tareas de refactorización realizadas.

### Scripts de Creación (`create-*`)

*   **`create-academic-table.js`**: Crea la tabla de estructura académica en la BD.
*   **`create-all-schedule-procedures.sql`**: Crea todos los Stored Procedures (SPs) relacionados con horarios.
*   **`create-course-reports-excel.js`**: Genera un Excel para informes de cursos.
*   **`create-payment-codes.js`**: Crea códigos de pago.
*   **`create-stored-procedures.js`**: Ejecuta los scripts SQL para crear los SPs.
*   **`create-teachers-table.js`**: Crea la tabla de profesores en la BD.
*   **`create-test-files.js`**: Crea un conjunto de archivos de prueba.
*   **`create-validation-procedure.sql`**: Crea el SP de validación principal.

### Scripts de Verificación y Chequeo (`check-*`)

*   **`check-academic-structures.js`**: Verifica la consistencia de las estructuras académicas.
*   **`check-database.js`**: Comprueba la conexión y estado de la base de datos.
*   **`check-duplicate-codes.js`**: Busca códigos duplicados en la BD.
*   **`check-enum-values.js`**: Valida que los valores de ciertos campos correspondan a un enumerado.
*   **`check-table-structure.js`**: Comprueba que la estructura de las tablas sea la correcta.
*   **`check-users.js`**: Realiza validaciones sobre la tabla de usuarios.

### Scripts de Corrección (`fix-*`)

*   **`fix-delete-sp.sql`**: Corrige un SP encargado de borrados.
*   **`fix-duplicate-indexes.js`**: Elimina índices duplicados en la BD.
*   **`fix-procedures.js`**: Script general para aplicar correcciones a varios SPs.
*   **`fix-roles.sql`**: Ajusta permisos y roles en la BD.
*   **`fix-sp.sql` / `fix-sp-final.sql`**: Archivos SQL con parches para los SPs.

### Scripts de Depuración (`debug-*`)

*   **`debug_sp_teachers.sql`**: SQL para depurar el SP de profesores.
*   **`debug-payment-codes-sp.js`**: Script para depurar el SP de códigos de pago.
*   **`debug-sp-error.js`**: Script para aislar y reproducir un error en un SP.

### Scripts de Pruebas (`test-*`)

*   **`test-*.js`**: Una gran cantidad de archivos para probar unitaria e integralmente cada parte del sistema: conexión a BD, endpoints de la API, lógica de SPs, autenticación, subida de archivos, etc.
*   **`test_*.sql`**: Scripts SQL diseñados para ejecutar casos de prueba directamente en la base de datos, probando los SPs con datos específicos.

### Otros Scripts

*   **`apply-teachers-sp.js`**: Aplica o ejecuta el SP relacionado con profesores.
*   **`recreate-academic-table.js`**: Borra y vuelve a crear la tabla académica (útil en desarrollo).
*   **`run-scheduling-migrations.js`**: Ejecuta migraciones de BD para el módulo de horarios.
*   **`simulate-backend-processing.js`**: Simula el proceso completo de una carga de datos en el backend.