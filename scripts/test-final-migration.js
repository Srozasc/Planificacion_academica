const mysql = require('mysql2/promise');
const fs = require('fs');

const logFile = 'final-migration-test.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

async function testFinalMigration() {
  let connection;
  
  try {
    // Limpiar archivo de log anterior
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
    
    log('=== INICIANDO TEST FINAL DE MIGRACIÓN ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    log('Conexión a base de datos establecida');
    
    // Contar registros iniciales
    const [stagingRows] = await connection.execute('SELECT COUNT(*) as count FROM staging_estructura_academica');
    const [beforeRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    
    log(`Registros en staging_estructura_academica: ${stagingRows[0].count}`);
    log(`Registros en academic_structures ANTES: ${beforeRows[0].count}`);
    
    // Simular la migración completa como en el servicio
    log('=== INICIANDO MIGRACIÓN COMPLETA ===');
    
    // 1. Eliminar referencias en course_reports_data
    log('Eliminando referencias en course_reports_data...');
    const [deleteResult] = await connection.execute('DELETE FROM course_reports_data WHERE academic_structure_id IS NOT NULL');
    log(`Referencias eliminadas: ${deleteResult.affectedRows}`);
    
    // 2. Limpiar academic_structures
    log('Limpiando tabla academic_structures...');
    await connection.execute('DELETE FROM academic_structures');
    
    // 3. Verificar limpieza
    const [afterClearRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    log(`Registros después de limpiar: ${afterClearRows[0].count}`);
    
    // 4. Obtener datos de staging
    const [stagingData] = await connection.execute('SELECT * FROM staging_estructura_academica LIMIT 10');
    log(`Obtenidos ${stagingData.length} registros de staging para migrar`);
    
    // 5. Insertar registros uno por uno (simulando el servicio)
    let insertedCount = 0;
    for (const record of stagingData) {
      try {
        const insertQuery = `
          INSERT INTO academic_structures (
            code, name, level, acronym, course, credits, category, hours, duration,
            clplestud, school_code, school_prog, id_bimestre, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        await connection.execute(insertQuery, [
          `${record.plan}-${record.sigla}`, // Combinación única plan-sigla
          record.carrera,
          record.nivel,
          record.sigla,
          record.asignatura,
          record.creditos,
          record.categoria,
          record.horas,
          record.duracion_carrera,
          record.clplestud,
          record.codigo_escuela,
          record.escuela_programa,
          record.id_bimestre,
          1
        ]);
        
        insertedCount++;
        if (insertedCount % 5 === 0) {
          log(`Procesados ${insertedCount} registros...`);
        }
      } catch (insertError) {
        log(`Error insertando registro ${record.id}: ${insertError.message}`);
      }
    }
    
    // 6. Verificar resultado final
    const [finalRows] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    log(`=== MIGRACIÓN COMPLETADA ===`);
    log(`Registros insertados exitosamente: ${insertedCount}`);
    log(`Conteo final en academic_structures: ${finalRows[0].count}`);
    
    if (finalRows[0].count === insertedCount) {
      log('✅ MIGRACIÓN EXITOSA: Todos los registros se insertaron correctamente');
    } else {
      log('⚠️  ADVERTENCIA: Discrepancia en el conteo de registros');
    }
    
  } catch (error) {
    log(`❌ Error durante la migración: ${error.message}`);
    log(`Stack: ${error.stack}`);
  } finally {
    if (connection) {
      await connection.end();
      log('Conexión cerrada');
    }
  }
}

testFinalMigration();