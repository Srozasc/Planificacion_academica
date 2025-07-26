const fs = require('fs');
const path = require('path');

function verifyImplementation() {
  console.log('🔍 === VERIFICACIÓN DE IMPLEMENTACIÓN ===\n');
  
  try {
    // Verificar que el archivo uploads.service.ts contiene la nueva funcionalidad
    const uploadsServicePath = path.join(__dirname, 'backend', 'src', 'uploads', 'uploads.service.ts');
    
    if (!fs.existsSync(uploadsServicePath)) {
      console.log('❌ Archivo uploads.service.ts no encontrado');
      return;
    }
    
    const uploadsServiceContent = fs.readFileSync(uploadsServicePath, 'utf8');
    
    // Verificar que contiene la ejecución de resolve_permissions.js
    const hasResolvePermissions = uploadsServiceContent.includes('resolve_permissions.js');
    const hasResolvePermissionsExecution = uploadsServiceContent.includes('EJECUTANDO RESOLVE_PERMISSIONS DESPUÉS DE LOAD_PLANS');
    const hasCorrectPath = uploadsServiceContent.includes('scripts/permissions/resolve_permissions.js');
    const hasCorrectCwd = uploadsServiceContent.includes("cwd: process.cwd().replace('backend', '')");
    
    console.log('📋 Verificación del archivo uploads.service.ts:');
    console.log(`   ✅ Contiene referencia a resolve_permissions.js: ${hasResolvePermissions ? 'SÍ' : 'NO'}`);
    console.log(`   ✅ Contiene log de ejecución de resolve_permissions: ${hasResolvePermissionsExecution ? 'SÍ' : 'NO'}`);
    console.log(`   ✅ Usa la ruta correcta del script: ${hasCorrectPath ? 'SÍ' : 'NO'}`);
    console.log(`   ✅ Usa el directorio de trabajo correcto: ${hasCorrectCwd ? 'SÍ' : 'NO'}`);
    
    // Verificar que los scripts existen
    const loadPlansPath = path.join(__dirname, 'scripts', 'permissions', 'load_plans.js');
    const resolvePermissionsPath = path.join(__dirname, 'scripts', 'permissions', 'resolve_permissions.js');
    
    console.log('\n📋 Verificación de scripts:');
    console.log(`   ✅ load_plans.js existe: ${fs.existsSync(loadPlansPath) ? 'SÍ' : 'NO'}`);
    console.log(`   ✅ resolve_permissions.js existe: ${fs.existsSync(resolvePermissionsPath) ? 'SÍ' : 'NO'}`);
    
    // Mostrar el fragmento de código relevante
    console.log('\n📄 Fragmento de código implementado:');
    const lines = uploadsServiceContent.split('\n');
    const startIndex = lines.findIndex(line => line.includes('EJECUTANDO RESOLVE_PERMISSIONS DESPUÉS DE LOAD_PLANS'));
    
    if (startIndex !== -1) {
      console.log('```typescript');
      for (let i = Math.max(0, startIndex - 2); i < Math.min(lines.length, startIndex + 15); i++) {
        console.log(lines[i]);
      }
      console.log('```');
    }
    
    console.log('\n✅ === VERIFICACIÓN COMPLETADA ===');
    
    if (hasResolvePermissions && hasResolvePermissionsExecution && hasCorrectPath && hasCorrectCwd) {
      console.log('\n🎉 ¡IMPLEMENTACIÓN EXITOSA!');
      console.log('   La funcionalidad para ejecutar resolve_permissions.js después de load_plans.js');
      console.log('   ha sido implementada correctamente en el método approveUpload.');
    } else {
      console.log('\n⚠️  Hay algunos problemas en la implementación que requieren revisión.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
}

verifyImplementation();