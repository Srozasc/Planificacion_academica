# Stored Procedure: sp_LoadAcademicStructure

## 📋 Descripción
Stored Procedure para carga masiva de datos de Estructura Académica desde archivos Excel/JSON. Incluye validaciones completas, manejo de errores y soporte para inserción y actualización de registros.

## ✅ Estado: IMPLEMENTADO Y VERIFICADO

### 🧪 Pruebas Realizadas
- ✅ **Inserción de registros nuevos**: Funcionando correctamente
- ✅ **Actualización de registros existentes**: Funcionando correctamente  
- ✅ **Validaciones de campos requeridos**: Funcionando correctamente
- ✅ **Validaciones de rangos y tipos**: Funcionando correctamente
- ✅ **Manejo de errores detallado**: JSON con errores específicos por campo
- ✅ **Estadísticas de procesamiento**: Contadores de éxito/error/inserción/actualización

## 📖 Parámetros

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `p_json_data` | LONGTEXT | Array JSON con datos de estructura académica |
| `p_user_id` | INT | ID del usuario que ejecuta la carga |
| `p_update_mode` | VARCHAR(20) | Modo: 'INSERT_ONLY', 'UPDATE_ONLY', 'UPSERT' |
| `p_result_json` | LONGTEXT (OUT) | JSON de respuesta con resultados |

## 📝 Estructura del JSON de Entrada

```json
[
  {
    "code": "MAT101",                    // Requerido: Código único (2-20 chars)
    "name": "Matemáticas I",             // Requerido: Nombre (max 255 chars)
    "credits": 4,                        // Opcional: Créditos (0-20)
    "plan_code": "ING2024",              // Opcional: Código del plan padre
    "type": "subject",                   // Requerido: subject/plan/module
    "semester": 1,                       // Opcional: Semestre (1-10)
    "prerequisites": "MAT100,ALG101",    // Opcional: Códigos separados por coma
    "description": "Curso básico...",    // Opcional: Descripción
    "hours_per_week": 6,                 // Opcional: Horas semanales (0-50)
    "is_active": true                    // Opcional: Estado activo (default: true)
  }
]
```

## 📊 Estructura del JSON de Respuesta

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
    "success_count": 2,
    "error_count": 1,
    "insert_count": 1,
    "update_count": 1,
    "skip_count": 0
  },
  "errors": [
    {
      "row": 0,
      "field": "code",
      "type": "REQUIRED",
      "message": "El código es requerido",
      "data": { /* registro completo con error */ }
    }
  ]
}
```

## 🔍 Validaciones Implementadas

### Campos Requeridos
- ✅ `code`: Código único de la asignatura/plan
- ✅ `name`: Nombre de la asignatura/plan  
- ✅ `type`: Tipo (subject/plan/module)

### Validaciones de Formato
- ✅ `code`: Entre 2 y 20 caracteres
- ✅ `name`: Máximo 255 caracteres
- ✅ `type`: Debe ser 'subject', 'plan' o 'module'

### Validaciones de Rango
- ✅ `credits`: Entre 0 y 20
- ✅ `semester`: Entre 1 y 10
- ✅ `hours_per_week`: Entre 0 y 50

### Validaciones de Integridad
- ✅ `plan_code`: Debe existir como plan activo en la tabla
- ✅ `code`: Validación de duplicados según modo de operación

### Validaciones de Modo
- ✅ **INSERT_ONLY**: Solo inserta registros nuevos, falla si existe
- ✅ **UPDATE_ONLY**: Solo actualiza registros existentes, falla si no existe
- ✅ **UPSERT**: Inserta nuevos y actualiza existentes (default)

## 💻 Ejemplos de Uso

### Ejemplo 1: Inserción Básica
```sql
CALL sp_LoadAcademicStructure(
    '[
        {
            "code": "MAT101",
            "name": "Matemáticas I",
            "credits": 4,
            "type": "subject",
            "semester": 1
        }
    ]', 
    1, 
    'UPSERT', 
    @result
);
SELECT @result;
```

### Ejemplo 2: Carga con Validación de Prerequisitos
```sql
CALL sp_LoadAcademicStructure(
    '[
        {
            "code": "MAT201",
            "name": "Matemáticas II",
            "credits": 4,
            "type": "subject",
            "semester": 2,
            "prerequisites": "MAT101",
            "plan_code": "ING2024"
        }
    ]', 
    1, 
    'UPSERT', 
    @result
);
SELECT @result;
```

### Ejemplo 3: Modo Solo Inserción
```sql
CALL sp_LoadAcademicStructure(
    '[{"code": "NEW123", "name": "Nueva Materia", "type": "subject"}]', 
    1, 
    'INSERT_ONLY', 
    @result
);
SELECT @result;
```

## 🔧 Características Técnicas

### Transaccional
- ✅ **START TRANSACTION**: Inicio de transacción
- ✅ **ROLLBACK**: En caso de error SQL crítico
- ✅ **COMMIT**: Solo si todo es exitoso sin errores

### Manejo de Errores
- ✅ **Error Handler SQL**: Captura errores MySQL automáticamente
- ✅ **Tabla temporal**: Para almacenar errores de validación
- ✅ **Reporte detallado**: Errores por fila, campo y tipo

### Resolución de Referencias
- ✅ **plan_code → plan_id**: Resolución automática de códigos a IDs
- ✅ **Validación FK**: Verifica que el plan padre exista
- ✅ **Soft delete**: Ignora registros marcados como eliminados

### Optimizaciones
- ✅ **Validación previa**: Todas las validaciones antes de inserción
- ✅ **Bulk processing**: Procesa múltiples registros en una llamada
- ✅ **Índices optimizados**: Utiliza índices existentes para consultas

## 📚 Casos de Uso

### 1. Carga Inicial de Plan de Estudios
Útil para cargar la estructura completa de un plan de estudios desde Excel.

### 2. Actualización Masiva de Créditos
Permite actualizar créditos de múltiples asignaturas simultáneamente.

### 3. Migración de Datos
Facilita la migración desde sistemas legacy manteniendo integridad.

### 4. Validación de Datos
Proporciona validación robusta antes de confirmar cambios en la BD.

## ⚠️ Consideraciones

### Rendimiento
- **Límite recomendado**: 1000 registros por llamada
- **Memoria**: JSON puede consumir memoria significativa
- **Índices**: Asegurar índices en campos de búsqueda

### Seguridad
- **Validación de usuario**: Verifica que p_user_id exista
- **Sanitización**: JSON_EXTRACT previene inyección SQL
- **Permisos**: Requiere permisos de INSERT/UPDATE en la tabla

### Logging
- **Auditoría**: Cada cambio registra timestamp automáticamente
- **Trazabilidad**: Los errores incluyen datos originales
- **Monitoreo**: Estadísticas permiten monitorear performance

## 🚀 Estado de Implementación

### ✅ Completado
- [x] Estructura del stored procedure
- [x] Validaciones completas  
- [x] Manejo de errores robusto
- [x] Pruebas de inserción y actualización
- [x] Validaciones de negocio
- [x] Documentación completa

### 📋 Próximos Pasos
- [ ] Integración con API NestJS
- [ ] Interface de carga desde Excel en frontend
- [ ] Logs de auditoría avanzados
- [ ] Métricas de performance
