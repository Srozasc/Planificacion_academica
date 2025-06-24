const mysql = require('mysql2/promise');
const { spawn } = require('child_process');
const path = require('path');

async function createProceduresViaMySQL() {
  try {
    console.log('🚀 Creando Stored Procedures via MySQL CLI...\n');
    
    const sqlFile = path.join(__dirname, 'create-all-schedule-procedures.sql');
    
    // Ejecutar via mysql command line
    const mysqlProcess = spawn('mysql', [
      '-h', 'localhost',
      '-u', 'planificacion_user',
      '-pPlanUser2025!',
      'planificacion_academica'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const fs = require('fs');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    mysqlProcess.stdin.write(sqlContent);
    mysqlProcess.stdin.end();
    
    let output = '';
    let errorOutput = '';
    
    mysqlProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    mysqlProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    return new Promise((resolve, reject) => {
      mysqlProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Stored procedures creados exitosamente');
          if (output) console.log('📋 Resultado:\n', output);
          resolve(true);
        } else {
          console.error('❌ Error creando procedures:', errorOutput);
          reject(new Error(errorOutput));
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function testWithNodeJS() {
  try {
    console.log('\n🧪 Probando conexión directa con Node.js...\n');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    // Probar stored procedure simple
    const [results] = await connection.execute(`
      SELECT 
        ROUTINE_NAME,
        ROUTINE_TYPE,
        CREATED
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'planificacion_academica' 
        AND ROUTINE_NAME LIKE 'sp_%Schedule%'
      ORDER BY ROUTINE_NAME
    `);

    console.log('📋 Stored Procedures encontrados:');
    results.forEach(proc => {
      console.log(`   ✅ ${proc.ROUTINE_NAME} (${proc.ROUTINE_TYPE})`);
    });

    await connection.end();
    return results.length > 0;
    
  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    return false;
  }
}

async function main() {
  try {
    // Intentar crear via MySQL CLI
    await createProceduresViaMySQL();
    
    // Verificar con Node.js
    const success = await testWithNodeJS();
    
    if (success) {
      console.log('\n🎉 ¡Stored Procedures de programación académica listos!');
      console.log('\n📊 Funcionalidades disponibles:');
      console.log('   - sp_GetScheduleEvents: Consultar eventos');
      console.log('   - sp_DeleteScheduleEvent: Eliminar eventos');
      console.log('\n✨ Sistema listo para el siguiente paso');
    } else {
      console.log('\n⚠️ Verificar la creación de stored procedures');
    }
    
  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.log('\n🔧 Sugerencia: Ejecutar manualmente el archivo SQL:');
    console.log('   mysql -u planificacion_user -p planificacion_academica < create-all-schedule-procedures.sql');
  }
}

main();
