const XLSX = require('xlsx');

// Datos de ejemplo para la plantilla oficial de códigos de pago
const templateData = [
    {
        'code': 'DOC001',
        'name': 'Docencia Pregrado',
        'category': 'docente',
        'type': 'categoria',
        'factor': 1.0,
        'base_amount': 50000,
        'is_active': true,
        'requires_hours': false,
        'is_taxable': true,
        'valid_from': '2025-01-01',
        'valid_until': '2025-12-31'
    },
    {
        'code': 'ADM001',
        'name': 'Bono Administrativo',
        'category': 'administrativo',
        'type': 'bono',
        'factor': 1.2,
        'base_amount': 75000,
        'is_active': true,
        'requires_hours': false,
        'is_taxable': true,
        'valid_from': '2025-01-01',
        'valid_until': '2025-12-31'
    },
    {
        'code': 'INV001',
        'name': 'Investigación por Horas',
        'category': 'academico',
        'type': 'categoria',
        'factor': 1.5,
        'base_amount': 30000,
        'is_active': true,
        'requires_hours': true,
        'is_taxable': true,
        'valid_from': '2025-01-01',
        'valid_until': '2025-12-31'
    }
];

// Crear el libro de trabajo
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Agregar la hoja al libro
XLSX.utils.book_append_sheet(workbook, worksheet, 'Códigos de Pago');

// Guardar el archivo
XLSX.writeFile(workbook, 'plantilla_codigos_pago.xlsx');

console.log('✅ Plantilla oficial creada: plantilla_codigos_pago.xlsx');
console.log('📋 Campos incluidos:');
console.log('   - code (requerido): Código único');
console.log('   - name (requerido): Nombre descriptivo');
console.log('   - category (requerido): Categoría del código');
console.log('   - type (requerido): Tipo de código');
console.log('   - factor: Factor multiplicador');
console.log('   - base_amount: Monto base');
console.log('   - is_active: Estado activo/inactivo');
console.log('   - requires_hours: Si requiere horas');
console.log('   - is_taxable: Si está afecto a impuestos');
console.log('   - valid_from: Fecha inicio validez');
console.log('   - valid_until: Fecha fin validez');
console.log('\n🎯 Esta plantilla es compatible con el sistema de cargas masivas.');
