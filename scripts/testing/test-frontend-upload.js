const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testFrontendUpload() {
    console.log('🧪 Probando carga desde frontend (simulada)...\n');
    
    try {
        // Verificar que el archivo existe
        if (!fs.existsSync('test_payment_codes_frontend.xlsx')) {
            console.error('❌ Archivo test_payment_codes_frontend.xlsx no encontrado');
            return;
        }
        
        console.log('✅ Archivo encontrado');
        
        // Crear FormData como lo haría el frontend
        const formData = new FormData();
        formData.append('file', fs.createReadStream('test_payment_codes_frontend.xlsx'), {
            filename: 'test_payment_codes_frontend.xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        formData.append('fileType', 'payment-codes');
        formData.append('mode', 'UPSERT');
        
        console.log('📤 Enviando archivo al backend...');
        
        // Hacer la petición al backend
        const response = await axios.post('http://localhost:3001/api/uploads/bulk', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': 'Bearer test-token' // Si es necesario
            },
            timeout: 30000
        });
        
        console.log('✅ Respuesta del backend:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error en la prueba:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('No hay respuesta del servidor. ¿Está ejecutándose en el puerto 3001?');
        } else {
            console.error('Error:', error.message);
        }
    }
}

testFrontendUpload();
