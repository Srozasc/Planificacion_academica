const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const XLSX = require('xlsx');

// Configuración de la API
const API_BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 1;
const TEST_BIMESTRE_ID = 21; // Bimestre 2025 2 - activo y válido

// Función para obtener token JWT
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email_institucional: 'admin@planificacion.edu',
      password: 'admin123'
    });
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error al obtener token de autenticación:', error.response?.data || error.message);
    throw error;
  }
}

// Función para crear un archivo Excel de prueba para DOL
function createTestDolExcel() {
  const testData = [
    {
      'PLAN': 'PLAN001',
      'SIGLA': 'MAT101',
      'DESCRIPCION': 'Matemáticas Básicas'
    },
    {
      'PLAN': 'PLAN002', 
      'SIGLA': 'FIS201',
      'DESCRIPCION': 'Física General'
    },
    {
      'PLAN': 'PLAN003',
      'SIGLA': 'QUI301',
      'DESCRIPCION': 'Química Orgánica'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(testData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DOL');
  
  const fileName = 'test-dol-data.xlsx';
  XLSX.writeFile(workbook, fileName);
  console.log(`✅ Archivo de prueba creado: ${fileName}`);
  return fileName;
}

// Función para subir archivo DOL
async function uploadDolFile(fileName, token) {
  try {
    console.log('\n=== SUBIENDO ARCHIVO DOL ===');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(fileName));
    formData.append('uploadType', 'DOL');
    formData.append('bimestreId', TEST_BIMESTRE_ID.toString());
    formData.append('mode', 'production');
    formData.append('validateOnly', 'false');
    formData.append('userId', TEST_USER_ID.toString());

    const response = await axios.post(`${API_BASE_URL}/api/uploads/dol`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });

    console.log('✅ Archivo DOL subido exitosamente');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error al subir archivo DOL:', error.response?.data || error.message);
    throw error;
  }
}

// Función para obtener cargas recientes
async function getRecentUploads(token) {
  try {
    console.log('\n=== OBTENIENDO CARGAS RECIENTES ===');
    
    const response = await axios.get(`${API_BASE_URL}/api/uploads/recent`, {
      params: { bimestreId: TEST_BIMESTRE_ID },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Cargas recientes obtenidas');
    console.log('📊 Estructura de respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar si response.data es un array o tiene una propiedad que contiene el array
    let uploads = Array.isArray(response.data) ? response.data : response.data.uploads || response.data.data || [];
    
    if (!Array.isArray(uploads)) {
      console.log('⚠️  La respuesta no contiene un array de cargas');
      return null;
    }
    
    const dolUploads = uploads.filter(upload => upload.upload_type === 'DOL');
    console.log(`📋 Cargas DOL encontradas: ${dolUploads.length}`);
    
    if (dolUploads.length > 0) {
      const latestDol = dolUploads[0];
      console.log('📄 Última carga DOL:', {
        id: latestDol.id,
        fileName: latestDol.fileName,
        uploadType: latestDol.uploadType,
        approvalStatus: latestDol.approvalStatus,
        totalRecords: latestDol.totalRecords,
        createdAt: latestDol.createdAt
      });
      return latestDol;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error al obtener cargas recientes:', error.response?.data || error.message);
    throw error;
  }
}

// Función para aprobar una carga
async function approveUpload(uploadId, token) {
  try {
    console.log(`\n=== APROBANDO CARGA ${uploadId} ===`);
    
    const response = await axios.post(`${API_BASE_URL}/api/uploads/approve/${uploadId}`, {
      userId: TEST_USER_ID
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Carga aprobada exitosamente');
    console.log('📊 Respuesta:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Error al aprobar carga:', error.response?.data || error.message);
    throw error;
  }
}

// Función para verificar datos en staging_dol
async function checkStagingDol() {
  try {
    console.log('\n=== VERIFICANDO DATOS EN STAGING_DOL ===');
    
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = ?',
      [TEST_BIMESTRE_ID]
    );

    console.log(`📊 Registros en staging_dol: ${rows[0].count}`);
    
    if (rows[0].count > 0) {
      const [sampleRows] = await connection.execute(
        'SELECT * FROM staging_dol WHERE id_bimestre = ? LIMIT 3',
        [TEST_BIMESTRE_ID]
      );
      console.log('📋 Muestra de datos:');
      sampleRows.forEach((row, index) => {
        console.log(`  ${index + 1}. Plan: ${row.plan}, Sigla: ${row.sigla}, Descripción: ${row.descripcion}`);
      });
    }

    await connection.end();
    return rows[0].count;
  } catch (error) {
    console.error('❌ Error al verificar staging_dol:', error.message);
    throw error;
  }
}

// Función para verificar datos en dol_aprobados
async function checkDolAprobados() {
  try {
    console.log('\n=== VERIFICANDO DATOS EN DOL_APROBADOS ===');
    
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM dol_aprobados WHERE id_bimestre = ?',
      [TEST_BIMESTRE_ID]
    );

    console.log(`📊 Registros en dol_aprobados: ${rows[0].count}`);
    
    if (rows[0].count > 0) {
      const [sampleRows] = await connection.execute(
        'SELECT * FROM dol_aprobados WHERE id_bimestre = ? ORDER BY fecha_aprobacion DESC LIMIT 3',
        [TEST_BIMESTRE_ID]
      );
      console.log('📋 Muestra de datos aprobados:');
      sampleRows.forEach((row, index) => {
        console.log(`  ${index + 1}. Plan: ${row.plan}, Sigla: ${row.sigla}, Descripción: ${row.descripcion}`);
        console.log(`      Aprobado por: ${row.aprobado_por}, Fecha: ${row.fecha_aprobacion}`);
      });
    }

    await connection.end();
    return rows[0].count;
  } catch (error) {
    console.error('❌ Error al verificar dol_aprobados:', error.message);
    throw error;
  }
}

// Función principal de prueba
async function runDolApprovalTest() {
  try {
    console.log('🚀 INICIANDO PRUEBA COMPLETA DE APROBACIÓN DOL');
    console.log('=' .repeat(60));

    // 1. Obtener token de autenticación
    console.log('🔐 Obteniendo token de autenticación...');
    const token = await getAuthToken();
    console.log('✅ Token obtenido exitosamente');

    // 2. Crear archivo de prueba
    const fileName = createTestDolExcel();

    // 3. Subir archivo
    const uploadResult = await uploadDolFile(fileName, token);

    // 4. Verificar datos en staging
    const stagingCount = await checkStagingDol();
    
    if (stagingCount === 0) {
      throw new Error('No se encontraron datos en staging_dol');
    }

    // 5. Obtener la carga reciente
    const recentUpload = await getRecentUploads(token);
    
    if (!recentUpload) {
      throw new Error('No se encontró la carga DOL reciente');
    }

    // 6. Verificar que la carga esté pendiente
    if (recentUpload.approvalStatus !== 'Pendiente') {
      console.log(`⚠️  Estado de aprobación: ${recentUpload.approvalStatus}`);
    }

    // 7. Aprobar la carga
    const approvalResult = await approveUpload(recentUpload.id, token);

    // 8. Esperar un momento para que se complete la migración
    console.log('⏳ Esperando que se complete la migración...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 9. Verificar datos en tabla de aprobados
    const approvedCount = await checkDolAprobados();
    
    if (approvedCount === 0) {
      throw new Error('No se encontraron datos en dol_aprobados después de la aprobación');
    }

    // 10. Limpiar archivo de prueba
    fs.unlinkSync(fileName);
    console.log(`🗑️  Archivo de prueba eliminado: ${fileName}`);

    console.log('\n' + '=' .repeat(60));
    console.log('✅ PRUEBA DE APROBACIÓN DOL COMPLETADA EXITOSAMENTE');
    console.log(`📊 Registros migrados: ${approvedCount}`);
    console.log('🎉 El flujo de aprobación de DOL funciona correctamente');
    
  } catch (error) {
    console.error('\n' + '=' .repeat(60));
    console.error('❌ ERROR EN LA PRUEBA DE APROBACIÓN DOL');
    console.error('💥 Error:', error.message);
    
    // Limpiar archivo de prueba en caso de error
    try {
      if (fs.existsSync('test-dol-data.xlsx')) {
        fs.unlinkSync('test-dol-data.xlsx');
        console.log('🗑️  Archivo de prueba eliminado tras error');
      }
    } catch (cleanupError) {
      console.error('⚠️  Error al limpiar archivo:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  runDolApprovalTest();
}

module.exports = {
  createTestDolExcel,
  uploadDolFile,
  getRecentUploads,
  approveUpload,
  checkStagingDol,
  checkDolAprobados,
  runDolApprovalTest
};