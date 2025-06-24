const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function createStoredProcedures() {
  let connection;
  
  try {
    console.log('🚀 Creando Stored Procedures de Programación Académica...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica',
      multipleStatements: true
    });

    console.log('✅ Conexión establecida con la base de datos\n');

    const proceduresPath = './src/database/stored-procedures';
    const procedures = [
      'sp_GetScheduleEvents.sql',
      'sp_ValidateAndSaveScheduleEvent.sql',
      'sp_DeleteScheduleEvent.sql',
      'sp_GetScheduleStatistics.sql'
    ];

    for (const procedure of procedures) {
      const filePath = path.join(proceduresPath, procedure);
      
      try {        console.log(`📄 Creando: ${procedure}`);
        
        let sql = await fs.readFile(filePath, 'utf8');
          // Limpiar delimiters y comentarios para Node.js
        sql = sql.replace(/DELIMITER \$\$/g, '')
                 .replace(/DELIMITER ;/g, '')
                 .replace(/\$\$/g, '')
                 .trim();
        
        // Extraer nombre del procedure para eliminar si existe
        const procNameMatch = sql.match(/CREATE PROCEDURE\s+(\w+)/i);
        if (procNameMatch) {
          const procName = procNameMatch[1];
          await connection.execute(`DROP PROCEDURE IF EXISTS ${procName}`);
        }
        
        // Ejecutar el stored procedure usando query en lugar de execute
        await connection.query(sql);
        
        console.log(`   ✅ ${procedure} creado exitosamente`);
        
      } catch (error) {
        console.error(`   ❌ Error en ${procedure}:`, error.message);
        
        // Si es un error de procedimiento ya existente, continuar
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️ ${procedure} ya existe, recreando...`);
          
          // Intentar eliminar y volver a crear
          const procName = procedure.replace('.sql', '');
          await connection.execute(`DROP PROCEDURE IF EXISTS ${procName}`);
          await connection.execute(sql);
          console.log(`   ✅ ${procedure} recreado exitosamente`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🔍 Verificando stored procedures creados...');
    
    // Verificar procedures creados
    const [procedures_list] = await connection.execute(`
      SELECT 
        ROUTINE_NAME,
        ROUTINE_TYPE,
        CREATED,
        ROUTINE_COMMENT
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'planificacion_academica' 
        AND ROUTINE_NAME LIKE 'sp_%Schedule%'
      ORDER BY ROUTINE_NAME
    `);

    console.log('\n📋 Stored Procedures de Programación:');
    procedures_list.forEach(proc => {
      console.log(`   ✅ ${proc.ROUTINE_NAME} (${proc.ROUTINE_TYPE}) - Creado: ${proc.CREATED}`);
    });

    console.log('\n🎉 ¡Stored Procedures creados exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Procedures creados: ${procedures_list.length}`);
    console.log(`   - sp_GetScheduleEvents: Consulta eventos con filtros`);
    console.log(`   - sp_ValidateAndSaveScheduleEvent: Validaciones críticas de negocio`);
    console.log(`   - sp_DeleteScheduleEvent: Eliminación lógica/física`);
    console.log(`   - sp_GetScheduleStatistics: Estadísticas y métricas`);
    
    return true;

  } catch (error) {
    console.error('\n❌ Error durante la creación de stored procedures:', error.message);
    return false;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar creación de procedures
createStoredProcedures().then(success => {
  if (success) {
    console.log('\n✨ Sistema listo para pruebas de stored procedures');
    process.exit(0);
  } else {
    console.log('\n🔧 Revisar errores y volver a intentar');
    process.exit(1);
  }
});
