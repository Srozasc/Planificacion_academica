# Configuración Avanzada de Multer - Módulo de Uploads

## Instalación y Configuración

### Dependencias Requeridas
El módulo requiere las siguientes dependencias que han sido instaladas:

```bash
# Instalación con --legacy-peer-deps debido a conflictos de versiones
npm install --legacy-peer-deps

# Dependencias específicas instaladas:
# - xlsx: Parser de archivos Excel
# - @types/xlsx: Tipos TypeScript para xlsx
# - multer: Middleware de upload de archivos
# - @types/multer: Tipos TypeScript para multer
# - @nestjs/schedule: Módulo de tareas programadas para limpieza
# - file-type: Detección de tipos de archivo por magic numbers
```

### ⚠️ Nota Importante sobre Instalación
**REQUERIDO**: Usar `npm install --legacy-peer-deps` debido a conflictos de peer dependencies:
- `@nestjs/schedule@6.0.0` requiere `@nestjs/common@^10.0.0 || ^11.0.0`
- El proyecto usa `@nestjs/common@9.4.3`
- `file-type@21.0.0` requiere Node.js >= 20 (actual: v18.20.2)

### Configuración Inicial
1. **Variables de entorno**: Configurar `UPLOAD_MAX_SIZE` si se desea cambiar el límite de 10MB
2. **Directorios**: Se crean automáticamente al inicializar el módulo
3. **Base de datos**: Los Stored Procedures deben estar implementados (SubTarea 2.2)

## Resumen
El módulo de uploads ha sido actualizado con una configuración avanzada de Multer que incluye validaciones estrictas, manejo de archivos por tipo, limpieza automática y logging completo.

## Características Implementadas

### 1. Configuración Asíncrona de Multer
- **Archivo**: `src/uploads/uploads.module.ts`
- **Características**:
  - Configuración dinámica basada en variables de entorno
  - Soporte para almacenamiento en memoria (para tests) y en disco
  - Creación automática de directorios por tipo de upload
  - Validación estricta de tipos MIME y extensiones

### 2. Estructura de Directorios Organizada
```
src/uploads/
├── temp/                    # Archivos temporales por tipo
│   ├── academic-structures/ 
│   ├── teachers/
│   ├── payment-codes/
│   └── course-reports/
├── processed/              # Archivos procesados exitosamente
├── failed/                 # Archivos con errores de procesamiento
└── templates/              # Plantillas de ejemplo
```

### 3. Validaciones Implementadas

#### Tipos de Archivo Permitidos
- **MIME Types**: 
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
  - `application/vnd.ms-excel` (.xls)
  - `application/octet-stream` (fallback para navegadores)

#### Extensiones Válidas
- `.xlsx`
- `.xls`

#### Límites de Archivo
- **Tamaño máximo**: 10MB (configurable via `UPLOAD_MAX_SIZE`)
- **Archivos por request**: 1
- **Campos adicionales**: máximo 10
- **Tamaño de nombres de campo**: máximo 100 caracteres

### 4. Servicios Auxiliares

#### FileCleanupService
- **Archivo**: `src/uploads/services/file-cleanup.service.ts`
- **Funcionalidades**:
  - Limpieza automática programada (cada hora)
  - Limpieza manual por tipo de archivo
  - Estadísticas de archivos por directorio
  - Configuración flexible de tiempos de retención

#### FileValidationMiddleware
- **Archivo**: `src/uploads/middleware/file-validation.middleware.ts`
- **Validaciones**:
  - Verificación de magic numbers usando `file-type`
  - Validación del contenido real del archivo
  - Verificación específica por tipo de upload

#### UploadLoggingInterceptor
- **Archivo**: `src/uploads/interceptors/upload-logging.interceptor.ts`
- **Características**:
  - Logging detallado de todos los uploads
  - Métricas de tiempo de procesamiento
  - Información de archivos y usuarios
  - Logging configurable via `UploadConfig`

### 5. Configuración Centralizada
- **Archivo**: `src/uploads/config/upload.config.ts`
- **Características**:
  - Configuración unificada de directorios
  - Límites y restricciones configurables
  - Opciones de logging
  - Validadores reutilizables

### 6. Endpoints de Administración

#### Estadísticas de Archivos
```http
GET /uploads/admin/stats
```
Retorna estadísticas detalladas de todos los directorios de upload.

#### Limpieza Manual
```http
DELETE /uploads/admin/cleanup
```
Ejecuta limpieza manual de todos los tipos de archivos.

#### Limpieza por Tipo
```http
DELETE /uploads/admin/cleanup/:type
```
Ejecuta limpieza de un tipo específico (`temp`, `processed`, `failed`).

## Variables de Entorno Soportadas

```env
# Configuración de uploads
UPLOAD_MAX_SIZE=10485760  # 10MB en bytes
NODE_ENV=development      # test usa memoria, otros usan disco

# Configuración de base de datos (heredada)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=planificacion_academica
```

## Integración en la Aplicación

### UploadsModule
- Integrado en `AppModule`
- Importa `ScheduleModule` para tareas programadas
- Configura middleware de validación para rutas `/uploads/*`
- Exporta servicios para uso en otros módulos

### Middleware Global
- `FileValidationMiddleware` se aplica automáticamente a rutas POST/PUT de `/uploads/*`
- Validación transparente sin afectar la lógica de controladores

### Interceptores
- `UploadLoggingInterceptor` se aplica a nivel de controlador
- Logging automático de todos los uploads sin configuración adicional

## Seguridad

### Validaciones Implementadas
1. **Tipo MIME**: Verificación del Content-Type enviado por el cliente
2. **Extensión**: Validación de la extensión del archivo
3. **Magic Numbers**: Verificación del contenido real del archivo
4. **Tamaño**: Límites estrictos de tamaño por archivo
5. **Sanitización**: Nombres de archivo sanitizados automáticamente

### Medidas de Seguridad
- No preservar rutas del cliente (`preservePath: false`)
- Nombres de archivo únicos con timestamp y hash
- Validación del contenido usando bibliotecas especializadas
- Límites estrictos en todos los aspectos del upload

## Próximos Pasos

### SubTarea 2.3.3: Integración Frontend
- Crear componentes React para upload de archivos
- Integrar validaciones del lado cliente
- Mostrar progreso y resultados de procesamiento

### Mejoras Futuras
- Soporte para múltiples archivos simultáneos
- Validación de contenido Excel más específica
- Cache de archivos procesados
- Compresión automática de archivos grandes
- Integración con sistemas de almacenamiento en la nube

## Estado Actual: ✅ COMPLETADO
La SubTarea 2.3.2 está completamente implementada y funcional. Todos los componentes están integrados y el sistema está listo para recibir y procesar archivos Excel con validaciones avanzadas y limpieza automática.
