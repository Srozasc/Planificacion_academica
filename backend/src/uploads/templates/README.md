# Plantillas de Excel para Carga Masiva

Este directorio contiene las plantillas de Excel que deben usarse para las cargas masivas de datos.

## Formatos de Archivo Soportados

- **.xlsx** (Excel 2007 y posteriores) - Recomendado
- **.xls** (Excel 97-2003) - Soportado

## Plantillas Disponibles

### 1. Estructuras Académicas (`academic_structures_template.xlsx`)

**Columnas requeridas:**
- `codigo` o `code` - Código único de la estructura
- `nombre` o `name` - Nombre de la estructura
- `tipo` o `type` - Tipo: subject, plan, module

**Columnas opcionales:**
- `creditos` o `credits` - Número de créditos (0-20)
- `codigo_plan` o `plan_code` - Código del plan padre
- `semestre` o `semester` - Semestre (1-10)
- `prerequisitos` o `prerequisites` - Códigos separados por coma
- `descripcion` o `description` - Descripción
- `horas_semanales` o `hours_per_week` - Horas semanales (0-50)
- `activo` o `is_active` - Estado activo (true/false)

### 2. Docentes (`teachers_template.xlsx`)

**Columnas requeridas:**
- `rut` - RUT chileno con formato 12345678-9
- `nombre` o `name` - Nombre completo
- `email` o `correo` - Email único

**Columnas opcionales:**
- `telefono` o `phone` - Teléfono
- `direccion` o `address` - Dirección
- `codigo_categoria` o `category_code` - Código de categoría
- `codigo_contrato` o `contract_type_code` - Código tipo contrato
- `horas_contrato` o `contract_hours` - Horas contratadas (0-44)
- `max_horas_semana` o `max_hours_per_week` - Máx horas/semana (0-60)
- `fecha_contratacion` o `hire_date` - Fecha contratación
- `activo` o `is_active` - Estado activo (true/false)

### 3. Códigos de Pago (`payment_codes_template.xlsx`)

**Columnas requeridas:**
- `codigo` o `code` - Código único
- `nombre` o `name` - Nombre del código

**Columnas opcionales:**
- `categoria` o `category` - Categoría: teaching, coordination, evaluation
- `tipo_contrato` o `contract_type` - Tipo: full_time, part_time, hourly
- `valor_hora` o `hourly_rate` - Valor por hora
- `horas_minimas` o `min_hours` - Horas mínimas
- `horas_maximas` o `max_hours` - Horas máximas
- `valido_desde` o `valid_from` - Fecha válido desde
- `valido_hasta` o `valid_until` - Fecha válido hasta
- `descripcion` o `description` - Descripción
- `activo` o `is_active` - Estado activo (true/false)

### 4. Reportes de Cursables (`course_reports_template.xlsx`)

**Columnas requeridas:**
- `id_estructura` o `academic_structure_id` - ID estructura académica
- `periodo` o `term` - Período: 1, 2, anual, intensivo
- `ano` o `year` - Año académico (2020-2050)

**Columnas opcionales:**
- `estudiantes_cursables` o `student_count` - Cantidad estudiantes cursables
- `seccion` o `section` - Sección (A, B, C, etc.)
- `modalidad` o `modality` - Modalidad: presencial, online, mixta
- `matriculados` o `enrolled_count` - Estudiantes matriculados
- `aprobados` o `passed_count` - Estudiantes aprobados
- `reprobados` o `failed_count` - Estudiantes reprobados
- `retirados` o `withdrawn_count` - Estudiantes retirados
- `horas_semanales` o `weekly_hours` - Horas semanales
- `horas_totales` o `total_hours` - Horas totales
- `validado` o `is_validated` - Si está validado (true/false)
- `observaciones` o `notes` - Observaciones

## Instrucciones de Uso

1. **Descarga la plantilla** correspondiente al tipo de datos que deseas cargar
2. **Completa los datos** en las columnas correspondientes
3. **Guarda el archivo** en formato Excel (.xlsx recomendado)
4. **Sube el archivo** usando el endpoint correspondiente en la API

## Validaciones

- Los archivos no pueden exceder **10MB**
- Solo se aceptan archivos **Excel** (.xlsx, .xls)
- La **primera fila** debe contener los encabezados
- Los **campos requeridos** no pueden estar vacíos
- Los datos deben cumplir con las **validaciones de negocio** definidas

## Modos de Operación

- **INSERT_ONLY**: Solo insertar registros nuevos
- **UPDATE_ONLY**: Solo actualizar registros existentes
- **UPSERT**: Insertar nuevos y actualizar existentes (por defecto)

## Endpoints de API

- `POST /uploads/academic-structures` - Carga estructuras académicas
- `POST /uploads/teachers` - Carga docentes
- `POST /uploads/payment-codes` - Carga códigos de pago
- `POST /uploads/course-reports` - Carga reportes de cursables
