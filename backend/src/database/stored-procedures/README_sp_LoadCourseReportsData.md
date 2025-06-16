# Documentación del Stored Procedure: sp_LoadCourseReportsData

## Descripción General
El SP `sp_LoadCourseReportsData` permite la carga masiva de datos de reportes de cursables desde datos JSON con validaciones comprehensivas de integridad referencial, consistencia estadística y rangos de datos académicos.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `p_json_data` | LONGTEXT | Array JSON con datos de reportes de cursables |
| `p_user_id` | INT | ID del usuario que ejecuta la carga |
| `p_update_mode` | VARCHAR(20) | Modo de operación: 'INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT' |
| `p_result_json` | LONGTEXT | JSON de respuesta con resultados (OUT) |

## Estructura del JSON de Entrada

```json
[
  {
    "academic_structure_id": 1,             // Requerido: ID de estructura académica
    "student_count": 45,                    // Opcional: Estudiantes cursables (default: 0)
    "term": "1",                            // Requerido: 1/2/anual/intensivo
    "year": 2025,                           // Requerido: Año académico (2020-2050)
    "section": "A",                         // Opcional: Sección (max 10 chars)
    "modality": "presencial",               // Opcional: presencial/online/mixta (default: presencial)
    "enrolled_count": 50,                   // Opcional: Estudiantes matriculados
    "passed_count": 35,                     // Opcional: Estudiantes aprobados
    "failed_count": 10,                     // Opcional: Estudiantes reprobados
    "withdrawn_count": 5,                   // Opcional: Estudiantes retirados
    "weekly_hours": 6.0,                    // Opcional: Horas semanales
    "total_hours": 108.0,                   // Opcional: Total de horas
    "is_validated": true,                   // Opcional: Si está validado (default: false)
    "notes": "Observaciones del reporte"    // Opcional: Notas adicionales
  }
]
```

## Modos de Operación

### INSERT_ONLY
- Solo inserta registros nuevos
- Falla si ya existe un reporte para la misma estructura/año/período/sección
- Ideal para cargas iniciales

### UPDATE_ONLY
- Solo actualiza registros existentes
- Falla si no existe el reporte a actualizar
- Ideal para actualizaciones masivas

### UPSERT (Default)
- Inserta registros nuevos
- Actualiza registros existentes
- Más flexible para cargas mixtas

## Validaciones Implementadas

### 1. Campos Requeridos
- `academic_structure_id`: ID de la estructura académica
- `term`: Período académico
- `year`: Año académico

### 2. Integridad Referencial
- `academic_structure_id`: Debe existir en `academic_structures` y estar activo
- Verificación de que la estructura no esté eliminada (deleted_at IS NULL)

### 3. Validaciones de Enums
- `term`: '1', '2', 'anual', 'intensivo'
- `modality`: 'presencial', 'online', 'mixta'

### 4. Validaciones de Rangos
- `student_count`: >= 0
- `year`: Entre 2020 y 2050
- `enrolled_count`: >= 0 (si se proporciona)
- `passed_count`: >= 0 (si se proporciona)
- `failed_count`: >= 0 (si se proporciona)
- `withdrawn_count`: >= 0 (si se proporciona)
- `weekly_hours`: > 0 (si se proporciona)
- `total_hours`: > 0 (si se proporciona)

### 5. Validaciones de Formato
- `section`: Máximo 10 caracteres

### 6. Validaciones de Consistencia Estadística
- La suma de `passed_count + failed_count + withdrawn_count` no puede exceder `enrolled_count`
- Esta validación solo se aplica cuando se proporcionan tanto el conteo de matriculados como al menos uno de los otros conteos

### 7. Clave Única Compuesta
- Combinación única: `academic_structure_id + year + term + section`
- Evita duplicados de reportes para el mismo período y asignatura

## Estructura de Respuesta

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Todos los registros procesados exitosamente",
  "statistics": {
    "total_rows": 5,
    "success_count": 5,
    "error_count": 0,
    "insert_count": 3,
    "update_count": 2,
    "skip_count": 0
  }
}
```

### Respuesta con Errores
```json
{
  "success": false,
  "message": "Procesamiento completado con errores",
  "statistics": {
    "total_rows": 3,
    "success_count": 1,
    "error_count": 2,
    "insert_count": 1,
    "update_count": 0,
    "skip_count": 0
  },
  "errors": [
    {
      "row": 1,
      "field": "academic_structure_id",
      "type": "FOREIGN_KEY",
      "message": "Estructura académica con ID 999 no encontrada",
      "data": {...}
    }
  ]
}
```

## Tipos de Errores

| Tipo | Descripción |
|------|-------------|
| `REQUIRED` | Campo requerido faltante |
| `FOREIGN_KEY` | Estructura académica no existe |
| `ENUM` | Valor de enum inválido |
| `RANGE` | Valor fuera del rango permitido |
| `FORMAT` | Formato de campo inválido |
| `LOGIC` | Error de consistencia estadística |
| `DUPLICATE` | Registro duplicado |
| `NOT_FOUND` | Registro no encontrado (UPDATE_ONLY) |

## Ejemplos de Uso

### Carga Inicial de Reportes
```sql
CALL sp_LoadCourseReportsData(
    '[
        {
            "academic_structure_id": 1,
            "student_count": 45,
            "term": "1",
            "year": 2025,
            "section": "A",
            "modality": "presencial",
            "enrolled_count": 50,
            "passed_count": 35,
            "failed_count": 10,
            "withdrawn_count": 5
        }
    ]',
    1,
    'INSERT_ONLY',
    @result
);
SELECT @result;
```

### Actualización de Estadísticas
```sql
CALL sp_LoadCourseReportsData(
    '[
        {
            "academic_structure_id": 1,
            "student_count": 48,
            "term": "1",
            "year": 2025,
            "section": "A",
            "passed_count": 38,
            "failed_count": 8,
            "withdrawn_count": 2
        }
    ]',
    1,
    'UPDATE_ONLY',
    @result
);
SELECT @result;
```

### Carga de Múltiples Períodos
```sql
CALL sp_LoadCourseReportsData(
    '[
        {
            "academic_structure_id": 2,
            "student_count": 35,
            "term": "1",
            "year": 2025,
            "section": "A",
            "modality": "presencial"
        },
        {
            "academic_structure_id": 2,
            "student_count": 32,
            "term": "2",
            "year": 2025,
            "section": "A",
            "modality": "mixta"
        }
    ]',
    1,
    'UPSERT',
    @result
);
SELECT @result;
```

## Casos de Uso Específicos

### Reportes de Cursos Intensivos
```sql
CALL sp_LoadCourseReportsData(
    '[
        {
            "academic_structure_id": 3,
            "student_count": 25,
            "term": "intensivo",
            "year": 2025,
            "section": "A",
            "modality": "online",
            "weekly_hours": 4.0,
            "total_hours": 60.0
        }
    ]',
    1,
    'UPSERT',
    @result
);
```

### Reportes con Validación Estadística
```sql
CALL sp_LoadCourseReportsData(
    '[
        {
            "academic_structure_id": 4,
            "student_count": 40,
            "term": "anual",
            "year": 2025,
            "enrolled_count": 42,
            "passed_count": 35,
            "failed_count": 4,
            "withdrawn_count": 3,
            "is_validated": true,
            "notes": "Excelente rendimiento académico"
        }
    ]',
    1,
    'UPSERT',
    @result
);
```

## Características Técnicas

### Transaccionalidad
- Operación completamente transaccional
- Rollback automático en caso de errores SQL
- Opción de rollback en errores de validación (configurable)

### Rendimiento
- Procesamiento por lotes en una sola transacción
- Validaciones optimizadas con índices existentes
- Tabla temporal para manejo eficiente de errores

### Integridad de Datos
- Validación de integridad referencial con `academic_structures`
- Validación de consistencia en datos estadísticos
- Clave única compuesta para evitar duplicados

### Flexibilidad
- Campos opcionales para diferentes tipos de reportes
- Soporte para múltiples modalidades y períodos
- Validación automática de rangos y formatos

### Auditoría
- Registro de usuario que ejecuta la operación
- Timestamps automáticos (created_at, updated_at)
- Soft delete compatible (deleted_at)

## Pruebas Realizadas

### Casos de Prueba Exitosos ✅
1. Inserción con datos válidos
2. Actualización de registro existente
3. Validación de estructura académica inexistente
4. Validación de campos requeridos faltantes
5. Validación de enums inválidos
6. Validación de año fuera de rango
7. Validación de inconsistencia estadística
8. Validación de duplicados
9. Procesamiento de múltiples registros
10. Validación de valores negativos

### Cobertura de Validaciones ✅
- ✅ Validación de integridad referencial
- ✅ Validación de campos requeridos
- ✅ Validación de enums específicos
- ✅ Validación de rangos numéricos
- ✅ Validación de consistencia estadística
- ✅ Validación de clave única compuesta
- ✅ Manejo de errores transaccional

## Estado del Desarrollo
- **Estado**: ✅ COMPLETADO
- **Fecha**: 2025-06-16
- **Pruebas**: ✅ EXITOSAS
- **Documentación**: ✅ COMPLETA

El SP `sp_LoadCourseReportsData` está completamente implementado, probado y documentado, listo para uso en producción para la carga masiva de datos de reportes académicos.
