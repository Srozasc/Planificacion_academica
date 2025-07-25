/**
 * Script para corregir permisos del bimestre 16 que fueron marcados incorrectamente como PROCESADO
 * Los marca como PENDIENTE para que sean reprocesados con la nueva lógica
 */

const mysql = require('mysql2/promise');

// Configuración de base de datos
const dbConfig = {
  host: 'localhost',
  user: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica',
  port: 3306
};

async function fixBimestre16Permissions() {
  let connection;
  
  try {
    console.log('🔧 Iniciando corrección de permisos del bimestre 16...');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a base de datos establecida');
    
    // 1. Verificar permisos problemáticos del bimestre 16
    console.log('\n🔍 Verificando permisos problemáticos del bimestre 16...');
    const [problemáticos] = await connection.execute(`
      SELECT 
        pp.id,
        pp.usuario_mail,
        pp.permiso_carrera_codigo,
        pp.bimestre_id,
        pp.estado,
        pp.fecha_creacion
      FROM permisos_pendientes pp
      LEFT JOIN carreras c ON pp.permiso_carrera_codigo = c.codigo_plan 
                           AND pp.bimestre_id = c.bimestre_id
                           AND c.activo = TRUE
      WHERE pp.bimestre_id = 16 
        AND pp.estado = 'PROCESADO'
        AND c.id IS NULL
        AND pp.permiso_carrera_codigo IS NOT NULL
    `);
    
    if (problemáticos.length === 0) {
      console.log('✅ No se encontraron permisos problemáticos para el bimestre 16');
      return;
    }
    
    console.log(`⚠️  Encontrados ${problemáticos.length} permisos problemáticos:`);
    problemáticos.forEach(row => {
      console.log(`   - ID: ${row.id}, Usuario: ${row.usuario_mail}, Carrera: ${row.permiso_carrera_codigo}`);
    });
    
    // 2. Marcar como PENDIENTE para reprocesamiento
    console.log('\n🔄 Marcando permisos como PENDIENTE para reprocesamiento...');
    const [updateResult] = await connection.execute(`
      UPDATE permisos_pendientes pp
      LEFT JOIN carreras c ON pp.permiso_carrera_codigo = c.codigo_plan 
                           AND pp.bimestre_id = c.bimestre_id
                           AND c.activo = TRUE
      SET 
        pp.estado = 'PENDIENTE',
        pp.mensaje_error = NULL,
        pp.fecha_procesamiento = NULL
      WHERE pp.bimestre_id = 16 
        AND pp.estado = 'PROCESADO'
        AND c.id IS NULL
        AND pp.permiso_carrera_codigo IS NOT NULL
    `);
    
    console.log(`✅ ${updateResult.affectedRows} permisos marcados como PENDIENTE`);
    
    // 3. Verificar el estado después de la corrección
    console.log('\n📊 Estado después de la corrección:');
    const [estadoFinal] = await connection.execute(`
      SELECT 
        estado,
        COUNT(*) as cantidad
      FROM permisos_pendientes
      WHERE bimestre_id = 16
      GROUP BY estado
      ORDER BY estado
    `);
    
    estadoFinal.forEach(row => {
      console.log(`   ${row.estado}: ${row.cantidad} registros`);
    });
    
    console.log('\n🎯 Ahora ejecuta el script resolve_permissions.js para procesar los permisos pendientes');
    console.log('   node scripts/permissions/resolve_permissions.js');
    
  } catch (error) {
    console.error('❌ Error en la corrección:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la corrección
if (require.main === module) {
  fixBimestre16Permissions()
    .then(() => {
      console.log('\n🎉 Corrección completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { fixBimestre16Permissions };