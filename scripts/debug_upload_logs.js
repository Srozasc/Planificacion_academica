const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function debugUploadLogs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('=== VERIFICANDO UPLOAD_LOGS ===');
    
    // Últimos 10 registros
    const [logs] = await connection.execute(
      'SELECT id, upload_type, status, created_at FROM upload_logs ORDER BY created_at DESC LIMIT 10'
    );
    console.log('\nÚltimos 10 registros en upload_logs:');
    logs.forEach(log => {
      console.log(`ID: ${log.id}, Tipo: ${log.upload_type}, Estado: ${log.status}, Fecha: ${log.created_at}`);
    });

    // Contar por tipo
    const [typeCount] = await connection.execute(
      'SELECT upload_type, COUNT(*) as count FROM upload_logs GROUP BY upload_type'
    );
    console.log('\nConteo por tipo de archivo:');
    typeCount.forEach(type => {
      console.log(`${type.upload_type}: ${type.count}`);
    });

    // Registros de Estructura Académica
    const [estructuraLogs] = await connection.execute(
      'SELECT id, status, created_at FROM upload_logs WHERE upload_type = "Estructura Académica" ORDER BY created_at DESC'
    );
    console.log('\nRegistros de "Estructura Académica":');
    estructuraLogs.forEach(log => {
      console.log(`ID: ${log.id}, Estado: ${log.status}, Fecha: ${log.created_at}`);
    });

    // Verificar staging_estructura_academica
    const [stagingCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_estructura_academica'
    );
    console.log(`\nRegistros en staging_estructura_academica: ${stagingCount[0].count}`);

    // Verificar carreras y asignaturas
    const [carrerasCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM carreras'
    );
    const [asignaturasCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM asignaturas'
    );
    console.log(`Registros en carreras: ${carrerasCount[0].count}`);
    console.log(`Registros en asignaturas: ${asignaturasCount[0].count}`);

    // Verificar si hay registros aprobados de Estructura Académica
    const [approvedLogs] = await connection.execute(
      'SELECT id, status, created_at FROM upload_logs WHERE upload_type = "Estructura Académica" AND status = "approved" ORDER BY created_at DESC'
    );
    console.log('\nRegistros APROBADOS de "Estructura Académica":');
    if (approvedLogs.length === 0) {
      console.log('No hay registros aprobados de Estructura Académica');
    } else {
      approvedLogs.forEach(log => {
        console.log(`ID: ${log.id}, Estado: ${log.status}, Fecha: ${log.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

debugUploadLogs();