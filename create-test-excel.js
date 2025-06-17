const XLSX = require('xlsx');
const path = require('path');

// Datos de prueba para estructura académica
const data = [
  {
    'program_code': 'ADMI01',
    'program_name': 'Administración de Empresas',
    'faculty': 'Ciencias Económicas',
    'level': 'Pregrado',
    'duration_semesters': 8
  },
  {
    'program_code': 'CONT01',
    'program_name': 'Contaduría Pública',
    'faculty': 'Ciencias Económicas',
    'level': 'Pregrado',
    'duration_semesters': 8
  },
  {
    'program_code': 'SIST01',
    'program_name': 'Ingeniería de Sistemas',
    'faculty': 'Ingeniería',
    'level': 'Pregrado',
    'duration_semesters': 10
  },
  {
    'program_code': 'MED01',
    'program_name': 'Medicina',
    'faculty': 'Ciencias de la Salud',
    'level': 'Pregrado',
    'duration_semesters': 12
  },
  {
    'program_code': 'DER01',
    'program_name': 'Derecho',
    'faculty': 'Ciencias Jurídicas',
    'level': 'Pregrado',
    'duration_semesters': 10
  }
];

// Crear libro de trabajo
const wb = XLSX.utils.book_new();

// Crear hoja de trabajo
const ws = XLSX.utils.json_to_sheet(data);

// Agregar la hoja al libro
XLSX.utils.book_append_sheet(wb, ws, 'Estructura Académica');

// Guardar el archivo
const filePath = path.join(__dirname, 'test-academic-structure.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Archivo Excel creado exitosamente: ${filePath}`);
