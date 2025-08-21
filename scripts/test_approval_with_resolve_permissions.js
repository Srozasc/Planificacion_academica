const { Pool } = require('pg');
const axios = require('axios');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'planificacion_academica',
  password: 'admin',
  port: 5432,
});

const API_BASE_URL = 'http://localhost:3000';

async function testApprovalWithResolvePermissions() {
  console.log('\n🧪 === PRUEBA DE APROBACIÓN CON RESOLVE_PERMISSIONS ===\n');
  
  try {
    // 1. Verificar datos en staging_estructura_academica
    console.log('1️⃣ Verificando datos en staging_estructura_academica...');
    const stagingResult = await pool.query('SELECT COUNT(*) as count FROM staging_estructura_academica');
    console.log(`   📊 Registros en staging_estructura_academica: ${stagingResult.rows[0].count}`);
    
    if (stagingResult.rows[0].count === '0') {
      console.log('   ⚠️  No hay datos en staging_estructura_academica. Insertando datos de prueba...');
      await pool.query(`
        INSERT INTO staging_estructura_academica (carrera_codigo, carrera_nombre, asignatura_codigo, asignatura_nombre, bimestre_id)
        VALUES 
        ('TEST001', 'Carrera de Prueba 1', 'ASIG001', 'Asignatura de Prueba 1', 1),
        ('TEST002', 'Carrera de Prueba 2', 'ASIG002', 'Asignatura de Prueba 2', 1)
      `);
      console.log('   ✅ Datos de prueba insertados');
    }
    
    // 2. Verificar estado inicial de las tablas
    console.log('\n2️⃣ Verificando estado inicial de las tablas...');
    const carrerasResult = await pool.query('SELECT COUNT(*) as count FROM carreras');
    const asignaturasResult = await pool.query('SELECT COUNT(*) as count FROM asignaturas');
    const permissionsPendingResult = await pool.query('SELECT COUNT(*) as count FROM permisos_pendientes');
    
    console.log(`   📊 Carreras: ${carrerasResult.rows[0].count}`);
    console.log(`   📊 Asignaturas: ${asignaturasResult.rows[0].count}`);
    console.log(`   📊 Permisos pendientes: ${permissionsPendingResult.rows[0].count}`);
    
    // 3. Buscar o crear una carga pendiente de Estructura Académica
    console.log('\n3️⃣ Buscando carga pendiente de Estructura Académica...');
    let uploadResult = await pool.query(`
      SELECT id, file_name, upload_type, approval_status, is_processed 
      FROM upload_logs 
      WHERE upload_type = 'Estructura Académica' 
      AND approval_status = 'Pendiente' 
      ORDER BY upload_date DESC 
      LIMIT 1
    `);
    
    let uploadId;
    if (uploadResult.rows.length === 0) {
      console.log('   📝 No hay cargas pendientes. Creando una carga de prueba...');
      const insertResult = await pool.query(`
        INSERT INTO upload_logs (file_name, upload_type, bimestre_id, status, total_records, error_count, approval_status, is_processed)
        VALUES ('test_estructura_academica.xlsx', 'Estructura Académica', 1, 'Exitoso', 2, 0, 'Pendiente', false)
        RETURNING id
      `);
      uploadId = insertResult.rows[0].id;
      console.log(`   ✅ Carga de prueba creada con ID: ${uploadId}`);
    } else {
      uploadId = uploadResult.rows[0].id;
      console.log(`   ✅ Carga pendiente encontrada con ID: ${uploadId}`);
    }
    
    // 4. Aprobar la carga a través de la API
    console.log('\n4️⃣ Aprobando la carga a través de la API...');
    try {
      const approvalResponse = await axios.post(`${API_BASE_URL}/uploads/${uploadId}/approve`, {
        approvedByUserId: 1
      });
      console.log('   ✅ Carga aprobada exitosamente');
      console.log(`   📋 Respuesta: ${JSON.stringify(approvalResponse.data, null, 2)}`);
    } catch (apiError) {
      console.log('   ❌ Error en la API de aprobación:', apiError.response?.data || apiError.message);
      return;
    }
    
    // 5. Esperar un momento para que se ejecuten los scripts
    console.log('\n5️⃣ Esperando ejecución de scripts (5 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Verificar estado final de las tablas
    console.log('\n6️⃣ Verificando estado final de las tablas...');
    const finalCarrerasResult = await pool.query('SELECT COUNT(*) as count FROM carreras');
    const finalAsignaturasResult = await pool.query('SELECT COUNT(*) as count FROM asignaturas');
    const finalPermissionsPendingResult = await pool.query('SELECT COUNT(*) as count FROM permisos_pendientes');
    
    console.log(`   📊 Carreras después: ${finalCarrerasResult.rows[0].count}`);
    console.log(`   📊 Asignaturas después: ${finalAsignaturasResult.rows[0].count}`);
    console.log(`   📊 Permisos pendientes después: ${finalPermissionsPendingResult.rows[0].count}`);
    
    // 7. Verificar el estado de la carga
    console.log('\n7️⃣ Verificando estado de la carga...');
    const finalUploadResult = await pool.query(`
      SELECT id, file_name, upload_type, approval_status, is_processed, approved_at, processed_at
      FROM upload_logs 
      WHERE id = $1
    `, [uploadId]);
    
    if (finalUploadResult.rows.length > 0) {
      const upload = finalUploadResult.rows[0];
      console.log(`   📋 Estado final de la carga:`);
      console.log(`      - ID: ${upload.id}`);
      console.log(`      - Archivo: ${upload.file_name}`);
      console.log(`      - Tipo: ${upload.upload_type}`);
      console.log(`      - Estado de aprobación: ${upload.approval_status}`);
      console.log(`      - Procesado: ${upload.is_processed}`);
      console.log(`      - Aprobado en: ${upload.approved_at}`);
      console.log(`      - Procesado en: ${upload.processed_at}`);
    }
    
    // 8. Verificar si hay datos específicos con bimestre_id
    console.log('\n8️⃣ Verificando datos con bimestre_id...');
    const carrerasWithBimestreResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM carreras 
      WHERE bimestre_id IS NOT NULL
    `);
    const asignaturasWithBimestreResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM asignaturas 
      WHERE bimestre_id IS NOT NULL
    `);
    
    console.log(`   📊 Carreras con bimestre_id: ${carrerasWithBimestreResult.rows[0].count}`);
    console.log(`   📊 Asignaturas con bimestre_id: ${asignaturasWithBimestreResult.rows[0].count}`);
    
    console.log('\n✅ === PRUEBA COMPLETADA ===\n');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Ejecutar la prueba
testApprovalWithResolvePermissions();