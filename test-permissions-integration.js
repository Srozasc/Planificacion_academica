const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Script de prueba para verificar la integración de scripts de permisos
 * con el endpoint de importación de usuarios del backend
 */

console.log('🧪 Creando archivo de prueba para integración de permisos...');

// Datos de prueba con información completa para permisos
const testData = [
  {
    Usuario: 'jperez',
    Mail: 'jperez@duoc.cl',
    Nombre: 'Juan Pérez',
    'Tipo de Rol': 'Editor',
    Cargo: 'Director de Carrera',
    Carrera: '1444728',
    Categoria: 'Docente',
    Expiracion: '31-12-2024'
  },
  {
    Usuario: 'mgarcia',
    Mail: 'mgarcia@duoc.cl',
    Nombre: 'María García',
    'Tipo de Rol': 'Maestro',
    Cargo: 'Coordinador Académico',
    Carrera: '1444729',
    Categoria: 'Coordinador',
    Expiracion: ''
  },
  {
    Usuario: 'clopez',
    Mail: 'clopez@duoc.cl',
    Nombre: 'Carlos López',
    'Tipo de Rol': 'Visualizador',
    Cargo: 'Docente',
    Carrera: '1444730',
    Categoria: 'Docente',
    Expiracion: '15-06-2025'
  }
];

try {
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  
  // Crear worksheet
  const worksheet = XLSX.utils.json_to_sheet(testData);
  
  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
  
  // Guardar archivo
  const fileName = 'test_users_permissions_integration.xlsx';
  XLSX.writeFile(workbook, fileName);
  
  console.log(`✅ Archivo creado: ${fileName}`);
  console.log(`📊 Registros: ${testData.length}`);
  console.log('\n📋 Contenido del archivo:');
  testData.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.Nombre} (${user.Mail}) - ${user['Tipo de Rol']} - Carrera: ${user.Carrera}`);
  });
  
  console.log('\n🔧 Instrucciones de prueba:');
  console.log('1. Asegúrate de que el backend esté ejecutándose');
  console.log('2. Ve a la página de gestión de usuarios en el frontend');
  console.log('3. Haz clic en "Importar usuarios"');
  console.log(`4. Selecciona el archivo: ${fileName}`);
  console.log('5. Confirma la importación');
  console.log('6. Verifica en los logs del backend que se ejecuten los scripts de permisos');
  console.log('7. Revisa las tablas permisos_pendientes, usuario_permisos_carrera y usuario_permisos_categoria');
  
  console.log('\n📝 Consultas SQL para verificar:');
  console.log('   SELECT COUNT(*) FROM permisos_pendientes WHERE estado = "PROCESADO";');
  console.log('   SELECT COUNT(*) FROM usuario_permisos_carrera;');
  console.log('   SELECT COUNT(*) FROM usuario_permisos_categoria;');
  
} catch (error) {
  console.error('❌ Error creando archivo de prueba:', error);
  process.exit(1);
}