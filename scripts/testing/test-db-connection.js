const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...\n');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    console.log('✅ Conexión exitosa a la base de datos');
      // Verificar tablas existentes relacionadas con programación
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'planificacion_academica' 
        AND (TABLE_NAME LIKE '%schedule%' 
             OR TABLE_NAME LIKE '%event%' 
             OR TABLE_NAME LIKE '%configuration%')
    `);
      console.log('\n📋 Tablas existentes relacionadas con programación:');
    if (tables.length === 0) {
      console.log('   No se encontraron tablas de programación (esperado antes de migraciones)');
    } else {
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    }
    
    // Verificar si existen las tablas base necesarias
    const [baseTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'planificacion_academica' 
        AND TABLE_NAME IN ('users', 'academic_structures', 'teachers')
    `);
    
    console.log('\n🏗️ Tablas base necesarias:');
    baseTables.forEach(table => {
      console.log(`   ✅ ${table.TABLE_NAME}`);
    });
    
    await connection.end();
    
    if (baseTables.length >= 3) {
      console.log('\n🚀 Base de datos lista para ejecutar migraciones de programación académica');
      return true;
    } else {
      console.log('\n⚠️ Faltan tablas base. Verificar migraciones anteriores.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n✨ Listo para proceder con las migraciones');
  } else {
    console.log('\n🔧 Revisar configuración de base de datos');
  }
});
