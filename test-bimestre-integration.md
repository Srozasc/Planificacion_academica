# Test de Integración: Bimestre ID desde Navbar

## Descripción
Este documento describe las pruebas para verificar que el `id_bimestre` se obtiene correctamente desde el navbar del frontend y se propaga hasta la tabla `event_teachers`.

## Flujo Implementado

### Frontend
1. **Navbar**: Muestra el bimestre seleccionado con `data-bimestre-id`
2. **EventService**: 
   - `createEvent()` obtiene el `bimestre_id` del navbar usando `document.querySelector('[data-bimestre-id]')`
   - `updateEvent()` también obtiene el `bimestre_id` del navbar
   - Envía el `bimestre_id` al backend en el payload

### Backend
1. **SchedulingService.create()**:
   - Prioriza el `bimestre_id` recibido desde el frontend
   - Solo usa determinación automática como fallback si no se proporciona
   - Asigna el `bimestre_id` al evento

2. **SchedulingService.assignTeachersToEvent()**:
   - Obtiene el `bimestre_id` del evento guardado
   - Lo asigna a las relaciones `event_teachers`

## Casos de Prueba

### Caso 1: Creación de Evento con Bimestre del Navbar
**Precondiciones:**
- Usuario tiene un bimestre seleccionado en el navbar
- El navbar muestra `data-bimestre-id="2"`

**Pasos:**
1. Abrir modal de creación de evento
2. Llenar formulario con datos válidos
3. Seleccionar docentes
4. Guardar evento

**Resultado Esperado:**
- Evento creado con `bimestre_id = 2`
- Registros en `event_teachers` con `id_bimestre = 2`
- Logs del backend muestran: "Usando bimestre_id proporcionado desde frontend (navbar): 2"

### Caso 2: Fallback a Determinación Automática
**Precondiciones:**
- Frontend no envía `bimestre_id` (simulando error)

**Pasos:**
1. Crear evento sin `bimestre_id` en el payload
2. Verificar que el backend usa determinación automática

**Resultado Esperado:**
- Logs del backend muestran: "Bimestre_id no proporcionado desde frontend, determinando automáticamente como fallback..."
- Evento creado con bimestre determinado por fecha

### Caso 3: Actualización de Evento
**Precondiciones:**
- Evento existente
- Bimestre seleccionado en navbar

**Pasos:**
1. Editar evento existente
2. Cambiar datos y guardar

**Resultado Esperado:**
- Evento actualizado mantiene consistencia con bimestre del navbar
- Relaciones `event_teachers` actualizadas correctamente

## Verificaciones en Base de Datos

```sql
-- Verificar que eventos tienen bimestre_id
SELECT id, title, bimestre_id, start_date, end_date 
FROM schedule_events 
ORDER BY id DESC LIMIT 5;

-- Verificar que event_teachers tienen id_bimestre
SELECT et.id, et.event_id, et.teacher_id, et.id_bimestre, se.title
FROM event_teachers et
JOIN schedule_events se ON et.event_id = se.id
ORDER BY et.id DESC LIMIT 10;

-- Verificar consistencia entre schedule_events y event_teachers
SELECT 
    se.id as event_id,
    se.title,
    se.bimestre_id as event_bimestre,
    et.id_bimestre as teacher_bimestre,
    CASE 
        WHEN se.bimestre_id = et.id_bimestre THEN 'CONSISTENTE'
        ELSE 'INCONSISTENTE'
    END as estado
FROM schedule_events se
JOIN event_teachers et ON se.id = et.event_id
ORDER BY se.id DESC;
```

## Logs a Monitorear

### Frontend (Console)
- Verificar que `data-bimestre-id` se lee correctamente
- Confirmar que se envía en el payload al backend

### Backend (Logs)
- `"Bimestre_id recibido desde frontend: X (tipo: number)"`
- `"Usando bimestre_id proporcionado desde frontend (navbar): X"`
- `"Evento creado con bimestre_id: X"`
- `"Asignando docente Y al evento Z con bimestre_id: X"`

## Beneficios de la Implementación

1. **Consistencia**: Todos los componentes usan el mismo bimestre del navbar
2. **Confiabilidad**: No depende de determinación automática por fechas
3. **Transparencia**: El usuario ve exactamente qué bimestre se está usando
4. **Flexibilidad**: Mantiene fallback para casos edge
5. **Integridad**: Garantiza que `event_teachers` tenga el bimestre correcto