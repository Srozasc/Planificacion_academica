# Sistema de Roles Temporales - Documentación

## Descripción General

El sistema permite asignar roles temporales a usuarios con fecha de expiración automática. Cuando un rol expira, el usuario automáticamente revierte al rol "Visualizador".

## Funcionamiento

### 1. Creación de Usuario con Rol Temporal

- Al crear un usuario con rol "Editor" y fecha de expiración:
  - Se guarda `roleExpiresAt` con la fecha especificada
  - Se establece automáticamente `previousRoleId = 1` (Visualizador)
  - El usuario mantiene el rol Editor hasta la fecha de expiración

### 2. Verificación de Expiración

La verificación de roles expirados ocurre automáticamente en:

- **Durante autenticación**: Cada vez que un usuario inicia sesión o hace una petición autenticada
- **En JwtAuthGuard**: Se ejecuta `checkAndRevertExpiredRole()` en cada request

### 3. Proceso de Reversión Automática

Cuando un rol expira:
1. Se cambia `roleId` al valor de `previousRoleId` (Visualizador)
2. Se limpia `roleExpiresAt` (se establece a NULL)
3. Se limpia `previousRoleId` (se establece a NULL)

## Implementación Técnica

### Backend

#### Entidad User
```typescript
@Column({ type: 'datetime', nullable: true })
roleExpiresAt: Date;

@Column({ type: 'int', nullable: true })
previousRoleId: number;
```

#### Método de Verificación
```typescript
async checkAndRevertExpiredRole(userId: number): Promise<boolean> {
  // Verifica si el rol ha expirado y lo revierte automáticamente
}
```

#### Puntos de Verificación
- `JwtAuthGuard.canActivate()`: En cada request autenticado
- `UsersService.checkAndRevertExpiredRole()`: Método principal de verificación

### Frontend

#### Formularios
- **CreateUserModal**: Campo de fecha solo visible para rol Editor
- **EditUserModal**: Campo de fecha habilitado solo para rol Editor
- Validación: Fecha mínima = fecha actual
- Formato: `YYYY-MM-DD` (tipo 'date')

#### Envío de Datos
- Se formatea la fecha como `${fecha}T23:59:59` para establecer fin del día
- Se envía solo si el rol es Editor y hay fecha especificada

## Flujo de Uso

1. **Administrador crea usuario Editor temporal**:
   - Selecciona rol "Editor"
   - Especifica fecha de expiración
   - Sistema automáticamente establece Visualizador como rol de reversión

2. **Usuario trabaja con rol Editor**:
   - Mantiene permisos de Editor hasta la fecha especificada
   - Puede acceder a todas las funciones de Editor

3. **Expiración automática**:
   - En la fecha especificada, al hacer login o cualquier request
   - Sistema detecta expiración y cambia rol a Visualizador
   - Usuario pierde permisos de Editor automáticamente

## Consideraciones

- **No requiere tareas programadas**: La verificación ocurre durante la actividad normal del usuario
- **Inmediata**: La reversión ocurre en el primer request después de la expiración
- **Segura**: No hay ventana de tiempo donde el usuario mantenga permisos expirados
- **Transparente**: El usuario simplemente ve que sus permisos han cambiado

## Base de Datos

### Campos Agregados
```sql
ALTER TABLE users 
ADD COLUMN role_expires_at DATETIME NULL;

ALTER TABLE users 
ADD COLUMN previous_role_id INT NULL;
```

### Relaciones
- `users.previous_role_id` → `roles.id` (FK opcional)
- Permite mantener referencia al rol de reversión

## Testing

Para probar el sistema:
1. Crear usuario con rol Editor y fecha de expiración de mañana
2. Verificar que se guarden correctamente los campos
3. Cambiar manualmente la fecha en BD a ayer
4. Hacer login con el usuario
5. Verificar que el rol se haya revertido a Visualizador

## Resolución del Problema Original

El problema reportado donde "la fecha de expiración del rol no se refleja en la base de datos" se resolvió:

1. **Backend**: Se corrigió el método `create` en `UsersService` para establecer automáticamente `previousRoleId = 1` cuando se especifica `roleExpiresAt`

2. **Verificación automática**: El sistema ya tenía implementada la lógica de verificación en `JwtAuthGuard`, que se ejecuta en cada request autenticado

3. **No se requieren tareas programadas**: La verificación ocurre naturalmente durante el uso normal del sistema

El sistema ahora funciona correctamente:
- Los usuarios con rol Editor temporal se crean con `previousRoleId` establecido
- La expiración se verifica automáticamente en cada autenticación
- Los roles se revierten automáticamente cuando expiran