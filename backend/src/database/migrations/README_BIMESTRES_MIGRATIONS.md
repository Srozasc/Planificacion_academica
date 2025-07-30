# Migraciones de Bimestres

Este directorio contiene las migraciones relacionadas con la funcionalidad de bimestres.

## Archivos de Migración

### 016-add-fechas-pago-to-bimestres.sql
- **Descripción**: Migración original que agregaba campos fechaPago1 y fechaPago2 individuales
- **Estado**: Obsoleta, reemplazada por 017-update-bimestres-fecha-pago-ranges.sql
- **Fecha**: 2025-01-27

### 017-update-bimestres-fecha-pago-ranges.sql
- **Descripción**: Actualiza la tabla bimestres para usar rangos de fechas de pago
- **Cambios**:
  - Elimina columnas `fechaPago1` y `fechaPago2` (si existen)
  - Agrega columnas `fechaPago1Inicio`, `fechaPago1Fin`, `fechaPago2Inicio`, `fechaPago2Fin`
- **Fecha**: 2025-01-30
- **Estado**: Activa

### run-bimestres-migrations.sql
- **Descripción**: Script principal para ejecutar todas las migraciones de bimestres
- **Uso**: Ejecuta automáticamente la migración 017 y verifica los resultados
- **Fecha**: 2025-01-30

## Estructura Final de la Tabla Bimestres

```sql
CREATE TABLE `bimestres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fechaInicio` date NOT NULL,
  `fechaFin` date NOT NULL,
  `anoAcademico` int NOT NULL,
  `numeroBimestre` int NOT NULL,
  `activo` tinyint NOT NULL DEFAULT '1',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `fechaPago1Inicio` date DEFAULT NULL,
  `fechaPago1Fin` date DEFAULT NULL,
  `fechaPago2Inicio` date DEFAULT NULL,
  `fechaPago2Fin` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Cómo Ejecutar las Migraciones

### Opción 1: Ejecutar script principal
```bash
mysql -u [usuario] -p [base_de_datos] < run-bimestres-migrations.sql
```

### Opción 2: Ejecutar migración individual
```bash
mysql -u [usuario] -p [base_de_datos] < 017-update-bimestres-fecha-pago-ranges.sql
```

## Validación Post-Migración

Después de ejecutar las migraciones, verificar:

1. **Estructura de la tabla**:
   ```sql
   DESCRIBE bimestres;
   ```

2. **Columnas específicas**:
   ```sql
   SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
   FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'planificacion_academica'
   AND TABLE_NAME = 'bimestres' 
   AND COLUMN_NAME IN ('fechaPago1Inicio', 'fechaPago1Fin', 'fechaPago2Inicio', 'fechaPago2Fin');
   ```

3. **Datos existentes**:
   ```sql
   SELECT id, nombre, fechaPago1Inicio, fechaPago1Fin, fechaPago2Inicio, fechaPago2Fin 
   FROM bimestres;
   ```

## Notas Importantes

- La migración 017 elimina las columnas `fechaPago1` y `fechaPago2` si existen
- Los nuevos campos permiten definir rangos de fechas para cada período de pago
- Todos los campos de fecha de pago son opcionales (NULL)
- La migración es compatible con datos existentes

## Rollback

Para revertir los cambios:

```sql
-- Eliminar las nuevas columnas
ALTER TABLE bimestres 
DROP COLUMN fechaPago1Inicio,
DROP COLUMN fechaPago1Fin,
DROP COLUMN fechaPago2Inicio,
DROP COLUMN fechaPago2Fin;

-- Restaurar las columnas originales (si es necesario)
ALTER TABLE bimestres 
ADD COLUMN fechaPago1 DATE NULL,
ADD COLUMN fechaPago2 DATE NULL;
```