# Scripts de Gestión de Permisos

Este directorio contiene los scripts para gestionar la carga y procesamiento de permisos de usuarios en el sistema de planificación académica.

## Archivos

- `load_users.js` - Carga usuarios desde archivo Excel/CSV
- `load_plans.js` - Sincroniza carreras y asignaturas desde archivo Excel/CSV
- `resolve_permissions.js` - Procesa permisos pendientes y crea usuarios/permisos reales
- `package.json` - Dependencias del proyecto

## Instalación

```bash
cd scripts/permissions
npm install
```

## Variables de Entorno

Configura las siguientes variables de entorno o modifica los valores por defecto en los scripts:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=planificacion_academica
```

## Uso

### 1. Cargar Planes de Estudio (Carreras y Asignaturas)

```bash
# Primero cargar estructura académica desde el módulo de carga del sistema
# Luego sincronizar planes desde staging
node load_plans.js
```

**Fuente de datos:**
- Lee desde la tabla `staging_estructura_academica`
- Esta tabla se carga previamente desde el módulo de carga de archivos del sistema
- Campos utilizados: `plan`, `carrera`, `sigla`, `asignatura`, `creditos`, `categoria`

### 2. Cargar Usuarios

```bash
node load_users.js ruta/al/archivo_usuarios.xlsx
```

**Formato esperado del archivo:**
- Hoja: "Usuarios" o primera hoja
- Columnas: `usuario_mail`, `usuario_nombre`, `cargo`, `permiso_carrera_codigo`, `tipo_rol`, `permiso_categoria`, `fecha_expiracion`

### 3. Procesar Permisos (Automático)

El script `resolve_permissions.js` se ejecuta automáticamente después de cada carga de usuarios o planes. También puede ejecutarse manualmente:

```bash
node resolve_permissions.js
```

## Flujo de Procesamiento

1. **Carga de Estructura Académica**: Los archivos de planes se cargan en `staging_estructura_academica` desde el módulo de carga del sistema
2. **Sincronización de Planes**: `load_plans.js` lee desde `staging_estructura_academica` y sincroniza carreras y asignaturas
3. **Preparar Archivos de Entrada**: 
   - Cargar estructura académica desde el módulo de carga del sistema
   - Preparar archivo de usuarios usando el ejemplo en `/ejemplos/formato_usuarios.csv`
4. **Carga de Usuarios**: Inserta datos en tabla temporal `permisos_pendientes`
5. **Resolución de Permisos**: Procesa registros pendientes y crea:
   - Usuarios en tabla `users`
   - Permisos por carrera en `usuario_permisos_carrera`
   - Permisos por categoría en `usuario_permisos_categoria`

## Características

- **Tolerancia a fallos**: Los errores se registran sin detener el procesamiento
- **Reintentabilidad**: Los registros con error pueden reprocesarse
- **Bloqueo de concurrencia**: Evita ejecuciones simultáneas
- **Caches optimizados**: Mejora el rendimiento en lotes grandes
- **Estadísticas detalladas**: Reportes de procesamiento

## Logs y Monitoreo

Los scripts generan logs detallados en consola con:
- ✅ Operaciones exitosas
- ⚠️ Advertencias
- ❌ Errores
- 📊 Estadísticas de procesamiento

## Solución de Problemas

### Error de conexión a base de datos
- Verificar variables de entorno
- Confirmar que el servidor MySQL esté ejecutándose
- Validar permisos de usuario de base de datos

### Archivos no encontrados
- Verificar ruta del archivo
- Confirmar formato Excel (.xlsx) o CSV

### Errores de formato
- Revisar nombres de columnas (case-sensitive)
- Verificar que no haya filas vacías al inicio
- Confirmar codificación UTF-8 para caracteres especiales

### Lock de proceso
Si el proceso se queda bloqueado, eliminar manualmente:
```bash
rm resolve_permissions.lock
```

## Estructura de Datos

### Tabla permisos_pendientes
```sql
CREATE TABLE permisos_pendientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_mail VARCHAR(255) NOT NULL,
    usuario_nombre VARCHAR(255),
    cargo VARCHAR(255),
    permiso_carrera_codigo VARCHAR(50),
    tipo_rol VARCHAR(50),
    permiso_categoria VARCHAR(50),
    fecha_expiracion DATE,
    estado ENUM('PENDIENTE', 'PROCESADO', 'ERROR') DEFAULT 'PENDIENTE',
    mensaje_error TEXT,
    intentos_procesamiento INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP NULL
);
```

### Roles del Sistema
- **Editor** (ID: 2): Acceso completo de edición
- **Editor temporal** (ID: 2): Acceso temporal con fecha de expiración
- **Maestro** (ID: 3): Acceso de maestro
- **Visualizador** (ID: 4): Solo lectura (por defecto)

## Mantenimiento

### Limpiar registros procesados
```sql
DELETE FROM permisos_pendientes 
WHERE estado = 'PROCESADO' 
AND fecha_procesado < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Reintentar registros con error
```sql
UPDATE permisos_pendientes 
SET estado = 'PENDIENTE', mensaje_error = NULL 
WHERE estado = 'ERROR' AND intentos_procesamiento < 3;
```