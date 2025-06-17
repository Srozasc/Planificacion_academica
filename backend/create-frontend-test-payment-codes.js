const XLSX = require('xlsx');

// Crear datos de prueba únicos para evitar duplicados
const testData = [
    {
        'code': 'FRONT_TEST_01',
        'name': 'Código de prueba frontend 1',
        'factor': 1.2,
        'base_amount': 1200000,
        'category': 'docente',
        'type': 'categoria',
        'is_active': true,
        'requires_hours': false,
        'is_taxable': true,
        'valid_from': '2025-01-01',
        'valid_until': '2025-12-31'
    },
    {
        'code': 'FRONT_TEST_02',
        'name': 'Código de prueba frontend 2',
        'factor': 0.8,
        'base_amount': 800000,
        'category': 'administrativo',
        'type': 'bono',
        'is_active': true,
        'requires_hours': false,
        'is_taxable': false,
        'valid_from': '2025-01-01',
        'valid_until': '2025-12-31'
    }
];

// Crear el libro de trabajo
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(testData);

// Agregar la hoja al libro
XLSX.utils.book_append_sheet(workbook, worksheet, 'Códigos de Pago');

// Guardar el archivo
XLSX.writeFile(workbook, 'test_payment_codes_frontend.xlsx');

console.log('✅ Archivo test_payment_codes_frontend.xlsx creado exitosamente');
console.log('📊 Registros creados:', testData.length);
console.log('📝 Códigos: FRONT_TEST_01, FRONT_TEST_02');
