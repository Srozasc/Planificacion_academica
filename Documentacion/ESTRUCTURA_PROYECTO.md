# Estructura del Proyecto - Planificación Académica

## Descripción General
Sistema de planificación académica desarrollado con NestJS (backend) y React (frontend), diseñado para la gestión de bimestres, usuarios, asignaturas y programación académica.

## Estructura de Directorios

```
Planificacion_academica/
├── .gemini/                          # Configuración de Gemini AI
│   └── settings.json
├── .gitignore                         # Archivos ignorados por Git
├── Documentacion/                     # Documentación del proyecto
│   ├── CHANGELOG.md
│   ├── GUIA_PROYECTO.md
│   ├── MULTER_CONFIG.md
│   ├── README_FINAL.md
│   ├── TESTING_GUIDE.md
│   ├── TEST_DATA.md
│   ├── arquitectura.txt
│   └── estado_actual.md
├── Insumos de entrada/                # Archivos de entrada y datos iniciales
├── backend/                           # Aplicación backend (NestJS)
│   ├── .env.example                  # Variables de entorno de ejemplo
│   ├── .eslintrc.js                  # Configuración ESLint
│   ├── .gitignore                    # Archivos ignorados específicos del backend
│   ├── .prettierrc.js               # Configuración Prettier
│   ├── database/
│   │   └── migrations/               # Migraciones de base de datos
│   ├── nest-cli.json                # Configuración NestJS CLI
│   ├── package.json                 # Dependencias del backend
│   ├── package-lock.json
│   ├── src/                         # Código fuente del backend
│   │   ├── academic/                # Módulo académico
│   │   ├── adol/                    # Módulo ADOL
│   │   ├── app.controller.ts        # Controlador principal
│   │   ├── app.module.ts           # Módulo principal
│   │   ├── app.service.ts          # Servicio principal
│   │   ├── approval/               # Módulo de aprobaciones
│   │   ├── asignaturas/            # Módulo de asignaturas
│   │   ├── auth/                   # Módulo de autenticación
│   │   ├── bimestre/               # Módulo de bimestre (legacy)
│   │   ├── bimestres/              # Módulo de bimestres
│   │   ├── carreras/               # Módulo de carreras
│   │   ├── common/                 # Módulos comunes
│   │   │   ├── decorators/         # Decoradores personalizados
│   │   │   ├── entities/           # Entidades de base de datos
│   │   │   ├── filters/            # Filtros de excepciones
│   │   │   ├── guards/             # Guards de autenticación/autorización
│   │   │   ├── interceptors/       # Interceptores
│   │   │   ├── interfaces/         # Interfaces TypeScript
│   │   │   ├── pipes/              # Pipes de validación
│   │   │   └── services/           # Servicios compartidos
│   │   ├── config/                 # Configuraciones
│   │   ├── course-reports/         # Reportes de cursos
│   │   ├── database/               # Configuración de base de datos
│   │   ├── dol/                    # Módulo DOL
│   │   ├── main.ts                 # Punto de entrada de la aplicación
│   │   ├── nomina-docentes/        # Nómina de docentes
│   │   ├── optativos/              # Módulo de optativos
│   │   ├── payment-codes/          # Códigos de pago
│   │   ├── reporte-cursables/      # Reportes de cursables
│   │   ├── scheduling/             # Programación académica
│   │   ├── teachers/               # Módulo de profesores
│   │   ├── uploads/                # Gestión de archivos subidos
│   │   ├── users/                  # Módulo de usuarios
│   │   └── vacantes-inicio/        # Vacantes de inicio
│   ├── templates/                  # Plantillas
│   ├── test/                       # Configuración de pruebas
│   ├── tests/                      # Pruebas organizadas
│   │   ├── e2e/                   # Pruebas end-to-end
│   │   ├── integration/           # Pruebas de integración
│   │   └── unit/                  # Pruebas unitarias
│   ├── tsconfig.json              # Configuración TypeScript
│   └── uploads/                   # Archivos subidos
├── clean_procedures.py            # Script de limpieza de procedimientos
├── database/
│   └── migrations/                # Migraciones adicionales
├── docs/                          # Documentación adicional
├── frontend/                      # Aplicación frontend (React)
│   ├── .env.test                 # Variables de entorno de prueba
│   ├── .eslintrc.js             # Configuración ESLint
│   ├── .prettierrc.js           # Configuración Prettier
│   ├── babel.config.js          # Configuración Babel
│   ├── diseño/
│   │   └── Douc_Icono.png       # Recursos de diseño
│   ├── index.html               # HTML principal
│   ├── jest.setup.js            # Configuración Jest
│   ├── package.json             # Dependencias del frontend
│   ├── package-lock.json
│   ├── postcss.config.js        # Configuración PostCSS
│   ├── public/                  # Archivos públicos
│   │   ├── Douc_Icono.png
│   │   ├── index.html
│   │   └── templates/
│   ├── src/                     # Código fuente del frontend
│   │   ├── App.tsx             # Componente principal
│   │   ├── components/         # Componentes reutilizables
│   │   ├── features/           # Características/módulos
│   │   ├── hooks/              # Hooks personalizados
│   │   ├── main.tsx           # Punto de entrada
│   │   ├── pages/             # Páginas de la aplicación
│   │   ├── routes/            # Configuración de rutas
│   │   ├── services/          # Servicios de API
│   │   ├── store/             # Gestión de estado
│   │   ├── styles/            # Estilos CSS
│   │   ├── test/              # Utilidades de prueba
│   │   ├── types/             # Tipos TypeScript
│   │   ├── utils/             # Utilidades
│   │   └── vite-env.d.ts      # Tipos de Vite
│   ├── tailwind.config.js     # Configuración Tailwind CSS
│   ├── test_api_direct.js     # Prueba directa de API
│   ├── tests/                 # Pruebas del frontend
│   │   ├── e2e/
│   │   ├── integration/
│   │   └── unit/
│   ├── tsconfig.json          # Configuración TypeScript
│   └── vite.config.ts         # Configuración Vite
├── generate-impact-report.ps1  # Script de reporte de impacto
├── log.txt                     # Archivo de logs
├── node-test-output.txt       # Salida de pruebas de Node
├── package.json               # Dependencias del proyecto raíz
├── package-lock.json
├── pantallas/                 # Capturas de pantalla
│   ├── dashboard.png
│   ├── error.png
│   ├── flujo_aprovacion.png
│   ├── gestion_usuarios.png
│   ├── load_data.png
│   ├── login.png
│   └── perfil.png
├── scripts/                   # Scripts de utilidad y pruebas
│   ├── README-TESTING.md
│   ├── README.md
│   ├── analyze-duplicates.js
│   ├── apply-teachers-sp.js
│   ├── backup-bimestres.json
│   ├── check-*.js            # Scripts de verificación
│   ├── create-*.js           # Scripts de creación
│   ├── data-creation/        # Creación de datos de prueba
│   ├── database/
│   │   └── fix-sp.sql
│   ├── debug-*.js            # Scripts de depuración
│   ├── debugging/            # Herramientas de depuración
│   ├── detailed-tests.js
│   ├── final-tests*.js       # Pruebas finales
│   ├── fix-*.js              # Scripts de corrección
│   ├── fixes/                # Correcciones
│   ├── permissions/          # Gestión de permisos
│   │   ├── README.md
│   │   ├── ejemplos/
│   │   └── setup.js
│   ├── read_*.js             # Scripts de lectura
│   ├── run-*.js              # Scripts de ejecución
│   ├── test-*.js             # Scripts de prueba
│   ├── testing/              # Herramientas de testing
│   ├── update-*.js           # Scripts de actualización
│   ├── verify-*.js           # Scripts de verificación
│   └── [otros scripts]
├── temp_uploads_service.txt   # Archivo temporal
├── test-auth.ps1             # Script de prueba de autenticación
├── test-output.txt           # Salida de pruebas
├── test_dropdown_api.html    # Prueba de API dropdown
└── tests/                    # Pruebas adicionales del proyecto
```

## Tecnologías Principales

### Backend
- **Framework**: NestJS
- **Base de Datos**: TypeORM
- **Autenticación**: JWT
- **Validación**: Class Validator
- **Testing**: Jest

### Frontend
- **Framework**: React con TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Testing**: Jest + React Testing Library
- **Estado**: Context API / Redux (según implementación)

## Módulos Principales

### Backend
1. **Auth**: Autenticación y autorización
2. **Users**: Gestión de usuarios
3. **Bimestres**: Gestión de períodos académicos
4. **Asignaturas**: Gestión de materias
5. **Carreras**: Gestión de programas académicos
6. **Teachers**: Gestión de profesores
7. **Scheduling**: Programación académica
8. **Uploads**: Gestión de archivos
9. **Academic**: Funcionalidades académicas generales
10. **ADOL/DOL**: Módulos específicos del dominio

### Frontend
1. **Components**: Componentes reutilizables
2. **Features**: Módulos de funcionalidades
3. **Pages**: Páginas de la aplicación
4. **Services**: Servicios de comunicación con API
5. **Store**: Gestión de estado global
6. **Routes**: Configuración de navegación

## Estructura de Base de Datos
- **Migraciones**: Organizadas en `backend/src/database/migrations/`
- **Entidades**: Definidas en `backend/src/common/entities/`
- **Servicios**: Lógica de negocio en cada módulo

## Scripts y Herramientas
- **Scripts de Testing**: Múltiples scripts para pruebas automatizadas
- **Scripts de Migración**: Herramientas para actualización de BD
- **Scripts de Verificación**: Validación de integridad de datos
- **Scripts de Depuración**: Herramientas de diagnóstico

## Documentación
- **Guías**: Documentación técnica y de usuario
- **Changelog**: Registro de cambios
- **Testing**: Guías de pruebas
- **Arquitectura**: Documentación de diseño

---

*Documento generado automáticamente basado en la estructura actual del proyecto.*
