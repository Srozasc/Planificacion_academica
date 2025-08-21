const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: 3306,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'planificacion_academica'
};

async function testUserCreation() {
  let connection;
  
  try {
    console.log('🔍 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa');
    
    // Verificar el último usuario creado
    console.log('\n📊 Verificando últimos usuarios creados:');
    const [users] = await connection.execute(`
      SELECT 
        id,
        name,
        email_institucional,
        role_id,
        role_expires_at,
        previous_role_id,
        is_active,
        created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('Últimos 5 usuarios:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Nombre: ${user.name}, Email: ${user.email_institucional}`);
      console.log(`  Rol ID: ${user.role_id}, Expira: ${user.role_expires_at}, Rol Anterior: ${user.previous_role_id}`);
      console.log(`  Activo: ${user.is_active}, Creado: ${user.created_at}`);
      console.log('');
    });
    
    // Verificar usuarios con roles temporales
    console.log('\n🕒 Usuarios con roles temporales (role_expires_at no nulo):');
    const [temporaryUsers] = await connection.execute(`
      SELECT 
        id,
        name,
        email_institucional,
        role_id,
        role_expires_at,
        previous_role_id
      FROM users 
      WHERE role_expires_at IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    if (temporaryUsers.length === 0) {
      console.log('❌ No se encontraron usuarios con roles temporales');
    } else {
      console.log(`✅ Se encontraron ${temporaryUsers.length} usuarios con roles temporales:`);
      temporaryUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email_institucional})`);
        console.log(`  Rol actual: ${user.role_id}, Expira: ${user.role_expires_at}, Rol anterior: ${user.previous_role_id}`);
      });
    }
    
    // Verificar usuarios con previous_role_id
    console.log('\n🔄 Usuarios con previous_role_id configurado:');
    const [usersWithPreviousRole] = await connection.execute(`
      SELECT 
        id,
        name,
        email_institucional,
        role_id,
        previous_role_id
      FROM users 
      WHERE previous_role_id IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    if (usersWithPreviousRole.length === 0) {
      console.log('❌ No se encontraron usuarios con previous_role_id configurado');
    } else {
      console.log(`✅ Se encontraron ${usersWithPreviousRole.length} usuarios con previous_role_id:`);
      usersWithPreviousRole.forEach(user => {
        console.log(`- ${user.name} (${user.email_institucional})`);
        console.log(`  Rol actual: ${user.role_id}, Rol anterior: ${user.previous_role_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
testUserCreation();