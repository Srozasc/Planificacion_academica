const mysql = require('mysql2/promise');
const fs = require('fs');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica',
  port: 3306
};

async function testDolDuplicateScenario() {
  let connection;
  
  try {
    console.log('=== PRUEBA DE ESCENARIO DOL CON SIGLAS DUPLICADAS ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos:', dbConfig.database);
    
    // Limpiar datos de prueba anteriores
    console.log('\n1. Limpiando datos de prueba anteriores...');
    await connection.query('DELETE FROM staging_dol WHERE id_bimestre = 20 AND sigla = "DOL006"');
    
    // Verificar estado inicial
    const [initialCount] = await connection.query(
      'SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = 20 AND sigla = "DOL006"'
    );
    console.log('Registros iniciales para bimestre 20 con sigla DOL006:', initialCount[0].count);
    
    // Simular inserción de dos registros con la misma sigla pero diferente plan
    console.log('\n2. Insertando primer registro: SIGLA=DOL006, PLAN=1114401');
    const insertQuery1 = `
      INSERT INTO staging_dol (sigla, plan, descripcion, id_bimestre) 
      VALUES ('DOL006', '1114401', 'Descripción Plan 1114401', 20)
    `;
    
    try {
      await connection.query(insertQuery1);
      console.log('✓ Primer registro insertado exitosamente');
    } catch (error) {
      console.log('✗ Error insertando primer registro:', error.message);
    }
    
    // Verificar después del primer insert
    const [countAfterFirst] = await connection.query(
      'SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = 20 AND sigla = "DOL006"'
    );
    console.log('Registros después del primer insert:', countAfterFirst[0].count);
    
    console.log('\n3. Insertando segundo registro: SIGLA=DOL006, PLAN=1114402');
    const insertQuery2 = `
      INSERT INTO staging_dol (sigla, plan, descripcion, id_bimestre) 
      VALUES ('DOL006', '1114402', 'Descripción Plan 1114402', 20)
    `;
    
    try {
      await connection.query(insertQuery2);
      console.log('✓ Segundo registro insertado exitosamente');
    } catch (error) {
      console.log('✗ Error insertando segundo registro:', error.message);
      console.log('Detalles del error:', error);
    }
    
    // Verificar después del segundo insert
    const [countAfterSecond] = await connection.query(
      'SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = 20 AND sigla = "DOL006"'
    );
    console.log('Registros después del segundo insert:', countAfterSecond[0].count);
    
    // Mostrar todos los registros
    console.log('\n4. Registros finales en la tabla:');
    const [finalRecords] = await connection.query(
      'SELECT * FROM staging_dol WHERE id_bimestre = 20 AND sigla = "DOL006" ORDER BY sigla, plan'
    );
    
    if (finalRecords.length === 0) {
      console.log('No hay registros en la tabla para bimestre 20 con sigla DOL006');
    } else {
      console.log('Registros encontrados:');
      finalRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. SIGLA: ${record.sigla}, PLAN: ${record.plan}, DESCRIPCION: ${record.descripcion}`);
      });
    }
    
    // Verificar estructura de la clave primaria
    console.log('\n5. Verificando estructura de la clave primaria:');
    const [keyInfo] = await connection.query(`
      SHOW KEYS FROM staging_dol WHERE Key_name = 'PRIMARY'
    `);
    
    console.log('Información de la clave primaria:');
    keyInfo.forEach(key => {
      console.log(`  Columna: ${key.Column_name}, Posición: ${key.Seq_in_index}`);
    });
    
    // Probar con INSERT ... ON DUPLICATE KEY UPDATE
    console.log('\n6. Probando INSERT ... ON DUPLICATE KEY UPDATE:');
    const upsertQuery = `
      INSERT INTO staging_dol (sigla, plan, descripcion, id_bimestre) 
      VALUES ('DOL006', '1114401', 'Descripción ACTUALIZADA Plan 1114401', 20)
      ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
    `;
    
    try {
      const [upsertResult] = await connection.query(upsertQuery);
      console.log('✓ UPSERT ejecutado exitosamente');
      console.log('Affected rows:', upsertResult.affectedRows);
      console.log('Changed rows:', upsertResult.changedRows);
    } catch (error) {
      console.log('✗ Error en UPSERT:', error.message);
    }
    
    // Verificar registros finales después del upsert
    console.log('\n7. Registros después del UPSERT:');
    const [upsertRecords] = await connection.query(
      'SELECT * FROM staging_dol WHERE id_bimestre = 20 AND sigla = "DOL006" ORDER BY sigla, plan'
    );
    
    upsertRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. SIGLA: ${record.sigla}, PLAN: ${record.plan}, DESCRIPCION: ${record.descripcion}`);
    });
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
testDolDuplicateScenario();