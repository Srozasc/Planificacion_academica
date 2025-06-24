const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  let connection;
  
  try {
    console.log('🚀 Iniciando ejecución de migraciones de programación académica...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica',
      multipleStatements: true
    });

    console.log('✅ Conexión establecida con la base de datos\n');

    const migrationsPath = './src/database/migrations';    const migrations = [
      '011-create-event-statuses-table.sql',
      '012-create-schedule-events-table.sql', 
      '013-seed-event-statuses-data.sql',
      '014a-create-configuration-table.sql',
      '014b-seed-configuration-data.sql'
    ];

    for (const migration of migrations) {
      const filePath = path.join(migrationsPath, migration);
      
      try {
        console.log(`📄 Ejecutando: ${migration}`);
        
        const sql = await fs.readFile(filePath, 'utf8');
        
        // Ejecutar la migración
        await connection.execute(sql);
        
        console.log(`   ✅ ${migration} ejecutada exitosamente`);
        
      } catch (error) {
        console.error(`   ❌ Error en ${migration}:`, error.message);
        
        // Si es un error de tabla ya existente, continuar
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️ ${migration} ya fue aplicada anteriormente`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🔍 Verificando tablas creadas...');
    
    // Verificar tablas creadas
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'planificacion_academica' 
        AND TABLE_NAME IN ('event_statuses', 'schedule_events', 'configuration')
      ORDER BY TABLE_NAME
    `);

    console.log('\n📋 Tablas de programación académica:');
    tables.forEach(table => {
      console.log(`   ✅ ${table.TABLE_NAME} - ${table.TABLE_COMMENT}`);
    });

    // Verificar estados creados
    const [statuses] = await connection.execute(`
      SELECT id, name, color_hex, sort_order 
      FROM event_statuses 
      ORDER BY sort_order
    `);

    console.log('\n🏷️ Estados de eventos creados:');
    statuses.forEach(status => {
      console.log(`   ${status.id}. ${status.name} (${status.color_hex})`);
    });

    // Verificar configuraciones
    const [configs] = await connection.execute(`
      SELECT category, COUNT(*) as count
      FROM configuration 
      GROUP BY category
      ORDER BY category
    `);

    console.log('\n⚙️ Configuraciones por categoría:');
    configs.forEach(config => {
      console.log(`   ${config.category}: ${config.count} configuraciones`);
    });

    console.log('\n🎉 ¡Migraciones de programación académica completadas exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Tablas creadas: ${tables.length}`);
    console.log(`   - Estados de eventos: ${statuses.length}`);
    console.log(`   - Configuraciones: ${configs.reduce((sum, c) => sum + c.count, 0)}`);
    
    return true;

  } catch (error) {
    console.error('\n❌ Error durante las migraciones:', error.message);
    return false;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migraciones
runMigrations().then(success => {
  if (success) {
    console.log('\n✨ Sistema listo para desarrollar funcionalidades de calendario');
    process.exit(0);
  } else {
    console.log('\n🔧 Revisar errores y volver a intentar');
    process.exit(1);
  }
});
