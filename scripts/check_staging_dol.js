const mysql = require('mysql2/promise');

async function checkStagingDol() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    console.log('=== ESTRUCTURA DE STAGING_DOL ===');
    const [columns] = await conn.execute('DESCRIBE staging_dol');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    console.log('\n=== CONTENIDO DE STAGING_DOL ===');
    const [data] = await conn.execute('SELECT * FROM staging_dol LIMIT 15');
    console.log(`Total registros: ${data.length}`);
    
    if (data.length > 0) {
      data.forEach((row, index) => {
        console.log(`  ${index + 1}. Sigla: ${row.sigla} - Plan: ${row.plan} - Bimestre: ${row.id_bimestre}`);
      });
    } else {
      console.log('  No hay registros en staging_dol');
    }

    console.log('\n=== ÚLTIMO UPLOAD LOG ===');
    const [uploadLog] = await conn.execute(`
      SELECT id, file_name, total_records, error_count, approval_status, is_processed, upload_date 
      FROM upload_logs 
      WHERE upload_type = 'DOL' 
      ORDER BY upload_date DESC 
      LIMIT 1
    `);
    
    if (uploadLog.length > 0) {
      const log = uploadLog[0];
      console.log(`  ID: ${log.id}`);
      console.log(`  Archivo: ${log.file_name}`);
      console.log(`  Registros: ${log.total_records}`);
      console.log(`  Errores: ${log.error_count}`);
      console.log(`  Estado: ${log.approval_status}`);
      console.log(`  Procesado: ${log.is_processed}`);
      console.log(`  Fecha: ${log.upload_date}`);
    }

    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStagingDol();