const mysql = require('mysql2/promise');

async function checkUploadLogs() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'planificacion_academica'
  });

  try {
    console.log('=== VERIFICANDO TABLA UPLOAD_LOGS ===\n');
    
    // Verificar los últimos registros de upload_logs
    const [uploads] = await connection.execute(`
      SELECT id, file_name, upload_type, approval_status, is_processed, created_at 
      FROM upload_logs 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Últimos 10 registros en upload_logs:');
    uploads.forEach(upload => {
      console.log(`ID: ${upload.id}, Archivo: ${upload.file_name}, Tipo: '${upload.upload_type}', Estado: ${upload.approval_status}, Procesado: ${upload.is_processed}, Fecha: ${upload.created_at}`);
    });
    
    // Buscar específicamente registros de Estructura Académica
    console.log('\n=== REGISTROS DE ESTRUCTURA ACADÉMICA ===\n');
    const [estructuraUploads] = await connection.execute(`
      SELECT id, file_name, upload_type, approval_status, is_processed, created_at 
      FROM upload_logs 
      WHERE upload_type = 'Estructura Académica'
      ORDER BY created_at DESC
    `);
    
    if (estructuraUploads.length === 0) {
      console.log('❌ No se encontraron registros con tipo "Estructura Académica"');
      
      // Buscar variaciones del nombre
      console.log('\nBuscando variaciones del tipo...');
      const [allTypes] = await connection.execute(`
        SELECT DISTINCT upload_type 
        FROM upload_logs 
        ORDER BY upload_type
      `);
      
      console.log('Tipos de archivo encontrados:');
      allTypes.forEach(type => {
        console.log(`- '${type.upload_type}'`);
      });
    } else {
      console.log(`✓ Encontrados ${estructuraUploads.length} registros de Estructura Académica:`);
      estructuraUploads.forEach(upload => {
        console.log(`ID: ${upload.id}, Archivo: ${upload.file_name}, Estado: ${upload.approval_status}, Procesado: ${upload.is_processed}`);
      });
    }
    
    // Verificar datos en staging_estructura_academica
    console.log('\n=== VERIFICANDO STAGING_ESTRUCTURA_ACADEMICA ===\n');
    const [stagingCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM staging_estructura_academica
    `);
    
    console.log(`Total de registros en staging_estructura_academica: ${stagingCount[0].total}`);
    
    if (stagingCount[0].total > 0) {
      const [sampleData] = await connection.execute(`
        SELECT * FROM staging_estructura_academica LIMIT 3
      `);
      
      console.log('\nMuestra de datos en staging:');
      sampleData.forEach((row, index) => {
        console.log(`Registro ${index + 1}:`, row);
      });
    }
    
    // Verificar tablas carreras y asignaturas
    console.log('\n=== VERIFICANDO TABLAS FINALES ===\n');
    const [carrerasCount] = await connection.execute(`SELECT COUNT(*) as total FROM carreras`);
    const [asignaturasCount] = await connection.execute(`SELECT COUNT(*) as total FROM asignaturas`);
    
    console.log(`Total de registros en carreras: ${carrerasCount[0].total}`);
    console.log(`Total de registros en asignaturas: ${asignaturasCount[0].total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUploadLogs().catch(console.error);