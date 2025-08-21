const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function simpleCheck() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('=== VERIFICACIÓN SIMPLE ===');
    
    // Verificar staging
    const [staging] = await connection.execute('SELECT COUNT(*) as count FROM staging_estructura_academica');
    console.log(`Staging estructura académica: ${staging[0].count} registros`);
    
    // Verificar carreras y asignaturas
    const [carreras] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
    const [asignaturas] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
    console.log(`Carreras: ${carreras[0].count} registros`);
    console.log(`Asignaturas: ${asignaturas[0].count} registros`);
    
    // Verificar upload_logs
    const [uploads] = await connection.execute(
      'SELECT id, uploadType, approvalStatus, isProcessed FROM upload_logs WHERE uploadType = "Estructura Académica" ORDER BY id DESC LIMIT 3'
    );
    console.log('\nÚltimas cargas de Estructura Académica:');
    uploads.forEach(u => {
      console.log(`  ID: ${u.id}, Estado: ${u.approvalStatus}, Procesado: ${u.isProcessed}`);
    });
    
    await connection.end();
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

simpleCheck();