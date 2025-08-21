const XLSX = require('xlsx');
const path = require('path');

// Datos de prueba para ADOL
const adolData = [
  { SIGLA: 'ADOL001', DESCRIPCION: 'Profesor de Matemáticas' },
  { SIGLA: 'ADOL002', DESCRIPCION: 'Profesor de Física' },
  { SIGLA: 'ADOL003', DESCRIPCION: 'Profesor de Química' },
  { SIGLA: 'ADOL004', DESCRIPCION: 'Profesor de Historia' },
  { SIGLA: 'ADOL005', DESCRIPCION: 'Profesor de Inglés' }
];

console.log('Creando archivo Excel de prueba para ADOL...');
console.log(`Datos a incluir: ${adolData.length} registros`);

// Crear workbook
const wb = XLSX.utils.book_new();

// Crear worksheet con los datos
const ws = XLSX.utils.json_to_sheet(adolData);

// Agregar worksheet al workbook
XLSX.utils.book_append_sheet(wb, ws, 'ADOL');

// Guardar archivo
const filename = 'test-adol.xlsx';
XLSX.writeFile(wb, filename);

console.log(`✅ Archivo creado exitosamente: ${filename}`);
console.log('Estructura del archivo:');
console.log('- Hoja: ADOL');
console.log('- Columnas: SIGLA, DESCRIPCION');
console.log(`- Registros: ${adolData.length}`);
console.log('\nPuedes usar este archivo para probar la carga de ADOL.');