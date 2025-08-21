const XLSX = require('xlsx');
const path = require('path');

async function analyzeDolDuplicates() {
  try {
    console.log('=== ANÁLISIS DE DUPLICADOS EN DOL.XLSX ===');
    
    const filePath = 'D:\\desarrollo\\workspace\\Planificacion_academica\\Insumos de entrada\\DOL.xlsx';
    console.log(`Analizando archivo: ${filePath}`);
    
    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`Hoja de trabajo: ${sheetName}`);
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Total de registros en el archivo: ${data.length}`);
    
    // Mostrar primeros registros
    console.log('\n=== PRIMEROS 5 REGISTROS ===');
    data.slice(0, 5).forEach((row, index) => {
      console.log(`${index + 1}. PLAN: ${row.PLAN || row.plan}, SIGLA: ${row.SIGLA || row.sigla}, DESCRIPCION: ${row.DESCRIPCION || row.descripcion}`);
    });
    
    // Analizar duplicados por combinación sigla-plan
    console.log('\n=== ANÁLISIS DE DUPLICADOS (SIGLA + PLAN) ===');
    const combinations = new Map();
    const duplicates = [];
    
    data.forEach((row, index) => {
      const sigla = row.SIGLA || row.sigla;
      const plan = row.PLAN || row.plan;
      const key = `${sigla}-${plan}`;
      
      if (combinations.has(key)) {
        const firstOccurrence = combinations.get(key);
        duplicates.push({
          combination: key,
          firstIndex: firstOccurrence.index,
          firstRow: firstOccurrence.row,
          duplicateIndex: index,
          duplicateRow: row
        });
        console.log(`🔄 DUPLICADO ENCONTRADO:`);
        console.log(`   Combinación: ${key}`);
        console.log(`   Primera aparición (fila ${firstOccurrence.index + 1}): PLAN=${firstOccurrence.row.PLAN || firstOccurrence.row.plan}, SIGLA=${firstOccurrence.row.SIGLA || firstOccurrence.row.sigla}`);
        console.log(`   Duplicado (fila ${index + 1}): PLAN=${plan}, SIGLA=${sigla}`);
        console.log(`   Descripción 1: ${firstOccurrence.row.DESCRIPCION || firstOccurrence.row.descripcion}`);
        console.log(`   Descripción 2: ${row.DESCRIPCION || row.descripcion}`);
        console.log('');
      } else {
        combinations.set(key, { index, row });
      }
    });
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`Total registros procesados: ${data.length}`);
    console.log(`Combinaciones únicas (sigla-plan): ${combinations.size}`);
    console.log(`Duplicados encontrados: ${duplicates.length}`);
    console.log(`Registros que se guardarían en BD: ${combinations.size}`);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log('El archivo contiene registros duplicados con la misma combinación SIGLA-PLAN.');
      console.log('TypeORM sobrescribe los duplicados debido a la clave primaria compuesta.');
      console.log(`Por eso se procesan ${data.length} registros pero solo se guardan ${combinations.size}.`);
    } else {
      console.log('\n✅ No se encontraron duplicados.');
    }
    
    // Analizar duplicados solo por sigla
    console.log('\n=== ANÁLISIS DE DUPLICADOS SOLO POR SIGLA ===');
    const siglaMap = new Map();
    data.forEach((row, index) => {
      const sigla = row.SIGLA || row.sigla;
      if (siglaMap.has(sigla)) {
        siglaMap.get(sigla).push({ index, row });
      } else {
        siglaMap.set(sigla, [{ index, row }]);
      }
    });
    
    const siglaDuplicates = Array.from(siglaMap.entries()).filter(([sigla, occurrences]) => occurrences.length > 1);
    
    if (siglaDuplicates.length > 0) {
      console.log(`Siglas que aparecen múltiples veces: ${siglaDuplicates.length}`);
      siglaDuplicates.forEach(([sigla, occurrences]) => {
        console.log(`  SIGLA ${sigla}: ${occurrences.length} veces`);
        occurrences.forEach((occ, idx) => {
          console.log(`    ${idx + 1}. Fila ${occ.index + 1}: PLAN=${occ.row.PLAN || occ.row.plan}`);
        });
      });
    } else {
      console.log('Todas las siglas son únicas.');
    }
    
  } catch (error) {
    console.error('❌ Error analizando el archivo:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

analyzeDolDuplicates();