const mysql = require('mysql2/promise');
const fs = require('fs');

// Función para escribir logs
function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('duplicates-analysis.log', logMessage);
  console.log(logMessage.trim());
}

async function analyzeDuplicates() {
  let connection;
  
  try {
    // Limpiar archivo de log
    if (fs.existsSync('duplicates-analysis.log')) {
      fs.unlinkSync('duplicates-analysis.log');
    }
    
    writeLog('Conectando a la base de datos...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    writeLog('Conexión establecida');
    
    // Analizar duplicados por plan
    writeLog('=== ANÁLISIS DE DUPLICADOS POR PLAN ===');
    const [duplicatePlans] = await connection.execute(`
      SELECT plan, COUNT(*) as count 
      FROM staging_estructura_academica 
      GROUP BY plan 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC
    `);
    
    writeLog(`Planes con duplicados: ${duplicatePlans.length}`);
    
    for (let i = 0; i < Math.min(5, duplicatePlans.length); i++) {
      const plan = duplicatePlans[i];
      writeLog(`Plan ${plan.plan}: ${plan.count} registros`);
      
      // Mostrar algunos registros de este plan
      const [records] = await connection.execute(
        'SELECT id, plan, carrera, nivel, sigla, asignatura FROM staging_estructura_academica WHERE plan = ? LIMIT 3',
        [plan.plan]
      );
      
      records.forEach((record, index) => {
        writeLog(`  ${index + 1}. ID:${record.id} - ${record.sigla} - ${record.asignatura}`);
      });
    }
    
    // Analizar combinaciones únicas
    writeLog('\n=== ANÁLISIS DE COMBINACIONES ÚNICAS ===');
    const [uniqueCombinations] = await connection.execute(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT plan) as unique_plans,
        COUNT(DISTINCT CONCAT(plan, '-', sigla)) as unique_plan_sigla,
        COUNT(DISTINCT CONCAT(plan, '-', carrera, '-', sigla)) as unique_plan_carrera_sigla
      FROM staging_estructura_academica
    `);
    
    const stats = uniqueCombinations[0];
    writeLog(`Total de registros: ${stats.total_records}`);
    writeLog(`Planes únicos: ${stats.unique_plans}`);
    writeLog(`Combinaciones plan-sigla únicas: ${stats.unique_plan_sigla}`);
    writeLog(`Combinaciones plan-carrera-sigla únicas: ${stats.unique_plan_carrera_sigla}`);
    
    // Sugerir estrategia
    writeLog('\n=== ESTRATEGIA RECOMENDADA ===');
    if (stats.unique_plan_sigla === stats.total_records) {
      writeLog('✅ Usar combinación plan-sigla como clave única');
    } else if (stats.unique_plan_carrera_sigla === stats.total_records) {
      writeLog('✅ Usar combinación plan-carrera-sigla como clave única');
    } else {
      writeLog('⚠️  Necesario análisis más profundo para determinar clave única');
    }
    
  } catch (error) {
    writeLog(`❌ Error: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      writeLog('Conexión cerrada');
    }
  }
}

analyzeDuplicates();