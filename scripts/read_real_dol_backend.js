const XLSX = require('xlsx');
const path = require('path');

function readRealDOL() {
  try {
    const filePath = path.join(__dirname, '..', 'Insumos de entrada', 'DOL.xlsx');
    console.log('Leyendo archivo:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('=== CONTENIDO DEL ARCHIVO REAL DOL.xlsx ===');
    console.log(`Total de filas: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\n=== ENCABEZADOS ===');
      console.log(data[0]);
      
      console.log('\n=== PRIMERAS 10 FILAS DE DATOS ===');
      for (let i = 1; i < Math.min(data.length, 11); i++) {
        console.log(`Fila ${i}:`, data[i]);
      }
      
      // Análisis de siglas únicas
      const siglas = new Set();
      const planes = new Set();
      const combinaciones = new Set();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i] && data[i].length >= 2) {
          const sigla = data[i][0];
          const plan = data[i][1];
          
          if (sigla) siglas.add(sigla);
          if (plan) planes.add(plan);
          if (sigla && plan) combinaciones.add(`${sigla}-${plan}`);
        }
      }
      
      console.log('\n=== ANÁLISIS ===');
      console.log(`Siglas únicas: ${siglas.size}`);
      console.log(`Planes únicos: ${planes.size}`);
      console.log(`Combinaciones SIGLA-PLAN únicas: ${combinaciones.size}`);
      console.log(`Filas de datos (sin encabezado): ${data.length - 1}`);
      
      console.log('\n=== SIGLAS ENCONTRADAS ===');
      Array.from(siglas).sort().forEach(sigla => console.log(`  - ${sigla}`));
    }
    
  } catch (error) {
    console.error('Error al leer el archivo:', error.message);
  }
}

readRealDOL();