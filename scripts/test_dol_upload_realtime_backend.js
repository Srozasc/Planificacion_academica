const mysql = require('mysql2/promise');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

// Función para obtener token JWT
async function getAuthToken() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email_institucional: process.env.TEST_EMAIL || '',
    password: process.env.TEST_PASSWORD || ''
    });
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error al obtener token de autenticación:', error.response?.data || error.message);
    throw error;
  }
}

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'planificacion_user',
  password: 'PlanUser2025!',
  database: 'planificacion_academica'
};

async function testDolUploadRealtime() {
  let connection;
  
  try {
    console.log('=== PRUEBA DE CARGA DOL EN TIEMPO REAL ===');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado a la base de datos');
    
    // Verificar estado inicial de staging_dol
    console.log('\n=== ESTADO INICIAL ===');
    const [initialRows] = await connection.query('SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = 20');
    console.log(`Registros iniciales en staging_dol (bimestre 20): ${initialRows[0].count}`);
    
    // Preparar el archivo para upload
    const filePath = 'D:\\desarrollo\\workspace\\Planificacion_academica\\Insumos de entrada\\DOL.xlsx';
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    
    console.log('\n=== INICIANDO CARGA ===');
    console.log(`Archivo a cargar: ${filePath}`);
    
    // Crear FormData para el upload
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('bimestreId', '20');
    form.append('validateOnly', 'false');
    
    // Obtener token de autenticación
    console.log('Obteniendo token de autenticación...');
    const token = await getAuthToken();
    console.log('Token obtenido exitosamente');

    // Realizar la carga
    console.log('Enviando archivo al servidor...');
    const response = await axios.post('http://localhost:3001/api/uploads/dol', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    
    console.log('\n=== RESPUESTA DEL SERVIDOR ===');
    console.log('Status:', response.status);
    console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Verificar inmediatamente después de la carga
    console.log('\n=== VERIFICACIÓN INMEDIATA ===');
    const [afterRows] = await connection.query('SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = 20');
    console.log(`Registros después de la carga: ${afterRows[0].count}`);
    
    // Mostrar algunos registros si existen
    if (afterRows[0].count > 0) {
      const [sampleRows] = await connection.query('SELECT * FROM staging_dol WHERE id_bimestre = 20 LIMIT 5');
      console.log('\nPrimeros 5 registros:');
      sampleRows.forEach((row, index) => {
        console.log(`${index + 1}. PLAN: ${row.plan}, SIGLA: ${row.sigla}, DESC: ${row.descripcion}`);
      });
    }
    
    // Verificar el último upload log
    console.log('\n=== ÚLTIMO UPLOAD LOG ===');
    const [logRows] = await connection.query(`
      SELECT id, file_name, upload_type, total_records, error_count, status, approval_status, is_processed, upload_date
      FROM upload_logs 
      WHERE upload_type = 'DOL' 
      ORDER BY upload_date DESC 
      LIMIT 1
    `);
    
    if (logRows.length > 0) {
      const log = logRows[0];
      console.log(`ID: ${log.id}`);
      console.log(`Archivo: ${log.file_name}`);
      console.log(`Registros: ${log.total_records}`);
      console.log(`Errores: ${log.error_count}`);
      console.log(`Estado: ${log.status}`);
      console.log(`Aprobación: ${log.approval_status}`);
      console.log(`Procesado: ${log.is_processed}`);
      console.log(`Fecha: ${log.upload_date}`);
    }
    
  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConexión cerrada');
    }
  }
}

testDolUploadRealtime();