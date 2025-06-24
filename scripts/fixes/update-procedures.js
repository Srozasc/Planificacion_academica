const mysql = require('mysql2/promise');
const fs = require('fs').promises;

async function updateProcedures() {
  let connection;
  
  try {
    console.log('🔄 Actualizando Stored Procedures...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica',
      multipleStatements: true
    });

    console.log('✅ Conexión establecida');

    // Leer y ejecutar el script SQL
    const sqlScript = await fs.readFile('update-procedures.sql', 'utf8');
    
    // Dividir el script en comandos individuales
    const commands = sqlScript.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command.length > 0 && !command.startsWith('--')) {
        try {
          console.log(`📄 Ejecutando comando ${i + 1}/${commands.length}...`);
          await connection.execute(command);
        } catch (error) {
          if (!error.message.includes('does not exist')) {
            console.log(`⚠️ Error en comando ${i + 1}: ${error.message}`);
          }
        }
      }
    }

    console.log('✅ Stored procedures actualizados exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

updateProcedures();
