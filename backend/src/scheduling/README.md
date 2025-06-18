# Módulo de Programación Académica - NestJS

## 📋 Resumen

El módulo `SchedulingModule` implementa la funcionalidad completa para gestionar eventos de programación académica a través de endpoints HTTP REST y comunicación en tiempo real vía WebSocket.

## 🏗️ Arquitectura

### Componentes Principales

1. **SchedulingController** - Endpoints HTTP REST
2. **SchedulingService** - Lógica de negocio
3. **SchedulingGateway** - WebSocket para tiempo real
4. **DTOs** - Validación y transferencia de datos

### Flujo de Datos

```
HTTP Request → Controller → Service → Database (SP) → Response
                    ↓
                Gateway → WebSocket Clients
```

## 🔗 Endpoints HTTP

### Autenticación
Todos los endpoints requieren autenticación JWT excepto GET (solo lectura).

### Lista de Endpoints

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/schedules` | Obtener eventos con filtros | No |
| GET | `/schedules/:id` | Obtener evento específico | No |
| POST | `/schedules` | Crear nuevo evento | Sí |
| PUT | `/schedules/:id` | Actualizar evento | Sí |
| DELETE | `/schedules/:id` | Eliminar evento | Sí |
| GET | `/schedules/area/:areaId` | Eventos por área | Roles específicos |
| GET | `/schedules/teacher/:teacherId` | Eventos por docente | No |

### Ejemplos de Uso

#### 1. Obtener todos los eventos
```http
GET /schedules
```

#### 2. Obtener eventos con filtros
```http
GET /schedules?area_id=1&start_date=2025-06-01&end_date=2025-12-31&teacher_id=5
```

#### 3. Crear nuevo evento
```http
POST /schedules
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "academic_structure_id": 1,
  "teacher_id": 2,
  "area_id": 1,
  "start_datetime": "2025-06-20T10:00:00Z",
  "end_datetime": "2025-06-20T12:00:00Z",
  "day_of_week": "LUNES",
  "classroom": "Aula 101",
  "vacancies": 30,
  "max_capacity": 35,
  "weekly_hours": 2.0,
  "academic_period": "2025-1",
  "section": "A"
}
```

#### 4. Actualizar evento
```http
PUT /schedules/1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "classroom": "Aula 201",
  "vacancies": 25
}
```

#### 5. Eliminar evento
```http
DELETE /schedules/1
Authorization: Bearer <jwt_token>
```

## 🔌 WebSocket (Socket.IO)

### Namespace
`/scheduling`

### Eventos del Cliente al Servidor

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `join_area` | Suscribirse a área | `{ areaId: number }` |
| `leave_area` | Desuscribirse de área | `{ areaId: number }` |
| `ping` | Verificar conexión | `{}` |

### Eventos del Servidor al Cliente

| Evento | Descripción | Payload |
|--------|-------------|---------|
| `connection_established` | Conexión exitosa | `{ message, clientId, timestamp }` |
| `joined_area` | Suscripción exitosa | `{ areaId, message, timestamp }` |
| `left_area` | Desuscripción exitosa | `{ areaId, message, timestamp }` |
| `event_created` | Nuevo evento creado | `{ type, areaId, eventData, timestamp }` |
| `event_updated` | Evento actualizado | `{ type, areaId, eventData, timestamp }` |
| `event_deleted` | Evento eliminado | `{ type, areaId, eventId, timestamp }` |
| `schedule_conflict` | Conflicto detectado | `{ type, areaId, conflictData, severity, timestamp }` |
| `pong` | Respuesta a ping | `{ timestamp, clientId }` |

### Ejemplo de Cliente JavaScript

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3001/scheduling');

// Conexión establecida
socket.on('connection_established', (data) => {
  console.log('Conectado:', data.message);
  
  // Suscribirse al área 1
  socket.emit('join_area', { areaId: 1 });
});

// Escuchar eventos de programación
socket.on('event_created', (data) => {
  console.log('Nuevo evento:', data.eventData);
});

socket.on('event_updated', (data) => {
  console.log('Evento actualizado:', data.eventData);
});

socket.on('event_deleted', (data) => {
  console.log('Evento eliminado:', data.eventId);
});
```

## 📝 DTOs (Data Transfer Objects)

### CreateEventDto
```typescript
{
  academic_structure_id: number;    // Requerido
  teacher_id: number;               // Requerido
  area_id: number;                  // Requerido
  start_datetime: string;           // Requerido (ISO 8601)
  end_datetime: string;             // Requerido (ISO 8601)
  day_of_week: string;              // Requerido (LUNES, MARTES, etc.)
  classroom?: string;               // Opcional
  vacancies?: number;               // Opcional
  max_capacity?: number;            // Opcional
  weekly_hours?: number;            // Opcional (0.5-10)
  academic_period?: string;         // Opcional
  section?: string;                 // Opcional
  is_recurring?: boolean;           // Opcional
  recurrence_end_date?: string;     // Opcional
}
```

### UpdateEventDto
Igual que `CreateEventDto` pero todos los campos son opcionales.

### GetEventsQueryDto
```typescript
{
  area_id?: number;
  start_date?: string;    // YYYY-MM-DD
  end_date?: string;      // YYYY-MM-DD
  teacher_id?: number;
  status_id?: number;
}
```

### ScheduleEventDto (Respuesta)
```typescript
{
  id: number;
  academic_structure_id: number;
  teacher_id: number;
  area_id: number;
  start_datetime: string;
  end_datetime: string;
  day_of_week: string;
  classroom?: string;
  // ... más campos de la BD
  
  // Información relacionada
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  teacher_email?: string;
  status_name?: string;
  // ... campos adicionales de JOINs
}
```

## 🔒 Autenticación y Autorización

### Guards Implementados
- `JwtAuthGuard` - Autenticación JWT
- `RolesGuard` - Autorización por roles

### Roles Requeridos
- **Lectura (GET)**: Sin autenticación
- **Creación/Edición**: Usuario autenticado
- **Área específica**: Coordinador, Director, Admin

## ⚡ Funcionalidades Destacadas

### 1. Validaciones de Negocio
- Conflictos de horario (solapamiento)
- Validación de fechas
- Verificación de docentes/asignaturas activos
- Capacidad máxima vs vacantes

### 2. Tiempo Real
- Notificaciones instantáneas de cambios
- Suscripción por áreas
- Eventos globales opcionales

### 3. Filtros Avanzados
- Por área académica
- Por rango de fechas
- Por docente
- Por estado del evento

### 4. Manejo de Errores
- Códigos HTTP apropiados
- Mensajes descriptivos
- Logging detallado
- Transacciones de BD

## 🧪 Pruebas

### Ejecutar Pruebas
```bash
node test-scheduling-module.js
```

### Script de Prueba
El script incluye:
- Autenticación
- Conexión WebSocket
- CRUD completo
- Suscripción a áreas
- Verificación de eventos en tiempo real

## 🚀 Despliegue

### Variables de Entorno
```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=planificacion_user
DATABASE_PASSWORD=PlanUser2025!
DATABASE_NAME=planificacion_academica
JWT_SECRET=your_jwt_secret
```

### Socket.IO Config
```typescript
cors: {
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
```

## 📊 Monitoreo

### Logs Disponibles
- Conexiones WebSocket
- Errores de validación
- Consultas a BD
- Eventos emitidos

### Métricas
- Conexiones activas
- Eventos procesados
- Errores por endpoint
- Tiempo de respuesta

## 🔄 Integración

### Con Otros Módulos
- **AuthModule**: Autenticación JWT
- **DatabaseModule**: Conexión a BD
- **UsersModule**: Información de usuarios

### APIs Externas
- Base de datos MySQL
- Stored Procedures personalizados
- Sistema de roles y permisos

## ⚠️ Deuda Técnica

### Actualización de Eventos - Estado Actual

**❌ PROBLEMA IDENTIFICADO**: El stored procedure `sp_ValidateAndSaveScheduleEvent` no implementa funcionalidad de actualización completa.

#### 🔍 Análisis Técnico (Junio 2025)

**Stored Procedure Analizado**: `sp_ValidateAndSaveScheduleEvent`

**Comportamiento Actual**:
- ✅ **Creación**: Funciona perfectamente
- ❌ **Actualización**: NO implementada
- 🔄 **Lógica actual**: Solo ejecuta `INSERT`, ignora campo `id` en JSON
- 🆕 **Resultado**: Siempre crea nuevos eventos en lugar de actualizar existentes

#### 📋 Evidencia de Pruebas

```javascript
// Prueba realizada: Enviar JSON con ID existente
const updateData = {
  id: 5,  // Evento existente
  classroom: "Aula Actualizada",  // Cambio deseado
  // ... otros campos
};

// Resultado: 
// - SP creó NUEVO evento (ID 7)
// - Evento original (ID 5) permaneció SIN CAMBIOS
// - Status: "SUCCESS" pero comportamiento incorrecto
```

#### 🛠️ Soluciones Propuestas

**Opción 1: Modificar SP Existente**
```sql
-- Agregar lógica condicional al SP actual
DECLARE v_event_id INT DEFAULT NULL;
SET v_event_id = JSON_UNQUOTE(JSON_EXTRACT(p_event_data, '$.id'));

IF v_event_id IS NOT NULL THEN
    -- Modo UPDATE
    UPDATE schedule_events SET ... WHERE id = v_event_id;
ELSE
    -- Modo INSERT (comportamiento actual)
    INSERT INTO schedule_events (...) VALUES (...);
END IF;
```

**Opción 2: Crear SP Separado** *(Recomendado)*
```sql
-- Nuevo SP específico para actualizaciones
CREATE PROCEDURE sp_UpdateScheduleEvent(
    IN p_event_id INT,
    IN p_event_data JSON,
    IN p_user_id INT,
    OUT o_status_code VARCHAR(50),
    OUT o_error_message TEXT
)
```

**Opción 3: Manejo en Servicio NestJS** *(Implementación Actual)*
```typescript
// Usar queries SQL directas para actualizaciones
async updateEvent(id: number, updateData: UpdateEventDto) {
  return this.databaseService.query(
    'UPDATE schedule_events SET ... WHERE id = ?',
    [updateData, id]
  );
}
```

#### 🎯 Plan de Resolución

**Fase 1: Implementación Temporal** ✅ *COMPLETADO*
- [x] Usar queries SQL directas en `SchedulingService.updateEvent()`
- [x] Mantener validaciones en nivel de aplicación
- [x] Emitir eventos WebSocket después de actualización
- [x] Documentar limitación actual

**Fase 2: Solución Definitiva** ⏳ *PENDIENTE*
- [ ] Crear `sp_UpdateScheduleEvent` dedicado
- [ ] Implementar validaciones completas en SP
- [ ] Migrar servicio a usar nuevo SP
- [ ] Pruebas exhaustivas de actualización

#### 🚨 Impacto en Funcionalidad

**Funcionalidad Afectada**:
- ❌ `PUT /schedules/:id` - Actualización de eventos existentes

**Funcionalidad NO Afectada**:
- ✅ `POST /schedules` - Creación de eventos
- ✅ `GET /schedules` - Obtención de eventos
- ✅ `DELETE /schedules/:id` - Eliminación de eventos
- ✅ WebSocket - Comunicación en tiempo real

#### 📅 Timeline Estimado

**Prioridad**: MEDIA  
**Estimación**: 4-6 horas de desarrollo  
**Responsable**: Pendiente asignación  
**Fecha límite**: Q3 2025  

#### 🔧 Workaround Actual

Mientras se resuelve la deuda técnica, las actualizaciones de eventos funcionan usando:

1. **Validaciones de aplicación** en `SchedulingService`
2. **Queries SQL directas** en lugar de SP
3. **Emisión manual** de eventos WebSocket
4. **Logging detallado** para debugging

```typescript
// Implementación actual en SchedulingService
async updateEvent(id: number, updateEventDto: UpdateEventDto, userId: number) {
  // Validaciones manuales
  const validationResult = await this.validateEventData(updateEventDto);
  
  // Query SQL directa
  const result = await this.databaseService.query(
    'UPDATE schedule_events SET ? WHERE id = ? AND is_active = TRUE',
    [updateEventDto, id]
  );
  
  // Emisión manual de evento WebSocket
  this.schedulingGateway.emitEventUpdated(result.area_id, result);
  
  return result;
}
```

---

*Nota: Esta deuda técnica fue identificada y documentada el 17 de junio de 2025 durante las pruebas exhaustivas de stored procedures del punto 3.3 del plan de acción.*

## 📈 Roadmap

### Próximas Funcionalidades
1. Eventos recurrentes avanzados
2. Notificaciones por email
3. Integración con calendario
4. API de estadísticas
5. Exportación de horarios
6. Conflictos inteligentes
7. Reserva de aulas automática
