/**
 * Script de prueba para verificar que los permisos se manejan correctamente
 * cuando no existen carreras para un bimestre específico
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

async function testBimestreValidation() {
  let connection;
  
  try {
    console.log('🔍 Iniciando prueba de validación de bimestre...');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a base de datos establecida');
    
    // 1. Verificar carreras por bimestre
    console.log('\n📊 CARRERAS POR BIMESTRE:');
    const [carreras] = await connection.execute(`
      SELECT 
        b.id as bimestre_id,
        b.nombre as bimestre_nombre,
        COUNT(c.id) as total_carreras
      FROM bimestres b
      LEFT JOIN carreras c ON b.id = c.bimestre_id AND c.activo = TRUE
      GROUP BY b.id, b.nombre
      ORDER BY b.id
    `);
    
    carreras.forEach(row => {
      console.log(`   Bimestre ${row.bimestre_id} (${row.bimestre_nombre}): ${row.total_carreras} carreras`);
    });
    
    // 2. Verificar permisos pendientes por bimestre
    console.log('\n📋 PERMISOS PENDIENTES POR BIMESTRE:');
    const [permisos] = await connection.execute(`
      SELECT 
        bimestre_id,
        estado,
        COUNT(*) as cantidad
      FROM permisos_pendientes
      GROUP BY bimestre_id, estado
      ORDER BY bimestre_id, estado
    `);
    
    permisos.forEach(row => {
      console.log(`   Bimestre ${row.bimestre_id} - ${row.estado}: ${row.cantidad} registros`);
    });
    
    // 3. Verificar permisos pendientes con carreras inexistentes
    console.log('\n⚠️  PERMISOS CON CARRERAS INEXISTENTES:');
    const [problemáticos] = await connection.execute(`
      SELECT 
        pp.id,
        pp.usuario_mail,
        pp.permiso_carrera_codigo,
        pp.bimestre_id,
        pp.estado,
        pp.mensaje_error,
        CASE 
          WHEN c.id IS NULL THEN 'CARRERA NO EXISTE PARA ESTE BIMESTRE'
          ELSE 'CARRERA EXISTE'
        END as validacion
      FROM permisos_pendientes pp
      LEFT JOIN carreras c ON pp.permiso_carrera_codigo = c.codigo_plan 
                           AND pp.bimestre_id = c.bimestre_id
                           AND c.activo = TRUE
      WHERE pp.permiso_carrera_codigo IS NOT NULL
      ORDER BY pp.bimestre_id, pp.estado
    `);
    
    problemáticos.forEach(row => {
      const status = row.validacion === 'CARRERA NO EXISTE PARA ESTE BIMESTRE' ? '❌' : '✅';
      console.log(`   ${status} ${row.usuario_mail} - Carrera: ${row.permiso_carrera_codigo} - Bimestre: ${row.bimestre_id} - Estado: ${row.estado}`);
      if (row.mensaje_error) {
        console.log(`      Error: ${row.mensaje_error}`);
      }
    });
    
    // 4. Resumen de validación
    console.log('\n📈 RESUMEN DE VALIDACIÓN:');
    const [resumen] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN pp.estado = 'PROCESADO' AND c.id IS NULL THEN 1 END) as procesados_incorrectos,
        COUNT(CASE WHEN pp.estado = 'ERROR' AND c.id IS NULL THEN 1 END) as errores_correctos,
        COUNT(CASE WHEN pp.estado = 'PENDIENTE' AND c.id IS NULL THEN 1 END) as pendientes_correctos
      FROM permisos_pendientes pp
      LEFT JOIN carreras c ON pp.permiso_carrera_codigo = c.codigo_plan 
                           AND pp.bimestre_id = c.bimestre_id
                           AND c.activo = TRUE
      WHERE pp.permiso_carrera_codigo IS NOT NULL
    `);
    
    const stats = resumen[0];
    console.log(`   ❌ Procesados incorrectamente (deberían ser ERROR): ${stats.procesados_incorrectos}`);
    console.log(`   ✅ Marcados como ERROR correctamente: ${stats.errores_correctos}`);
    console.log(`   ⏳ Pendientes (esperando carreras): ${stats.pendientes_correctos}`);
    
    if (stats.procesados_incorrectos > 0) {
      console.log('\n🚨 PROBLEMA DETECTADO: Hay permisos marcados como PROCESADO cuando deberían estar en ERROR');
      console.log('   Esto indica que el script resolve_permissions.js necesita la corrección implementada.');
    } else {
      console.log('\n✅ VALIDACIÓN EXITOSA: Los permisos se están manejando correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testBimestreValidation()
    .then(() => {
      console.log('\n🎉 Prueba completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { testBimestreValidation };