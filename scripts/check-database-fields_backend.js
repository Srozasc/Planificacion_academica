const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'planificacion_academica'
};

async function checkDatabaseFields() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Verificar estructura de la tabla users
    console.log('\n=== ESTRUCTURA DE LA TABLA USERS ===');
    const [tableStructure] = await connection.execute('DESCRIBE users');
    console.table(tableStructure);
    
    // 2. Verificar si existen los campos específicos
    console.log('\n=== VERIFICACIÓN DE CAMPOS ESPECÍFICOS ===');
    const roleExpiresField = tableStructure.find(field => field.Field === 'role_expires_at');
    const previousRoleField = tableStructure.find(field => field.Field === 'previous_role_id');
    
    console.log('Campo role_expires_at:', roleExpiresField ? '✅ EXISTE' : '❌ NO EXISTE');
    console.log('Campo previous_role_id:', previousRoleField ? '✅ EXISTE' : '❌ NO EXISTE');
    
    if (roleExpiresField) {
      console.log('  - Tipo:', roleExpiresField.Type);
      console.log('  - Null:', roleExpiresField.Null);
      console.log('  - Default:', roleExpiresField.Default);
    }
    
    if (previousRoleField) {
      console.log('  - Tipo:', previousRoleField.Type);
      console.log('  - Null:', previousRoleField.Null);
      console.log('  - Default:', previousRoleField.Default);
    }
    
    // 3. Verificar datos existentes
    console.log('\n=== DATOS EXISTENTES EN LA TABLA USERS ===');
    const [users] = await connection.execute(`
      SELECT 
        id,
        name,
        email_institucional,
        role_id,
        role_expires_at,
        previous_role_id,
        is_active,
        created_at,
        updated_at
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY id
    `);
    
    console.table(users);
    
    // 4. Verificar usuarios con roles temporales
    console.log('\n=== USUARIOS CON ROLES TEMPORALES ===');
    const [tempUsers] = await connection.execute(`
      SELECT 
        id,
        name,
        email_institucional,
        role_id,
        role_expires_at,
        previous_role_id
      FROM users 
      WHERE role_expires_at IS NOT NULL
        AND deleted_at IS NULL
    `);
    
    if (tempUsers.length > 0) {
      console.table(tempUsers);
    } else {
      console.log('No hay usuarios con roles temporales.');
    }
    
    // 5. Verificar foreign keys
    console.log('\n=== FOREIGN KEYS DE LA TABLA USERS ===');
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
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada.');
    }
  }
}

// Ejecutar la verificación
checkDatabaseFields();