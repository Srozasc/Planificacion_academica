const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Douc2024*',
  database: 'planificacion_academica'
};

async function checkUserUpdateIssue() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos');
    
    // 1. Verificar la estructura de la tabla users
    console.log('\n=== ESTRUCTURA DE LA TABLA USERS ===');
    const [tableStructure] = await connection.execute('DESCRIBE users');
    console.table(tableStructure);
    
    // 2. Verificar constraints y foreign keys
    console.log('\n=== FOREIGN KEYS EN LA TABLA USERS ===');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'planificacion_academica' 
        AND TABLE_NAME = 'users' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(foreignKeys);
    
    // 3. Verificar triggers en la tabla users
    console.log('\n=== TRIGGERS EN LA TABLA USERS ===');
    const [triggers] = await connection.execute(`
      SELECT 
        TRIGGER_NAME,
        EVENT_MANIPULATION,
        ACTION_TIMING,
        ACTION_STATEMENT
      FROM INFORMATION_SCHEMA.TRIGGERS 
      WHERE TABLE_SCHEMA = 'planificacion_academica' 
        AND TABLE_NAME = 'users'
    `);
    console.table(triggers);
    
    // 4. Verificar el estado actual del usuario ID 7
    console.log('\n=== ESTADO ACTUAL DEL USUARIO ID 7 ===');
    const [currentUser] = await connection.execute(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = 7
    `);
    console.table(currentUser);
    
    // 5. Intentar actualizar manualmente el usuario
    console.log('\n=== INTENTANDO ACTUALIZACIÓN MANUAL ===');
    console.log('Actualizando role_id de 7 a 8...');
    
    const [updateResult] = await connection.execute(
      'UPDATE users SET role_id = 8 WHERE id = 7'
    );
    console.log('Resultado de la actualización:', updateResult);
    
    // 6. Verificar el estado después de la actualización
    console.log('\n=== ESTADO DESPUÉS DE LA ACTUALIZACIÓN ===');
    const [updatedUser] = await connection.execute(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.id = 7
    `);
    console.table(updatedUser);
    
    // 7. Verificar si existe el rol ID 8
    console.log('\n=== VERIFICANDO EXISTENCIA DEL ROL ID 8 ===');
    const [role8] = await connection.execute('SELECT * FROM roles WHERE id = 8');
    console.table(role8);
    
    // 8. Revertir el cambio para mantener el estado original
    console.log('\n=== REVIRTIENDO CAMBIO ===');
    await connection.execute('UPDATE users SET role_id = 7 WHERE id = 7');
    console.log('Cambio revertido');
    
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