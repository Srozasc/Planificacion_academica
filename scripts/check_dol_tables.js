const mysql = require('mysql2/promise');

async function checkDolTables() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'planificacion_user',
    password: 'PlanUser2025!',
    database: 'planificacion_academica'
  });

  console.log('=== VERIFICACIÓN DE TABLAS DOL ===');
  
  const tables = ['staging_dol', 'dol_aprobados', 'adol_aprobados', 'staging_adol_simple'];
  
  for (const table of tables) {
    try {
      const [count] = await conn.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${count[0].count} registros`);
    } catch (error) {
      console.log(`${table}: Error - ${error.message}`);
    }
  }

  // Verificar registros específicos en dol_aprobados si tiene datos
  try {
    const [dolCount] = await conn.execute('SELECT COUNT(*) as count FROM dol_aprobados');
    if (dolCount[0].count > 0) {
      console.log('\n=== DATOS EN DOL_APROBADOS ===');
      const [dolData] = await conn.execute('SELECT sigla, plan, descripcion, id_bimestre FROM dol_aprobados ORDER BY sigla, plan LIMIT 15');
      dolData.forEach(row => {
        console.log(`  ${row.sigla} - Plan: ${row.plan} - Bimestre: ${row.id_bimestre} - ${row.descripcion}`);
      });
      
      // Verificar si hay duplicados de sigla
      const [duplicates] = await conn.execute(`
        SELECT sigla, COUNT(*) as count 
        FROM dol_aprobados 
        GROUP BY sigla 
        HAVING COUNT(*) > 1
      `);
      
      if (duplicates.length > 0) {
        console.log('\n=== SIGLAS CON MÚLTIPLES REGISTROS ===');
        duplicates.forEach(dup => {
          console.log(`  ${dup.sigla}: ${dup.count} registros`);
        });
      }
    }
  } catch (error) {
    console.log('Error verificando dol_aprobados:', error.message);
  }

  await conn.end();
}

checkDolTables().catch(console.error);