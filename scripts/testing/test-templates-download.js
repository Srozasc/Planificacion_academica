const http = require('http');
const fs = require('fs');

console.log('🧪 Probando endpoints de plantillas...\n');

// Función para hacer requests HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = [];
      
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      
      res.on('end', () => {
        const response = {
          statusCode: res.statusCode,
          headers: res.headers,
          data: Buffer.concat(data)
        };
        resolve(response);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testTemplatesEndpoints() {
  try {    // 1. Probar endpoint de lista de plantillas
    console.log('1️⃣ Probando GET /api/templates...');
    const listOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/templates',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const listResponse = await makeRequest(listOptions);
    console.log(`   Status: ${listResponse.statusCode}`);
    
    if (listResponse.statusCode === 200) {
      const templatesData = JSON.parse(listResponse.data.toString());
      console.log('   ✅ Plantillas disponibles:', Object.keys(templatesData.templates || {}));
    } else {
      console.log('   ❌ Error:', listResponse.data.toString());
    }
    
    console.log('');
    
    // 2. Probar descarga de plantilla específica
    const templateTypes = ['payment-codes', 'academic-structures', 'teachers', 'course-reports'];
    
    for (const templateType of templateTypes) {
      console.log(`2️⃣ Probando descarga de plantilla: ${templateType}...`);        const downloadOptions = {
        hostname: 'localhost',
        port: 3001,
        path: `/api/templates/${templateType}`,
        method: 'GET'
      };
      
      const downloadResponse = await makeRequest(downloadOptions);
      console.log(`   Status: ${downloadResponse.statusCode}`);
      
      if (downloadResponse.statusCode === 200) {
        const filename = `plantilla_${templateType}_test.xlsx`;
        fs.writeFileSync(filename, downloadResponse.data);
        console.log(`   ✅ Plantilla descargada: ${filename} (${downloadResponse.data.length} bytes)`);
      } else {
        console.log(`   ❌ Error:`, downloadResponse.data.toString());
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

testTemplatesEndpoints();
