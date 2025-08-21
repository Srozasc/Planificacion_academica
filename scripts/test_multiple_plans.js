const mysql = require('mysql2/promise');
const fs = require('fs');
const XLSX = require('xlsx');

async function testMultiplePlans() {
  let connection;
  
  try {
    console.log('🧪 Iniciando prueba de múltiples planes para la misma sigla...');
    
    // Crear datos de prueba con la misma sigla en diferentes planes
    const testData = [
      { SIGLA: 'TEST001', PLAN: '1114401', DESCRIPCION: 'Prueba Plan 1' },
      { SIGLA: 'TEST001', PLAN: '2224024', DESCRIPCION: 'Prueba Plan 2' },
      { SIGLA: 'TEST002', PLAN: '1114401', DESCRIPCION: 'Prueba 2 Plan 1' },
      { SIGLA: 'TEST002', PLAN: '1444729', DESCRIPCION: 'Prueba 2 Plan 3' },
      { SIGLA: 'TEST003', PLAN: '1114401', DESCRIPCION: 'Prueba 3 Plan 1' }
    ];
    
    console.log('📋 Datos de prueba a insertar:');
    console.table(testData);
    
    // Crear archivo Excel de prueba
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(testData);
    XLSX.utils.book_append_sheet(wb, ws, 'DOL');
    
    const testFilePath = './test_multiple_plans_dol.xlsx';
    XLSX.writeFile(wb, testFilePath);
    console.log(`📁 Archivo de prueba creado: ${testFilePath}`);
    
    // Conectar a la base de datos para verificar antes
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    console.log('\n📊 Estado ANTES de la prueba:');
    const [beforeCount] = await connection.execute('SELECT COUNT(*) as total FROM staging_dol');
    console.log(`Total registros en staging_dol: ${beforeCount[0].total}`);
    
    // Verificar si existen registros con siglas TEST
    const [testRecords] = await connection.execute(`
      SELECT sigla, plan, descripcion 
      FROM staging_dol 
      WHERE sigla LIKE 'TEST%' 
      ORDER BY sigla, plan
    `);
    
    if (testRecords.length > 0) {
      console.log('⚠️  Registros de prueba existentes encontrados:');
      console.table(testRecords);
    } else {
      console.log('✅ No hay registros de prueba previos');
    }
    
    console.log('\n💡 Para probar la funcionalidad:');
    console.log('1. Ve a la interfaz web (http://localhost:5173)');
    console.log('2. Navega a la sección de carga DOL');
    console.log('3. Selecciona un bimestre (ej: Bimestre 2025 1 - ID 20)');
    console.log(`4. Sube el archivo: ${testFilePath}`);
    console.log('5. Verifica que se permita la misma sigla en diferentes planes');
    
    console.log('\n🔍 Después de la carga, ejecuta este script nuevamente para verificar los resultados');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Función para verificar resultados después de la carga
async function verifyResults() {
  let connection;
  
  try {
    console.log('🔍 Verificando resultados de la prueba...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    // Verificar registros de prueba
    const [testRecords] = await connection.execute(`
      SELECT sigla, plan, descripcion, id_bimestre
      FROM staging_dol 
      WHERE sigla LIKE 'TEST%' 
      ORDER BY sigla, plan
    `);
    
    if (testRecords.length > 0) {
      console.log('✅ Registros de prueba encontrados:');
      console.table(testRecords);
      
      // Verificar siglas con múltiples planes
      const [multiPlanTest] = await connection.execute(`
        SELECT 
          sigla,
          COUNT(DISTINCT plan) as planes_diferentes,
          GROUP_CONCAT(DISTINCT plan ORDER BY plan) as planes
        FROM staging_dol 
        WHERE sigla LIKE 'TEST%'
        GROUP BY sigla
        HAVING COUNT(DISTINCT plan) > 1
        ORDER BY sigla
      `);
      
      if (multiPlanTest.length > 0) {
        console.log('\n🎉 ¡ÉXITO! Siglas con múltiples planes:');
        console.table(multiPlanTest);
        console.log('✅ La funcionalidad de clave primaria compuesta (sigla, plan) está funcionando correctamente');
      } else {
        console.log('\n⚠️  No se encontraron siglas con múltiples planes');
      }
    } else {
      console.log('❌ No se encontraron registros de prueba');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Determinar qué función ejecutar basado en argumentos
const args = process.argv.slice(2);
if (args.includes('--verify')) {
  verifyResults();
} else {
  testMultiplePlans();
}