# Instrucciones de Instalación - Módulo de Uploads

## ⚠️ IMPORTANTE: Usar --legacy-peer-deps

### Comando de Instalación Requerido
```bash
npm install --legacy-peer-deps
```

### ¿Por qué es necesario --legacy-peer-deps?

#### Conflicto 1: @nestjs/schedule vs @nestjs/common
- **@nestjs/schedule@6.0.0** requiere `@nestjs/common@^10.0.0 || ^11.0.0`
- **Proyecto actual** usa `@nestjs/common@9.4.3`
- **Solución**: `--legacy-peer-deps` permite usar versiones compatibles

#### Conflicto 2: file-type vs Node.js
- **file-type@21.0.0** requiere `Node.js >= 20`
- **Entorno actual** usa `Node.js v18.20.2`
- **Solución**: `--legacy-peer-deps` + funciona correctamente en v18

### Dependencias Críticas Instaladas

#### Para Upload de Archivos
```bash
# Parser de Excel
xlsx@0.18.5
@types/xlsx@0.0.36

# Multer para uploads
multer@1.4.5-lts.1
@types/multer@1.4.7
```

#### Para Funcionalidades Avanzadas
```bash
# Tareas programadas (limpieza automática)
@nestjs/schedule@6.0.0

# Detección de tipos de archivo
file-type@21.0.0
```

### Verificación de Instalación

#### 1. Instalar dependencias
```bash
cd backend
npm install --legacy-peer-deps
```

#### 2. Verificar compilación
```bash
npx tsc --noEmit
```
**Resultado esperado**: Sin errores de TypeScript

#### 3. Verificar estructura de archivos
```bash
ls -la src/uploads/
```
**Resultado esperado**:
```
├── config/
├── dto/
├── interceptors/
├── middleware/
├── services/
├── templates/
├── temp/
├── uploads.controller.ts
├── uploads.module.ts
├── uploads.service.ts
└── README.md
```

### Variables de Entorno Opcionales

```env
# Tamaño máximo de archivo (default: 10MB)
UPLOAD_MAX_SIZE=10485760

# Entorno (test=memoria, otros=disco)
NODE_ENV=development
```

### Problemas Conocidos y Soluciones

#### Error: "Cannot resolve dependency"
```bash
# Solución
npm install --legacy-peer-deps --force
```

#### Error: "Unsupported engine"
```bash
# Warning esperado, ignorar
npm WARN EBADENGINE Unsupported engine {
  package: 'file-type@21.0.0',
  required: { node: '>=20' },
  current: { node: 'v18.20.2', npm: '10.5.0' }
}
```

#### Error en compilación TypeScript
```bash
# Verificar imports de file-type
import { fileTypeFromBuffer } from 'file-type';
# NO usar: import * as fileType from 'file-type';
```

### Estado Post-Instalación

#### ✅ Funcionalidades Disponibles
- Upload de archivos Excel (.xlsx, .xls)
- Validación avanzada de archivos
- Limpieza automática de archivos temporales
- Logging detallado de uploads
- Endpoints de administración
- Procesamiento con Stored Procedures

#### ✅ Servicios Activos
- FileCleanupService (limpieza cada hora)
- FileValidationMiddleware (validación en uploads)
- UploadLoggingInterceptor (logging automático)

#### ✅ Endpoints Disponibles
- POST /uploads/academic-structures
- POST /uploads/teachers
- POST /uploads/payment-codes
- POST /uploads/course-reports
- GET /uploads/admin/stats
- DELETE /uploads/admin/cleanup
- DELETE /uploads/admin/cleanup/:type

---

## 🚀 ¡Instalación Completada!

El módulo de uploads está listo para procesar archivos Excel con validaciones avanzadas, limpieza automática y logging completo.

**Próximo paso**: Crear archivos Excel de prueba usando las plantillas en `src/uploads/templates/`
