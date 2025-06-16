# Documentación del Stored Procedure: sp_LoadPaymentCodes

## Descripción General
El SP `sp_LoadPaymentCodes` permite la carga masiva de códigos de pago desde datos JSON con validaciones comprehensivas de factores, categorías, tipos y fechas de vigencia.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `p_json_data` | LONGTEXT | Array JSON con datos de códigos de pago |
| `p_user_id` | INT | ID del usuario que ejecuta la carga |
| `p_update_mode` | VARCHAR(20) | Modo de operación: 'INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT' |
| `p_result_json` | LONGTEXT | JSON de respuesta con resultados (OUT) |

## Estructura del JSON de Entrada

```json
[
  {
    "code_name": "DOC1",                    // Requerido: Código único (2-20 chars)
    "description": "Profesor Titular",      // Requerido: Descripción (max 255)
    "factor": 1.5000,                       // Requerido: Factor > 0
    "base_amount": 2500000.00,              // Opcional: Monto base >= 0
    "category": "docente",                  // Requerido: docente/administrativo/otro
    "type": "categoria",                    // Requerido: categoria/contrato/bono/descuento/hora
    "is_active": true,                      // Opcional: Estado activo (default: true)
    "requires_hours": false,                // Opcional: Requiere horas (default: false)
    "is_taxable": true,                     // Opcional: Afecto a impuestos (default: true)
    "valid_from": "2024-01-01",             // Opcional: Fecha desde (YYYY-MM-DD)
    "valid_until": "2024-12-31"             // Opcional: Fecha hasta (YYYY-MM-DD)
  }
]
```

## Modos de Operación

### INSERT_ONLY
- Solo inserta registros nuevos
- Falla si el código ya existe
- Ideal para cargas iniciales

### UPDATE_ONLY
- Solo actualiza registros existentes
- Falla si el código no existe
- Ideal para actualizaciones masivas

### UPSERT (Default)
- Inserta registros nuevos
- Actualiza registros existentes
- Más flexible para cargas mixtas

## Validaciones Implementadas

### 1. Campos Requeridos
- `code_name`: Código único (2-20 caracteres)
- `description`: Descripción (máx. 255 caracteres)
- `factor`: Factor multiplicador (> 0)
- `category`: Categoría del código
- `type`: Tipo de código de pago

### 2. Validaciones de Formato
- Código: Entre 2 y 20 caracteres
- Descripción: Máximo 255 caracteres
- Fechas: Formato YYYY-MM-DD

### 3. Validaciones de Rango
- `factor`: > 0
- `base_amount`: >= 0

### 4. Validaciones de Enums
- `category`: 'docente', 'administrativo', 'otro'
- `type`: 'categoria', 'contrato', 'bono', 'descuento', 'hora'

### 5. Validaciones de Fechas
- Formato ISO (YYYY-MM-DD)
- `valid_until` >= `valid_from` (si ambas están presentes)

### 6. Validaciones de Lógica de Negocio
- `requires_hours` = true solo para `type` = 'hora'
- Códigos de tipo 'descuento' deberían tener `factor` < 1

### 7. Unicidad
- `code_name` único en el sistema

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
      "field": "factor",
      "type": "RANGE",
      "message": "El factor debe ser mayor a 0",
      "data": {...}
    }
  ]
}
```

## Tipos de Errores

| Tipo | Descripción |
|------|-------------|
| `REQUIRED` | Campo requerido faltante |
| `FORMAT` | Formato inválido (fechas, longitudes) |
| `RANGE` | Valor fuera del rango permitido |
| `ENUM` | Valor de enum inválido |
| `LOGIC` | Error de lógica de negocio |
| `DUPLICATE` | Código duplicado |
| `NOT_FOUND` | Registro no encontrado (UPDATE_ONLY) |

## Ejemplos de Uso

### Carga de Categorías Docentes
```sql
CALL sp_LoadPaymentCodes(
    '[
        {"code_name": "DOC1", "description": "Profesor Titular", "factor": 1.5, "category": "docente", "type": "categoria"},
        {"code_name": "DOC2", "description": "Profesor Asociado", "factor": 1.3, "category": "docente", "type": "categoria"}
    ]',
    1,
    'INSERT_ONLY',
    @result
);
SELECT @result;
```

### Carga de Códigos de Horas
```sql
CALL sp_LoadPaymentCodes(
    '[
        {"code_name": "HORA1", "description": "Hora Cátedra", "factor": 1.0, "base_amount": 15000, "category": "docente", "type": "hora", "requires_hours": true}
    ]',
    1,
    'UPSERT',
    @result
);
SELECT @result;
```

### Actualización de Factores
```sql
CALL sp_LoadPaymentCodes(
    '[
        {"code_name": "DOC1", "description": "Profesor Titular", "factor": 1.6, "category": "docente", "type": "categoria"}
    ]',
    1,
    'UPDATE_ONLY',
    @result
);
SELECT @result;
```

## Características Técnicas

### Transaccionalidad
- Operación completamente transaccional
- Rollback automático en caso de errores SQL
- Opción de rollback en errores de validación (configurable)

### Rendimiento
- Procesamiento por lotes en una sola transacción
- Validaciones optimizadas con índices
- Tabla temporal para manejo de errores

### Validaciones Específicas
- Códigos únicos con validación de duplicados
- Validaciones de lógica de negocio para coherencia
- Formato de fechas ISO con validación de rangos

### Auditoría
- Registro de usuario que ejecuta la operación
- Timestamps automáticos (created_at, updated_at)
- Soft delete compatible (deleted_at)

## Estado del Desarrollo
- **Estado**: ✅ IMPLEMENTADO
- **Fecha**: 2025-06-16
- **Cargado en BD**: ✅ SÍ
- **Pruebas**: 🔄 EN PROCESO
- **Documentación**: ✅ COMPLETA

El SP `sp_LoadPaymentCodes` está implementado y cargado en la base de datos, listo para pruebas y uso en producción.
