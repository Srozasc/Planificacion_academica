#!/usr/bin/env node

/**
 * Script de prueba para verificar que los endpoints requieren autenticación
 * 
 * Este script prueba que los endpoints estén protegidos correctamente
 * con JwtAuthGuard y RolesGuard.
 */

const https = require('http');

const BASE_URL = 'http://localhost:3001/api/uploads';

const endpoints = [
  { method: 'GET', path: '/templates' },
  { method: 'GET', path: '/admin/health' },
  { method: 'GET', path: '/admin/stats' },
  { method: 'POST', path: '/academic-structures' },
  { method: 'POST', path: '/teachers' },
  { method: 'POST', path: '/payment-codes' },
  { method: 'POST', path: '/course-reports' }
];

async function testEndpointAuth(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/uploads${endpoint.path}`,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: res.statusCode,
        protected: res.statusCode === 401 || res.statusCode === 403
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'ERROR',
        protected: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runAuthTests() {
  console.log('🔐 Testing Authentication Protection on Uploads Endpoints\n');
  console.log('⚠️  Note: Server must be running on http://localhost:3001\n');

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpointAuth(endpoint);
    results.push(result);
    
    const status = result.protected ? '✅ PROTECTED' : '❌ UNPROTECTED';
    console.log(`${result.method.padEnd(6)} ${result.endpoint.padEnd(25)} ${result.status.toString().padEnd(6)} ${status}`);
  }

  console.log('\n📊 Summary:');
  const protectedCount = results.filter(r => r.protected).length;
  const totalCount = results.length;
  
  console.log(`Protected endpoints: ${protectedCount}/${totalCount}`);
  
  if (protectedCount === totalCount) {
    console.log('✅ All endpoints are properly protected!');
  } else {
    console.log('❌ Some endpoints are not protected - check authentication configuration');
  }
}

if (require.main === module) {
  runAuthTests().catch(console.error);
}

module.exports = { testEndpointAuth, runAuthTests };
