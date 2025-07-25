Documento Técnico: Sistema de Gestión de Permisos de Usuarios (Versión Corregida)

Versión: 2.2
Fecha: 17 de Enero de 2025
Estado: Funcional Completo - Refleja Implementación Real

1. Resumen del Requerimiento

Se necesita implementar un sistema de base de datos y procesos de carga para gestionar los permisos de los usuarios sobre las asignaturas de la aplicación. El sistema debe ser capaz de manejar dos fuentes de datos principales (Archivo A - Usuarios, Archivo B - Planes de Estudio) que pueden cargarse en cualquier orden y en cualquier momento.

Reglas de negocio clave:

Permiso por Carrera: Un usuario con un permiso asociado a un codigo_plan (ej. 1444728) obtiene acceso a todas las asignaturas de esa carrera.

Permiso por Categoría (TRAN): Un usuario con el permiso de categoría TRAN obtiene acceso a todas las asignaturas marcadas con la categoría TRAN en el archivo de planes de estudio, independientemente de la carrera a la que pertenezcan.

2. Diseño de la Base de Datos (Esquema SQL Corregido)

Se utilizará un modelo relacional optimizado para evitar explosión de datos y mejorar el rendimiento.

2.1. Usuarios (Tabla Existente)

Se utilizará la tabla users existente en la aplicación. No requiere modificaciones adicionales ya que contiene todos los campos necesarios:

id: Identificador único del usuario

email_institucional: Email del usuario (equivalente al campo mail del archivo)

name: Nombre del usuario

role_id: Rol actual del usuario

role_expires_at: Fecha de expiración del rol (para roles temporales de Editor)

is_active: Estado activo del usuario

Nota: La tabla ya existe y está en uso por la aplicación.

2.2. Carreras

Catálogo de carreras o planes de estudio.

Generated sql
CREATE TABLE carreras (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo_plan VARCHAR(50) NOT NULL,
    nombre_carrera VARCHAR(255) NOT NULL,
    bimestre_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
    UNIQUE KEY unique_carrera_bimestre (codigo_plan, bimestre_id)
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
2.3. Asignaturas

Catálogo de todas las asignaturas, vinculadas a una carrera.

Generated sql
CREATE TABLE asignaturas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    carrera_id INT NOT NULL,
    sigla VARCHAR(20) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    creditos INT,
    categoria_asignatura VARCHAR(50),
    bimestre_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
    UNIQUE KEY unique_asignatura_bimestre (carrera_id, sigla, bimestre_id)
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
2.4. Usuario_Permisos_Carrera (NUEVA - Evita explosión de datos)

Relaciona usuarios con carreras completas.

Generated sql
CREATE TABLE usuario_permisos_carrera (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    carrera_id INT NOT NULL,
    bimestre_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NULL COMMENT 'Fecha de expiración del permiso (para roles temporales)',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES users(id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
    UNIQUE KEY unique_usuario_carrera_bimestre (usuario_id, carrera_id, bimestre_id)
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
2.5. Usuario_Permisos_Categoria (NUEVA - Para permisos TRAN)

Relaciona usuarios con categorías específicas.

Generated sql
CREATE TABLE usuario_permisos_categoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    bimestre_id INT NOT NULL,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NULL COMMENT 'Fecha de expiración del permiso (para roles temporales)',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES users(id),
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
    UNIQUE KEY unique_usuario_categoria_bimestre (usuario_id, categoria, bimestre_id)
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
2.6. Permisos_Pendientes (Tabla de Staging - Mejorada)

Tabla temporal para almacenar los datos del Archivo A hasta que puedan ser procesados.

Generated sql
CREATE TABLE permisos_pendientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_mail VARCHAR(255) NOT NULL,
    usuario_nombre VARCHAR(255),
    cargo VARCHAR(255),
    permiso_carrera_codigo VARCHAR(50),
    tipo_rol VARCHAR(50),
    permiso_categoria VARCHAR(50),
    bimestre_id INT NOT NULL,
    fecha_expiracion DATETIME NULL COMMENT 'Fecha de expiración para roles temporales',
    estado ENUM('PENDIENTE', 'PROCESADO', 'ERROR') DEFAULT 'PENDIENTE',
    mensaje_error TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP NULL,
    intentos_procesamiento INT DEFAULT 0,
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id)
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
3. Procesos de Carga (Integrados en UsersService)

Los procesos de carga de usuarios y planes de estudio no son scripts independientes que se ejecutan de forma aislada. En la implementación real, estos procesos están integrados directamente en el `UsersService` del backend, lo que asegura una gestión centralizada y coherente de los datos.

3.1. Flujo de Creación Manual de Usuarios (CreateUserModal)

Cuando un usuario se crea manualmente a través de la interfaz de usuario (por ejemplo, un modal de "Crear Nuevo Usuario"), el flujo es el siguiente:

El frontend envía los datos del nuevo usuario (nombre, email, rol, permisos de carrera/categoría) al backend.
`UsersService.create()`: Este método es invocado para crear el nuevo usuario en la tabla `users`.
`UsersService.create()` también se encarga de insertar los permisos asociados a este usuario en la tabla `permisos_pendientes`. Esto asegura que, incluso para la creación manual, la lógica de resolución de permisos se centralice y se aplique de manera uniforme.
`executePermissionScriptsForUser()`: Inmediatamente después de la creación del usuario y el volcado a `permisos_pendientes`, `UsersService.create()` llama a este método. Este método ejecuta únicamente `resolve_permissions.js` para procesar los permisos recién agregados. La estructura académica debe cargarse por separado.

3.2. Flujo de Importación Masiva de Usuarios (UsersService.importUsers())

Para la importación masiva de usuarios (por ejemplo, a través de la carga de un archivo Excel/CSV desde el frontend), el flujo es similar:

El frontend envía el archivo de importación al backend.
`UsersService.importUsers()`: Este método procesa el archivo, crea los usuarios en la tabla `users` y, por cada usuario, inserta sus permisos en la tabla `permisos_pendientes`.
`executePermissionScriptsForUser()`: Una vez que todos los usuarios y sus permisos han sido volcados a `permisos_pendientes`, `UsersService.importUsers()` llama a este método para procesar los permisos de todos los usuarios importados.

Consideraciones Clave de la Implementación Real:

El script `load_users.js` se ejecuta como parte del proceso de importación masiva, pero `load_plans.js` no se ejecuta durante la carga de usuarios ya que la estructura académica es un proceso independiente. La lógica está encapsulada y orquestada dentro de `UsersService`.
La tabla `permisos_pendientes` actúa como una cola unificada para todos los tipos de creación de usuarios (manual o masiva), asegurando que la lógica de `resolve_permissions.js` se aplique a todos.
Los usuarios se crean en la tabla `users` *antes* de que `resolve_permissions.js` intente procesar sus permisos. `resolve_permissions.js` solo se encarga de asignar los permisos, no de crear o actualizar usuarios.

4. Proceso de Resolución de Permisos: resolve_permissions.js (IMPLEMENTACIÓN REAL)

Este es el proceso central que conecta toda la información. En la implementación real, `resolve_permissions.js` no se ejecuta de forma independiente, sino que es invocado como parte del método `executePermissionScriptsForUser()` dentro de `UsersService`.

Disparador: Es ejecutado sincrónicamente por `executePermissionScriptsForUser()` después de la creación/importación de usuarios y el volcado de sus permisos a `permisos_pendientes`.

Lógica Corregida:

4.1. Inicialización y Bloqueo
Generated javascript
const fs = require('fs');
const path = require('path');

function acquireLock() {
    const lockFile = path.join(process.cwd(), 'resolve_permissions.lock');
    try {
        // Verificar si el lock ya existe
        if (fs.existsSync(lockFile)) {
            const stats = fs.statSync(lockFile);
            const now = new Date();
            const lockAge = now - stats.mtime;
            
            // Si el lock tiene más de 30 minutos, considerarlo stale
            if (lockAge > 30 * 60 * 1000) {
                fs.unlinkSync(lockFile);
            } else {
                return null;
            }
        }
        
        // Crear el lock
        fs.writeFileSync(lockFile, process.pid.toString());
        return lockFile;
    } catch (error) {
        return null;
    }
}

function releaseLock(lockFile) {
    if (lockFile && fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
    }
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END
4.2. Procesamiento Principal
Generated javascript
async function resolvePermissions() {
    const lockFile = acquireLock();
    if (!lockFile) {
        console.log('Proceso ya en ejecución');
        return;
    }
    
    try {
        // Seleccionar registros pendientes
        const [registrosPendientes] = await connection.execute(`
            SELECT id, usuario_mail, usuario_nombre, 
                   permiso_carrera_codigo, permiso_categoria 
            FROM permisos_pendientes 
            WHERE estado = 'PENDIENTE' 
            ORDER BY fecha_creacion 
            LIMIT 500
        `);
        
        // Cache de usuarios existentes
        const usuariosCache = new Map();
        const [usuarios] = await connection.execute('SELECT id, email_institucional FROM users');
        for (const usuario of usuarios) {
            usuariosCache.set(usuario.email_institucional, usuario.id);
        }
        
        // Cache de carreras
        const carrerasCache = new Map();
        const [carreras] = await connection.execute('SELECT id, codigo_plan FROM carreras');
        for (const carrera of carreras) {
            carrerasCache.set(carrera.codigo_plan, carrera.id);
        }
        
        // Procesar cada registro
        for (const registro of registrosPendientes) {
            try {
                await procesarRegistro(registro, usuariosCache, carrerasCache);
            } catch (error) {
                await marcarError(registro.id, error.message);
            }
        }
                
    } finally {
        releaseLock(lockFile);
    }
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END
4.3. Procesamiento de Registro Individual (CORREGIDO)
Generated javascript
async function procesarRegistro(registro, usuariosCache, carrerasCache) {
    const { id: registroId, usuario_mail, usuario_nombre, cargo, permiso_carrera_codigo, tipo_rol, permiso_categoria, fecha_expiracion } = registro;
    
    // 1. Resolver Usuario: El usuario ya debe existir en la tabla `users`.
    // Este script NO crea ni actualiza usuarios en `users`.
    let usuarioId = usuariosCache.get(usuario_mail);

    if (!usuarioId) {
        // Si por alguna razón el usuario no está en caché (ej. inconsistencia o caché desactualizada),
        // se asume que el usuario DEBE haber sido creado previamente por UsersService.
        // Se puede añadir un log de advertencia aquí si se desea.
        console.warn(`Usuario ${usuario_mail} no encontrado en caché. Asumiendo que fue creado previamente.`);
        // Opcional: Intentar buscar en BD directamente si la caché es la única fuente de verdad
        const [existingUser] = await connection.execute(
            'SELECT id FROM users WHERE email_institucional = ?',
            [usuario_mail]
        );
        if (existingUser.length > 0) {
            usuarioId = existingUser[0].id;
            usuariosCache.set(usuario_mail, usuarioId); // Actualizar caché
        } else {
            // Si el usuario realmente no existe, es un error crítico en el flujo.
            throw new Error(`Usuario ${usuario_mail} no existe en la tabla users. No se pueden asignar permisos.`);
        }
    }
    
    // 2. Resolver Permisos
    let permisoResuelto = false;
    
    // 2a. Permiso por Carrera (CORREGIDO - No explosión de datos)
    if (permiso_carrera_codigo) {
        const carreraId = carrerasCache.get(permiso_carrera_codigo);
        if (carreraId) {
            await connection.execute(`
                INSERT IGNORE INTO usuario_permisos_carrera 
                (usuario_id, carrera_id, fecha_expiracion) VALUES (?, ?, ?)
            `, [usuarioId, carreraId, fecha_expiracion]);
            permisoResuelto = true;
        } else {
            // Carrera no existe aún, dejar pendiente
            return;
        }
    }
    
    // 2b. Permiso por Categoría (CORREGIDO)
    if (permiso_categoria) {
        await connection.execute(`
            INSERT IGNORE INTO usuario_permisos_categoria 
            (usuario_id, categoria, fecha_expiracion) VALUES (?, ?, ?)
        `, [usuarioId, permiso_categoria, fecha_expiracion]);
        permisoResuelto = true;
    }
    
    // 3. Marcar como procesado
    if (permisoResuelto) {
        await connection.execute(`
            UPDATE permisos_pendientes 
            SET estado = 'PROCESADO', fecha_procesado = NOW() 
            WHERE id = ?
        `, [registroId]);
    }
}

async function marcarError(registroId, mensajeError) {
    await connection.execute(`
        UPDATE permisos_pendientes 
        SET estado = 'ERROR', mensaje_error = ?, intentos_procesamiento = intentos_procesamiento + 1
        WHERE id = ?
    `, [mensajeError, registroId]);
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END
5. Consultas de Verificación de Permisos (NUEVAS)

Para verificar si un usuario tiene permiso sobre una asignatura específica:

Generated sql
-- Función para verificar permisos de usuario (con validación de expiración)
CREATE FUNCTION usuario_tiene_permiso(p_usuario_id INT, p_asignatura_id INT) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE tiene_permiso BOOLEAN DEFAULT FALSE;
    DECLARE asignatura_carrera_id INT;
    DECLARE asignatura_categoria VARCHAR(50);
    
    -- Obtener datos de la asignatura
    SELECT carrera_id, categoria_asignatura 
    INTO asignatura_carrera_id, asignatura_categoria
    FROM asignaturas 
    WHERE id = p_asignatura_id AND activo = TRUE;
    
    -- Verificar permiso por carrera (considerando expiración)
    IF EXISTS (
        SELECT 1 FROM usuario_permisos_carrera 
        WHERE usuario_id = p_usuario_id 
        AND carrera_id = asignatura_carrera_id 
        AND activo = TRUE
        AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
    ) THEN
        SET tiene_permiso = TRUE;
    END IF;
    
    -- Verificar permiso por categoría (considerando expiración)
    IF NOT tiene_permiso AND asignatura_categoria IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM usuario_permisos_categoria 
            WHERE usuario_id = p_usuario_id 
            AND categoria = asignatura_categoria 
            AND activo = TRUE
            AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())
        ) THEN
            SET tiene_permiso = TRUE;
        END IF;
    END IF;
    
    RETURN tiene_permiso;
END;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
6. Consulta para Listar Asignaturas Permitidas
Generated sql
-- Vista para asignaturas permitidas por usuario (con validación de expiración)
CREATE VIEW usuario_asignaturas_permitidas AS
SELECT DISTINCT 
    u.id as usuario_id,
    u.email_institucional as usuario_mail,
    a.id as asignatura_id,
    a.sigla,
    a.nombre as asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    'CARRERA' as tipo_permiso,
    upc.fecha_expiracion
FROM users u
JOIN usuario_permisos_carrera upc ON u.id = upc.usuario_id
JOIN carreras c ON upc.carrera_id = c.id
JOIN asignaturas a ON c.id = a.carrera_id
WHERE u.is_active = TRUE 
  AND upc.activo = TRUE 
  AND a.activo = TRUE
  AND (upc.fecha_expiracion IS NULL OR upc.fecha_expiracion > NOW())

UNION

SELECT DISTINCT 
    u.id as usuario_id,
    u.email_institucional as usuario_mail,
    a.id as asignatura_id,
    a.sigla,
    a.nombre as asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    'CATEGORIA' as tipo_permiso,
    upcat.fecha_expiracion
FROM users u
JOIN usuario_permisos_categoria upcat ON u.id = upcat.usuario_id
JOIN asignaturas a ON upcat.categoria = a.categoria_asignatura
JOIN carreras c ON a.carrera_id = c.id
WHERE u.is_active = TRUE 
  AND upcat.activo = TRUE 
  AND a.activo = TRUE
  AND (upcat.fecha_expiracion IS NULL OR upcat.fecha_expiracion > NOW());
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
7. Despliegue y Operación Básica
7.1. Configuración Inicial

Ejecutar los scripts SQL para crear las tablas en la base de datos

Crear índices básicos:

Generated sql
CREATE INDEX idx_users_email ON users(email_institucional);
CREATE INDEX idx_carreras_codigo ON carreras(codigo_plan);
CREATE INDEX idx_asignaturas_carrera ON asignaturas(carrera_id);
CREATE INDEX idx_asignaturas_categoria ON asignaturas(categoria_asignatura);
CREATE INDEX idx_permisos_pendientes_estado ON permisos_pendientes(estado);
CREATE INDEX idx_usuario_permisos_carrera_expiracion ON usuario_permisos_carrera(fecha_expiracion);
CREATE INDEX idx_usuario_permisos_categoria_expiracion ON usuario_permisos_categoria(fecha_expiracion);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
7.2. Scripts de Carga

Los scripts de carga (`load_users.js` y `load_plans.js`) no se ejecutan de forma independiente. Su lógica está integrada en el `UsersService` del backend. Por lo tanto, no es necesario desplegarlos como scripts separados ni ejecutarlos manualmente.

Dependencias necesarias (para el backend):

Generated bash
npm install csv-parser mysql2
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Bash
IGNORE_WHEN_COPYING_END

Flujo de ejecución real:

Carga de estructura académica: Se realiza a través del módulo de carga del sistema, que vuelca los datos a `staging_estructura_academica`.
Sincronización de planes: La lógica de `load_plans.js` debe ejecutarse por separado e independientemente de la carga de usuarios para sincronizar la estructura académica.
Creación/Importación de usuarios: Se realiza a través de la interfaz web (creación manual o importación masiva). `UsersService` se encarga de crear los usuarios y volcar sus permisos a `permisos_pendientes`.
Procesamiento de permisos: `executePermissionScriptsForUser()` es invocado por `UsersService` y ejecuta solo `resolve_permissions.js` para usuarios individuales, o `load_users.js` seguido de `resolve_permissions.js` para importación masiva.

7.3. Ejecución Automática Post-Carga

La ejecución de los scripts de permisos (`load_users.js` y `resolve_permissions.js`) es orquestada por el método `executePermissionScriptsForUser()` dentro de `UsersService`. Este método se llama sincrónicamente después de que los usuarios y sus permisos han sido volcados a `permisos_pendientes`. El script `load_plans.js` se ejecuta independientemente para la sincronización de estructura académica.

No se utiliza un scheduler de respaldo ni se requiere la ejecución manual de estos scripts después de la carga. La integración con `UsersService` garantiza que el procesamiento de permisos sea una parte intrínseca del flujo de creación/importación de usuarios.

8. Consideraciones de Robustez y Escalabilidad

Idempotencia: Todos los procesos de resolución de permisos son idempotentes, lo que permite su ejecución repetida sin efectos secundarios negativos.
Manejo de Errores: Los errores durante el procesamiento de permisos se registran en la tabla `permisos_pendientes`.
Concurrencia: El mecanismo de bloqueo (`resolve_permissions.lock`) asegura que solo una instancia de `resolve_permissions.js` se ejecute a la vez.

9. Pruebas

Se deben realizar pruebas exhaustivas para validar:

Carga de usuarios y planes en diferentes órdenes.
Asignación correcta de permisos por carrera y categoría.
Manejo de usuarios existentes y nuevos.
Comportamiento con fechas de expiración.
Robustez ante datos malformados.

10. Futuras Mejoras

Interfaz de usuario para gestión de permisos.
Reportes de auditoría de permisos.
Integración con sistemas de autenticación externos.

11. Cambios en la Versión 2.2 (Refleja Implementación Real)

Actualización del estado del documento a "Funcional Completo - Refleja Implementación Real".
Modificación de la sección "3. Procesos de Carga" para indicar que están "Integrados en UsersService", detallando el flujo de la "Creación Manual de Usuarios (CreateUserModal)" y la "Importación Masiva de Usuarios (UsersService.importUsers())", explicando que ambos flujos usan `permisos_pendientes` y `executePermissionScriptsForUser()`, y que los usuarios se crean directamente en la tabla `users`.
Actualización de la sección "4. Proceso de Resolución de Permisos: resolve_permissions.js" para indicar que es la "IMPLEMENTACIÓN REAL", especificando que se ejecuta como parte integrada del proceso de creación/importación de usuarios a través de `executePermissionScriptsForUser()` y que los usuarios ya existen en la tabla `users` cuando este script se ejecuta.
En la sección "4.3. Procesamiento de Registro Individual", se eliminó la lógica de creación o actualización de usuarios en `resolve_permissions.js`, y se añadió una verificación para asegurar que el usuario fue creado previamente por `UsersService`.
Actualización de la sección "7. Despliegue y Operación Básica" para reflejar el flujo de operación real, indicando que el sistema funciona de forma integrada a través de la aplicación web, sin scripts independientes, y detalla el flujo de ejecución real que incluye la carga de estructura académica, la sincronización de planes (opcional), la creación/importación de usuarios (manual o masiva desde la interfaz web) y el procesamiento automático de permisos vía `executePermissionScriptsForUser()`.
Actualización de la sección "7.3. Ejecución Automática Post-Carga" para reflejar la integración real con `UsersService`, mostrando cómo se ejecuta `executePermissionScriptsForUser()` desde `UsersService.create()` y `UsersService.importUsers()`, y especificando que este método ejecuta solo `resolve_permissions.js` para usuarios individuales o `load_users.js` seguido de `resolve_permissions.js` para importación masiva, eliminando la necesidad de un scheduler de respaldo. El script `load_plans.js` se ejecuta independientemente.
Adición de una nueva sección de resumen (Sección 12) que detalla las principales correcciones realizadas en la versión 2.2.

12. Cambios Temporales: Soporte para Historial de Bimestres (Versión 2.3)

### 12.1. Problema Identificado

Las carreras y sus categorías pueden cambiar de un bimestre a otro, y los permisos no consideran el aspecto temporal, lo que genera problemas de consistencia temporal en el sistema de permisos:
- **Inconsistencia temporal**: Los permisos pueden referenciar datos de diferentes bimestres
- **Pérdida de historial**: No se puede consultar información de bimestres anteriores
- **Permisos incorrectos**: Un usuario puede ver asignaturas que no corresponden a su bimestre
- **Cambios de permisos no manejados**: Si un usuario cambia de carrera entre bimestres, ve datos incorrectos

### 12.2. Solución Implementada

Se agregó `bimestre_id` tanto a las tablas finales (`carreras` y `asignaturas`) como a las tablas de permisos (`usuario_permisos_carrera` y `usuario_permisos_categoria`) para lograr consistencia temporal completa.

### 12.3. Script de Migración

```sql
-- Migración para agregar soporte temporal a tablas finales
-- EJECUTAR EN ORDEN:

-- 1. Agregar columna bimestre_id a carreras
ALTER TABLE carreras 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 2. Agregar foreign key a bimestres
ALTER TABLE carreras 
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 3. Eliminar índice único anterior y crear nuevo
ALTER TABLE carreras 
DROP INDEX codigo_plan,
ADD UNIQUE KEY unique_carrera_bimestre (codigo_plan, bimestre_id);

-- 4. Agregar columna bimestre_id a asignaturas
ALTER TABLE asignaturas 
ADD COLUMN bimestre_id INT NOT NULL DEFAULT 1;

-- 5. Agregar foreign key a bimestres
ALTER TABLE asignaturas 
ADD FOREIGN KEY (bimestre_id) REFERENCES bimestres(id);

-- 6. Eliminar índice único anterior y crear nuevo
ALTER TABLE asignaturas 
DROP INDEX unique_sigla_carrera,
ADD UNIQUE KEY unique_asignatura_bimestre (carrera_id, sigla, bimestre_id);

-- 7. Actualizar datos existentes al bimestre actual
UPDATE carreras SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

UPDATE asignaturas SET bimestre_id = (
    SELECT id FROM bimestres WHERE activo = 1 LIMIT 1
);

-- 8. Remover DEFAULT después de la migración
ALTER TABLE carreras ALTER COLUMN bimestre_id DROP DEFAULT;
ALTER TABLE asignaturas ALTER COLUMN bimestre_id DROP DEFAULT;
```

### 12.4. Cambios en la Lógica de Carga

**Datos Finales - Antes (sobrescribía datos):**
```sql
-- Limpiaba toda la tabla
DELETE FROM carreras;

-- Insertaba datos del bimestre actual
INSERT INTO carreras (codigo_plan, nombre_carrera, activo) 
VALUES ('PLAN001', 'Ingeniería de Sistemas', true);
```

**Datos Finales - Después (preserva historial):**
```sql
-- Inserta solo si no existe la combinación (codigo_plan, bimestre_id)
INSERT IGNORE INTO carreras (codigo_plan, nombre_carrera, bimestre_id, activo) 
VALUES ('PLAN001', 'Ingeniería de Sistemas', 2, true);
```

**Permisos - Cambio Requerido:**
```sql
-- Al asignar permisos, ahora incluir bimestre_id
INSERT INTO usuario_permisos_carrera (usuario_id, carrera_id, bimestre_id, activo)
VALUES (123, 456, 2, true);

-- Al cambiar permisos entre bimestres, crear nuevos registros
-- En lugar de UPDATE, usar INSERT para el nuevo bimestre
```

### 12.5. Vista Actualizada con Filtrado Temporal Completo

```sql
CREATE VIEW usuario_asignaturas_permitidas AS
SELECT DISTINCT 
    u.id AS usuario_id,
    u.email_institucional AS usuario_mail,
    a.id AS asignatura_id,
    a.sigla,
    a.nombre AS asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    a.bimestre_id,
    'CARRERA' AS tipo_permiso
FROM users u
JOIN usuario_permisos_carrera upc ON u.id = upc.usuario_id
JOIN carreras c ON upc.carrera_id = c.id AND upc.bimestre_id = c.bimestre_id  -- CLAVE: Filtro temporal en permisos
JOIN asignaturas a ON c.id = a.carrera_id AND c.bimestre_id = a.bimestre_id
WHERE u.is_active = true AND upc.activo = true AND a.activo = true

UNION

SELECT DISTINCT 
    u.id AS usuario_id,
    u.email_institucional AS usuario_mail,
    a.id AS asignatura_id,
    a.sigla,
    a.nombre AS asignatura_nombre,
    c.nombre_carrera,
    a.categoria_asignatura,
    a.bimestre_id,
    'CATEGORIA' AS tipo_permiso
FROM users u
JOIN usuario_permisos_categoria upcat ON u.id = upcat.usuario_id
JOIN asignaturas a ON upcat.categoria = a.categoria_asignatura AND upcat.bimestre_id = a.bimestre_id  -- CLAVE: Filtro temporal en permisos
JOIN carreras c ON a.carrera_id = c.id AND a.bimestre_id = c.bimestre_id
WHERE u.is_active = true AND upcat.activo = true AND a.activo = true;
```

**Ejemplo de consulta para verificar permisos específicos por bimestre:**
```sql
-- Ver qué asignaturas puede acceder un usuario en un bimestre específico
SELECT * FROM usuario_asignaturas_permitidas 
WHERE usuario_id = 123 AND bimestre_id = 2;
```

### 12.6. Beneficios de Esta Solución

1. **Precisión Temporal Completa**: Los permisos y datos se evalúan correctamente para cada bimestre específico
2. **Historial Completo**: Se preserva tanto la información de datos como de permisos de todos los bimestres
3. **Consistencia Temporal**: Los permisos y datos siempre corresponden al mismo bimestre
4. **Manejo de Cambios**: Los usuarios que cambian de carrera entre bimestres ven datos correctos
5. **Consultas Precisas**: Las vistas filtran automáticamente por bimestre en permisos y datos
6. **Escalabilidad**: Fácil agregar nuevos bimestres sin afectar datos o permisos existentes

### 12.7. Próximos Pasos

1. **Ejecutar migración**: Aplicar el script `migracion_bimestre_temporal.sql`
2. **Actualizar scripts de carga**: Cambiar a `INSERT IGNORE` para preservar historial
3. **Modificar gestión de permisos**: Incluir `bimestre_id` al asignar permisos
4. **Actualizar consultas**: Incluir filtrado por `bimestre_id` en permisos y datos
5. **Validar funcionamiento**: Verificar que los permisos funcionen correctamente por bimestre
6. **Probar casos especiales**: Validar usuarios con cambios de carrera entre bimestres

13. Resumen de Correcciones en la Versión 2.2

La versión 2.2 de este documento ha sido actualizada para reflejar fielmente la implementación real del sistema de gestión de permisos, corrigiendo varias discrepancias clave con el plan original:

Arquitectura de Scripts: Se ha clarificado que los scripts `load_users.js` y `resolve_permissions.js` están encapsulados y orquestados por el método `executePermissionScriptsForUser()` dentro del `UsersService` del backend para el proceso de carga de usuarios. El script `load_plans.js` se ejecuta independientemente para la sincronización de estructura académica, separando las responsabilidades de carga académica y gestión de usuarios. Esto asegura una integración más robusta y un flujo de trabajo unificado.
Creación Manual de Usuarios: Se ha documentado explícitamente que la creación manual de usuarios a través de la interfaz de usuario también utiliza la tabla `permisos_pendientes` y activa el mismo flujo de procesamiento de permisos a través de `executePermissionScriptsForUser()`. Esto garantiza la coherencia en la asignación de permisos, independientemente de cómo se cree el usuario.
Importación Masiva: Se ha detallado que la importación masiva de usuarios se maneja directamente a través de `UsersService.importUsers()`, que se encarga de crear los usuarios y volcar sus permisos a `permisos_pendientes`, seguido de la ejecución de `executePermissionScriptsForUser()`.
Secuencia de Creación de Usuarios y Ejecución de Scripts: Se ha corregido la secuencia de eventos. Los usuarios se crean en la tabla `users` *antes* de que `resolve_permissions.js` procese sus permisos. `resolve_permissions.js` ahora se describe correctamente como un script que *asigna* permisos a usuarios ya existentes, no que los crea o actualiza.
Beneficios de la Actualización: Esta versión corregida proporciona una representación precisa del sistema en producción, lo que facilita el mantenimiento, la depuración y el desarrollo futuro al eliminar la confusión causada por las discrepancias anteriores entre el plan y la implementación real.