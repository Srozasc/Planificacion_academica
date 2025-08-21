const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
require('dotenv').config({ path: './backend/.env' });

const execAsync = promisify(exec);

async function testWithOutput() {
  let output = [];
  
  function log(message) {
    console.log(message);
    output.push(message);
  }
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    log('=== DIAGNÓSTICO DE PROBLEMA DE APROBACIÓN ===\n');
    
    // 1. Verificar datos en staging_estructura_academica
    const [stagingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_estructura_academica'
    );
    log(`1. Total registros en staging_estructura_academica: ${stagingData[0].count}`);
    
    const [stagingWithBimestre] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_estructura_academica WHERE id_bimestre IS NOT NULL'
    );
    log(`   Registros con bimestre_id: ${stagingWithBimestre[0].count}`);
    
    // 2. Verificar upload_logs
    const [uploadLogs] = await connection.execute(
      'SELECT id, uploadType, approvalStatus, fileName FROM upload_logs WHERE uploadType = "Estructura Académica" ORDER BY id DESC LIMIT 5'
    );
    log(`\n2. Cargas de Estructura Académica en upload_logs: ${uploadLogs.length}`);
    uploadLogs.forEach(upload => {
      log(`   ID: ${upload.id}, Estado: ${upload.approvalStatus}, Archivo: ${upload.fileName}`);
    });
    
    // 3. Estado actual de carreras y asignaturas
    const [carreras] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
    const [asignaturas] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
    log(`\n3. Estado actual - Carreras: ${carreras[0].count}, Asignaturas: ${asignaturas[0].count}`);
    
    // 4. Verificar si load_plans.js existe en la ruta correcta
    const loadPlansPath = './scripts/permissions/load_plans.js';
    const exists = fs.existsSync(loadPlansPath);
    log(`\n4. Archivo load_plans.js existe en ${loadPlansPath}: ${exists}`);
    
    if (exists) {
      log('   ✅ Archivo encontrado en la ruta correcta');
      
      // 5. Intentar ejecutar load_plans.js
      log('\n5. Intentando ejecutar load_plans.js...');
      try {
        const { stdout, stderr } = await execAsync('node scripts/permissions/load_plans.js');
        log('   ✅ Ejecución exitosa');
        if (stdout) log(`   Stdout: ${stdout}`);
        if (stderr) log(`   Stderr: ${stderr}`);
      } catch (error) {
        log(`   ❌ Error: ${error.message}`);
        if (error.stdout) log(`   Stdout: ${error.stdout}`);
        if (error.stderr) log(`   Stderr: ${error.stderr}`);
      }
      
      // 6. Verificar estado después de la ejecución
      const [carrerasPost] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
      const [asignaturasPost] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
      log(`\n6. Estado después - Carreras: ${carrerasPost[0].count}, Asignaturas: ${asignaturasPost[0].count}`);
      
      const carrerasAgregadas = carrerasPost[0].count - carreras[0].count;
      const asignaturasAgregadas = asignaturasPost[0].count - asignaturas[0].count;
      log(`   Registros agregados - Carreras: ${carrerasAgregadas}, Asignaturas: ${asignaturasAgregadas}`);
    } else {
      log('   ❌ Archivo no encontrado');
    }
    
    // 7. Verificar configuración de base de datos
    log(`\n7. Configuración de BD:`);
    log(`   Host: ${process.env.DB_HOST}`);
    log(`   User: ${process.env.DB_USER}`);
    log(`   Database: ${process.env.DB_NAME}`);
    
    // Escribir resultados a archivo
    fs.writeFileSync('test_results.txt', output.join('\n'));
    log('\n✅ Resultados guardados en test_results.txt');
    
  } catch (error) {
    log(`❌ Error en la prueba: ${error.message}`);
    fs.writeFileSync('test_results.txt', output.join('\n'));
  } finally {
    await connection.end();
  }
}

testWithOutput();