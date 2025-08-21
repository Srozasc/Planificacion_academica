const mysql = require('mysql2/promise');
const fs = require('fs');

// Función para escribir logs
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('complete-migration.log', logMessage);
  console.log(logMessage.trim());
}

async function completeMigration() {
  let connection;
  
  try {
    // Limpiar archivo de log
    if (fs.existsSync('complete-migration.log')) {
      fs.unlinkSync('complete-migration.log');
    }
    
    writeLog('=== MIGRACIÓN COMPLETA DE ESTRUCTURA ACADÉMICA ===');
    writeLog('Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    writeLog('Conexión a base de datos establecida');
    
    // Contar registros iniciales
    const [stagingCount] = await connection.execute('SELECT COUNT(*) as count FROM staging_estructura_academica');
    const [academicCount] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    
    writeLog(`Registros en staging_estructura_academica: ${stagingCount[0].count}`);
    writeLog(`Registros en academic_structures ANTES: ${academicCount[0].count}`);
    
    writeLog('=== INICIANDO MIGRACIÓN COMPLETA ===');
    
    // 1. Eliminar referencias en course_reports_data
    writeLog('Eliminando referencias en course_reports_data...');
    const [deleteResult] = await connection.execute(
      'DELETE FROM course_reports_data WHERE academic_structure_id IN (SELECT id FROM academic_structures)'
    );
    writeLog(`Referencias eliminadas: ${deleteResult.affectedRows}`);
    
    // 2. Limpiar tabla academic_structures
    writeLog('Limpiando tabla academic_structures...');
    await connection.execute('DELETE FROM academic_structures');
    
    const [afterCleanCount] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    writeLog(`Registros después de limpiar: ${afterCleanCount[0].count}`);
    
    // 3. Obtener TODOS los datos de staging
    writeLog('Obteniendo TODOS los registros de staging...');
    const [stagingData] = await connection.execute(`
      SELECT id, plan, carrera, nivel, sigla, asignatura, creditos, categoria, 
             horas, duracion_carrera, clplestud, codigo_escuela, escuela_programa, id_bimestre
      FROM staging_estructura_academica 
      ORDER BY id
    `);
    
    writeLog(`Obtenidos ${stagingData.length} registros de staging para migrar`);
    
    // 4. Insertar todos los registros
    const insertQuery = `
      INSERT INTO academic_structures 
      (code, name, level, acronym, course, credits, category, hours, duration, 
       clplestud, school_code, school_prog, id_bimestre, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < stagingData.length; i++) {
      const record = stagingData[i];
      
      try {
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
        
        successCount++;
        
        // Log de progreso cada 50 registros
        if ((i + 1) % 50 === 0) {
          writeLog(`Procesados ${i + 1} registros...`);
        }
        
      } catch (error) {
        errorCount++;
        writeLog(`❌ Error insertando registro ${record.id}: ${error.message}`);
      }
    }
    
    // 5. Verificar resultado final
    const [finalCount] = await connection.execute('SELECT COUNT(*) as count FROM academic_structures');
    
    writeLog('=== MIGRACIÓN COMPLETADA ===');
    writeLog(`Registros procesados: ${stagingData.length}`);
    writeLog(`Registros insertados exitosamente: ${successCount}`);
    writeLog(`Errores: ${errorCount}`);
    writeLog(`Conteo final en academic_structures: ${finalCount[0].count}`);
    
    if (successCount === stagingData.length && errorCount === 0) {
      writeLog('✅ MIGRACIÓN EXITOSA: Todos los registros se insertaron correctamente');
    } else {
      writeLog(`⚠️  MIGRACIÓN PARCIAL: ${successCount}/${stagingData.length} registros insertados`);
    }
    
    // Mostrar algunos registros migrados como muestra
    writeLog('\n=== MUESTRA DE REGISTROS MIGRADOS ===');
    const [sampleRecords] = await connection.execute(
      'SELECT code, name, acronym, course FROM academic_structures LIMIT 5'
    );
    
    sampleRecords.forEach((record, index) => {
      writeLog(`${index + 1}. ${record.code} - ${record.acronym} - ${record.course}`);
    });
    
  } catch (error) {
    writeLog(`❌ Error general: ${error.message}`);
    writeLog(`Stack trace: ${error.stack}`);
  } finally {
    if (connection) {
      await connection.end();
      writeLog('Conexión cerrada');
    }
  }
}

completeMigration();