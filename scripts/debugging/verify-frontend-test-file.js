const XLSX = require('xlsx');

console.log('🔍 Verificando archivo test_payment_codes_frontend.xlsx...\n');

try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile('test_payment_codes_frontend.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📊 Información del archivo:');
    console.log(`- Nombre de hoja: ${sheetName}`);
    console.log(`- Número de registros: ${data.length}`);
    
    if (data.length > 0) {
        console.log('\n🏷️ Columnas encontradas:');
        const columns = Object.keys(data[0]);
        columns.forEach((col, index) => {
            console.log(`  ${index + 1}. "${col}"`);
        });
        
        console.log('\n📝 Primer registro:');
        console.log(JSON.stringify(data[0], null, 2));
        
        // Verificar campos requeridos
        const requiredFields = ['code', 'name', 'category', 'type'];
        console.log('\n✅ Verificando campos requeridos:');
        
        requiredFields.forEach(field => {
            const hasField = columns.some(col => col.toLowerCase() === field.toLowerCase());
            console.log(`  - ${field}: ${hasField ? '✅ PRESENTE' : '❌ FALTANTE'}`);
        });
        
        // Verificar todos los campos que esperamos
        const expectedFields = [
            'code', 'name', 'factor', 'base_amount', 'category', 
            'type', 'is_active', 'requires_hours', 'is_taxable', 
            'valid_from', 'valid_until'
        ];
        
        console.log('\n📋 Todos los campos esperados:');
        expectedFields.forEach(field => {
            const hasField = columns.some(col => col.toLowerCase() === field.toLowerCase());
            console.log(`  - ${field}: ${hasField ? '✅' : '❌'}`);
        });
    }
    
} catch (error) {
    console.error('❌ Error leyendo archivo:', error.message);
}
