# API Course Reports Data - Documentación

## Endpoints Disponibles

### Autenticación Requerida
Todos los endpoints requieren autenticación JWT. Incluir el token en el header:
```
Authorization: Bearer <your-jwt-token>
```

### Roles y Permisos
- **Administrador**: Acceso completo (crear, leer, actualizar, eliminar, validar)
- **Director/Jefe de Programa**: Crear, leer, actualizar, validar/invalidar
- **Usuario Lector**: Solo lectura

---

## 1. Obtener todos los reportes de curso

**GET** `/course-reports`

**Query Parameters:**
- `year` (opcional): Año académico (ej: 2025)
- `term` (opcional): `1`, `2`, `anual`, `intensivo`
- `modality` (opcional): `presencial`, `online`, `mixta`
- `academic_structure_id` (opcional): ID de la estructura académica
- `is_validated` (opcional): `true`/`false` para filtrar por validación
- `section` (opcional): Sección específica (A, B, C, etc.)
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 20)

**Ejemplos:**
```bash
GET /course-reports
GET /course-reports?year=2025&term=1
GET /course-reports?modality=online&is_validated=true
GET /course-reports?academic_structure_id=1&page=1&limit=10
```

---

## 2. Obtener reportes por período

**GET** `/course-reports/period/{year}/{term}`

**Parámetros:**
- `year`: Año académico
- `term`: `1`, `2`, `anual`, `intensivo`

**Ejemplo:**
```bash
GET /course-reports/period/2025/1
```

---

## 3. Obtener reportes por estructura académica

**GET** `/course-reports/academic-structure/{id}`

**Parámetros:**
- `id`: ID de la estructura académica

**Ejemplo:**
```bash
GET /course-reports/academic-structure/1
```

---

## 4. Obtener reportes pendientes de validación

**GET** `/course-reports/pending-validation`

**Roles:** Administrador, Director/Jefe de Programa

Retorna todos los reportes que aún no han sido validados.

---

## 5. Obtener estadísticas por período

**GET** `/course-reports/statistics/period/{year}`

**Parámetros:**
- `year`: Año académico

**Query Parameters:**
- `term` (opcional): Filtrar por término específico

**Ejemplo:**
```bash
GET /course-reports/statistics/period/2025
GET /course-reports/statistics/period/2025?term=1
```

**Respuesta:**
```json
{
  "total_courses": 15,
  "total_students": 450,
  "total_enrolled": 480,
  "total_passed": 350,
  "total_failed": 80,
  "total_withdrawn": 50,
  "average_approval_rate": 72.92,
  "average_retention_rate": 89.58
}
```

---

## 6. Obtener reporte por ID

**GET** `/course-reports/{id}`

**Parámetros:**
- `id`: ID numérico del reporte

---

## 7. Crear nuevo reporte

**POST** `/course-reports`

**Roles:** Administrador, Director/Jefe de Programa

**Body:**
```json
{
  "academic_structure_id": 1,
  "student_count": 45,
  "term": "1",
  "year": 2025,
  "section": "A",
  "modality": "presencial",
  "enrolled_count": 50,
  "passed_count": 35,
  "failed_count": 10,
  "withdrawn_count": 5,
  "weekly_hours": 6.0,
  "total_hours": 108.0,
  "notes": "Curso con buen rendimiento académico"
}
```

---

## 8. Actualizar reporte

**PATCH** `/course-reports/{id}`

**Roles:** Administrador, Director/Jefe de Programa

**Body:** (campos opcionales)
```json
{
  "student_count": 48,
  "passed_count": 38,
  "failed_count": 8,
  "withdrawn_count": 2,
  "notes": "Datos actualizados después del cierre"
}
```

---

## 9. Validar reporte

**PATCH** `/course-reports/{id}/validate`

**Roles:** Administrador, Director/Jefe de Programa

Marca el reporte como validado por el usuario autenticado.

---

## 10. Invalidar reporte

**PATCH** `/course-reports/{id}/invalidate`

**Roles:** Administrador, Director/Jefe de Programa

Marca el reporte como no validado.

---

## 11. Eliminar reporte (soft delete)

**DELETE** `/course-reports/{id}`

**Roles:** Administrador

---

## Estructura de Respuesta

```json
{
  "id": 1,
  "academic_structure_id": 1,
  "student_count": 45,
  "term": "1",
  "year": 2025,
  "section": "A",
  "modality": "presencial",
  "enrolled_count": 50,
  "passed_count": 35,
  "failed_count": 10,
  "withdrawn_count": 5,
  "weekly_hours": 6.0,
  "total_hours": 108.0,
  "is_validated": true,
  "validated_by": 1,
  "validated_at": "2025-06-16T10:30:00.000Z",
  "notes": "Curso con alto rendimiento académico",
  "created_at": "2025-06-16T08:00:00.000Z",
  "updated_at": "2025-06-16T10:30:00.000Z",
  "academic_structure": {
    "id": 1,
    "name": "Matemática I",
    "code": "MAT101",
    "level": "undergraduate",
    "area": "ciencias"
  },
  "full_period_name": "Primer Semestre 2025 - Sección A",
  "approval_rate": 70.0,
  "retention_rate": 90.0,
  "failure_rate": 20.0,
  "completed_count": 45,
  "is_data_complete": true,
  "is_period_active": true
}
```

## Campos Calculados

- **`full_period_name`**: Nombre completo del período (ej: "Primer Semestre 2025 - Sección A")
- **`approval_rate`**: Porcentaje de aprobación (aprobados/matriculados * 100)
- **`retention_rate`**: Porcentaje de retención (no retirados/matriculados * 100)
- **`failure_rate`**: Porcentaje de reprobación (reprobados/matriculados * 100)
- **`completed_count`**: Total de estudiantes que completaron (aprobados + reprobados)
- **`is_data_complete`**: Si todos los datos estadísticos están completos
- **`is_period_active`**: Si el período es del año actual o futuro

## Validaciones

### Consistencia de Datos
- La suma de aprobados + reprobados + retirados no puede exceder los matriculados
- Todos los conteos deben ser números positivos o null
- Las horas semanales y totales deben ser positivas si se proporcionan
- El año debe estar entre 2020 y 2050

### Restricciones Únicas
- No pueden existir dos reportes para la misma estructura académica, año, término y sección

## Enums Disponibles

### CourseTerm
- `1`: Primer Semestre
- `2`: Segundo Semestre  
- `anual`: Curso Anual
- `intensivo`: Curso Intensivo

### CourseModality
- `presencial`: Modalidad Presencial
- `online`: Modalidad Online
- `mixta`: Modalidad Mixta (Blended)
