const XLSX = require('xlsx');
const fs = require('fs');

// Función para analizar los datos exactos del archivo DOL
function analyzeDolFile() {
  console.log('=== ANÁLISIS DETALLADO DE DATOS DOL ===');
  
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile('d:\\desarrollo\\workspace\\Planificacion_academica\\Insumos de entrada\\DOL.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Total registros en archivo: ${data.length}`);
    console.log('\n=== DATOS CRUDOS DEL ARCHIVO ===');
    
    data.forEach((row, index) => {
      console.log(`\nRegistro ${index + 1}:`);
      console.log(`  PLAN: ${JSON.stringify(row.PLAN)} (tipo: ${typeof row.PLAN})`);
      console.log(`  SIGLA: ${JSON.stringify(row.SIGLA)} (tipo: ${typeof row.SIGLA})`);
      console.log(`  DESCRIPCION: ${JSON.stringify(row.DESCRIPCION)} (tipo: ${typeof row.DESCRIPCION})`);
      
      // Verificar valores alternativos
      if (row.plan !== undefined) console.log(`  plan (minúscula): ${JSON.stringify(row.plan)}`);
      if (row.sigla !== undefined) console.log(`  sigla (minúscula): ${JSON.stringify(row.sigla)}`);
      if (row.descripcion !== undefined) console.log(`  descripcion (minúscula): ${JSON.stringify(row.descripcion)}`);
    });
    
    console.log('\n=== ANÁLISIS DE REGISTROS DOL006 ===');
    const dol006Records = data.filter(row => 
      (row.SIGLA || row.sigla) === 'DOL006'
    );
    
    console.log(`Registros DOL006 encontrados: ${dol006Records.length}`);
    dol006Records.forEach((record, index) => {
      console.log(`\nDOL006 #${index + 1}:`);
      console.log(`  PLAN: ${JSON.stringify(record.PLAN)} (tipo: ${typeof record.PLAN})`);
      console.log(`  SIGLA: ${JSON.stringify(record.SIGLA)} (tipo: ${typeof record.SIGLA})`);
      console.log(`  DESCRIPCION: ${JSON.stringify(record.DESCRIPCION)} (tipo: ${typeof record.DESCRIPCION})`);
      
      // Verificar si PLAN es null, undefined, o string vacío
      const plan = record.PLAN || record.plan;
      if (plan === null) console.log('  ⚠️  PLAN es null');
      if (plan === undefined) console.log('  ⚠️  PLAN es undefined');
      if (plan === '') console.log('  ⚠️  PLAN es string vacío');
      if (typeof plan === 'string' && plan.trim() === '') console.log('  ⚠️  PLAN es string con solo espacios');
    });
    
    console.log('\n=== SIMULACIÓN DE PROCESAMIENTO ===');
    const processedRecords = [];
    
    data.forEach((row, index) => {
      const processed = {
        PLAN: row.PLAN || row.plan || null,
        SIGLA: row.SIGLA || row.sigla,
        DESCRIPCION: row.DESCRIPCION || row.descripcion
      };
      
      console.log(`\nProcesando registro ${index + 1}:`);
      console.log(`  Original PLAN: ${JSON.stringify(row.PLAN)}`);
      console.log(`  Procesado PLAN: ${JSON.stringify(processed.PLAN)}`);
      console.log(`  SIGLA: ${processed.SIGLA}`);
      
      processedRecords.push(processed);
    });
    
    console.log('\n=== VERIFICACIÓN DE DUPLICADOS EN DATOS PROCESADOS ===');
    const combinations = new Map();
    
    processedRecords.forEach((record, index) => {
      const key = `${record.SIGLA}-${record.PLAN}`;
      
      if (combinations.has(key)) {
        console.log(`\n🚨 DUPLICADO ENCONTRADO:`);
        console.log(`  Clave: ${key}`);
        console.log(`  Primer registro: índice ${combinations.get(key)}`);
        console.log(`  Segundo registro: índice ${index}`);
        console.log(`  Datos primer registro:`, processedRecords[combinations.get(key)]);
        console.log(`  Datos segundo registro:`, record);
      } else {
        combinations.set(key, index);
      }
    });
    
    console.log(`\nTotal combinaciones únicas: ${combinations.size}`);
    console.log(`Total registros procesados: ${processedRecords.length}`);
    
    if (combinations.size < processedRecords.length) {
      console.log(`\n⚠️  HAY ${processedRecords.length - combinations.size} DUPLICADOS EN LOS DATOS PROCESADOS`);
    } else {
      console.log(`\n✅ NO HAY DUPLICADOS EN LOS DATOS PROCESADOS`);
    }
    
    console.log('\n=== ANÁLISIS ESPECÍFICO DOL006 PROCESADO ===');
    const processedDol006 = processedRecords.filter(record => record.SIGLA === 'DOL006');
    processedDol006.forEach((record, index) => {
      console.log(`\nDOL006 procesado #${index + 1}:`);
      console.log(`  PLAN: ${JSON.stringify(record.PLAN)}`);
      console.log(`  SIGLA: ${record.SIGLA}`);
      console.log(`  Clave compuesta: ${record.SIGLA}-${record.PLAN}`);
    });
    
  } catch (error) {
    console.error('Error analizando archivo:', error.message);
  }
}

// Ejecutar análisis
analyzeDolFile();