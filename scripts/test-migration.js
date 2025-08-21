const mysql = require('mysql2/promise');
const fs = require('fs');

async function testMigration() {
  const logFile = 'd:\\desarrollo\\workspace\\Planificacion_academica\\migration-test.log';
  function log(message) {
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
  }
  
  // Limpiar archivo de log
  fs.writeFileSync(logFile, 'Iniciando prueba de migración...\n');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'planificacion_user',
    password: 'PlanUser2025!',
    database: 'planificacion_academica'
  });

  try {
    // Verificar registros en staging
    const [stagingRows] = await connection.execute('SELECT COUNT(*) as count FROM staging_estructura_academica');
    log(`Registros en staging_estructura_academica: ${stagingRows[0].count}`);
    
    // Verificar registros en academic_structures
    const [academicRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    log(`Registros en academic_structures: ${academicRows[0].count}`);
    
    // Mostrar algunos registros de staging para verificar datos
    const [sampleRows] = await connection.execute('SELECT * FROM staging_estructura_academica LIMIT 3');
    log('Muestra de registros en staging:');
    sampleRows.forEach((row, index) => {
      log(`Registro ${index + 1}: id=${row.id}, plan=${row.plan}, carrera=${row.carrera}, asignatura=${row.asignatura}`);
    });
    
  } catch (error) {
    log('Error: ' + error.message);
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

testMigration();