const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'planificacion_academica'
};

async function checkUserUpdateIssue() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos');
    
    // 1. Verificar el estado actual del usuario ID 7
    console.log('\n=== ESTADO INICIAL DEL USUARIO ID 7 ===');
    const [initialUser] = await connection.execute(`
      SELECT u.id, u.name, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = 7
    `);
    console.table(initialUser);
    
    // 2. Verificar si existe el rol ID 8
    console.log('\n=== VERIFICANDO EXISTENCIA DEL ROL ID 8 ===');
    const [role8] = await connection.execute('SELECT * FROM roles WHERE id = 8');
    console.table(role8);
    
    if (role8.length === 0) {
      console.log('❌ ERROR: El rol ID 8 no existe!');
      return;
    }
    
    // 3. Intentar actualizar manualmente el usuario
    console.log('\n=== INTENTANDO ACTUALIZACIÓN MANUAL ===');
    console.log('Actualizando role_id de 7 a 8...');
    
    const [updateResult] = await connection.execute(
      'UPDATE users SET role_id = 8 WHERE id = 7'
    );
    console.log('Resultado de la actualización:', {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows,
      info: updateResult.info
    });
    
    // 4. Verificar el estado después de la actualización
    console.log('\n=== ESTADO DESPUÉS DE LA ACTUALIZACIÓN ===');
    const [updatedUser] = await connection.execute(`
      SELECT u.id, u.name, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = 7
    `);
    console.table(updatedUser);
    
    // 5. Verificar si el cambio se persistió
    if (updatedUser[0].role_id === 8) {
      console.log('✅ ÉXITO: La actualización manual funcionó correctamente');
    } else {
      console.log('❌ ERROR: La actualización manual no se persistió');
    }
    
    // 6. Revertir el cambio para mantener el estado original
    console.log('\n=== REVIRTIENDO CAMBIO ===');
    await connection.execute('UPDATE users SET role_id = 7 WHERE id = 7');
    console.log('Cambio revertido');
    
    // 7. Verificar el estado final
    console.log('\n=== ESTADO FINAL ===');
    const [finalUser] = await connection.execute(`
      SELECT u.id, u.name, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = 7
    `);
    console.table(finalUser);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

checkUserUpdateIssue();