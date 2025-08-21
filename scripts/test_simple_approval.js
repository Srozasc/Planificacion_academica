const { Pool } = require('pg');
const fs = require('fs');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'planificacion_academica',
  password: 'admin',
  port: 5432,
});

async function testSimpleApproval() {
  const results = [];
  results.push('=== PRUEBA SIMPLE DE APROBACIÓN ===\n');
  
  try {
    // Verificar datos en staging_estructura_academica
    const stagingResult = await pool.query('SELECT COUNT(*) as count FROM staging_estructura_academica');
    results.push(`Registros en staging_estructura_academica: ${stagingResult.rows[0].count}`);
    
    // Verificar estado de las tablas
    const carrerasResult = await pool.query('SELECT COUNT(*) as count FROM carreras');
    const asignaturasResult = await pool.query('SELECT COUNT(*) as count FROM asignaturas');
    
    results.push(`Carreras: ${carrerasResult.rows[0].count}`);
    results.push(`Asignaturas: ${asignaturasResult.rows[0].count}`);
    
    // Verificar cargas de Estructura Académica
    const uploadsResult = await pool.query(`
      SELECT id, file_name, approval_status, is_processed 
      FROM upload_logs 
      WHERE upload_type = 'Estructura Académica' 
      ORDER BY upload_date DESC 
      LIMIT 5
    `);
    
    results.push(`\nÚltimas 5 cargas de Estructura Académica:`);
    uploadsResult.rows.forEach(upload => {
      results.push(`  ID: ${upload.id}, Archivo: ${upload.file_name}, Estado: ${upload.approval_status}, Procesado: ${upload.is_processed}`);
    });
    
    results.push('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    results.push(`Error: ${error.message}`);
  } finally {
    await pool.end();
  }
  
  // Escribir resultados al archivo
  fs.writeFileSync('test_simple_results.txt', results.join('\n'));
  console.log('Resultados escritos en test_simple_results.txt');
}

testSimpleApproval();