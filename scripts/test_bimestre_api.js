const axios = require('axios');

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000';

async function testBimestreAPI() {
  console.log('🧪 Probando API de bimestres...');
  
  try {
    // 1. Probar endpoint de bimestres activos
    console.log('\n📅 Probando /bimestres/activos...');
    try {
      const activosResponse = await axios.get(`${API_BASE_URL}/bimestres/activos`);
      console.log('✅ Respuesta exitosa:');
      console.log('   Status:', activosResponse.status);
      console.log('   Data:', JSON.stringify(activosResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error en /bimestres/activos:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      } else {
        console.log('   Error:', error.message);
      }
    }
    
    // 2. Probar endpoint de bimestre actual
    console.log('\n🎯 Probando /bimestres/actual...');
    try {
      const actualResponse = await axios.get(`${API_BASE_URL}/bimestres/actual`);
      console.log('✅ Respuesta exitosa:');
      console.log('   Status:', actualResponse.status);
      console.log('   Data:', JSON.stringify(actualResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error en /bimestres/actual:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      } else {
        console.log('   Error:', error.message);
      }
    }
    
    // 3. Probar endpoint de todos los bimestres
    console.log('\n📋 Probando /bimestres...');
    try {
      const allResponse = await axios.get(`${API_BASE_URL}/bimestres`);
      console.log('✅ Respuesta exitosa:');
      console.log('   Status:', allResponse.status);
      console.log('   Cantidad de bimestres:', allResponse.data.data ? allResponse.data.data.length : 'N/A');
      if (allResponse.data.data && allResponse.data.data.length > 0) {
        console.log('   Primeros 3 bimestres:');
        allResponse.data.data.slice(0, 3).forEach((bimestre, index) => {
          console.log(`     ${index + 1}. ID: ${bimestre.id} | ${bimestre.nombre} | Activo: ${bimestre.activo}`);
        });
      }
    } catch (error) {
      console.log('❌ Error en /bimestres:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      } else {
        console.log('   Error:', error.message);
      }
    }
    
    // 4. Probar creación de usuario con bimestre específico
    console.log('\n👤 Probando creación de usuario con bimestreId=15...');
    try {
      const testUserData = {
        name: 'Usuario Test API',
        emailInstitucional: 'test.api@planificacion.edu',
        password: 'TestPassword123!',
        roleId: 1
      };
      
      const createUserResponse = await axios.post(
        `${API_BASE_URL}/users?bimestreId=15`,
        testUserData
      );
      console.log('✅ Usuario creado exitosamente:');
      console.log('   Status:', createUserResponse.status);
      console.log('   Data:', JSON.stringify(createUserResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Error al crear usuario:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('   Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Función para verificar si el servidor está corriendo
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    try {
      // Intentar con un endpoint básico si /health no existe
      const response = await axios.get(`${API_BASE_URL}/`, { timeout: 5000 });
      return true;
    } catch (error2) {
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de API...');
  
  // Verificar si el servidor está corriendo
  console.log('\n🔍 Verificando estado del servidor...');
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ El servidor no está corriendo en http://localhost:3000');
    console.log('💡 Asegúrate de que el backend esté ejecutándose antes de ejecutar este script.');
    console.log('   Puedes iniciarlo con: npm run start:dev (en la carpeta backend)');
    return;
  }
  
  console.log('✅ Servidor está corriendo');
  await testBimestreAPI();
}

main();