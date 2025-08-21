# Integración Automática de Scripts de Permisos

## Resumen

Se ha implementado la ejecución automática de los scripts de permisos después de importar usuarios desde la interfaz web. Ahora, cuando un usuario importa un archivo Excel de usuarios desde la página de gestión de usuarios, el sistema automáticamente:

1. **Carga usuarios** en la tabla `users` (funcionalidad existente)
2. **Ejecuta automáticamente** los scripts de permisos en segundo plano
3. **Procesa permisos** por carrera y categoría
4. **Puebla las tablas** `usuario_permisos_carrera` y `usuario_permisos_categoria`

## Flujo Completo

```
Usuario importa Excel → Backend procesa → Tabla users poblada → 
Scripts automáticos → permisos_pendientes → resolve_permissions.js → 
Tablas de permisos pobladas
```

## Archivos Modificados

### Backend
- **`backend/src/users/users.service.ts`**: Agregada funcionalidad de ejecución automática de scripts
  - Método `saveTemporaryFile()`: Guarda archivo temporal para procesamiento
  - Método `executePermissionScripts()`: Ejecuta scripts de permisos de forma asíncrona
  - Modificado `importUsers()`: Ejecuta scripts después de importación exitosa

### Scripts de Permisos
- **`scripts/permissions/load_users.js`**: Agregada carga de variables de entorno
- **`scripts/permissions/load_plans.js`**: Agregada carga de variables de entorno
- **`scripts/permissions/resolve_permissions.js`**: Agregada carga de variables de entorno
- **`scripts/permissions/package.json`**: Agregada dependencia `dotenv`

### Archivos de Prueba
- **`test-permissions-integration.js`**: Script para crear archivo de prueba
- **`INTEGRACION_PERMISOS_AUTOMATICA.md`**: Esta documentación

## Configuración Requerida

### 1. Instalar Dependencias en Scripts

```bash
cd scripts/permissions
npm install
```

### 2. Verificar Variables de Entorno

Asegúrate de que el archivo `backend/.env` contenga:

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=planificacion_academica
```

### 3. Verificar Estructura de Base de Datos

Asegúrate de que existan las siguientes tablas:
- `users`
- `permisos_pendientes`
- `usuario_permisos_carrera`
- `usuario_permisos_categoria`
- `carreras`
- `asignaturas`
- `staging_estructura_academica`

## Cómo Usar

### Desde la Interfaz Web

1. **Accede** a la página de gestión de usuarios
2. **Haz clic** en "Importar usuarios"
3. **Selecciona** un archivo Excel con la estructura correcta
4. **Confirma** la importación
5. **Observa** el mensaje que indica que los permisos se están procesando en segundo plano

### Estructura del Archivo Excel

El archivo debe contener las siguientes columnas:

| Columna | Descripción | Requerido |
|---------|-------------|----------|
| Usuario | Nombre de usuario | Opcional |
| Mail | Email institucional | **Sí** |
| Nombre | Nombre completo | **Sí** |
| Tipo de Rol | Rol del usuario (Editor, Maestro, Visualizador) | **Sí** |
| Cargo | Cargo del usuario | Opcional |
| Carrera | Código de carrera | Opcional |
| Categoria | Categoría del usuario | Opcional |
| Expiracion | Fecha de expiración (DD-MM-YYYY) | Opcional |

## Pruebas

### Crear Archivo de Prueba

```bash
node test-permissions-integration.js
```

Esto creará un archivo `test_users_permissions_integration.xlsx` con datos de prueba.

### Verificar Funcionamiento

1. **Importa** el archivo de prueba desde la interfaz web
2. **Revisa los logs** del backend para ver la ejecución de scripts
3. **Ejecuta consultas SQL** para verificar que se poblaron las tablas:

```sql
-- Verificar registros procesados
SELECT COUNT(*) FROM permisos_pendientes WHERE estado = 'PROCESADO';

-- Verificar permisos por carrera
SELECT COUNT(*) FROM usuario_permisos_carrera;

-- Verificar permisos por categoría
SELECT COUNT(*) FROM usuario_permisos_categoria;

-- Ver detalle de permisos creados
SELECT u.name, u.email_institucional, c.nombre_carrera, upc.puede_ver, upc.puede_editar
FROM usuario_permisos_carrera upc
JOIN users u ON upc.user_id = u.id
JOIN carreras c ON upc.carrera_id = c.id;
```

## Logs y Debugging

### Logs del Backend

El backend mostrará logs como:

```
🚀 Ejecutando scripts de permisos...
📁 Archivo temporal: /path/to/temp/users_import_1234567890.xlsx
📂 Directorio de scripts: /path/to/scripts/permissions
📊 Scripts de permisos: [output del script]
✅ Scripts de permisos ejecutados exitosamente
🗑️ Archivo temporal eliminado
```

### En Caso de Errores

Si hay errores, revisa:

1. **Logs del backend** para errores de ejecución
2. **Variables de entorno** en `backend/.env`
3. **Dependencias** en `scripts/permissions/node_modules`
4. **Permisos de archivos** en el directorio temporal
5. **Conexión a base de datos** desde los scripts

## Beneficios

- ✅ **Experiencia de usuario mejorada**: Un solo paso desde la interfaz web
- ✅ **Sistema completo**: Usuarios + permisos académicos automáticos
- ✅ **Compatibilidad**: Mantiene funcionalidad actual del backend
- ✅ **Consistencia**: Usa el sistema de scripts ya probado
- ✅ **Asíncrono**: No bloquea la respuesta al usuario
- ✅ **Limpieza automática**: Elimina archivos temporales
- ✅ **Logging completo**: Trazabilidad de la ejecución

## Troubleshooting

### Problema: Scripts no se ejecutan

**Solución:**
1. Verificar que `scripts/permissions/load_users.js` existe
2. Verificar permisos de ejecución
3. Revisar logs del backend

### Problema: Error de conexión a base de datos

**Solución:**
1. Verificar archivo `backend/.env`
2. Verificar que la base de datos esté ejecutándose
3. Probar conexión manualmente con los scripts

### Problema: Tablas de permisos vacías

**Solución:**
1. Verificar que `load_plans.js` se haya ejecutado previamente
2. Verificar que existan carreras en la tabla `carreras`
3. Revisar logs de `resolve_permissions.js`

## Próximos Pasos

1. **Monitoreo**: Implementar métricas de ejecución de scripts
2. **Notificaciones**: Notificar al usuario cuando el procesamiento termine
3. **Dashboard**: Mostrar estado de procesamiento en tiempo real
4. **Optimización**: Mejorar rendimiento para archivos grandes