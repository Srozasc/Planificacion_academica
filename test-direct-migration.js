const mysql = require('mysql2/promise');
const fs = require('fs');

function log(message) {
  console.log(message);
  fs.appendFileSync('migration-debug.log', message + '\n');
}

async function testMigration() {
  // Limpiar archivo de log
  fs.writeFileSync('migration-debug.log', '=== INICIO DEL TEST ===\n');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'planificacion_user',
    password: 'PlanUser2025!',
    database: 'planificacion_academica'
  });

  try {
    log('=== INICIANDO TEST DE MIGRACIÓN DIRECTA ===');
    
    // Contar registros en staging
    const [stagingRows] = await connection.execute('SELECT COUNT(*) as count FROM staging_estructura_academica');
    log(`Registros en staging_estructura_academica: ${stagingRows[0].count}`);
    
    // Contar registros en academic_structures antes
    const [beforeRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    log(`Registros en academic_structures ANTES: ${beforeRows[0].count}`);
    
    // Manejar restricciones de clave foránea antes de limpiar
    log('Eliminando referencias en course_reports_data...');
    await connection.execute('DELETE FROM course_reports_data WHERE academic_structure_id IS NOT NULL');
    log('Referencias en course_reports_data eliminadas');
    
    // Ahora limpiar academic_structures
    await connection.execute('DELETE FROM academic_structures');
    log('Tabla academic_structures limpiada');
    
    // Verificar limpieza
    const [afterClearRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    log(`Registros después de limpiar: ${afterClearRows[0].count}`);
    
    // Obtener registros de staging
    const [stagingData] = await connection.execute('SELECT * FROM staging_estructura_academica LIMIT 5');
    log(`Muestra de registros de staging (primeros 5):`);
    stagingData.forEach((record, index) => {
      log(`  ${index + 1}. ID: ${record.id}, Plan: ${record.plan}, Carrera: ${record.carrera}`);
    });
    
    // Intentar insertar un registro de prueba
    const testRecord = stagingData[0];
    if (testRecord) {
      log('\n=== INSERTANDO REGISTRO DE PRUEBA ===');
      log(`Datos del registro: plan=${testRecord.plan}, carrera=${testRecord.carrera}`);
      
      const insertQuery = `
        INSERT INTO academic_structures (
          code, name, level, acronym, course, credits, category, hours, duration,
          clplestud, school_code, school_prog, id_bimestre, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const values = [
        testRecord.plan,
        testRecord.carrera,
        testRecord.nivel,
        testRecord.sigla,
        testRecord.asignatura,
        testRecord.creditos,
        testRecord.categoria,
        testRecord.horas,
        testRecord.duracion_carrera,
        testRecord.clplestud,
        testRecord.codigo_escuela,
        testRecord.escuela_programa,
        testRecord.id_bimestre,
        1
      ];
      
      log('Valores a insertar: ' + JSON.stringify(values));
      
      try {
        const [insertResult] = await connection.execute(insertQuery, values);
        log('Inserción exitosa: ' + JSON.stringify(insertResult));
        
        // Verificar inserción
        const [finalRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
        log(`Registros después de inserción: ${finalRows[0].count}`);
        
      } catch (insertError) {
        log('Error en inserción: ' + insertError.message);
        log('Código de error: ' + insertError.code);
        log('SQL State: ' + insertError.sqlState);
      }
    }
    
  } catch (error) {
    log('Error general: ' + error.message);
    log('Stack: ' + error.stack);
  } finally {
    await connection.end();
  }
}

testMigration().catch(console.error);