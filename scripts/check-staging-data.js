const mysql = require('mysql2/promise');
const fs = require('fs');

const logFile = 'staging-data-check.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

async function checkStagingData() {
  let connection;
  
  try {
    // Limpiar archivo de log anterior
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
    }
    
    log('=== VERIFICANDO ESTRUCTURA DE DATOS ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    log('Conexión establecida');
    
    // Obtener estructura de la tabla
    const [columns] = await connection.execute('DESCRIBE staging_estructura_academica');
    log('Estructura de staging_estructura_academica:');
    columns.forEach(col => {
      log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Obtener un registro de muestra
    const [sampleData] = await connection.execute('SELECT * FROM staging_estructura_academica LIMIT 1');
    
    if (sampleData.length > 0) {
      log('\nDatos de muestra (primer registro):');
      const record = sampleData[0];
      Object.keys(record).forEach(key => {
        const value = record[key];
        const type = typeof value;
        log(`  ${key}: ${value} (${type})`);
      });
      
      // Verificar campos específicos que podrían ser problemáticos
      log('\nVerificación de campos específicos:');
      log(`  plan: ${record.plan} (${record.plan === null ? 'NULL' : typeof record.plan})`);
      log(`  carrera: ${record.carrera} (${record.carrera === null ? 'NULL' : typeof record.carrera})`);
      log(`  nivel: ${record.nivel} (${record.nivel === null ? 'NULL' : typeof record.nivel})`);
      log(`  codigo_asignatura: ${record.codigo_asignatura} (${record.codigo_asignatura === null ? 'NULL' : typeof record.codigo_asignatura})`);
      log(`  asignatura: ${record.asignatura} (${record.asignatura === null ? 'NULL' : typeof record.asignatura})`);
      log(`  creditos: ${record.creditos} (${record.creditos === null ? 'NULL' : typeof record.creditos})`);
      log(`  categoria: ${record.categoria} (${record.categoria === null ? 'NULL' : typeof record.categoria})`);
      log(`  horas: ${record.horas} (${record.horas === null ? 'NULL' : typeof record.horas})`);
      log(`  duracion_carrera: ${record.duracion_carrera} (${record.duracion_carrera === null ? 'NULL' : typeof record.duracion_carrera})`);
      log(`  clplestud: ${record.clplestud} (${record.clplestud === null ? 'NULL' : typeof record.clplestud})`);
      log(`  codigo_escuela: ${record.codigo_escuela} (${record.codigo_escuela === null ? 'NULL' : typeof record.codigo_escuela})`);
      log(`  escuela_programa: ${record.escuela_programa} (${record.escuela_programa === null ? 'NULL' : typeof record.escuela_programa})`);
      log(`  id_bimestre: ${record.id_bimestre} (${record.id_bimestre === null ? 'NULL' : typeof record.id_bimestre})`);
    }
    
  } catch (error) {
    log(`Error: ${error.message}`);
    log(`Stack: ${error.stack}`);
  } finally {
    if (connection) {
      await connection.end();
      log('Conexión cerrada');
    }
  }
}

checkStagingData();