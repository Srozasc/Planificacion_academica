# Sistema de Permisos de Usuarios

## Descripción General

El sistema de permisos de usuarios en la aplicación de Planificación Académica permite controlar el acceso de los usuarios a las asignaturas de manera granular, ya sea por carrera completa o por categoría de asignatura. El sistema está diseñado para manejar múltiples bimestres y mantener consistencia temporal.

## Tipos de Permisos

### 1. Permisos por Carrera (Plan)
- **Descripción**: El usuario tiene acceso a todas las asignaturas de una carrera específica
- **Ejemplo**: Usuario asignado al plan "1444728" puede ver todas las asignaturas de esa carrera
- **Alcance**: Todas las materias del plan de estudios seleccionado

### 2. Permisos por Categoría
- **Descripción**: El usuario tiene acceso a todas las asignaturas que pertenecen a una categoría específica
- **Ejemplo**: Usuario con categoría "TRAN" puede ver todas las asignaturas marcadas como "TRAN" de cualquier carrera
- **Alcance**: Asignaturas transversales que cruzan múltiples carreras

## Flujo de Asignación de Permisos

### Paso 1: Captura en el Frontend

**Archivo**: `frontend/src/components/users/CreateUserModal.tsx`

1. El administrador selecciona el tipo de permiso:
   - "Sin permisos específicos"
   - "Por Categoría de Asignatura"
   - "Por Carrera"

2. Según la selección, aparecen los controles correspondientes:
   - **Por Categoría**: Lista de checkboxes con categorías disponibles (CAPR, ESCU, PRAC, TRAN, etc.)
   - **Por Carrera**: Lista de checkboxes con carreras disponibles por código de plan

3. Los datos se envían al backend como:
```typescript
interface CreateUserData {
  // ... otros campos del usuario
  tipoPermiso: 'categoria' | 'carrera' | '';
  categorias: string[];  // ['TRAN', 'PRAC']
  carreras: number[];    // [1, 5, 8]
}
```

### Paso 2: Procesamiento en el Backend

**Archivo**: `backend/src/users/users.service.ts`

1. **Creación del Usuario**:
   - Se crea el registro en la tabla `users`
   - Se hashea la contraseña
   - Se asignan roles y fechas de expiración

2. **Creación de Permisos Pendientes**:
   ```typescript
   // Para permisos por categoría
   if (createUserDto.tipoPermiso === 'categoria') {
     for (const categoria of createUserDto.categorias) {
       // Crear registro en permisos_pendientes
       const permisosPendientes = {
         usuarioMail: createUserDto.emailInstitucional,
         usuarioNombre: createUserDto.name,
         permisoCategoria: categoria,
         estado: 'PENDIENTE',
         bimestre_id: bimestreActivo
       };
     }
   }
   
   // Para permisos por carrera
   if (createUserDto.tipoPermiso === 'carrera') {
     for (const carrera of carreras) {
       // Crear registro en permisos_pendientes
       const permisosPendientes = {
         usuarioMail: createUserDto.emailInstitucional,
         usuarioNombre: createUserDto.name,
         permisoCarreraCodigo: carrera.codigo_plan,
         estado: 'PENDIENTE',
         bimestre_id: bimestreActivo
       };
     }
   }
   ```

3. **Ejecución de Scripts de Resolución**:
   - Se ejecuta `executePermissionScriptsForUser()`
   - Este método llama al script externo `resolve_permissions.js`

### Paso 3: Resolución de Permisos

**Archivo**: `scripts/permissions/resolve_permissions.js`

1. **Procesamiento de Registros Pendientes**:
   ```javascript
   // Obtener registros en estado 'PENDIENTE'
   const registrosPendientes = await obtenerRegistrosPendientes(connection);
   
   // Procesar cada registro
   for (const registro of registrosPendientes) {
     await procesarRegistro(connection, registro, caches, stats);
   }
   ```

2. **Creación de Permisos Reales**:
   ```javascript
   // Para permisos por carrera
   async function crearPermisoCarrera(connection, usuarioId, codigoCarrera, bimestreId) {
     await connection.execute(`
       INSERT INTO usuario_permisos_carrera (usuario_id, carrera_id, bimestre_id, activo)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE activo = TRUE
     `, [usuarioId, carreraId, bimestreId]);
   }
   
   // Para permisos por categoría
   async function crearPermisoCategoria(connection, usuarioId, categoria, bimestreId) {
     await connection.execute(`
       INSERT INTO usuario_permisos_categoria (usuario_id, categoria, bimestre_id, activo)
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE activo = TRUE
     `, [usuarioId, categoria, bimestreId]);
   }
   ```

3. **Actualización de Estado**:
   - Los registros procesados se marcan como 'PROCESADO'
   - Los errores se registran con estado 'ERROR'

## Estructura de Base de Datos

### Tablas de Permisos

#### usuario_permisos_carrera
```sql
CREATE TABLE usuario_permisos_carrera (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    carrera_id INT NOT NULL,
    bimestre_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id),
    FOREIGN KEY (carrera_id) REFERENCES carreras(id),
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
    UNIQUE KEY unique_usuario_carrera_bimestre (usuario_id, carrera_id, bimestre_id)
);
```

#### usuario_permisos_categoria
```sql
CREATE TABLE usuario_permisos_categoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    bimestre_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id),
    FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
    UNIQUE KEY unique_usuario_categoria_bimestre (usuario_id, categoria, bimestre_id)
);
```

### Tablas de Datos Académicos

#### carreras
- Contiene los planes de estudio
- Campos clave: `id`, `codigo_plan`, `nombre_carrera`, `bimestre_id`

#### asignaturas
- Contiene las materias
- Campos clave: `id`, `carrera_id`, `sigla`, `nombre`, `categoria_asignatura`, `bimestre_id`

## Consulta de Permisos

### Vista Principal: usuario_asignaturas_permitidas

Esta vista es el corazón del sistema de consulta de permisos:

```sql
CREATE VIEW usuario_asignaturas_permitidas AS
-- Permisos por CARRERA
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
JOIN carreras c ON upc.carrera_id = c.id AND upc.bimestre_id = c.bimestre_id
JOIN asignaturas a ON c.id = a.carrera_id AND c.bimestre_id = a.bimestre_id
WHERE u.is_active = true AND upc.activo = true AND a.activo = true

UNION

-- Permisos por CATEGORÍA
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
JOIN asignaturas a ON upcat.categoria = a.categoria_asignatura AND upcat.bimestre_id = a.bimestre_id
JOIN carreras c ON a.carrera_id = c.id AND a.bimestre_id = c.bimestre_id
WHERE u.is_active = true AND upcat.activo = true AND a.activo = true;
```

### Consultas de Aplicación

#### Obtener Permisos de un Usuario

**Archivo**: `backend/src/users/users.service.ts`

```typescript
async getUserPermissions(userId: number, bimestreId?: number): Promise<any> {
  // Buscar permisos por categoría
  const permisosCategorias = await this.usuarioPermisoCategoriaRepository.find({
    where: { 
      usuario_id: userId,
      ...(bimestreId && { bimestre_id: bimestreId })
    }
  });

  if (permisosCategorias.length > 0) {
    return {
      tipoPermiso: 'categoria',
      categorias: permisosCategorias.map(p => p.categoria),
      carreras: []
    };
  }

  // Buscar permisos por carrera
  const permisosCarrera = await this.usuarioPermisoCarreraRepository.find({
    where: { 
      usuario_id: userId,
      ...(bimestreId && { bimestre_id: bimestreId })
    }
  });

  if (permisosCarrera.length > 0) {
    return {
      tipoPermiso: 'carrera',
      categorias: [],
      carreras: permisosCarrera.map(p => p.carrera_id)
    };
  }

  return {
    tipoPermiso: '',
    categorias: [],
    carreras: []
  };
}
```

#### Verificar Acceso a Asignatura

```sql
-- Verificar si un usuario tiene acceso a una asignatura específica
SELECT COUNT(*) as tiene_acceso
FROM usuario_asignaturas_permitidas
WHERE usuario_id = ? 
  AND asignatura_id = ? 
  AND bimestre_id = ?;
```

#### Listar Asignaturas Accesibles

```sql
-- Obtener todas las asignaturas que puede ver un usuario
SELECT *
FROM usuario_asignaturas_permitidas
WHERE usuario_id = ? 
  AND bimestre_id = ?
ORDER BY nombre_carrera, sigla;
```

## Gestión Temporal por Bimestre

### Características Clave

1. **Consistencia Temporal**: Todos los permisos están vinculados a un bimestre específico
2. **Evolución de Permisos**: Un usuario puede tener diferentes permisos en diferentes bimestres
3. **Filtrado Automático**: Las consultas siempre filtran por el bimestre activo o especificado

### Ejemplos de Casos de Uso

#### Caso 1: Usuario con Diferentes Carreras por Bimestre
```
Usuario: juan.perez@universidad.edu
Bimestre 1: Permiso para Carrera "Ingeniería Civil" (código 1444728)
Bimestre 2: Permiso para Carrera "Arquitectura" (código 1555839)

Resultado:
- En Bimestre 1: Ve solo asignaturas de Ingeniería Civil
- En Bimestre 2: Ve solo asignaturas de Arquitectura
- Sin accesos cruzados entre bimestres
```

#### Caso 2: Usuario con Categoría Transversal
```
Usuario: maria.lopez@universidad.edu
Bimestre 1: Permiso para Categoría "TRAN"
Bimestre 2: Permiso para Categoría "TRAN"

Resultado:
- En ambos bimestres: Ve todas las asignaturas marcadas como "TRAN"
- Puede incluir asignaturas de múltiples carreras
- Solo ve las asignaturas TRAN del bimestre correspondiente
```

## Flujo de Datos Completo

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │     Backend      │    │   Script Externo   │
│ CreateUserModal │───▶│ UsersService     │───▶│ resolve_permissions │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                        │
         │                       ▼                        ▼
         │              ┌─────────────────┐    ┌─────────────────────┐
         │              │ permisos_       │    │ usuario_permisos_   │
         │              │ pendientes      │    │ carrera/categoria   │
         │              └─────────────────┘    └─────────────────────┘
         │                                              │
         │                                              ▼
         │                                    ┌─────────────────────┐
         │                                    │ usuario_asignaturas │
         │                                    │ _permitidas (Vista) │
         │                                    └─────────────────────┘
         │                                              │
         │              ┌─────────────────┐              │
         └─────────────▶│   Consultas de  │◀─────────────┘
                        │   Permisos      │
                        └─────────────────┘
```

## Consideraciones de Seguridad

1. **Validación de Permisos**: Todas las consultas de datos académicos deben verificar permisos
2. **Filtrado por Bimestre**: Siempre incluir el filtro de bimestre en las consultas
3. **Estados de Usuario**: Verificar que el usuario esté activo (`is_active = true`)
4. **Permisos Activos**: Verificar que los permisos estén activos (`activo = true`)

## Mantenimiento y Monitoreo

### Consultas de Diagnóstico

```sql
-- Verificar permisos pendientes
SELECT estado, COUNT(*) as cantidad
FROM permisos_pendientes
GROUP BY estado;

-- Usuarios sin permisos
SELECT u.id, u.email_institucional, u.name
FROM users u
LEFT JOIN usuario_permisos_carrera upc ON u.id = upc.usuario_id
LEFT JOIN usuario_permisos_categoria upcat ON u.id = upcat.usuario_id
WHERE u.is_active = true 
  AND upc.id IS NULL 
  AND upcat.id IS NULL;

-- Permisos por bimestre
SELECT b.nombre as bimestre, 
       COUNT(DISTINCT upc.usuario_id) as usuarios_carrera,
       COUNT(DISTINCT upcat.usuario_id) as usuarios_categoria
FROM bimestres b
LEFT JOIN usuario_permisos_carrera upc ON b.id = upc.bimestre_id
LEFT JOIN usuario_permisos_categoria upcat ON b.id = upcat.bimestre_id
GROUP BY b.id, b.nombre;
```

### Scripts de Limpieza

```sql
-- Limpiar permisos de usuarios inactivos
DELETE upc FROM usuario_permisos_carrera upc
JOIN users u ON upc.usuario_id = u.id
WHERE u.is_active = false;

DELETE upcat FROM usuario_permisos_categoria upcat
JOIN users u ON upcat.usuario_id = u.id
WHERE u.is_active = false;

-- Limpiar permisos pendientes antiguos
DELETE FROM permisos_pendientes
WHERE estado = 'PROCESADO' 
  AND fecha_procesado < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Conclusión

El sistema de permisos proporciona un control granular y flexible sobre el acceso a las asignaturas, manteniendo la consistencia temporal a través de los bimestres. La arquitectura de tres capas (pendientes → permisos → vista) permite un procesamiento eficiente y un mantenimiento sencillo del sistema.