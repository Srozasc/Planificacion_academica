const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'DuocAdmin123.',
  database: 'planificacion_academica'
};

async function fixAdminUserName() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos');
    
    // 1. Verificar el usuario actual
    console.log('\n=== VERIFICANDO USUARIO ADMIN ACTUAL ===');
    const [currentUser] = await connection.execute(
      'SELECT id, email_institucional, name, role_id, is_active FROM users WHERE email_institucional = ?',
      ['admin@planificacion.edu']
    );
    
    if (currentUser.length === 0) {
      console.log('❌ Usuario admin@planificacion.edu no encontrado');
      return;
    }
    
    console.log('Usuario actual:', currentUser[0]);
    
    // 2. Actualizar el campo name del usuario
    console.log('\n=== ACTUALIZANDO NOMBRE DEL USUARIO ===');
    const [updateResult] = await connection.execute(
      'UPDATE users SET name = ? WHERE email_institucional = ?',
      ['admin@planificacion.edu', 'admin@planificacion.edu']
    );
    
    console.log('Resultado de la actualización:', updateResult);
    
    // 3. Verificar el usuario después de la actualización
    console.log('\n=== VERIFICANDO USUARIO DESPUÉS DE LA ACTUALIZACIÓN ===');
    const [updatedUser] = await connection.execute(
      'SELECT id, email_institucional, name, role_id, is_active FROM users WHERE email_institucional = ?',
      ['admin@planificacion.edu']
    );
    
    console.log('Usuario actualizado:', updatedUser[0]);
    
    // 4. Verificar registros de upload_logs recientes
    console.log('\n=== VERIFICANDO REGISTROS DE UPLOAD_LOGS ===');
    const [uploadLogs] = await connection.execute(`
      SELECT ul.id, ul.file_name, ul.upload_type, ul.upload_date, ul.user_id, u.name as user_name
      FROM upload_logs ul
      LEFT JOIN users u ON ul.user_id = u.id
      ORDER BY ul.upload_date DESC
      LIMIT 5
    `);
    
    console.log('Últimos registros de cargas:');
    uploadLogs.forEach(log => {
      console.log(`- ID: ${log.id}, Archivo: ${log.file_name}, Usuario: ${log.user_name || 'Sin usuario'}, UserID: ${log.user_id}`);
    });
    
    console.log('\n✅ Proceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar el script
fixAdminUserName();