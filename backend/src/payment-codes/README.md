# API Payment Codes - Documentación

## Endpoints Disponibles

### Autenticación Requerida
Todos los endpoints requieren autenticación JWT. Incluir el token en el header:
```
Authorization: Bearer <your-jwt-token>
```

### Roles y Permisos
- **admin**: Acceso completo (crear, leer, actualizar, eliminar)
- **coordinador**: Crear, leer, actualizar, activar/desactivar
- **profesor**: Solo lectura

---

## 1. Obtener todos los códigos de pago

**GET** `/payment-codes`

**Query Parameters:**
- `category` (opcional): `docente`, `administrativo`, `otro`
- `type` (opcional): `categoria`, `contrato`, `bono`, `descuento`, `hora`
- `active` (opcional): `true` para solo códigos activos

**Ejemplos:**
```bash
GET /payment-codes
GET /payment-codes?category=docente
GET /payment-codes?type=categoria
GET /payment-codes?active=true
```

---

## 2. Obtener códigos por categoría

**GET** `/payment-codes/categories/{category}`

**Parámetros:**
- `category`: `docente`, `administrativo`, `otro`

**Ejemplo:**
```bash
GET /payment-codes/categories/docente
```

---

## 3. Obtener códigos por tipo

**GET** `/payment-codes/types/{type}`

**Parámetros:**
- `type`: `categoria`, `contrato`, `bono`, `descuento`, `hora`

**Ejemplo:**
```bash
GET /payment-codes/types/categoria
```

---

## 4. Obtener códigos activos

**GET** `/payment-codes/active`

Retorna solo los códigos que están activos y dentro de su período de validez.

---

## 5. Obtener código por nombre

**GET** `/payment-codes/code/{codeName}`

**Parámetros:**
- `codeName`: Nombre del código (ej: `DOC1`, `BON1`)

**Ejemplo:**
```bash
GET /payment-codes/code/DOC1
```

---

## 6. Obtener código por ID

**GET** `/payment-codes/{id}`

**Parámetros:**
- `id`: ID numérico del código

---

## 7. Crear nuevo código

**POST** `/payment-codes`

**Roles:** admin, coordinador

**Body:**
```json
{
  "code_name": "DOC6",
  "description": "Profesor Emérito",
  "factor": 2.0000,
  "base_amount": 3000000.00,
  "category": "docente",
  "type": "categoria",
  "is_active": true,
  "requires_hours": false,
  "is_taxable": true,
  "valid_from": "2025-01-01",
  "valid_until": "2025-12-31"
}
```

---

## 8. Actualizar código

**PATCH** `/payment-codes/{id}`

**Roles:** admin, coordinador

**Body:** (campos opcionales)
```json
{
  "description": "Nueva descripción",
  "factor": 1.8000,
  "base_amount": 2800000.00
}
```

---

## 9. Activar código

**PATCH** `/payment-codes/{id}/activate`

**Roles:** admin, coordinador

---

## 10. Desactivar código

**PATCH** `/payment-codes/{id}/deactivate`

**Roles:** admin, coordinador

---

## 11. Eliminar código (soft delete)

**DELETE** `/payment-codes/{id}`

**Roles:** admin

---

## Estructura de Respuesta

```json
{
  "id": 1,
  "code_name": "DOC1",
  "description": "Profesor Titular",
  "factor": 1.5000,
  "base_amount": 2500000.00,
  "category": "docente",
  "type": "categoria",
  "is_active": true,
  "requires_hours": false,
  "is_taxable": true,
  "valid_from": null,
  "valid_until": null,
  "created_at": "2025-06-16T05:30:00.000Z",
  "updated_at": "2025-06-16T05:30:00.000Z",
  "is_valid": true
}
```

## Códigos de Ejemplo en la Base de Datos

### Categorías Docentes
- `DOC1`: Profesor Titular (factor: 1.5000)
- `DOC2`: Profesor Asociado (factor: 1.3000)
- `DOC3`: Profesor Asistente (factor: 1.1000)
- `DOC4`: Profesor Instructor (factor: 1.0000)
- `DOC5`: Profesor Hora (factor: 0.8000, requiere horas)

### Tipos de Contrato
- `CONT1`: Contrato Indefinido (factor: 1.0000)
- `CONT2`: Contrato a Plazo Fijo (factor: 0.9500)
- `CONT3`: Honorarios (factor: 0.9000)
- `CONT4`: Reemplazo (factor: 0.8500)

### Bonos
- `BON1`: Bono Coordinación ($300,000)
- `BON2`: Bono Investigación ($200,000)
- `BON3`: Bono Extensión ($150,000)
- `BON4`: Bono Perfeccionamiento ($100,000)

### Horas Académicas
- `HORA1`: Hora Cátedra Diurna ($15,000, requiere horas)
- `HORA2`: Hora Cátedra Vespertina ($15,000 * 1.1, requiere horas)
- `HORA3`: Hora Cátedra Nocturna ($15,000 * 1.2, requiere horas)
- `HORA4`: Hora Laboratorio ($15,000 * 1.3, requiere horas)
