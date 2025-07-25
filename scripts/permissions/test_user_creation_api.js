const axios = require('axios');

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Datos de prueba para crear usuario
const testUserData = {
    name: 'Usuario Test API',
    emailInstitucional: 'test-api@planificacion.edu',
    password: 'TestPassword123!',
    roleId: 1, // Visualizador
    tipoPermiso: 'categoria',
    categoria: 'CARR'
};

async function testUserCreation() {
    console.log('🧪 PRUEBA: Creación de Usuario vía API');
    console.log('=' .repeat(50));
    
    try {
        // 1. Probar sin bimestreId (debería fallar)
        console.log('\n1. PRUEBA SIN BIMESTRE_ID:');
        try {
            const response1 = await axios.post(`${API_BASE_URL}/users`, testUserData);
            console.log('❌ ERROR: Debería haber fallado sin bimestreId');
            console.log('Respuesta:', response1.data);
        } catch (error) {
            console.log('✅ CORRECTO: Falló como esperado');
            console.log('Error:', error.response?.data?.message || error.message);
        }
        
        // 2. Probar con bimestreId válido (debería funcionar)
        console.log('\n2. PRUEBA CON BIMESTRE_ID = 2:');
        try {
            const response2 = await axios.post(`${API_BASE_URL}/users?bimestreId=2`, {
                ...testUserData,
                emailInstitucional: 'test-api-2@planificacion.edu'
            });
            console.log('✅ ÉXITO: Usuario creado correctamente');
            console.log('Usuario creado:', {
                id: response2.data.id,
                name: response2.data.name,
                email: response2.data.emailInstitucional
            });
        } catch (error) {
            console.log('❌ ERROR: No se pudo crear usuario con bimestreId');
            console.log('Error:', error.response?.data?.message || error.message);
            if (error.response?.data) {
                console.log('Detalles:', JSON.stringify(error.response.data, null, 2));
            }
        }
        
        // 3. Probar con bimestreId inválido
        console.log('\n3. PRUEBA CON BIMESTRE_ID INVÁLIDO = 999:');
        try {
            const response3 = await axios.post(`${API_BASE_URL}/users?bimestreId=999`, {
                ...testUserData,
                emailInstitucional: 'test-api-3@planificacion.edu'
            });
            console.log('❌ ERROR: Debería haber fallado con bimestreId inválido');
            console.log('Respuesta:', response3.data);
        } catch (error) {
            console.log('✅ CORRECTO: Falló con bimestreId inválido');
            console.log('Error:', error.response?.data?.message || error.message);
        }
        
        console.log('\n✅ Pruebas completadas');
        
    } catch (error) {
        console.error('❌ Error general en las pruebas:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 SUGERENCIA: Asegúrate de que el servidor backend esté ejecutándose en http://localhost:3000');
        }
    }
}

// Ejecutar pruebas
testUserCreation();