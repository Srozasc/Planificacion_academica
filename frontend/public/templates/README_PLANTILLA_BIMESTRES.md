# Plantilla de Configuración de Bimestres

## Descripción
Esta plantilla Excel permite la carga masiva de bimestres en el sistema de Planificación Académica.

## Estructura del Archivo

La plantilla debe contener **exactamente 5 bimestres** con las siguientes columnas:

| Columna | Descripción | Formato | Ejemplo |
|---------|-------------|---------|----------|
| **Número** | Número del bimestre (1-5) | Entero | 1 |
| **Año** | Año académico | Entero (2020-2030) | 2025 |
| **Fecha_Inicio** | Fecha de inicio del bimestre | DD-MM-YYYY | 01-02-2025 |
| **Fecha_Fin** | Fecha de fin del bimestre | DD-MM-YYYY | 31-03-2025 |
| **Pago1_Inicio** | Inicio del primer período de pago | DD-MM-YYYY | 01-02-2025 |
| **Pago1_Fin** | Fin del primer período de pago | DD-MM-YYYY | 15-02-2025 |
| **Pago2_Inicio** | Inicio del segundo período de pago | DD-MM-YYYY | 16-02-2025 |
| **Pago2_Fin** | Fin del segundo período de pago | DD-MM-YYYY | 28-02-2025 |
| **Descripción** | Descripción del bimestre | Texto | Primer bimestre 2025 |
| **Factor** | Factor multiplicador | Decimal | 1.0 |

## Validaciones del Sistema

### Campos Obligatorios
- Todos los campos son obligatorios
- El archivo debe contener exactamente 5 filas de datos (más el encabezado)

### Validaciones de Fechas
- Formato: DD-MM-YYYY (ejemplo: 15-03-2025)
- Fecha_Inicio debe ser menor que Fecha_Fin
- No puede haber solapamiento entre bimestres del mismo año
- Pago1_Inicio debe ser menor que Pago1_Fin
- Pago2_Inicio debe ser menor que Pago2_Fin

### Validaciones de Datos
- **Número**: Debe ser secuencial (1, 2, 3, 4, 5)
- **Año**: Entre 2020 y 2030
- **Factor**: Número decimal entre 0 y 9999 (puede usar coma como separador decimal)

### Restricciones del Sistema
- No pueden existir bimestres previos para el año académico especificado
- Si ya existen bimestres para un año, deben eliminarse antes de la carga masiva

## Archivos Disponibles

1. **plantilla_bimestres.xlsx** - Plantilla oficial para descargar desde la aplicación
2. **Calendario_Bimestres.xlsx** - Archivo de ejemplo actualizado
3. **Calendario_Bimestres_backup.xlsx** - Respaldo del archivo original

## Uso en la Aplicación

1. Descargar la plantilla desde el botón "Descargar Plantilla" en la configuración de bimestres
2. Completar los datos siguiendo la estructura especificada
3. Subir el archivo usando la función "Carga Masiva desde Excel"
4. El sistema validará automáticamente la estructura y datos
5. Si hay errores, se mostrarán mensajes específicos para cada problema

## Mensajes de Error Comunes

- **"El archivo debe contener exactamente 5 bimestres"**: Verificar que hay 5 filas de datos
- **"Encabezado incorrecto"**: Los nombres de las columnas deben coincidir exactamente
- **"Formato de fecha inválido"**: Usar formato DD-MM-YYYY
- **"Ya existen bimestres para el año académico"**: Eliminar bimestres existentes primero
- **"Las fechas se solapan"**: Verificar que no hay solapamiento entre períodos

## Notas Técnicas

- El sistema genera automáticamente el nombre del bimestre como "Bimestre {Año} {Número}"
- Los bimestres se crean como inactivos por defecto
- El factor puede usar coma (,) o punto (.) como separador decimal
- Las fechas se procesan en zona horaria local