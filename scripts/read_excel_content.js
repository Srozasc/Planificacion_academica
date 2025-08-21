const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const filePath = path.join(__dirname, '..', 'test_multiple_plans_dol.xlsx');

console.log('=== ANÁLISIS DEL ARCHIVO EXCEL ===');
console.log('Ruta del archivo:', filePath);

try {
  // Leer el archivo
  const workbook = XLSX.readFile(filePath);
  
  // Obtener la primera hoja
  const sheetName = workbook.SheetNames[0];
  console.log('Nombre de la hoja:', sheetName);
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('\n=== CONTENIDO DEL ARCHIVO ===');
  console.log('Total de filas (sin encabezado):', data.length);
  
  console.log('\nRegistros encontrados:');
  data.forEach((row, index) => {
    console.log(`  ${index + 1}. SIGLA: ${row.SIGLA}, PLAN: ${row.PLAN}, DESCRIPCION: ${row.DESCRIPCION}`);
  });
  
  // Analizar duplicados por SIGLA
  const siglaCount = {};
  data.forEach(row => {
    const sigla = row.SIGLA;
    if (!siglaCount[sigla]) {
      siglaCount[sigla] = [];
    }
    siglaCount[sigla].push(row.PLAN);
  });
  
  console.log('\n=== ANÁLISIS DE SIGLAS ===');
  Object.keys(siglaCount).forEach(sigla => {
    const planes = siglaCount[sigla];
    console.log(`SIGLA ${sigla}: ${planes.length} plan(es) - [${planes.join(', ')}]`);
  });
  
  // Verificar si hay registros duplicados exactos
  const uniqueRecords = new Set();
  const duplicates = [];
  
  data.forEach((row, index) => {
    const key = `${row.SIGLA}-${row.PLAN}`;
    if (uniqueRecords.has(key)) {
      duplicates.push({ index: index + 1, ...row });
    } else {
      uniqueRecords.add(key);
    }
  });
  
  console.log('\n=== VERIFICACIÓN DE DUPLICADOS EXACTOS ===');
  if (duplicates.length > 0) {
    console.log('Registros duplicados encontrados:');
    duplicates.forEach(dup => {
      console.log(`  Fila ${dup.index}: SIGLA: ${dup.SIGLA}, PLAN: ${dup.PLAN}`);
    });
  } else {
    console.log('No se encontraron registros duplicados exactos (SIGLA + PLAN)');
  }
  
  console.log('\nRegistros únicos (SIGLA + PLAN):', uniqueRecords.size);
  
} catch (error) {
  console.error('Error leyendo el archivo Excel:', error.message);
}