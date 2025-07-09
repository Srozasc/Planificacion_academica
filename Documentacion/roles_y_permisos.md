# Roles y Permisos del Sistema

## Descripción General

El sistema de planificación académica cuenta con tres roles principales que definen los niveles de acceso y permisos de los usuarios.

## Roles Definidos

### 1. Visualizador
**Descripción:** Rol de solo lectura con acceso limitado a visualización y reportes.

**Permisos:**
- ✅ Ver información del sistema
- ✅ Descargar reportes
- ❌ Crear, modificar o eliminar contenido
- ❌ Gestionar usuarios o roles
- ❌ Cargar archivos de insumos

**Casos de uso típicos:**
- Docentes que solo necesitan consultar información
- Personal administrativo con acceso de consulta
- Usuarios externos con permisos limitados

### 2. Editor
**Descripción:** Rol operativo con permisos para gestionar eventos y docentes.

**Permisos:**
- ✅ Ver información del sistema
- ✅ Crear, modificar y eliminar eventos
- ✅ Asignar y modificar docentes
- ✅ Descargar reportes
- ❌ Gestionar usuarios o roles
- ❌ Cargar archivos de insumos (Excel)

**Casos de uso típicos:**
- Coordinadores académicos
- Personal de programación académica
- Gestores de horarios y eventos

### 3. Maestro
**Descripción:** Rol administrativo con permisos completos del sistema.

**Permisos:**
- ✅ Ver información del sistema
- ✅ Cargar y modificar insumos (archivos Excel)
- ✅ Asignar y modificar roles de usuarios
- ✅ Gestionar usuarios del sistema
- ✅ Descargar reportes
- ✅ Acceso completo a todas las funcionalidades

**Casos de uso típicos:**
- Administradores del sistema
- Directores académicos
- Personal de TI con permisos completos

## Migración de Roles Anteriores

La actualización del sistema migró automáticamente los roles anteriores:

| Rol Anterior | Nuevo Rol | Justificación |
|--------------|-----------|---------------|
| Administrador del sistema | Maestro | Mantiene permisos administrativos completos |
| Coordinador académico | Editor | Enfoque en gestión de eventos y docentes |
| Profesor del sistema | Visualizador | Acceso de consulta y reportes |

## Consideraciones de Seguridad

- Los permisos se validan tanto en el frontend como en el backend
- Cada endpoint de la API verifica los permisos del usuario
- Los roles se almacenan de forma segura en la base de datos
- Las sesiones incluyen información de roles para validación en tiempo real

## Actualización: Julio 2025

- ✅ Roles actualizados en la base de datos
- ✅ Frontend actualizado con nuevos roles
- ✅ Backend configurado con enum actualizado
- ✅ Usuarios existentes migrados automáticamente