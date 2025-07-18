# Templates - Plantillas Oficiales

Esta carpeta contiene las plantillas oficiales para cargas masivas del sistema académico.

## 📄 Plantillas Disponibles

### `plantilla_codigos_pago.xlsx`
Plantilla oficial para la carga masiva de códigos de pago.

**Campos requeridos:**
- `code` - Código único del tipo de pago
- `name` - Nombre descriptivo del código  
- `category` - Categoría (docente, administrativo, academico)
- `type` - Tipo de código (categoria, bono, etc.)

**Campos opcionales:**
- `factor` - Factor multiplicador (decimal)
- `base_amount` - Monto base (número)
- `is_active` - Estado activo/inactivo (true/false)
- `requires_hours` - Requiere horas (true/false) 
- `is_taxable` - Afecto a impuestos (true/false)
- `valid_from` - Fecha inicio validez (YYYY-MM-DD)
- `valid_until` - Fecha fin validez (YYYY-MM-DD)

## 🔄 Regenerar Plantillas

Para regenerar las plantillas ejecutar:

```bash
node scripts/generators/create-official-payment-codes-template.js
```

## ✅ Estado

✅ Plantilla validada y funcional  
✅ Compatible con el sistema de cargas masivas  
✅ Estructura de campos confirmada  

Ver documentación completa en: `/Documentacion/RESOLUCION_PROBLEMAS_CARGAS_MASIVAS.md`
