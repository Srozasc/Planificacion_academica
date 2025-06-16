# Módulo de Cargas (UploadsModule)

## ⚙️ Instalación y Configuración

### Requisitos Previos
- Node.js v18.20.2+
- NestJS 9.x
- MySQL con Stored Procedures implementados (SubTarea 2.2)

### Instalación de Dependencias
```bash
# ⚠️ IMPORTANTE: Usar --legacy-peer-deps debido a conflictos de versiones
npm install --legacy-peer-deps
```

### Conflictos de Dependencias Resueltos
- `@nestjs/schedule@6.0.0` vs `@nestjs/common@9.4.3`
- `file-type@21.0.0` requiere Node.js >= 20 (funciona con v18 usando --legacy-peer-deps)

### Variables de Entorno
```env
# Tamaño máximo de archivo (opcional, default: 10MB)
UPLOAD_MAX_SIZE=10485760

# Entorno (test usa memoria, otros disco)
NODE_ENV=development
```

## Descripción General

El `UploadsModule` es responsable de manejar la carga masiva de datos desde archivos Excel hacia la base de datos del sistema académico. Utiliza los Stored Procedures implementados en la SubTarea 2.2 para procesar los datos de manera eficiente y segura.

## Arquitectura

```
UploadsModule
├── UploadsController    # Endpoints REST para carga de archivos
├── UploadsService      # Lógica de procesamiento de Excel y llamadas a SPs
├── FileCleanupService  # Limpieza automática de archivos
├── Middleware/         # Validaciones avanzadas
├── Interceptors/       # Logging detallado
└── DTOs
    ├── file-upload.dto.ts    # DTOs para manejo de archivos
    └── bulk-upload-options   # Opciones de carga masiva
```

## Características Principales

### 🔄 **Procesamiento de Archivos Excel**
- Soporte para formatos `.xlsx` y `.xls`
- Parseo automático con detección de encabezados
- Mapeo flexible de columnas (español/inglés)
- Validación de formato y tamaño (máx 10MB)

### 🗄️ **Integración con Stored Procedures**
- Llamadas directas a los 4 SPs implementados:
  - `sp_LoadAcademicStructure`
  - `sp_LoadTeachers` 
  - `sp_LoadPaymentCodes`
  - `sp_LoadCourseReportsData`

### 🔧 **Modos de Operación**
- **INSERT_ONLY**: Solo insertar registros nuevos
- **UPDATE_ONLY**: Solo actualizar registros existentes
- **UPSERT**: Insertar nuevos y actualizar existentes (por defecto)

### 🛡️ **Seguridad y Validación**
- Validación de tipos de archivo
- Límites de tamaño
- Limpieza automática de archivos temporales
- Manejo robusto de errores

## Endpoints Disponibles

### 1. Carga de Estructuras Académicas
```http
POST /uploads/academic-structures
Content-Type: multipart/form-data

Body:
- file: archivo Excel
- mode: INSERT_ONLY | UPDATE_ONLY | UPSERT (opcional)
```

### 2. Carga de Docentes
```http
POST /uploads/teachers
Content-Type: multipart/form-data

Body:
- file: archivo Excel
- mode: INSERT_ONLY | UPDATE_ONLY | UPSERT (opcional)
```

### 3. Carga de Códigos de Pago
```http
POST /uploads/payment-codes
Content-Type: multipart/form-data

Body:
- file: archivo Excel
- mode: INSERT_ONLY | UPDATE_ONLY | UPSERT (opcional)
```

### 4. Carga de Reportes de Cursables
```http
POST /uploads/course-reports
Content-Type: multipart/form-data

Body:
- file: archivo Excel
- mode: INSERT_ONLY | UPDATE_ONLY | UPSERT (opcional)
```

## Estructura de Respuesta

```typescript
{
  success: boolean,
  message: string,
  totalRecords: number,
  processedRecords: number,
  insertedCount?: number,
  updatedCount?: number,
  errorCount?: number,
  errors?: any[],
  executionTimeMs?: number,
  filename?: string,
  uploadedAt: Date
}
```

## Mapeo de Columnas

El servicio mapea automáticamente columnas en español e inglés:

### Estructuras Académicas
- `codigo/code` → code
- `nombre/name` → name
- `tipo/type` → type
- `creditos/credits` → credits
- `codigo_plan/plan_code` → plan_code
- etc.

### Docentes
- `rut` → rut
- `nombre/name` → name
- `email/correo` → email
- `telefono/phone` → phone
- etc.

### Códigos de Pago
- `codigo/code` → code
- `nombre/name` → name
- `categoria/category` → category
- `valor_hora/hourly_rate` → hourly_rate
- etc.

### Reportes de Cursables
- `id_estructura/academic_structure_id` → academic_structure_id
- `periodo/term` → term
- `ano/year` → year
- `estudiantes_cursables/student_count` → student_count
- etc.

## Flujo de Procesamiento

1. **Recepción del archivo**: Validación de formato y tamaño
2. **Parseo de Excel**: Conversión a JSON con mapeo de columnas
3. **Llamada al SP**: Invocación del Stored Procedure correspondiente
4. **Procesamiento**: El SP maneja validaciones y operaciones de BD
5. **Respuesta**: Retorno de estadísticas y errores (si los hay)
6. **Limpieza**: Eliminación del archivo temporal

## Configuración

### Dependencias Requeridas
```json
{
  "xlsx": "^0.18.x",
  "@types/xlsx": "^0.0.x",
  "multer": "^1.4.x",
  "@types/multer": "^1.4.x"
}
```

### Configuración de Multer
- **Destino**: `./src/uploads/temp`
- **Nomenclatura**: `{fieldname}-{timestamp}-{random}.{ext}`
- **Filtros**: Solo archivos Excel
- **Límite**: 10MB máximo

## Manejo de Errores

### Errores de Archivo
- Formato no soportado
- Tamaño excedido
- Archivo corrupto
- Sin datos

### Errores de Procesamiento
- Columnas requeridas faltantes
- Datos inválidos
- Errores de validación del SP
- Errores de base de datos

### Respuesta de Error
```typescript
{
  success: false,
  message: "Descripción del error",
  errors: [...], // Detalles específicos
  filename: "archivo.xlsx",
  uploadedAt: "2025-06-16T..."
}
```

## Ejemplos de Uso

### Con cURL
```bash
curl -X POST \
  http://localhost:3000/uploads/academic-structures \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@estructuras.xlsx' \
  -F 'mode=UPSERT'
```

### Con JavaScript/Frontend
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('mode', 'UPSERT');

const response = await fetch('/uploads/academic-structures', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## Consideraciones de Performance

- **Archivos grandes**: Se recomienda procesar en lotes de máximo 1000 registros
- **Memoria**: Los archivos se procesan en memoria temporalmente
- **Transacciones**: Los SPs manejan transacciones para garantizar consistencia
- **Limpieza**: Archivos temporales se eliminan automáticamente

## Logging y Monitoreo

- Logs de carga de archivos
- Métricas de procesamiento
- Errores de validación
- Estadísticas de uso

## Pruebas

Para probar el módulo:

1. Usar las plantillas de Excel en `src/uploads/templates/`
2. Enviar archivos a los endpoints correspondientes
3. Verificar respuestas y datos en la base de datos
4. Validar limpieza de archivos temporales

## Próximas Mejoras

- [ ] Carga asíncrona para archivos muy grandes
- [ ] Preview de datos antes de procesar
- [ ] Reportes de progreso en tiempo real
- [ ] Soporte para más formatos (CSV, JSON)
- [ ] Validación previa sin procesar
