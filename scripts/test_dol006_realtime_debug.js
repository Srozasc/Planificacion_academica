const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');
const mysql = require('mysql2/promise');

// Función para obtener token de autenticación
async function getAuthToken() {
  try {
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email_institucional: process.env.TEST_EMAIL || '',
    password: process.env.TEST_PASSWORD || ''
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error obteniendo token:', error.message);
    throw error;
  }
}

// Función para verificar registros DOL006 específicamente
async function checkDol006Records(label) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'planificacion_user',
      password: 'PlanUser2025!',
      database: 'planificacion_academica'
    });

    console.log(`\n=== ${label} ===`);
    
    // Verificar registros DOL006
    const [dol006Records] = await connection.execute(
      'SELECT * FROM staging_dol WHERE sigla = ? ORDER BY plan',
      ['DOL006']
    );
    
    console.log(`Registros DOL006: ${dol006Records.length}`);
    dol006Records.forEach((record, index) => {
      console.log(`  ${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}, DESC: ${record.descripcion}`);
    });
    
    // Verificar específicamente los planes 1444728 y 1444729
    const [plan1444728] = await connection.execute(
      'SELECT * FROM staging_dol WHERE plan = ?',
      ['1444728']
    );
    
    const [plan1444729] = await connection.execute(
      'SELECT * FROM staging_dol WHERE plan = ?',
      ['1444729']
    );
    
    console.log(`Plan 1444728: ${plan1444728.length} registros`);
    plan1444728.forEach((record, index) => {
      console.log(`  ${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}`);
    });
    
    console.log(`Plan 1444729: ${plan1444729.length} registros`);
    plan1444729.forEach((record, index) => {
      console.log(`  ${index + 1}. PLAN: ${record.plan}, SIGLA: ${record.sigla}`);
    });
    
    // Contar total de registros
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM staging_dol WHERE id_bimestre = ?',
      [20]
    );
    
    console.log(`Total registros bimestre 20: ${totalCount[0].count}`);
    
    await connection.end();
    return {
      dol006Count: dol006Records.length,
      plan1444728Count: plan1444728.length,
      plan1444729Count: plan1444729.length,
      totalCount: totalCount[0].count
    };
    
  } catch (error) {
    console.error('Error verificando registros:', error.message);
    throw error;
  }
}

async function testDol006Upload() {
  try {
    console.log('=== PRUEBA ESPECÍFICA DOL006 ===');
    
    // Verificar estado inicial
    const initialState = await checkDol006Records('ESTADO INICIAL');
    
    // Obtener token
    console.log('\nObteniendo token de autenticación...');
    const token = await getAuthToken();
    console.log('Token obtenido exitosamente');
    
    // Preparar archivo
    const filePath = 'D:\\desarrollo\\workspace\\Planificacion_academica\\Insumos de entrada\\DOL.xlsx';
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('bimestreId', '20');
    
    console.log('\nEnviando archivo al servidor...');
    
    // Enviar archivo
    const response = await axios.post(
      'http://localhost:3001/api/uploads/dol',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('\n=== RESPUESTA DEL SERVIDOR ===');
    console.log('Status:', response.status);
    console.log('Respuesta:', JSON.stringify(response.data, null, 2));
    
    // Esperar un momento para que se complete la transacción
    console.log('\nEsperando 2 segundos para verificación...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar estado final
    const finalState = await checkDol006Records('ESTADO FINAL');
    
    // Comparar estados
    console.log('\n=== COMPARACIÓN DE ESTADOS ===');
    console.log(`DOL006 - Inicial: ${initialState.dol006Count}, Final: ${finalState.dol006Count}`);
    console.log(`Plan 1444728 - Inicial: ${initialState.plan1444728Count}, Final: ${finalState.plan1444728Count}`);
    console.log(`Plan 1444729 - Inicial: ${initialState.plan1444729Count}, Final: ${finalState.plan1444729Count}`);
    console.log(`Total - Inicial: ${initialState.totalCount}, Final: ${finalState.totalCount}`);
    
    // Análisis del problema
    if (finalState.plan1444728Count === 0 && finalState.plan1444729Count === 1) {
      console.log('\n⚠️  PROBLEMA CONFIRMADO:');
      console.log('- El registro DOL006 con PLAN=1444728 NO se guardó');
      console.log('- El registro DOL006 con PLAN=1444729 SÍ se guardó');
      console.log('- Esto sugiere que el segundo registro sobrescribió al primero');
    } else if (finalState.dol006Count === 2) {
      console.log('\n✅ PROBLEMA RESUELTO:');
      console.log('- Ambos registros DOL006 se guardaron correctamente');
    } else {
      console.log('\n❓ SITUACIÓN INESPERADA:');
      console.log('- El comportamiento no coincide con lo esperado');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

testDol006Upload();