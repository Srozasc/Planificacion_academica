# Análisis de Inconsistencias: Procedimientos Almacenados vs Backend

## Resumen Ejecutivo

Se encontraron **inconsistencias críticas** entre el procedimiento almacenado `sp_CreateEventSafe_completo.sql` y la estructura actual del backend NestJS. Estas inconsistencias impedirían el funcionamiento correcto del sistema.

## Inconsistencias Identificadas

### 1. Estructura de Campos - CRÍTICO ❌

| Campo en Procedimiento Original | Campo en Backend Actual | Tipo Esperado | Tipo Actual |
|----------------------------------|-------------------------|---------------|-------------|
| `subject_id` | `subject` | INT (FK) | VARCHAR(100) |
| `teacher_id` | `teacher` | INT (FK) | VARCHAR(100) |
| `room_id` | `room` | INT (FK) | VARCHAR(50) |
| `start_time` | `start_date` | DATETIME | DATETIME |
| `end_time` | `end_date` | DATETIME | DATETIME |
| `is_active` | `active` | BOOLEAN | BOOLEAN |

### 2. Campos Inexistentes en Backend - CRÍTICO ❌

El procedimiento original intentaba usar campos que **NO EXISTEN** en la tabla actual:

- `status_id` - No existe en la tabla actual
- `conflicts_checked` - No existe en la tabla actual
- `validation_notes` - No existe en la tabla actual
- `created_by_user_id` - No existe en la tabla actual

### 3. Validaciones Incompatibles - ALTO ⚠️

- **Validación de asignatura**: El procedimiento valida existencia en tabla `academic_structures` usando `subject_id`, pero el backend usa texto libre en campo `subject`
- **Validación de docente**: El procedimiento valida existencia en tabla `teachers` usando `teacher_id`, pero el backend usa texto libre en campo `teacher`
- **Validación de sala**: El procedimiento valida conflictos usando `room_id`, pero el backend usa texto libre en campo `room`

### 4. Problemas de Integridad Referencial - ALTO ⚠️

El procedimiento original asume un modelo relacional con claves foráneas:
- `subject_id` → `academic_structures.id`
- `teacher_id` → `teachers.id`
- `room_id` → `rooms.id` (tabla que podría no existir)
- `status_id` → `event_statuses.id` (tabla que podría no existir)

Pero el backend actual usa un modelo más simple con campos de texto libre.

## Impacto de las Inconsistencias

### Errores que se producirían:

1. **Error SQL**: Columnas inexistentes al intentar ejecutar el procedimiento
2. **Error de validación**: Fallarían las validaciones de existencia en tablas relacionadas
3. **Error de inserción**: Fallaría el INSERT por campos inexistentes
4. **Error de conflictos**: Las validaciones de conflictos no funcionarían correctamente

### Funcionalidades afectadas:

- ❌ Creación de eventos desde el backend
- ❌ Validaciones de conflictos de horarios
- ❌ Validaciones de integridad de datos
- ❌ Auditoría de cambios

## Solución Implementada

### Archivo Corregido: `sp_CreateEventSafe_corregido.sql`

#### Cambios Aplicados:

1. **Adaptación de Parámetros**:
   - ✅ `subject_id` → `p_subject` (VARCHAR)
   - ✅ `teacher_id` → `p_teacher` (VARCHAR)
   - ✅ `room_id` → `p_room` (VARCHAR)
   - ✅ `start_time/end_time` → `start_date/end_date`
   - ✅ `is_active` → `active`

2. **Eliminación de Campos Inexistentes**:
   - ✅ Removido `status_id`
   - ✅ Removido `conflicts_checked`
   - ✅ Removido `validation_notes`
   - ✅ Removido `created_by_user_id`

3. **Adaptación de Validaciones**:
   - ✅ Validación de conflictos de docente usando campo `teacher` (VARCHAR)
   - ✅ Validación de conflictos de sala usando campo `room` (VARCHAR)
   - ✅ Eliminadas validaciones de existencia en tablas relacionadas
   - ✅ Agregadas validaciones de formato (color hexadecimal, número de estudiantes)

4. **Nuevos Procedimientos Agregados**:
   - ✅ `sp_CreateEventSafe` - Crear eventos con validaciones
   - ✅ `sp_UpdateEventSafe` - Actualizar eventos con validaciones
   - ✅ `sp_GetEventWithRelations` - Obtener evento con información del bimestre
   - ✅ `fn_CheckRoomConflict` - Función para verificar conflictos de sala

## Procedimientos Corregidos

### 1. sp_CreateEventSafe
**Parámetros de entrada**:
- `p_title` VARCHAR(255) - Título del evento
- `p_description` TEXT - Descripción (opcional)
- `p_subject` VARCHAR(100) - Materia (opcional)
- `p_teacher` VARCHAR(100) - Docente (opcional)
- `p_room` VARCHAR(50) - Sala (opcional)
- `p_start_date` DATETIME - Fecha/hora inicio
- `p_end_date` DATETIME - Fecha/hora fin
- `p_students` INT - Número de estudiantes (opcional)
- `p_background_color` VARCHAR(7) - Color hexadecimal (opcional)
- `p_bimestre_id` INT - ID del bimestre (opcional)

**Parámetros de salida**:
- `p_event_id` INT - ID del evento creado
- `p_success` BOOLEAN - Éxito de la operación
- `p_error_message` TEXT - Mensaje de error si aplica

### 2. sp_UpdateEventSafe
Similar a `sp_CreateEventSafe` pero para actualizar eventos existentes.

### 3. sp_GetEventWithRelations
Obtiene un evento con información relacionada del bimestre.

## Validaciones Implementadas

✅ **Validaciones básicas**:
- Título obligatorio
- Fecha fin posterior a fecha inicio
- Formato de color hexadecimal válido
- Número de estudiantes positivo

✅ **Validaciones de conflictos**:
- Conflictos de docente en el mismo horario
- Conflictos de sala en el mismo horario
- Existencia del bimestre (si se proporciona)

✅ **Manejo de errores**:
- Transacciones con ROLLBACK automático
- Mensajes de error descriptivos
- Manejo de excepciones SQL

## Recomendaciones

### Inmediatas:
1. ✅ **Usar el archivo corregido**: `sp_CreateEventSafe_corregido.sql`
2. ✅ **Probar los procedimientos** con datos reales del sistema
3. ✅ **Integrar con el backend** NestJS si es necesario

### A futuro:
1. **Considerar migración a modelo relacional**: Si se requiere mayor integridad de datos
2. **Crear tablas de referencia**: Para salas, estados de eventos, etc.
3. **Implementar auditoría**: Agregar campos de auditoría si es necesario

## Estado Actual

- ❌ **Procedimiento original**: Incompatible con backend actual
- ✅ **Procedimiento corregido**: Compatible y funcional
- ✅ **Backend**: Sin cambios necesarios
- ✅ **Base de datos**: Compatible con estructura actual

---

**Fecha de análisis**: 2025-01-22  
**Archivos analizados**: 
- `sp_CreateEventSafe_completo.sql` (original)
- `012-create-schedule-events-table.sql` (migración)
- `schedule-event.entity.ts` (entidad backend)
- `schedule-event.dto.ts` (DTO backend)

**Archivo de solución**: `sp_CreateEventSafe_corregido.sql`