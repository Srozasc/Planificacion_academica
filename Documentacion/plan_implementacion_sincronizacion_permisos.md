# Plan de Acción: Implementación de Sincronización Completa de Permisos

Este documento detalla el plan de acción para implementar la funcionalidad de sincronización completa de permisos en el sistema, permitiendo la adición y eliminación eficiente de permisos de usuario.

## 1. Análisis y Diseño (Completado)

*   **Objetivo:** Entender los requisitos y definir la estrategia de implementación.
*   **Resultado:** Se determinó que la "Sincronización Completa" es la estrategia más adecuada, donde el frontend envía la lista final de permisos deseados y el backend gestiona las diferencias.

## 2. Modificaciones en el Frontend

*   **Archivo:** `frontend/src/features/users/components/EditUserModal.tsx`
*   **Tareas:**
    *   Modificar el componente `EditUserModal` para que recolecte y envíe la lista completa de IDs de permisos seleccionados (tanto de carrera como de categoría) en el `updateUserDto`.
    *   Asegurar que el estado local del modal refleje con precisión los permisos seleccionados por el usuario, permitiendo tanto la selección como la deselección.
    *   Ajustar la lógica de envío del formulario para incluir estos nuevos campos en el DTO de actualización de usuario.

## 3. Modificaciones en el Backend

*   **Archivo:** `backend/src/users/users.service.ts`
*   **Tareas:**
    *   Modificar el método `update` en `UsersService` para que reciba el `updateUserDto` con las listas de IDs de permisos (ej. `carreraIds`, `categoriaIds`).
    *   Para cada tipo de permiso (carrera y categoría):
        *   **Obtener Permisos Actuales:** Recuperar los permisos existentes del usuario desde la base de datos (tablas `usuario_permiso_carrera` y `usuario_permiso_categoria`).
        *   **Calcular Diferencias:** Comparar los permisos actuales con los recibidos en el DTO para identificar:
            *   Permisos a eliminar: Aquellos que están en la base de datos pero no en la lista recibida.
            *   Permisos a agregar: Aquellos que están en la lista recibida pero no existen en la base de datos para ese usuario.
        *   **Ejecutar Operaciones:** Realizar las operaciones de eliminación e inserción correspondientes en las tablas `usuario_permiso_carrera` y `usuario_permiso_categoria`.
    *   **Transaccionalidad:** Envolver todas las operaciones de base de datos relacionadas con la actualización de permisos dentro de una transacción para garantizar la atomicidad y consistencia de los datos. Esto es vital para evitar estados inconsistentes si una parte de la actualización falla.

## 4. Consideraciones Adicionales

*   **Validación:** Implementar validaciones en el backend para asegurar que los IDs de permisos recibidos sean válidos y existan en las tablas maestras correspondientes (ej. `carreras`, `categorias`).
*   **Rendimiento:** Para usuarios con un gran número de permisos, optimizar las consultas de base de datos para las operaciones de diferencia y actualización (ej. usando `IN` clauses o `LEFT JOIN` para identificar diferencias de manera eficiente).
*   **Manejo de Errores:** Asegurar un manejo robusto de errores en caso de fallos en la base de datos o validaciones, proporcionando mensajes claros al frontend.
*   **Pruebas:** Desarrollar pruebas unitarias y de integración exhaustivas para validar la nueva lógica de sincronización de permisos, cubriendo casos de adición, eliminación y modificación de permisos.

## 5. Pruebas y Despliegue

*   **Pruebas:** Realizar pruebas funcionales completas en un entorno de desarrollo/staging para verificar que la adición y eliminación de permisos funciona correctamente desde el modal de edición de usuarios.
*   **Despliegue:** Una vez validadas las funcionalidades, proceder con el despliegue a producción siguiendo el proceso establecido.

## Estado de Implementación

- [x] Modificaciones en el Backend
- [x] Modificaciones en el Frontend
- [ ] Pruebas de Integración
- [x] Documentación Actualizada

## Cambios Implementados

### Backend

1. **UpdateUserDto** (`backend/src/users/dto/update-user.dto.ts`):
   - Agregados campos `careerPermissionIds?: number[]` y `categoryPermissionIds?: string[]`
   - Importada validación `IsArray` de class-validator

2. **UsersService** (`backend/src/users/users.service.ts`):
   - Modificado método `update()` para usar transacciones
   - Agregados métodos privados `syncCareerPermissions()` y `syncCategoryPermissions()`
   - Implementada lógica de sincronización completa que elimina permisos existentes y crea nuevos
   - Integración con bimestre activo para mantener consistencia

### Frontend

1. **EditUserModal.tsx** (`frontend/src/components/users/EditUserModal.tsx`):
   - Modificada función `handleSubmit()` para enviar lista completa de permisos
   - Eliminada llamada separada a `updateUserPermissions()`
   - Implementada lógica de sincronización que envía arrays completos de IDs

### Características Implementadas

- ✅ Sincronización completa de permisos de carrera
- ✅ Sincronización completa de permisos de categoría
- ✅ Transacciones de base de datos para garantizar consistencia
- ✅ Integración con bimestre activo
- ✅ Validaciones de entrada en DTOs
- ✅ Manejo de errores y casos edge
- ✅ Compatibilidad con creación de usuarios (no afectada)