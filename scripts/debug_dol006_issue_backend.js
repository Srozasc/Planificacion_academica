const mysql = require('mysql2/promise');

async function debugDol006Issue() {
  let connection;
  
  try {
    console.log('=== DEBUG DEL PROBLEMA CON DOL006 ===');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });
    
    console.log('✅ Conexión establecida');
    
    // Verificar todos los registros de DOL006
    console.log('\n=== REGISTROS DE DOL006 EN STAGING_DOL ===');
    const [dol006Records] = await connection.execute(
      'SELECT * FROM staging_dol WHERE sigla = ? ORDER BY plan',
      ['DOL006']
    );
    
    console.log(`Total registros DOL006: ${dol006Records.length}`);
    dol006Records.forEach((record, index) => {
      console.log(`${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}, DESC: ${record.descripcion}, BIMESTRE: ${record.id_bimestre}`);
    });
    
    // Verificar todos los registros del bimestre 20
    console.log('\n=== TODOS LOS REGISTROS DEL BIMESTRE 20 ===');
    const [allRecords] = await connection.execute(
      'SELECT * FROM staging_dol WHERE id_bimestre = ? ORDER BY sigla, plan',
      [20]
    );
    
    console.log(`Total registros bimestre 20: ${allRecords.length}`);
    allRecords.forEach((record, index) => {
      console.log(`${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}, DESC: ${record.descripcion}`);
    });
    
    // Verificar si hay registros con PLAN=1444728
    console.log('\n=== BÚSQUEDA ESPECÍFICA DE PLAN 1444728 ===');
    const [plan1444728] = await connection.execute(
      'SELECT * FROM staging_dol WHERE plan = ?',
      ['1444728']
    );
    
    console.log(`Registros con PLAN=1444728: ${plan1444728.length}`);
    plan1444728.forEach((record, index) => {
      console.log(`${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}, DESC: ${record.descripcion}, BIMESTRE: ${record.id_bimestre}`);
    });
    
    // Verificar si hay registros con PLAN=1444729
    console.log('\n=== BÚSQUEDA ESPECÍFICA DE PLAN 1444729 ===');
    const [plan1444729] = await connection.execute(
      'SELECT * FROM staging_dol WHERE plan = ?',
      ['1444729']
    );
    
    console.log(`Registros con PLAN=1444729: ${plan1444729.length}`);
    plan1444729.forEach((record, index) => {
      console.log(`${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}, DESC: ${record.descripcion}, BIMESTRE: ${record.id_bimestre}`);
    });
    
    // Contar combinaciones únicas
    console.log('\n=== COMBINACIONES ÚNICAS SIGLA-PLAN ===');
    const [uniqueCombinations] = await connection.execute(
      'SELECT DISTINCT sigla, plan FROM staging_dol WHERE id_bimestre = ? ORDER BY sigla, plan',
      [20]
    );
    
    console.log(`Total combinaciones únicas: ${uniqueCombinations.length}`);
    uniqueCombinations.forEach((combo, index) => {
      console.log(`${index + 1}. SIGLA: ${combo.sigla}, PLAN: ${combo.plan}`);
    });
    
    // Verificar si hay duplicados en la tabla
    console.log('\n=== VERIFICACIÓN DE DUPLICADOS EN BD ===');
    const [duplicateCheck] = await connection.execute(`
      SELECT sigla, plan, COUNT(*) as count 
      FROM staging_dol 
      WHERE id_bimestre = ? 
      GROUP BY sigla, plan 
      HAVING COUNT(*) > 1
    `, [20]);
    
    if (duplicateCheck.length > 0) {
      console.log('⚠️  Duplicados encontrados en BD:');
      duplicateCheck.forEach((dup, index) => {
        console.log(`${index + 1}. SIGLA: ${dup.sigla}, PLAN: ${dup.plan}, COUNT: ${dup.count}`);
      });
    } else {
      console.log('✅ No hay duplicados en la base de datos');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

debugDol006Issue();