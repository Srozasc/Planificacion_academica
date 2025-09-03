# Plan de Pruebas - Sistema de Planificación Académica

## 1. Información General

### 1.1 Objetivo
Validar la funcionalidad, rendimiento, seguridad y usabilidad del sistema de planificación académica desarrollado con NestJS (backend) y React/TypeScript (frontend).

### 1.2 Alcance
- **Backend**: APIs REST, autenticación JWT, gestión de datos, uploads
- **Frontend**: Interfaz de usuario, formularios, navegación, integración con APIs
- **Base de Datos**: Integridad, migraciones, vistas, procedimientos
- **Integración**: Comunicación frontend-backend
- **Seguridad**: Autenticación, autorización, validaciones
- **Rendimiento**: Carga, concurrencia, optimización

### 1.3 Herramientas Requeridas
- **Pruebas Unitarias**: Jest, React Testing Library
- **Pruebas de Integración**: Supertest, Jest
- **Pruebas E2E**: Playwright (ya configurado)
- **Pruebas de Rendimiento**: Artillery o k6
- **Pruebas de Seguridad**: OWASP ZAP, manual testing
- **Base de Datos**: Scripts SQL, datos de prueba

---

## 2. Fase 1: Pruebas Unitarias Backend

### 2.1 Módulo de Autenticación
- **AuthService**
  - ✅ Validación de credenciales correctas
  - ✅ Rechazo de credenciales incorrectas
  - ✅ Generación de JWT tokens
  - ✅ Validación de tokens expirados
  - ✅ Hash de contraseñas

- **AuthController**
  - ✅ POST /api/auth/login - respuesta exitosa
  - ✅ POST /api/auth/login - credenciales inválidas
  - ✅ Validación de DTOs de entrada

### 2.2 Módulo de Usuarios
- **UsersService**
  - ✅ Creación de usuarios
  - ✅ Búsqueda por ID y email
  - ✅ Actualización de datos
  - ✅ Validación de roles
  - ✅ Manejo de usuarios duplicados

- **UsersController**
  - ✅ GET /api/users - listado paginado
  - ✅ GET /api/users/:id - usuario específico
  - ✅ POST /api/users - creación
  - ✅ PUT /api/users/:id - actualización
  - ✅ DELETE /api/users/:id - eliminación

### 2.3 Módulo de Scheduling
- **ScheduleService**
  - ✅ Creación de eventos de horario
  - ✅ Validación de conflictos de horario
  - ✅ Cálculo de horas totales
  - ✅ Filtrado por plan, nivel, asignatura
  - ✅ Asignación de docentes

- **ScheduleController**
  - ✅ GET /api/schedule/events - listado de eventos
  - ✅ POST /api/schedule/events - creación de evento
  - ✅ PUT /api/schedule/events/:id - actualización
  - ✅ DELETE /api/schedule/events/:id - eliminación
  - ✅ Validación de DTOs (CreateEventDto, ScheduleEventDto)

### 2.4 Módulo de Uploads
- **UploadsService**
  - ✅ Validación de tipos de archivo permitidos
  - ✅ Validación de tamaño máximo
  - ✅ Procesamiento de archivos Excel
  - ✅ Manejo de errores de archivo

### 2.5 Estructuras Académicas
- **Servicios de Planes, Niveles, Asignaturas**
  - ✅ CRUD básico para cada entidad
  - ✅ Relaciones entre entidades
  - ✅ Validaciones de integridad

**Estimación**: 3-4 días
**Criterio de Aceptación**: 90% cobertura de código, todas las pruebas pasan

---

## 3. Fase 2: Pruebas Unitarias Frontend

### 3.1 Componentes de UI
- **EventModal**
  - ✅ Renderizado correcto del formulario
  - ✅ Validación de campos requeridos
  - ✅ Manejo de tipos de evento (inicio, continuidad, adol, optativo)
  - ✅ Filtros de plan, nivel, asignatura
  - ✅ Cálculo automático de horas
  - ✅ Reseteo de formulario al cerrar

- **Componentes de Formularios**
  - ✅ Validación de inputs
  - ✅ Manejo de estados de carga
  - ✅ Mensajes de error
  - ✅ Autocompletado y selects

- **Tablas y Listas**
  - ✅ Renderizado de datos
  - ✅ Paginación
  - ✅ Ordenamiento
  - ✅ Filtros

### 3.2 Hooks y Utilidades
- **Custom Hooks**
  - ✅ useAuth - manejo de autenticación
  - ✅ useApi - llamadas a APIs
  - ✅ Manejo de estados de carga y error

- **Utilidades**
  - ✅ Formateo de fechas
  - ✅ Validaciones de formularios
  - ✅ Helpers de cálculo

### 3.3 Store/Estado Global
- **Gestión de Estado**
  - ✅ Acciones de autenticación
  - ✅ Manejo de datos de usuario
  - ✅ Cache de datos de formularios

**Estimación**: 2-3 días
**Criterio de Aceptación**: 85% cobertura de componentes, pruebas de interacción pasan

---

## 4. Fase 3: Pruebas de Integración

### 4.1 APIs Backend
- **Flujos de Autenticación**
  - ✅ Login completo con JWT
  - ✅ Protección de rutas con guards
  - ✅ Renovación de tokens

- **CRUD de Entidades**
  - ✅ Creación → Lectura → Actualización → Eliminación
  - ✅ Validación de relaciones entre entidades
  - ✅ Manejo de errores de base de datos

- **Uploads e Importación**
  - ✅ Upload de archivos Excel
  - ✅ Procesamiento y validación de datos
  - ✅ Importación masiva de registros

### 4.2 Base de Datos
- **Migraciones**
  - ✅ Ejecución correcta de todas las migraciones
  - ✅ Validación de estructura de tablas
  - ✅ Verificación de índices y constraints

- **Vista vw_total_horas**
  - ✅ Cálculo correcto de horas por docente
  - ✅ Filtros por período académico
  - ✅ Rendimiento de consultas

- **Integridad Referencial**
  - ✅ Relaciones entre tablas
  - ✅ Cascadas de eliminación
  - ✅ Validaciones de FK

### 4.3 Frontend-Backend
- **Integración de APIs**
  - ✅ Autenticación desde frontend
  - ✅ CRUD de eventos desde EventModal
  - ✅ Carga de datos en formularios
  - ✅ Manejo de errores de red

**Estimación**: 3-4 días
**Criterio de Aceptación**: Todos los endpoints funcionan correctamente, datos se persisten

---

## 5. Fase 4: Pruebas End-to-End (E2E)

### 5.1 Flujos Principales de Usuario
- **Flujo de Autenticación**
  - ✅ Login exitoso → Dashboard
  - ✅ Login fallido → Mensaje de error
  - ✅ Logout → Redirección a login
  - ✅ Acceso a rutas protegidas sin auth → Redirección

- **Gestión de Eventos de Horario**
  - ✅ Crear nuevo evento → Verificar en calendario
  - ✅ Editar evento existente → Verificar cambios
  - ✅ Eliminar evento → Verificar eliminación
  - ✅ Filtrar eventos por plan/nivel/asignatura

- **Gestión de Docentes y Asignaturas**
  - ✅ Crear docente → Asignar a evento → Verificar relación
  - ✅ Importar datos desde Excel → Verificar importación
  - ✅ Generar reportes → Verificar datos

### 5.2 Casos de Uso Complejos
- **Planificación Completa**
  - ✅ Crear plan académico completo
  - ✅ Asignar múltiples docentes
  - ✅ Verificar cálculo de horas totales
  - ✅ Generar reporte final

- **Validaciones de Negocio**
  - ✅ Conflictos de horario
  - ✅ Límites de horas por docente
  - ✅ Validaciones de períodos académicos

### 5.3 Responsive y Navegación
- **Diferentes Dispositivos**
  - ✅ Desktop (1920x1080)
  - ✅ Tablet (768x1024)
  - ✅ Mobile (375x667)

- **Navegación**
  - ✅ Menús y enlaces
  - ✅ Breadcrumbs
  - ✅ Botones de acción

**Estimación**: 4-5 días
**Criterio de Aceptación**: Todos los flujos principales funcionan sin errores

---

## 6. Fase 5: Pruebas de Rendimiento

### 6.1 Carga de APIs
- **Endpoints Críticos**
  - ✅ GET /api/schedule/events (100 usuarios concurrentes)
  - ✅ POST /api/schedule/events (50 creaciones/minuto)
  - ✅ Upload de archivos (archivos de 5MB+)

- **Base de Datos**
  - ✅ Consultas complejas con JOIN
  - ✅ Vista vw_total_horas con muchos registros
  - ✅ Operaciones de escritura masiva

### 6.2 Frontend
- **Carga de Componentes**
  - ✅ Renderizado de tablas grandes (1000+ filas)
  - ✅ Formularios complejos
  - ✅ Navegación entre páginas

- **Memoria y CPU**
  - ✅ Uso de memoria en sesiones largas
  - ✅ Detección de memory leaks
  - ✅ Optimización de re-renders

**Estimación**: 2-3 días
**Criterio de Aceptación**: Tiempo de respuesta < 2s, sin memory leaks

---

## 7. Fase 6: Pruebas de Seguridad

### 7.1 Autenticación y Autorización
- **JWT Security**
  - ✅ Validación de tokens manipulados
  - ✅ Expiración de tokens
  - ✅ Refresh token security

- **Autorización por Roles**
  - ✅ Acceso a recursos según rol
  - ✅ Escalación de privilegios
  - ✅ Bypass de autenticación

### 7.2 Validación de Inputs
- **Inyección SQL**
  - ✅ Parámetros de consulta
  - ✅ Campos de formulario
  - ✅ Headers HTTP

- **XSS y CSRF**
  - ✅ Sanitización de inputs
  - ✅ Validación de contenido HTML
  - ✅ Protección CSRF

### 7.3 Upload Security
- **Validación de Archivos**
  - ✅ Tipos de archivo permitidos
  - ✅ Tamaño máximo
  - ✅ Contenido malicioso
  - ✅ Path traversal

**Estimación**: 2-3 días
**Criterio de Aceptación**: Sin vulnerabilidades críticas o altas

---

## 8. Configuración y Preparación

### 8.1 Entorno de Pruebas
- **Base de Datos de Pruebas**
  - Copia de estructura de producción
  - Datos de prueba representativos
  - Scripts de limpieza y reset

- **Configuración de Herramientas**
  - Jest configurado para backend y frontend
  - Playwright configurado (ya disponible)
  - Artillery/k6 para rendimiento
  - Variables de entorno de testing

### 8.2 Datos de Prueba
- **Usuarios de Prueba**
  - Admin, Docente, Coordinador
  - Diferentes roles y permisos

- **Datos Académicos**
  - Planes de estudio
  - Asignaturas y niveles
  - Eventos de horario
  - Docentes y asignaciones

### 8.3 Scripts de Automatización
- **CI/CD Pipeline**
  - Ejecución automática de pruebas
  - Reportes de cobertura
  - Notificaciones de fallos

**Estimación**: 1-2 días

---

## 9. Cronograma y Recursos

### 9.1 Cronograma Total
- **Preparación**: 1-2 días
- **Fase 1 (Backend Unit)**: 3-4 días
- **Fase 2 (Frontend Unit)**: 2-3 días
- **Fase 3 (Integración)**: 3-4 días
- **Fase 4 (E2E)**: 4-5 días
- **Fase 5 (Rendimiento)**: 2-3 días
- **Fase 6 (Seguridad)**: 2-3 días
- **Documentación y Reportes**: 1 día

**Total Estimado**: 18-25 días hábiles

### 9.2 Recursos Necesarios
- **Tester/QA Senior**: Planificación y ejecución
- **Desarrollador**: Soporte técnico y fixes
- **DevOps**: Configuración de entornos
- **Acceso a**: Base de datos, servidores, herramientas

---

## 10. Criterios de Aceptación Global

### 10.1 Funcionalidad
- ✅ Todos los casos de uso principales funcionan
- ✅ Validaciones de negocio implementadas
- ✅ Manejo correcto de errores

### 10.2 Calidad
- ✅ Cobertura de código > 85%
- ✅ Sin bugs críticos o altos
- ✅ Rendimiento dentro de parámetros

### 10.3 Seguridad
- ✅ Sin vulnerabilidades críticas
- ✅ Autenticación y autorización robustas
- ✅ Validaciones de entrada implementadas

### 10.4 Usabilidad
- ✅ Interfaz intuitiva y responsive
- ✅ Mensajes de error claros
- ✅ Navegación fluida

---

## 11. Entregables

1. **Reporte de Pruebas Unitarias**
   - Cobertura de código
   - Casos fallidos y resoluciones

2. **Reporte de Pruebas de Integración**
   - APIs validadas
   - Integridad de datos

3. **Reporte de Pruebas E2E**
   - Flujos de usuario validados
   - Screenshots de casos críticos

4. **Reporte de Rendimiento**
   - Métricas de carga
   - Recomendaciones de optimización

5. **Reporte de Seguridad**
   - Vulnerabilidades encontradas
   - Recomendaciones de seguridad

6. **Plan de Regresión**
   - Suite de pruebas para futuras releases
   - Automatización recomendada

---

## 12. Riesgos y Mitigaciones

### 12.1 Riesgos Técnicos
- **Datos de prueba insuficientes** → Crear datasets representativos
- **Entorno inestable** → Configurar entorno dedicado
- **Dependencias externas** → Mocks y stubs

### 12.2 Riesgos de Cronograma
- **Bugs complejos** → Buffer de tiempo adicional
- **Cambios de requerimientos** → Proceso de change control
- **Recursos no disponibles** → Plan de contingencia

---

**Documento creado**: $(date)
**Versión**: 1.0
**Estado**: Pendiente de aprobación