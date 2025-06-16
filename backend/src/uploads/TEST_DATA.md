# Datos de Prueba para Testing

## 📊 Archivos Excel de Prueba

### **1. test_academic_structures.xlsx**
**Contenido (crear en Excel):**
```
| code    | name              | type    | credits | plan_code | semester |
|---------|-------------------|---------|---------|-----------|----------|
| MAT101  | Matemáticas I     | subject | 4       | ING2024   | 1        |
| FIS101  | Física I          | subject | 5       | ING2024   | 1        |
| ING2024 | Ingeniería Civil  | plan    |         |           |          |
| MOD01   | Módulo Básico     | module  |         | ING2024   |          |
```

### **2. test_teachers.xlsx**
**Contenido:**
```
| teacher_code | full_name        | email                | phone      | department |
|--------------|------------------|----------------------|------------|------------|
| DOC001       | Juan Pérez       | juan.perez@uni.cl    | 123456789  | Matemática |
| DOC002       | María González   | maria.gonzalez@uni.cl| 987654321  | Física     |
| DOC003       | Carlos Rodríguez | carlos.rodriguez@uni.cl| 555666777| Química    |
```

### **3. test_payment_codes.xlsx**
**Contenido:**
```
| code    | description          | amount | category  | semester | year |
|---------|---------------------|--------|-----------|----------|------|
| PAY001  | Matrícula Semestre 1| 500000 | matricula | 1        | 2024 |
| PAY002  | Arancel Mensual     | 150000 | arancel   | 1        | 2024 |
| PAY003  | Seguro Estudiantil  | 25000  | seguro    | 1        | 2024 |
```

### **4. test_course_reports.xlsx**
**Contenido:**
```
| course_code | teacher_code | semester | year | students_enrolled | students_passed | average_grade |
|-------------|--------------|----------|------|-------------------|-----------------|---------------|
| MAT101      | DOC001       | 1        | 2024 | 45                | 38              | 5.2           |
| FIS101      | DOC002       | 1        | 2024 | 42                | 35              | 4.8           |
| MAT101      | DOC001       | 2        | 2024 | 48                | 41              | 5.5           |
```

## 🔧 Cómo crear los archivos

### **Opción 1: Usando Excel/LibreOffice**
1. Abrir Excel o LibreOffice Calc
2. Copiar los datos de las tablas anteriores
3. Guardar como .xlsx en `backend/test-files/`

### **Opción 2: Usando un script de Node.js**
```javascript
// create-test-files.js
const XLSX = require('xlsx');

// Datos de estructura académica
const academicData = [
  ["code", "name", "type", "credits", "plan_code", "semester"],
  ["MAT101", "Matemáticas I", "subject", 4, "ING2024", 1],
  ["FIS101", "Física I", "subject", 5, "ING2024", 1],
  ["ING2024", "Ingeniería Civil", "plan", null, null, null],
  ["MOD01", "Módulo Básico", "module", null, "ING2024", null]
];

// Crear libro de trabajo
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(academicData);
XLSX.utils.book_append_sheet(wb, ws, "Academic Structures");

// Guardar archivo
XLSX.writeFile(wb, "./test-files/test_academic_structures.xlsx");
console.log("Archivo test_academic_structures.xlsx creado");
```

### **Opción 3: Archivos CSV (convertibles a Excel)**
```bash
# Crear directorio de pruebas
mkdir -p test-files

# Crear CSV que luego puedes convertir a Excel
cat > test-files/test_teachers.csv << EOF
teacher_code,full_name,email,phone,department
DOC001,Juan Pérez,juan.perez@uni.cl,123456789,Matemática
DOC002,María González,maria.gonzalez@uni.cl,987654321,Física
DOC003,Carlos Rodríguez,carlos.rodriguez@uni.cl,555666777,Química
EOF
```

## 🧪 Archivos de Prueba para Validaciones

### **test_invalid.txt** (para probar rechazo)
```
Este es un archivo de texto, no Excel
Debería ser rechazado por el sistema
```

### **test_empty.xlsx** (archivo Excel vacío)
- Archivo Excel con solo headers, sin datos
- Para probar manejo de archivos vacíos

### **test_malformed.xlsx** (datos incorrectos)
```
| code | name | type     | credits |
|------|------|----------|---------|
| 123  |      | invalid  | texto   |  # Datos inválidos
|      | Sin código | subject | -5   |  # Datos faltantes/inválidos
```

## 📁 Estructura de archivos de prueba

```
backend/
├── test-files/
│   ├── valid/
│   │   ├── test_academic_structures.xlsx
│   │   ├── test_teachers.xlsx
│   │   ├── test_payment_codes.xlsx
│   │   └── test_course_reports.xlsx
│   ├── invalid/
│   │   ├── test_invalid.txt
│   │   ├── test_large_file.xlsx (>10MB)
│   │   └── test_malformed.xlsx
│   └── edge-cases/
│       ├── test_empty.xlsx
│       ├── test_special_chars.xlsx
│       └── test_unicode.xlsx
```

## 🎯 Scripts de automatización

### **create-test-files.sh**
```bash
#!/bin/bash
echo "Creando archivos de prueba..."

# Crear directorio
mkdir -p test-files/valid test-files/invalid test-files/edge-cases

# Archivo inválido
echo "No soy un Excel" > test-files/invalid/test_invalid.txt

# Archivo grande (>10MB)
dd if=/dev/zero of=test-files/invalid/test_large_file.xlsx bs=1M count=15

echo "Archivos de prueba creados en test-files/"
echo "Ahora necesitas crear los archivos Excel manualmente o usar el script de Node.js"
```

¿Te gustaría que empecemos creando estos archivos de prueba o prefieres que probemos directamente con los endpoints?
