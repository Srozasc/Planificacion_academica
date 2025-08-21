const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica'
};

async function checkDol006Records() {
  let connection;
  
  try {
    console.log('=== VERIFICACIÓN DE REGISTROS DOL006 ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión a la base de datos establecida');
    
    // Consultar todos los registros DOL006 para el bimestre 20
    const [rows] = await connection.execute(
      'SELECT sigla, plan, descripcion, id_bimestre FROM staging_dol WHERE sigla = ? AND id_bimestre = ? ORDER BY plan',
      ['DOL006', 20]
    );
    
    console.log(`\nRegistros encontrados para DOL006 en bimestre 20: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('\nDetalle de registros:');
      rows.forEach((row, index) => {
        console.log(`  ${index + 1}. SIGLA: ${row.sigla}, PLAN: ${row.plan}, DESCRIPCION: ${row.descripcion}`);
      });
    } else {
      console.log('No se encontraron registros DOL006 para el bimestre 20');
    }
    
    // Consultar el total de registros en staging_dol para el bimestre 20
    const [totalRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM staging_dol WHERE id_bimestre = ?',
      [20]
    );
    
    console.log(`\nTotal de registros en staging_dol para bimestre 20: ${totalRows[0].total}`);
    
    // Consultar todas las siglas únicas para el bimestre 20
    const [siglas] = await connection.execute(
      'SELECT DISTINCT sigla FROM staging_dol WHERE id_bimestre = ? ORDER BY sigla',
      [20]
    );
    
    console.log(`\nSiglas únicas en bimestre 20: ${siglas.length}`);
    console.log('Primeras 10 siglas:', siglas.slice(0, 10).map(s => s.sigla).join(', '));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

checkDol006Records();