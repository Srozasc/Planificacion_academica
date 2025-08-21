# Análisis de Impacto - Nuevos Archivos Excel

## Resumen Ejecutivo

Este documento analiza el impacto de los nuevos archivos Excel proporcionados por el cliente en la estructura actual de la base de datos del sistema de Planificación Académica.

**🔴 IMPACTO CRÍTICO DETECTADO:** El análisis automatizado de los archivos Excel reales revela que **7 de 7 archivos** requieren cambios significativos en la base de datos, con estructuras completamente diferentes a las esperadas.

## Archivos Analizados

### Archivos de Entrada Actuales:
1. **ADOL.xlsx** - Códigos de pago
2. **Cursables a Implementar.xlsx** - Cursos a implementar
3. **Docentes.xlsx** - Nómina de docentes
4. **DOL.xlsx** - Distribución de Obligaciones Laborales
5. **Estructura Académica Final.xlsx** - Estructura académica
6. **Usuarios Agendador Campus.xlsx** - Usuarios con permisos de agendamiento
7. **Vacantes Inicio.xlsx** - Vacantes disponibles

## Análisis por Tabla de Base de Datos

### 1. Tabla `academic_structures`

**Estructura Actual:**
- `code` (varchar 20) - Código único
- `name` (varchar 255) - Nombre
- `credits` (int) - Créditos
- `plan_id` (int) - ID del plan
- `type` (enum) - Tipo: subject/plan/module
- `semester` (int) - Semestre recomendado
- `prerequisites` (text) - Prerrequisitos
- `description` (text) - Descripción
- `hours_per_week` (int) - Horas semanales
- `is_active` (boolean) - Estado activo

**Archivo Relacionado:** `Estructura Académica Final.xlsx`

**Impacto Estimado:** 🔴 **ALTO**
- **Estructura completamente diferente detectada**
- Campos reales: `PLAN`, `CARRERA`, `NIVEL`, `SIGLA`, `ASIGNATURA`, `CRÉDITOS`, `CATEGORIA`, `HORAS`, `DURACIÓN CARRERA`, `ClPlEstud`, `CODIGO ESCUELA`, `ESCUELA / PROGRAMA`
- **12 campos nuevos** vs **10 campos faltantes** de la estructura actual
- Requiere **reestructuración completa** de la tabla `academic_structures`
- **281 registros** de datos reales
- Modificación **mayor** del procedimiento `sp_LoadAcademicStructure`

### 2. Tabla `teachers`

**Estructura Actual:**
- `rut` (varchar 12) - RUT del docente
- `name` (varchar 255) - Nombre completo
- `email` (varchar 255) - Email institucional
- `phone` (varchar 20) - Teléfono
- `address` (text) - Dirección
- `academic_degree` (varchar 100) - Título académico
- `specialization` (varchar 255) - Especialización
- `university` (varchar 255) - Universidad de origen
- `category_id` (int) - Categoría docente
- `contract_type_id` (int) - Tipo de contrato
- `hire_date` (date) - Fecha de contratación
- `contract_hours` (int) - Horas contractuales
- `salary_base` (decimal) - Salario base
- `is_active` (boolean) - Estado activo
- `can_coordinate` (boolean) - Puede coordinar
- `max_hours_per_week` (int) - Máximo horas semanales

**Archivo Relacionado:** `Docentes.xlsx`

**Impacto Estimado:** 🔴 **ALTO**
- **Estructura simplificada detectada**
- Campos reales: `DOCENTE`, `ID DOCENTE`, `RUT DOCENTE`
- **Solo 3 campos** vs **16 campos esperados** en la estructura actual
- **145 registros** de docentes reales
- Requiere **mapeo complejo** para completar información faltante
- **Reestructuración mayor** del procedimiento `sp_LoadTeachers`

### 3. Tabla `payment_codes`

**Estructura Actual:**
- `code_name` (varchar 20) - Código único
- `description` (varchar 255) - Descripción
- `factor` (decimal) - Factor multiplicador
- `base_amount` (decimal) - Monto base
- `category` (enum) - Categoría: docente/administrativo/otro
- `type` (enum) - Tipo: categoria/contrato/bono/descuento/hora
- `is_active` (boolean) - Estado activo
- `requires_hours` (boolean) - Requiere horas
- `is_taxable` (boolean) - Afecto a impuestos
- `valid_from` (date) - Válido desde
- `valid_until` (date) - Válido hasta

**Archivo Relacionado:** `ADOL.xlsx`

**Impacto Estimado:** 🔴 **ALTO**
- **Estructura simplificada detectada**
- Campos reales: `SIGLA`, `DESCRIPCIÓN`
- **Solo 2 campos** vs **11 campos esperados** en la estructura actual
- **22 registros** de códigos ADOL
- Falta información crítica: `factor`, `base_amount`, `category`, `type`, etc.
- **Reestructuración completa** del procedimiento `sp_LoadPaymentCodes`

### 4. Tabla `course_reports_data`

**Estructura Actual:**
- `academic_structure_id` (int) - ID estructura académica
- `student_count` (int) - Cantidad de estudiantes
- `term` (enum) - Período académico
- `year` (year) - Año académico
- `section` (varchar 10) - Sección
- `modality` (enum) - Modalidad: presencial/online/mixta
- `enrolled_count` (int) - Estudiantes matriculados
- `passed_count` (int) - Estudiantes aprobados
- `failed_count` (int) - Estudiantes reprobados
- `withdrawn_count` (int) - Estudiantes retirados
- `weekly_hours` (decimal) - Horas semanales
- `total_hours` (decimal) - Total de horas
- `is_validated` (boolean) - Datos validados
- `validated_by` (int) - Validado por usuario
- `validated_at` (timestamp) - Fecha validación
- `notes` (text) - Observaciones

**Archivo Relacionado:** `Cursables a Implementar.xlsx`

**Impacto Estimado:** 🔴 **ALTO**
- **Estructura completamente diferente detectada**
- Campos reales: `RUT`, `PLAN`, `NIVEL`, `SIGLA`, `ASIGNATURA`
- **5 campos nuevos** vs **16 campos faltantes** de la estructura actual
- **3,874 registros** de datos de estudiantes cursables
- Representa **asignaciones de estudiantes**, no reportes de cursos
- **Reestructuración completa** del procedimiento `sp_LoadCourseReportsData`

## Nuevas Tablas Requeridas

### 5. Tabla `teacher_assignments` (Nueva)

**Archivo Relacionado:** `DOL.xlsx` (Distribución de Obligaciones Laborales)

**Impacto Estimado:** 🔴 **ALTO**
- **Nueva tabla requerida**
- Campos reales detectados: `PLAN`, `SIGLA`, `DESCRIPCIÓN`
- **12 registros** de asignaciones DOL
- Estructura real:
  - `plan` (int) - Código del plan académico
  - `sigla` (varchar) - Código de la obligación laboral
  - `descripcion` (varchar) - Descripción de la obligación
  - Campos adicionales necesarios: `teacher_id`, `hours_assigned`, `term`, `year`, `is_active`
- **Nuevo procedimiento almacenado requerido**
- **Nuevas APIs y frontend**

### 6. Tabla `campus_scheduler_users` (Nueva)

**Archivo Relacionado:** `Usuarios Agendador Campus.xlsx`

**Impacto Estimado:** 🔴 **ALTO**
- **Nueva tabla requerida** o modificación de tabla `users`
- Campos reales detectados: `Usuario`, `Mail`, `Nombre`, `Cargo`, `Carrera`, `Tipo de Rol`
- **21 registros** de usuarios agendadores
- Estructura real:
  - `usuario` (varchar) - Username del usuario
  - `mail` (varchar) - Email institucional
  - `nombre` (varchar) - Nombre completo
  - `cargo` (varchar) - Cargo/posición
  - `carrera` (int) - Código de carrera asignada
  - `tipo_de_rol` (varchar) - Tipo de rol (Editor, etc.)
- **Modificación del sistema de permisos**
- **Nuevas APIs y frontend**

### 7. Tabla `program_vacancies` (Nueva)

**Archivo Relacionado:** `Vacantes Inicio.xlsx`

**Impacto Estimado:** 🔴 **ALTO**
- **Nueva tabla requerida**
- Campos reales detectados: `CODIGO PLAN`, `CARREA`, `SIGLA ASIGNATURA`, `ASIGNATURA`, `NIVEL`, `CREDITOS`, `VACANTES`
- **1 registro** de muestra (archivo con datos limitados)
- Estructura real:
  - `codigo_plan` (int) - Código del plan académico
  - `carrera` (varchar) - Nombre de la carrera
  - `sigla_asignatura` (varchar) - Código de la asignatura
  - `asignatura` (varchar) - Nombre de la asignatura
  - `nivel` (int) - Nivel académico
  - `creditos` (int) - Créditos de la asignatura
  - `vacantes` (int) - Número de vacantes disponibles
- **Nuevo procedimiento almacenado requerido**
- **Nuevas APIs y frontend**

## Plan de Implementación

### Fase 1: Análisis Detallado (2-3 días)
- [ ] Crear script para leer archivos Excel reales
- [ ] Mapear estructura exacta de cada archivo
- [ ] Identificar campos faltantes o nuevos
- [ ] Validar compatibilidad con datos existentes

### Fase 2: Diseño de Base de Datos (2-3 días)
- [ ] Diseñar modificaciones a tablas existentes
- [ ] Diseñar nuevas tablas requeridas
- [ ] Crear scripts de migración
- [ ] Actualizar diagrama ER

### Fase 3: Backend - Procedimientos Almacenados (3-4 días)
- [ ] Modificar `sp_LoadAcademicStructure`
- [ ] Modificar `sp_LoadCourseReportsData`
- [ ] Crear `sp_LoadTeacherAssignments`
- [ ] Crear `sp_LoadCampusSchedulerUsers`
- [ ] Crear `sp_LoadProgramVacancies`

### Fase 4: Backend - APIs (4-5 días)
- [ ] Actualizar DTOs existentes
- [ ] Crear nuevos DTOs
- [ ] Modificar servicios de carga
- [ ] Actualizar controladores
- [ ] Implementar validaciones

### Fase 5: Frontend (3-5 días)
- [ ] Actualizar interfaces de carga
- [ ] Crear nuevas pantallas para gestión
- [ ] Actualizar validaciones del lado cliente
- [ ] Implementar nuevos reportes

### Fase 6: Testing y Validación (3-4 días)
- [ ] Pruebas unitarias
- [ ] Pruebas de integración
- [ ] Pruebas de carga de archivos
- [ ] Validación con datos reales
- [ ] Pruebas de regresión

## Estimación de Esfuerzo (Actualizada con Datos Reales)

| Componente | Días Estimados | Complejidad | Justificación |
|------------|----------------|-------------|---------------|
| Análisis y Rediseño Completo | 5-8 | **Muy Alta** | Estructuras completamente diferentes |
| Migraciones BD Complejas | 6-8 | **Muy Alta** | 3 nuevas tablas + reestructuración |
| Procedimientos Almacenados | 8-10 | **Muy Alta** | Reescritura completa de 4 SPs |
| Backend APIs | 8-12 | **Muy Alta** | Nuevos DTOs, servicios y controladores |
| Frontend | 6-10 | **Alta** | Nuevas interfaces y validaciones |
| Testing Integral | 5-7 | **Alta** | Testing de migración y nuevas funcionalidades |
| **TOTAL** | **38-55 días** | **Crítica** | **Proyecto de reestructuración mayor** |

## Riesgos Identificados

### 🔴 Riesgos Críticos
1. **Incompatibilidad total de estructuras** - Los archivos reales son completamente diferentes a lo esperado
2. **Pérdida de funcionalidad existente** - Las estructuras actuales no mapean con los nuevos datos
3. **Migración de datos extremadamente compleja** - Requiere mapeo manual y completar información faltante
4. **Impacto en sistema en producción** - Cambios tan extensos pueden afectar estabilidad
5. **Tiempo de desarrollo subestimado** - La complejidad real es 2-3 veces mayor a la estimada

### 🟡 Riesgos Medios
1. **Tiempo de desarrollo subestimado** - Complejidad real podría ser mayor
2. **Dependencias entre archivos** - Cambios en un archivo podrían afectar otros
3. **Validaciones complejas** - Nuevos campos podrían requerir validaciones específicas

### 🟢 Riesgos Bajos
1. **Cambios menores en UI** - Ajustes cosméticos en interfaces
2. **Configuración de nuevos campos** - Agregado de campos opcionales

## Recomendaciones

### Inmediatas (CRÍTICAS)
1. ✅ **Script de análisis completado** - Análisis real de archivos Excel finalizado
2. **Backup completo URGENTE** de la base de datos actual antes de cualquier cambio
3. **Ambiente de desarrollo aislado** dedicado para reestructuración
4. **Reunión de emergencia** con stakeholders para revisar impacto real
5. **Evaluación de viabilidad** - Considerar si es factible continuar o redefinir alcance

### A Mediano Plazo
1. **Rediseño arquitectónico completo** del sistema de carga de datos
2. **Implementación por módulos críticos** priorizando funcionalidad esencial
3. **Validación exhaustiva** con el cliente en cada fase
4. **Plan de rollback detallado** para cada componente
5. **Documentación completa** de la nueva arquitectura

### A Largo Plazo
1. **Monitoreo de rendimiento** después de la implementación
2. **Plan de rollback** en caso de problemas críticos
3. **Capacitación de usuarios** en las nuevas funcionalidades

---

## Conclusiones Críticas

### 🚨 **ALERTA DE PROYECTO**
El análisis de los archivos Excel reales revela que el proyecto requiere una **reestructuración completa** del sistema de carga de datos. Las estructuras actuales de la base de datos son **incompatibles** con los datos reales.

### 📊 **Estadísticas del Impacto Real**
- **Total de registros analizados:** 4,354
- **Archivos con impacto ALTO:** 7/7 (100%)
- **Nuevas tablas requeridas:** 3
- **Tablas existentes a reestructurar:** 4
- **Procedimientos almacenados a reescribir:** 4

### 🎯 **Recomendación Final**
**PAUSA INMEDIATA** del desarrollo actual para:
1. Evaluar viabilidad técnica y económica
2. Redefinir alcance del proyecto
3. Considerar alternativas de implementación
4. Obtener aprobación para reestructuración mayor

---

**Fecha de Análisis:** 17 de Julio, 2025
**Versión:** 2.0 (Actualizada con datos reales)
**Estado:** ⚠️ **REQUIERE DECISIÓN CRÍTICA DE PROYECTO**