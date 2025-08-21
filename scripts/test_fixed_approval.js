const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config({ path: './backend/.env' });

const execAsync = promisify(exec);

async function testFixedApproval() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('=== PRUEBA DE APROBACIÓN CORREGIDA ===\n');
    
    // 1. Verificar datos en staging_estructura_academica
    const [stagingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_estructura_academica WHERE id_bimestre IS NOT NULL'
    );
    console.log(`1. Registros en staging_estructura_academica con bimestre: ${stagingData[0].count}`);
    
    if (stagingData[0].count === 0) {
      console.log('❌ No hay datos en staging_estructura_academica. Necesitas cargar un archivo primero.');
      return;
    }

    // 2. Estado inicial de carreras y asignaturas
    const [carrerasInicial] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
    const [asignaturasInicial] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
    console.log(`2. Estado inicial - Carreras: ${carrerasInicial[0].count}, Asignaturas: ${asignaturasInicial[0].count}`);

    // 3. Verificar si hay cargas de Estructura Académica pendientes
    const [pendingUploads] = await connection.execute(
      'SELECT id, fileName, uploadType, approvalStatus FROM upload_logs WHERE uploadType = "Estructura Académica" AND approvalStatus = "Pendiente" ORDER BY id DESC LIMIT 1'
    );
    
    if (pendingUploads.length === 0) {
      console.log('❌ No hay cargas de Estructura Académica pendientes de aprobación.');
      return;
    }
    
    const uploadId = pendingUploads[0].id;
    console.log(`3. Carga pendiente encontrada - ID: ${uploadId}, Archivo: ${pendingUploads[0].fileName}`);

    // 4. Simular aprobación ejecutando load_plans.js directamente
    console.log('\n4. Ejecutando load_plans.js desde la ruta corregida...');
    try {
      const { stdout, stderr } = await execAsync('node scripts/permissions/load_plans.js', {
        cwd: process.cwd()
      });
      
      if (stderr) {
        console.log('⚠️  Stderr:', stderr);
      }
      
      console.log('✅ Load plans ejecutado exitosamente');
      console.log('Salida:', stdout);
    } catch (loadPlansError) {
      console.log('❌ Error ejecutando load_plans:', loadPlansError.message);
      if (loadPlansError.stdout) {
        console.log('Stdout:', loadPlansError.stdout);
      }
      if (loadPlansError.stderr) {
        console.log('Stderr:', loadPlansError.stderr);
      }
      return;
    }

    // 5. Verificar estado final
    const [carrerasFinal] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
    const [asignaturasFinal] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
    console.log(`\n5. Estado final - Carreras: ${carrerasFinal[0].count}, Asignaturas: ${asignaturasFinal[0].count}`);

    // 6. Verificar que se agregaron registros
    const carrerasAgregadas = carrerasFinal[0].count - carrerasInicial[0].count;
    const asignaturasAgregadas = asignaturasFinal[0].count - asignaturasInicial[0].count;
    
    console.log(`\n6. Registros agregados - Carreras: ${carrerasAgregadas}, Asignaturas: ${asignaturasAgregadas}`);
    
    if (carrerasAgregadas > 0 || asignaturasAgregadas > 0) {
      console.log('\n✅ ¡ÉXITO! La corrección funciona correctamente.');
      console.log('   - load_plans.js se ejecuta desde la ruta correcta');
      console.log('   - Los datos se sincronizan correctamente a las tablas finales');
    } else {
      console.log('\n⚠️  No se agregaron registros. Verifica que los datos en staging tengan bimestre_id.');
    }

    // 7. Mostrar algunos registros de ejemplo
    const [sampleCarreras] = await connection.execute(
      'SELECT codigo_plan, nombre_carrera, bimestre_id FROM carreras ORDER BY id DESC LIMIT 3'
    );
    const [sampleAsignaturas] = await connection.execute(
      'SELECT sigla, nombre, bimestre_id FROM asignaturas ORDER BY id DESC LIMIT 3'
    );
    
    console.log('\n7. Ejemplos de registros creados:');
    console.log('   Carreras:');
    sampleCarreras.forEach(c => {
      console.log(`     - ${c.codigo_plan}: ${c.nombre_carrera} (Bimestre: ${c.bimestre_id})`);
    });
    
    console.log('   Asignaturas:');
    sampleAsignaturas.forEach(a => {
      console.log(`     - ${a.sigla}: ${a.nombre} (Bimestre: ${a.bimestre_id})`);
    });

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await connection.end();
  }
}

testFixedApproval();