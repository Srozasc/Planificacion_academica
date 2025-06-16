const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Crear directorio de archivos de prueba
const testDir = path.join(__dirname, 'test-files');
const validDir = path.join(testDir, 'valid');
const invalidDir = path.join(testDir, 'invalid');

// Crear directorios si no existen
[testDir, validDir, invalidDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Función para crear archivo Excel
function createExcelFile(data, filename, sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, path.join(validDir, filename));
  console.log(`✅ Creado: ${filename}`);
}

// 1. Estructura Académica
const academicData = [
  ["code", "name", "type", "credits", "plan_code", "semester", "prerequisites", "description", "hours_per_week", "is_active"],
  ["MAT101", "Matemáticas I", "subject", 4, "ING2024", 1, "", "Fundamentos de matemáticas", 6, true],
  ["FIS101", "Física I", "subject", 5, "ING2024", 1, "", "Mecánica clásica", 8, true],
  ["MAT102", "Matemáticas II", "subject", 4, "ING2024", 2, "MAT101", "Cálculo diferencial", 6, true],
  ["ING2024", "Ingeniería Civil", "plan", null, null, null, "", "Plan de estudios Ingeniería Civil", null, true],
  ["MOD01", "Módulo Básico", "module", null, "ING2024", null, "", "Módulo de materias básicas", null, true]
];

createExcelFile(academicData, 'test_academic_structures.xlsx', 'Academic Structures');

// 2. Profesores
const teachersData = [
  ["teacher_code", "full_name", "email", "phone", "department", "specialty", "hire_date", "status"],
  ["DOC001", "Juan Pérez González", "juan.perez@universidad.cl", "123456789", "Matemáticas", "Análisis Matemático", "2020-03-15", "active"],
  ["DOC002", "María González Silva", "maria.gonzalez@universidad.cl", "987654321", "Física", "Mecánica Cuántica", "2019-08-20", "active"],
  ["DOC003", "Carlos Rodríguez López", "carlos.rodriguez@universidad.cl", "555666777", "Química", "Química Orgánica", "2021-01-10", "active"],
  ["DOC004", "Ana Martínez Torres", "ana.martinez@universidad.cl", "444555666", "Matemáticas", "Geometría", "2018-09-05", "active"],
  ["DOC005", "Luis Fernández Ruiz", "luis.fernandez@universidad.cl", "333444555", "Física", "Termodinámica", "2022-02-28", "active"]
];

createExcelFile(teachersData, 'test_teachers.xlsx', 'Teachers');

// 3. Códigos de Pago
const paymentCodesData = [
  ["code", "description", "amount", "category", "semester", "year", "due_date", "is_active"],
  ["PAY001", "Matrícula Semestre 1", 500000, "matricula", 1, 2024, "2024-03-15", true],
  ["PAY002", "Arancel Mensual Marzo", 150000, "arancel", 1, 2024, "2024-03-05", true],
  ["PAY003", "Seguro Estudiantil", 25000, "seguro", 1, 2024, "2024-03-01", true],
  ["PAY004", "Matrícula Semestre 2", 500000, "matricula", 2, 2024, "2024-08-15", true],
  ["PAY005", "Laboratorio Física", 75000, "laboratorio", 1, 2024, "2024-04-01", true],
  ["PAY006", "Biblioteca Digital", 30000, "servicios", 1, 2024, "2024-03-20", true]
];

createExcelFile(paymentCodesData, 'test_payment_codes.xlsx', 'Payment Codes');

// 4. Reportes de Cursos
const courseReportsData = [
  ["course_code", "teacher_code", "semester", "year", "students_enrolled", "students_passed", "average_grade", "observations"],
  ["MAT101", "DOC001", 1, 2024, 45, 38, 5.2, "Buen rendimiento general"],
  ["FIS101", "DOC002", 1, 2024, 42, 35, 4.8, "Dificultades en laboratorio"],
  ["MAT102", "DOC001", 1, 2024, 40, 32, 5.0, "Requisitos de matemáticas cumplidos"],
  ["MAT101", "DOC004", 2, 2024, 48, 41, 5.5, "Excelente grupo de estudiantes"],
  ["FIS101", "DOC005", 2, 2024, 44, 39, 5.1, "Mejora en laboratorios"],
  ["MAT102", "DOC001", 2, 2024, 38, 35, 5.3, "Progreso notable del semestre anterior"]
];

createExcelFile(courseReportsData, 'test_course_reports.xlsx', 'Course Reports');

// 5. Archivo con datos inválidos para pruebas de validación
const invalidAcademicData = [
  ["code", "name", "type", "credits", "plan_code", "semester"],
  ["", "Sin código", "subject", 4, "ING2024", 1], // Código vacío
  ["MAT999", "", "subject", 4, "ING2024", 1], // Nombre vacío
  ["FIS999", "Física Inválida", "invalid_type", 4, "ING2024", 1], // Tipo inválido
  ["QUI999", "Química", "subject", -5, "ING2024", 1], // Créditos negativos
  ["BIO999", "Biología", "subject", 25, "ING2024", 1] // Créditos excesivos
];

createExcelFile(invalidAcademicData, 'test_invalid_academic_structures.xlsx', 'Invalid Data');

// 6. Crear archivo de texto inválido
fs.writeFileSync(
  path.join(invalidDir, 'test_invalid.txt'),
  'Este es un archivo de texto, no Excel.\nDebería ser rechazado por el sistema.'
);
console.log('✅ Creado: test_invalid.txt');

// 7. Crear archivo Excel vacío
const emptyData = [
  ["code", "name", "type", "credits", "plan_code", "semester"]
  // Sin datos, solo headers
];
createExcelFile(emptyData, 'test_empty_academic_structures.xlsx', 'Empty Data');

console.log('\n🎉 Todos los archivos de prueba han sido creados exitosamente!');
console.log('\n📁 Estructura creada:');
console.log('test-files/');
console.log('├── valid/');
console.log('│   ├── test_academic_structures.xlsx');
console.log('│   ├── test_teachers.xlsx');
console.log('│   ├── test_payment_codes.xlsx');
console.log('│   ├── test_course_reports.xlsx');
console.log('│   ├── test_invalid_academic_structures.xlsx');
console.log('│   └── test_empty_academic_structures.xlsx');
console.log('└── invalid/');
console.log('    └── test_invalid.txt');
console.log('\n🧪 Puedes usar estos archivos para probar los endpoints!');
