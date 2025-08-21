# Dependencias de la Tabla Bimestres

## Resumen Ejecutivo

Este documento detalla todas las tablas que tienen dependencias con la tabla `bimestres` en el sistema de Planificación Académica. Esta información es crucial para el desarrollo del Stored Procedure de limpieza anual de bimestres.

## Estructura de la Tabla Bimestres

```sql
CREATE TABLE `bimestres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date NOT NULL,
  `anoAcademico` int NOT NULL,
  `numeroBimestre` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '0',
  `descripcion` text,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `fechaPago1Inicio` date DEFAULT NULL,
  `fechaPago1Fin` date DEFAULT NULL,
  `fechaPago2Inicio` date DEFAULT NULL,
  `fechaPago2Fin` date DEFAULT NULL,
  `factor` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
```

## Tablas con Dependencias Directas

### 1. Tablas de Eventos

#### `schedule_events`
- **Columna FK**: `bimestre_id`
- **Constraint**: `fk_events_bimestre`
- **Acción**: `ON DELETE SET NULL ON UPDATE CASCADE`
- **Descripción**: Eventos programados del sistema

#### `event_teachers`
- **Columna FK**: `id_bimestre`
- **Constraint**: `fk_event_teachers_bimestre`
- **Acción**: `ON DELETE SET NULL ON UPDATE CASCADE`
- **Descripción**: Relación entre eventos y docentes

### 2. Tablas de Permisos

#### `usuario_permisos_carrera`
- **Columna FK**: `bimestre_id`
- **Constraint**: `fk_usuario_permisos_carrera_bimestre`
- **Descripción**: Permisos de usuarios por carrera y bimestre
- **Clave única**: `unique_usuario_carrera_bimestre (usuario_id, carrera_id, bimestre_id)`

#### `usuario_permisos_categoria`
- **Columna FK**: `bimestre_id`
- **Constraint**: `fk_usuario_permisos_categoria_bimestre`
- **Descripción**: Permisos de usuarios por categoría y bimestre
- **Clave única**: `unique_usuario_categoria_bimestre (usuario_id, categoria, bimestre_id)`

#### `permisos_pendientes`
- **Columna FK**: `bimestre_id`
- **Descripción**: Permisos pendientes de aprobación por bimestre

### 3. Tablas Staging

#### `staging_dol`
- **Columna FK**: `id_bimestre`
- **Constraint**: `FK_staging_dol_bimestre`
- **Descripción**: Datos temporales de DOL (Declaración de Línea)

#### `staging_adol`
- **Columna FK**: `id_bimestre`
- **Índice**: `IX_staging_adol_simple_bimestre`
- **Descripción**: Datos temporales de ADOL

#### `staging_cursables`
- **Columna FK**: `id_bimestre`
- **Descripción**: Datos temporales de asignaturas cursables

#### `staging_docentes`
- **Columna FK**: `id_bimestre`
- **Descripción**: Datos temporales de nómina de docentes

#### `staging_estructura_academica`
- **Columna FK**: `id_bimestre`
- **Descripción**: Datos temporales de estructura académica

#### `staging_usuarios_agendador`
- **Columna FK**: `id_bimestre`
- **Descripción**: Datos temporales de usuarios del agendador

#### `staging_vacantes`
- **Columna FK**: `id_bimestre`
- **Descripción**: Datos temporales de vacantes

### 4. Tablas Finales

#### `asignaturas`
- **Columna FK**: `bimestre_id`
- **Descripción**: Asignaturas por bimestre

#### `carreras`
- **Columna FK**: `bimestre_id`
- **Descripción**: Carreras por bimestre

#### `dol_aprobados`
- **Columna FK**: `id_bimestre`
- **Descripción**: DOL aprobados por bimestre

#### `asignaturas_optativas_aprobadas`
- **Columna FK**: `id_bimestre`
- **Descripción**: Asignaturas optativas aprobadas por bimestre

### 5. Tablas de Logs y Auditoría

#### `upload_logs`
- **Columna FK**: `bimestre_id`
- **Constraint**: `upload_logs_ibfk_1`
- **Acción**: `ON DELETE SET NULL`
- **Descripción**: Logs de cargas de archivos por bimestre

## Orden de Eliminación Recomendado

Basándose en el método `deleteWithEvents` existente, el orden de eliminación debe ser:

1. **Tablas de permisos** (eliminar primero para evitar conflictos FK)
   - `usuario_permisos_carrera`
   - `usuario_permisos_categoria`
   - `permisos_pendientes`

2. **Tablas staging** (datos temporales)
   - `staging_dol`
   - `staging_cursables`
   - `staging_docentes`
   - `staging_estructura_academica`
   - `staging_usuarios_agendador`
   - `staging_vacantes`
   - `staging_adol`

3. **Tabla de eventos**
   - `schedule_events`
   - `event_teachers`

4. **Tablas finales** (eliminar después de staging)
   - `asignaturas`
   - `carreras`
   - `dol_aprobados`
   - `asignaturas_optativas_aprobadas`

5. **Tablas de logs** (eliminar al final)
   - `upload_logs`

6. **Tabla principal**
   - `bimestres` (eliminar al final)

## Método deleteWithEvents Existente

El sistema ya cuenta con un método `deleteWithEvents` en el servicio de bimestres que:

- Verifica dependencias con `checkDependencies()`
- Elimina registros en el orden correcto
- Maneja errores de FK graciosamente
- Registra logs detallados
- Cuenta registros eliminados

## Consideraciones para el Stored Procedure

1. **Transaccionalidad**: Usar transacciones para garantizar atomicidad
2. **Manejo de errores**: Continuar con otras tablas si una falla
3. **Logging**: Registrar cantidad de registros eliminados por tabla
4. **Validaciones**: Verificar que existan más de N bimestres antes de eliminar
5. **Ordenamiento**: Usar `ORDER BY createdAt DESC` para identificar los más recientes

## Impacto de la Eliminación

⚠️ **ADVERTENCIA**: La eliminación de bimestres es una operación crítica que:

- Elimina datos históricos permanentemente
- Puede afectar reportes y auditorías
- Requiere backups previos
- Debe ejecutarse en horarios de baja actividad

## Próximos Pasos

1. Analizar el método `deleteWithEvents` existente
2. Verificar permisos de base de datos para stored procedures
3. Definir criterios de ordenamiento y validación
4. Desarrollar el stored procedure
5. Crear el servicio NestJS correspondiente

---

**Fecha de creación**: 2025-01-30  
**Fase**: 1.2 - Análisis y Preparación  
**Estado**: Completado