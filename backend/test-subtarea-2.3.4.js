#!/usr/bin/env node

/**
 * Script de pruebas para SubTarea 2.3.4
 * Prueba las funcionalidades implementadas:
 * - Parseo y validación robusta
 * - Validaciones multicapa
 * - Logging detallado
 * - Endpoint de validación independiente
 * - Sistema de plantillas dinámico
 * - Manejo de errores y cleanup
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email_institucional: 'admin@planificacion.edu',
  password: 'admin123'
};

let authToken = '';

// Utilidades
const log = (message, type = 'info') => {
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type];
  console.log(`${prefix} ${message}`);
};

const makeRequest = async (method, url, data = null, isFileUpload = false) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };

    if (data) {
      if (isFileUpload) {
        config.data = data;
        config.headers = {
          ...config.headers,
          ...data.getHeaders()
        };
      } else {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Paso 1: Autenticación
const authenticate = async () => {
  log('Iniciando autenticación...');
  
  const result = await makeRequest('POST', '/auth/login', TEST_USER);
  
  if (result.success) {
    authToken = result.data.access_token;
    log('Autenticación exitosa', 'success');
    return true;
  } else {
    log(`Error en autenticación: ${JSON.stringify(result.error)}`, 'error');
    return false;
  }
};

// Paso 2: Probar endpoints de administración
const testAdminEndpoints = async () => {
  log('\n📊 Probando endpoints de administración...');
  
  // Health check
  const health = await makeRequest('GET', '/uploads/admin/health');
  if (health.success) {
    log('Health check: OK', 'success');
  } else {
    log(`Health check falló: ${health.status}`, 'error');
  }
  
  // Stats
  const stats = await makeRequest('GET', '/uploads/admin/stats');
  if (stats.success) {
    log('Stats obtenidas correctamente', 'success');
    console.log('  Estadísticas:', JSON.stringify(stats.data, null, 2));
  } else {
    log(`Stats falló: ${stats.status}`, 'error');
  }
  
  // Templates
  const templates = await makeRequest('GET', '/uploads/templates');
  if (templates.success) {
    log('Templates obtenidas correctamente', 'success');
    console.log('  Tipos disponibles:', Object.keys(templates.data));
  } else {
    log(`Templates falló: ${templates.status}`, 'error');
  }
};

// Paso 3: Probar validación independiente
const testValidationEndpoint = async () => {
  log('\n🔍 Probando endpoint de validación independiente...');
  
  const testFiles = [
    { type: 'academic-structures', file: 'test_academic_structures.xlsx' },
    { type: 'teachers', file: 'test_teachers.xlsx' },
    { type: 'payment-codes', file: 'test_payment_codes.xlsx' },
    { type: 'course-reports', file: 'test_course_reports.xlsx' }
  ];
  
  for (const testCase of testFiles) {
    const filePath = path.join(__dirname, 'test-files', 'valid', testCase.file);
    
    if (!fs.existsSync(filePath)) {
      log(`Archivo no encontrado: ${testCase.file}`, 'warning');
      continue;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const result = await makeRequest('POST', `/uploads/validate/${testCase.type}`, formData, true);
    
    if (result.success) {
      log(`Validación de ${testCase.type}: OK`, 'success');
      console.log(`  Resultado:`, JSON.stringify(result.data, null, 2));
    } else {
      log(`Validación de ${testCase.type} falló: ${result.status} - ${JSON.stringify(result.error)}`, 'error');
    }
  }
};

// Paso 4: Probar carga de archivos con diferentes opciones
const testFileUploads = async () => {
  log('\n📁 Probando carga de archivos con diferentes opciones...');
  
  const testCases = [
    {
      endpoint: '/uploads/academic-structures',
      file: 'test_academic_structures.xlsx',
      options: { mode: 'UPSERT', validateOnly: 'true' }
    },
    {
      endpoint: '/uploads/teachers',
      file: 'test_teachers.xlsx',
      options: { mode: 'INSERT_ONLY', validateOnly: 'true' }
    }
  ];
  
  for (const testCase of testCases) {
    const filePath = path.join(__dirname, 'test-files', 'valid', testCase.file);
    
    if (!fs.existsSync(filePath)) {
      log(`Archivo no encontrado: ${testCase.file}`, 'warning');
      continue;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Añadir opciones al FormData
    Object.entries(testCase.options).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const result = await makeRequest('POST', testCase.endpoint, formData, true);
    
    if (result.success) {
      log(`Upload a ${testCase.endpoint}: OK`, 'success');
      console.log(`  Resultado:`, JSON.stringify(result.data, null, 2));
    } else {
      log(`Upload a ${testCase.endpoint} falló: ${result.status} - ${JSON.stringify(result.error)}`, 'error');
    }
  }
};

// Paso 5: Probar manejo de errores
const testErrorHandling = async () => {
  log('\n⚠️  Probando manejo de errores...');
  
  // Probar con archivo inválido
  const invalidFilePath = path.join(__dirname, 'test-files', 'invalid', 'test_invalid.txt');
  
  if (fs.existsSync(invalidFilePath)) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(invalidFilePath));
    
    const result = await makeRequest('POST', '/uploads/validate/academic-structures', formData, true);
    
    if (!result.success) {
      log('Manejo de archivos inválidos: OK (rechazo esperado)', 'success');
      console.log(`  Error esperado:`, JSON.stringify(result.error, null, 2));
    } else {
      log('Manejo de archivos inválidos: FALLO (debería rechazar)', 'error');
    }
  }
  
  // Probar con tipo inválido
  const validFilePath = path.join(__dirname, 'test-files', 'valid', 'test_academic_structures.xlsx');
  if (fs.existsSync(validFilePath)) {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(validFilePath));
    
    const result = await makeRequest('POST', '/uploads/validate/invalid-type', formData, true);
    
    if (!result.success) {
      log('Manejo de tipos inválidos: OK (rechazo esperado)', 'success');
    } else {
      log('Manejo de tipos inválidos: FALLO (debería rechazar)', 'error');
    }
  }
};

// Función principal
const runTests = async () => {
  console.log('🧪 Iniciando pruebas de SubTarea 2.3.4');
  console.log('================================================');
  
  // Verificar que el servidor esté corriendo
  try {
    await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    log('Servidor detectado y funcionando', 'success');
  } catch (error) {
    log('⚠️  El servidor no responde. Asegúrate de que esté corriendo en http://localhost:3001', 'error');
    process.exit(1);
  }
  
  // Ejecutar pruebas
  const authenticated = await authenticate();
  if (!authenticated) {
    log('No se pudo autenticar. Terminando pruebas.', 'error');
    process.exit(1);
  }
  
  await testAdminEndpoints();
  await testValidationEndpoint();
  await testFileUploads();
  await testErrorHandling();
  
  console.log('\n================================================');
  log('Pruebas de SubTarea 2.3.4 completadas', 'success');
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  runTests().catch(error => {
    log(`Error fatal: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runTests };
