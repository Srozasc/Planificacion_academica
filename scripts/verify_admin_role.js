const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'DuocAdmin123.',
  database: 'planificacion_academica'
};

async function verifyAdminRole() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // 1. Verificar el usuario admin@planificacion.edu
    console.log('\n=== VERIFICANDO USUARIO ADMIN ===');
    const [adminUser] = await connection.execute(
      'SELECT id, email_institucional, name, role_id, is_active FROM users WHERE email_institucional = ?',
      ['admin@planificacion.edu']
    );
    
    if (adminUser.length === 0) {
      console.log('❌ Usuario admin@planificacion.edu no encontrado');
      return;
    }
    
    const user = adminUser[0];
    console.log('📋 Información del usuario:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email_institucional}`);
    console.log(`   - Nombre: ${user.name}`);
    console.log(`   - Role ID: ${user.role_id} (tipo: ${typeof user.role_id})`);
    console.log(`   - Activo: ${user.is_active}`);
    
    // 2. Verificar los roles disponibles
    console.log('\n=== ROLES DISPONIBLES ===');
    const [roles] = await connection.execute(
      'SELECT id, name, description FROM roles ORDER BY id'
    );
    
    roles.forEach(role => {
      console.log(`   - ID: ${role.id}, Nombre: ${role.name}, Descripción: ${role.description}`);
    });
    
    // 3. Verificar si el role_id 3 corresponde a 'Maestro'
    console.log('\n=== VERIFICACIÓN ESPECÍFICA ===');
    const [maestroRole] = await connection.execute(
      'SELECT id, name FROM roles WHERE id = 3'
    );
    
    if (maestroRole.length > 0) {
      console.log(`✅ Role ID 3 corresponde a: ${maestroRole[0].name}`);
    } else {
      console.log('❌ No se encontró role con ID 3');
    }
    
    // 4. Verificar si el usuario admin tiene role_id = 3
    if (user.role_id === 3) {
      console.log('✅ El usuario admin@planificacion.edu tiene role_id = 3 (Maestro)');
    } else {
      console.log(`❌ El usuario admin@planificacion.edu tiene role_id = ${user.role_id}, NO es 3`);
      
      // Buscar qué rol tiene actualmente
      const [currentRole] = await connection.execute(
        'SELECT name FROM roles WHERE id = ?',
        [user.role_id]
      );
      
      if (currentRole.length > 0) {
        console.log(`   Su rol actual es: ${currentRole[0].name}`);
      }
    }
    
    // 5. Verificar comparación en JavaScript
    console.log('\n=== VERIFICACIÓN DE COMPARACIÓN ===');
    console.log(`user.role_id === 3: ${user.role_id === 3}`);
    console.log(`user.role_id == 3: ${user.role_id == 3}`);
    console.log(`Number(user.role_id) === 3: ${Number(user.role_id) === 3}`);
    console.log(`String(user.role_id) === '3': ${String(user.role_id) === '3'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la verificación
verifyAdminRole();