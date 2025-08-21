const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function testApiApproval() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('=== PRUEBA DE APROBACIÓN VIA API ===\n');
    
    // 1. Verificar datos en staging
    const [stagingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_estructura_academica WHERE id_bimestre IS NOT NULL'
    );
    console.log(`1. Registros en staging con bimestre: ${stagingData[0].count}`);
    
    if (stagingData[0].count === 0) {
      console.log('❌ No hay datos en staging. Necesitas cargar un archivo primero.');
      return;
    }

    // 2. Buscar carga pendiente
    const [pendingUploads] = await connection.execute(
      'SELECT id, fileName, uploadType, approvalStatus FROM upload_logs WHERE uploadType = "Estructura Académica" AND approvalStatus = "Pendiente" ORDER BY id DESC LIMIT 1'
    );
    
    if (pendingUploads.length === 0) {
      console.log('❌ No hay cargas pendientes. Creando una carga de prueba...');
      
      // Crear una carga de prueba
      await connection.execute(
        'INSERT INTO upload_logs (fileName, uploadType, bimestreId, status, totalRecords, errorCount, approvalStatus, isProcessed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['test_estructura.xlsx', 'Estructura Académica', 16, 'Exitoso', stagingData[0].count, 0, 'Pendiente', false]
      );
      
      const [newUpload] = await connection.execute(
        'SELECT id FROM upload_logs WHERE uploadType = "Estructura Académica" AND approvalStatus = "Pendiente" ORDER BY id DESC LIMIT 1'
      );
      
      console.log(`✅ Carga de prueba creada con ID: ${newUpload[0].id}`);
    }
    
    // 3. Obtener la carga a aprobar
    const [uploadToApprove] = await connection.execute(
      'SELECT id, fileName FROM upload_logs WHERE uploadType = "Estructura Académica" AND approvalStatus = "Pendiente" ORDER BY id DESC LIMIT 1'
    );
    
    const uploadId = uploadToApprove[0].id;
    console.log(`\n2. Aprobando carga ID: ${uploadId} (${uploadToApprove[0].fileName})`);

    // 4. Estado inicial
    const [carrerasInicial] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
    const [asignaturasInicial] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
    console.log(`3. Estado inicial - Carreras: ${carrerasInicial[0].count}, Asignaturas: ${asignaturasInicial[0].count}`);

    // 5. Llamar a la API de aprobación
    try {
      const response = await axios.post(`http://localhost:3000/api/uploads/approve/${uploadId}`, {
        approvedByUserId: 1
      });
      
      console.log('\n4. ✅ Aprobación exitosa via API');
      console.log('   Respuesta:', JSON.stringify(response.data, null, 2));
    } catch (apiError) {
      console.log('\n4. ❌ Error en API de aprobación:');
      if (apiError.response) {
        console.log('   Status:', apiError.response.status);
        console.log('   Data:', JSON.stringify(apiError.response.data, null, 2));
      } else {
        console.log('   Error:', apiError.message);
      }
      return;
    }

    // 6. Esperar un momento para que se complete la ejecución
    console.log('\n5. Esperando 3 segundos para que se complete load_plans.js...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 7. Verificar estado final
    const [carrerasFinal] = await connection.execute('SELECT COUNT(*) as count FROM carreras');
    const [asignaturasFinal] = await connection.execute('SELECT COUNT(*) as count FROM asignaturas');
    console.log(`\n6. Estado final - Carreras: ${carrerasFinal[0].count}, Asignaturas: ${asignaturasFinal[0].count}`);

    const carrerasAgregadas = carrerasFinal[0].count - carrerasInicial[0].count;
    const asignaturasAgregadas = asignaturasFinal[0].count - asignaturasInicial[0].count;
    
    console.log(`   Registros agregados - Carreras: ${carrerasAgregadas}, Asignaturas: ${asignaturasAgregadas}`);
    
    // 8. Verificar estado de la carga
    const [finalUpload] = await connection.execute(
      'SELECT approvalStatus, isProcessed, processedAt FROM upload_logs WHERE id = ?',
      [uploadId]
    );
    
    console.log(`\n7. Estado final de la carga:`);
    console.log(`   Aprobación: ${finalUpload[0].approvalStatus}`);
    console.log(`   Procesado: ${finalUpload[0].isProcessed}`);
    console.log(`   Fecha procesado: ${finalUpload[0].processedAt}`);
    
    if (carrerasAgregadas > 0 || asignaturasAgregadas > 0) {
      console.log('\n✅ ¡ÉXITO! La funcionalidad está trabajando correctamente.');
    } else {
      console.log('\n⚠️  No se agregaron registros. Puede haber un problema con load_plans.js.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testApiApproval();