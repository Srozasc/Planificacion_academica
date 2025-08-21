const XLSX = require('xlsx');
const path = require('path');

// Datos de prueba con fechas de expiración
const testData = [
  {
    Usuario: 'jperez',
    Mail: 'jperez@duoc.cl',
    Nombre: 'Juan Pérez',
    Cargo: 'Director de Carrera',
    Carrera: '1444728',
    'Tipo de Rol': 'Editor',
    Categoria: '',
    Expiracion: '31-12-2024'
  },
  {
    Usuario: 'mgonzalez',
    Mail: 'mgonzalez@duoc.cl',
    Nombre: 'María González',
    Cargo: 'Jefa de Programas Transversales',
    Carrera: '',
    'Tipo de Rol': 'Editor',
    Categoria: 'TRAN',
    Expiracion: '30-06-2025'
  },
  {
    Usuario: 'crodriguez',
    Mail: 'crodriguez@duoc.cl',
    Nombre: 'Carlos Rodríguez',
    Cargo: 'Jefe UAP',
    Carrera: '',
    'Tipo de Rol': 'Administrador',
    Categoria: '',
    Expiracion: ''
  },
  {
    Usuario: 'atemporales',
    Mail: 'atemporales@duoc.cl',
    Nombre: 'Ana Temporales',
    Cargo: 'Coordinadora Temporal',
    Carrera: '',
    'Tipo de Rol': 'Editor',
    Categoria: '',
    Expiracion: '15-08-2025'
  },
  {
    Usuario: 'sinexpiracion',
    Mail: 'sinexpiracion@duoc.cl',
    Nombre: 'Pedro Sin Expiración',
    Cargo: 'Coordinador Permanente',
    Carrera: '1444728',
    'Tipo de Rol': 'Editor',
    Categoria: '',
    Expiracion: ''
  }
];

// Crear el libro de trabajo
const workbook = XLSX.utils.book_new();

// Crear la hoja de trabajo con los datos
const worksheet = XLSX.utils.json_to_sheet(testData);

// Agregar la hoja al libro
XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');

// Definir la ruta de salida
const outputPath = path.join(__dirname, '../test_usuarios_con_fechas.xlsx');

// Escribir el archivo
XLSX.writeFile(workbook, outputPath);

console.log(`Archivo de prueba creado exitosamente en: ${outputPath}`);
console.log('El archivo incluye:');
console.log('- 5 usuarios de prueba');
console.log('- 3 usuarios con fechas de expiración');
console.log('- 2 usuarios sin fecha de expiración');
console.log('- Diferentes tipos de roles y categorías');