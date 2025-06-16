# Documentación del Stored Procedure: sp_LoadTeachers

## Descripción General
El SP `sp_LoadTeachers` permite la carga masiva de docentes desde datos JSON con validaciones comprehensivas, incluyendo validación de RUT chileno, integridad referencial y manejo de errores.

## Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `p_json_data` | LONGTEXT | Array JSON con datos de docentes |
| `p_user_id` | INT | ID del usuario que ejecuta la carga |
| `p_update_mode` | VARCHAR(20) | Modo de operación: 'INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT' |
| `p_result_json` | LONGTEXT | JSON de respuesta con resultados (OUT) |

## Estructura del JSON de Entrada

```json
[
  {
    "rut": "12345678-5",                    // Requerido: RUT chileno válido
    "name": "Juan Pérez González",          // Requerido: Nombre completo
    "email": "juan.perez@universidad.cl",  // Requerido: Email institucional
    "phone": "+56912345678",                // Opcional: Teléfono
    "address": "Av. Principal 123",         // Opcional: Dirección
    "academic_degree": "Magíster",          // Opcional: Título académico
    "specialization": "Matemáticas",        // Opcional: Especialización
    "university": "Universidad de Chile",   // Opcional: Universidad
    "category_code": "DOC1",                // Opcional: Código categoría docente
    "contract_type_code": "CONT1",          // Opcional: Código tipo contrato
    "hire_date": "2024-03-01",              // Opcional: Fecha contratación
    "contract_hours": 40,                   // Opcional: Horas contractuales
    "salary_base": 1200000.00,              // Opcional: Salario base
    "is_active": true,                      // Opcional: Estado activo
    "can_coordinate": false,                // Opcional: Puede coordinar
    "max_hours_per_week": 44                // Opcional: Horas máx. semanales
  }
]
```

## Modos de Operación

### INSERT_ONLY
- Solo inserta registros nuevos
- Falla si el RUT ya existe
- Ideal para cargas iniciales

### UPDATE_ONLY
- Solo actualiza registros existentes
- Falla si el RUT no existe
- Ideal para actualizaciones masivas

### UPSERT (Default)
- Inserta registros nuevos
- Actualiza registros existentes
- Más flexible para cargas mixtas

## Validaciones Implementadas

### 1. Campos Requeridos
- `rut`: RUT chileno válido
- `name`: Nombre completo (máx. 255 caracteres)
- `email`: Email válido (máx. 255 caracteres)

### 2. Validación de RUT Chileno
- Formato: 7-8 dígitos + dígito verificador
- Algoritmo estándar de validación de RUT chileno
- Normalización automática (sin puntos, con guión)

### 3. Validaciones de Formato
- Email: Formato estándar RFC 5322
- Teléfono: Máximo 20 caracteres
- Nombre: Máximo 255 caracteres

### 4. Validaciones de Rango
- `contract_hours`: 0-44 horas
- `max_hours_per_week`: 0-60 horas
- `salary_base`: ≥ 0

### 5. Integridad Referencial
- `category_code`: Debe existir en `payment_codes` con `category='docente'`
- `contract_type_code`: Debe existir en `payment_codes` con `type='contrato'`

### 6. Unicidad
- RUT único en el sistema
- Email único en el sistema

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
      "field": "rut",
      "type": "FORMAT",
      "message": "RUT chileno inválido",
      "data": {...}
    }
  ]
}
```

## Tipos de Errores

| Tipo | Descripción |
|------|-------------|
| `REQUIRED` | Campo requerido faltante |
| `FORMAT` | Formato inválido (RUT, email, etc.) |
| `RANGE` | Valor fuera del rango permitido |
| `FOREIGN_KEY` | Referencia inexistente |
| `DUPLICATE` | Valor duplicado (RUT, email) |
| `NOT_FOUND` | Registro no encontrado (UPDATE_ONLY) |

## Ejemplos de Uso

### Carga Inicial de Docentes
```sql
CALL sp_LoadTeachers(
    '[
        {"rut": "12345678-5", "name": "María González", "email": "maria@universidad.cl"},
        {"rut": "87654321-6", "name": "Pedro Pérez", "email": "pedro@universidad.cl"}
    ]',
    1,
    'INSERT_ONLY',
    @result
);
SELECT @result;
```

### Actualización Masiva
```sql
CALL sp_LoadTeachers(
    '[
        {"rut": "12345678-5", "name": "María González López", "salary_base": 1500000.00}
    ]',
    1,
    'UPDATE_ONLY',
    @result
);
SELECT @result;
```

### Carga Mixta (Upsert)
```sql
CALL sp_LoadTeachers(
    '[
        {"rut": "12345678-5", "name": "María González", "email": "maria@universidad.cl"},
        {"rut": "11111111-1", "name": "Ana Silva", "email": "ana@universidad.cl"}
    ]',
    1,
    'UPSERT',
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

### Normalización de Datos
- RUT se normaliza automáticamente al formato estándar
- Resolución automática de códigos a IDs

### Auditoría
- Registro de usuario que ejecuta la operación
- Timestamps automáticos (created_at, updated_at)
- Soft delete compatible (deleted_at)

## Pruebas Realizadas

### Casos de Prueba Exitosos ✅
1. Inserción con RUT válido
2. Actualización de registro existente
3. Validación de RUT inválido
4. Validación de campos requeridos faltantes
5. Validación de email duplicado
6. Validación de rangos numéricos
7. Procesamiento de múltiples registros

### Cobertura de Validaciones ✅
- ✅ Validación completa de RUT chileno
- ✅ Validación de formato de email
- ✅ Validación de campos requeridos
- ✅ Validación de rangos numéricos
- ✅ Validación de integridad referencial
- ✅ Validación de unicidad
- ✅ Manejo de errores transaccional

## Estado del Desarrollo
- **Estado**: ✅ COMPLETADO
- **Fecha**: 2025-06-16
- **Pruebas**: ✅ EXITOSAS
- **Documentación**: ✅ COMPLETA

El SP `sp_LoadTeachers` está completamente implementado, probado y documentado, listo para uso en producción.
