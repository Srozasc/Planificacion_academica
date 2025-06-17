# Migraciones de Programación Académica - Documentación

## 📋 Resumen de Migraciones Creadas

**Fecha:** 17 de Junio de 2025  
**Objetivo:** Implementar esquema de base de datos para programación académica colaborativa

### 🗃️ Migraciones Implementadas

#### 011-create-event-statuses-table.sql
- **Tabla:** `event_statuses`
- **Propósito:** Estados para eventos de programación (Borrador, En Revisión, Aprobado, etc.)
- **Campos clave:** 
  - `name`: Nombre del estado
  - `description`: Descripción del estado
  - `color_hex`: Color para UI
  - `can_edit/can_delete`: Permisos por estado

#### 012-create-schedule-events-table.sql
- **Tabla:** `schedule_events`
- **Propósito:** Eventos principales de programación académica
- **Campos clave:**
  - `academic_structure_id`: FK a asignaturas
  - `teacher_id`: FK a docentes
  - `start_datetime/end_datetime`: Horarios
  - `classroom`: Aula asignada
  - `status_id`: Estado del evento
  - `conflicts_checked`: Validación de conflictos

#### 013-seed-event-statuses-data.sql
- **Propósito:** Poblar tabla de estados con datos iniciales
- **Estados creados:**
  1. Borrador (#6c757d)
  2. En Revisión (#ffc107)
  3. Aprobado (#28a745)
  4. Rechazado (#dc3545)
  5. Suspendido (#fd7e14)
  6. Cancelado (#6f42c1)
  7. Programado (#17a2b8)

#### 014-create-configuration-table.sql
- **Tabla:** `configuration`
- **Propósito:** Configuraciones globales del sistema
- **Configuraciones incluidas:**
  - `max_teacher_hours_weekly`: Horas máximas por docente
  - `time_unit`: Unidad de tiempo (60min cronológicos/45min académicos)
  - `working_hours_start/end`: Horario laboral
  - `calendar_view_default`: Vista por defecto

## 🔧 Instrucciones de Ejecución

### Opción 1: Ejecución Individual
```sql
-- Ejecutar en orden:
SOURCE backend/src/database/migrations/011-create-event-statuses-table.sql;
SOURCE backend/src/database/migrations/012-create-schedule-events-table.sql;
SOURCE backend/src/database/migrations/013-seed-event-statuses-data.sql;
SOURCE backend/src/database/migrations/014-create-configuration-table.sql;
```

### Opción 2: Script Completo
```sql
SOURCE backend/src/database/migrations/run-scheduling-migrations.sql;
```

### Opción 3: Desde Terminal
```bash
cd backend/src/database/migrations
mysql -u usuario -p nombre_bd < run-scheduling-migrations.sql
```

## 📊 Estructura de Relaciones

```
Users (existente)
├── schedule_events (created_by_user_id)
└── schedule_events (approved_by)

Academic_Structures (existente)
└── schedule_events (academic_structure_id)

Teachers (existente)
└── schedule_events (teacher_id)

Event_Statuses (nueva)
└── schedule_events (status_id)

Configuration (nueva)
├── Configuraciones de horarios
├── Configuraciones académicas
└── Configuraciones de UI
```

## 🔍 Validaciones Implementadas

### Tabla schedule_events
- ✅ `end_datetime > start_datetime`
- ✅ `day_of_week` en días válidos
- ✅ `vacancies >= 0` si no es NULL
- ✅ `max_capacity > 0` si no es NULL
- ✅ `weekly_hours > 0` si no es NULL

### Tabla event_statuses
- ✅ `name` único
- ✅ Campos de permisos (`can_edit`, `can_delete`)
- ✅ Estados activos/inactivos

### Tabla configuration
- ✅ `config_key` único
- ✅ Tipos de datos validados
- ✅ Categorización de configuraciones

## 📈 Índices Optimizados

### schedule_events
- **Consultas por docente:** `idx_schedule_events_teacher`
- **Consultas por horario:** `idx_schedule_events_datetime`
- **Búsquedas por estado:** `idx_schedule_events_status`
- **Filtros por área:** `idx_schedule_events_area`
- **Consultas compuestas:** `idx_schedule_events_teacher_datetime`

### event_statuses
- **Estados activos:** `idx_event_statuses_active`
- **Ordenamiento:** `idx_event_statuses_sort`

### configuration
- **Por categoría:** `idx_configuration_category`
- **Configuraciones editables:** `idx_configuration_editable`

## 🛡️ Restricciones de Seguridad

### Foreign Keys
- ✅ `ON DELETE RESTRICT` para relaciones críticas
- ✅ `ON DELETE SET NULL` para campos opcionales
- ✅ `ON UPDATE CASCADE` para actualizaciones

### Permisos por Estado
- **Borrador:** Editable y eliminable
- **En Revisión:** Solo lectura
- **Aprobado:** Solo lectura
- **Rechazado:** Editable, no eliminable

## 🧪 Verificación Post-Migración

### Consultas de Verificación
```sql
-- Verificar tablas creadas
SHOW TABLES LIKE '%schedule%' OR '%event%' OR '%configuration%';

-- Verificar estados creados
SELECT * FROM event_statuses ORDER BY sort_order;

-- Verificar configuraciones
SELECT category, COUNT(*) as configs 
FROM configuration 
GROUP BY category;

-- Verificar foreign keys
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

## 🎯 Próximos Pasos

1. **Ejecutar migraciones** en ambiente de desarrollo
2. **Verificar integridad** de datos y relaciones
3. **Crear entidades TypeORM** correspondientes
4. **Implementar servicios** de programación
5. **Desarrollar API endpoints** para calendario

---

**✅ Migraciones listas para ejecución**  
**🔄 Paso 3.1 completado**
