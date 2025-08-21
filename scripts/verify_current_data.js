const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica'
};

async function verifyCurrentData() {
  let connection;
  
  try {
    console.log('=== VERIFICACIÓN DE DATOS ACTUALES ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión a la base de datos establecida');
    
    // Verificar todos los bimestres disponibles
    const [bimestres] = await connection.execute(
      'SELECT DISTINCT id_bimestre FROM staging_dol ORDER BY id_bimestre'
    );
    
    console.log('\nBimestres con datos en staging_dol:');
    for (const bim of bimestres) {
      const [count] = await connection.execute(
        'SELECT COUNT(*) as total FROM staging_dol WHERE id_bimestre = ?',
        [bim.id_bimestre]
      );
      console.log(`  Bimestre ${bim.id_bimestre}: ${count[0].total} registros`);
    }
    
    // Verificar el bimestre más reciente (probablemente el que acabas de cargar)
    if (bimestres.length > 0) {
      const latestBimestre = bimestres[bimestres.length - 1].id_bimestre;
      
      console.log(`\n=== ANÁLISIS DETALLADO DEL BIMESTRE ${latestBimestre} ===`);
      
      // Obtener todos los registros del bimestre más reciente
      const [records] = await connection.execute(
        'SELECT sigla, plan, descripcion FROM staging_dol WHERE id_bimestre = ? ORDER BY sigla, plan',
        [latestBimestre]
      );
      
      console.log(`Total de registros: ${records.length}`);
      
      if (records.length > 0) {
        console.log('\nRegistros encontrados:');
        records.forEach((record, index) => {
          console.log(`  ${index + 1}. SIGLA: ${record.sigla}, PLAN: ${record.plan}, DESCRIPCION: ${record.descripcion}`);
        });
        
        // Analizar siglas únicas
        const siglaCount = {};
        records.forEach(record => {
          const sigla = record.sigla;
          if (!siglaCount[sigla]) {
            siglaCount[sigla] = [];
          }
          siglaCount[sigla].push(record.plan);
        });
        
        console.log('\n=== ANÁLISIS DE SIGLAS ===');
        Object.keys(siglaCount).forEach(sigla => {
          const planes = siglaCount[sigla];
          console.log(`SIGLA ${sigla}: ${planes.length} plan(es) - [${planes.join(', ')}]`);
        });
        
        console.log(`\nSiglas únicas: ${Object.keys(siglaCount).length}`);
        console.log(`Combinaciones únicas (sigla-plan): ${records.length}`);
      }
    }
    
    // Verificar logs de upload más recientes
    console.log('\n=== LOGS DE UPLOAD RECIENTES ===');
    const [uploadLogs] = await connection.execute(
      'SELECT filename, file_type, status, total_records, invalid_records, created_at FROM upload_logs WHERE file_type = "DOL" ORDER BY created_at DESC LIMIT 5'
    );
    
    if (uploadLogs.length > 0) {
      console.log('Últimos 5 uploads de DOL:');
      uploadLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.filename} - ${log.status} - Total: ${log.total_records}, Inválidos: ${log.invalid_records} - ${log.created_at}`);
      });
    } else {
      console.log('No se encontraron logs de upload de DOL');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

verifyCurrentData();