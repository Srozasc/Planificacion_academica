const XLSX = require('xlsx');
const fs = require('fs');

console.log('🧪 Simulando el procesamiento del backend...\n');

try {
    // Leer el archivo Excel como lo haría el backend
    const workbook = XLSX.readFile('test_payment_codes_frontend.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON como lo hace el backend
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📊 Datos parseados del Excel:');
    console.log(`- Registros encontrados: ${data.length}`);
    console.log(`- Primeras columnas: ${Object.keys(data[0]).slice(0, 5).join(', ')}`);
    
    // Simular la validación de estructura del backend
    const requiredFields = ['code', 'name', 'category', 'type'];
    const firstRecord = data[0];
    const availableFields = Object.keys(firstRecord).map(key => key.toLowerCase());
    
    console.log('\n🔍 Validación de estructura:');
    console.log(`- Campos disponibles: ${availableFields.join(', ')}`);
    
    const getFieldVariations = (field) => {
        const variations = {
            'code': ['code', 'codigo', 'código'],
            'name': ['name', 'nombre'],
            'type': ['type', 'tipo'],
            'category': ['category', 'categoria', 'categoría'],
        };
        return variations[field] || [field];
    };
    
    const missingFields = requiredFields.filter(field => {
        const fieldVariations = getFieldVariations(field);
        return !fieldVariations.some(variation => 
            availableFields.includes(variation.toLowerCase())
        );
    });
    
    if (missingFields.length > 0) {
        console.error(`❌ FALTAN CAMPOS: ${missingFields.join(', ')}`);
        console.error(`   Campos disponibles: ${availableFields.join(', ')}`);
    } else {
        console.log('✅ Todos los campos requeridos están presentes');
    }
    
    // Simular el mapeo de datos del backend
    console.log('\n🗺️ Simulando mapeo de datos:');
    const mappedData = data.map(row => ({
        code_name: row.codigo || row.code || row.code_name || null,
        description: row.nombre || row.name || row.description || null,
        factor: row.factor || row.multiplicador || 1.0,
        base_amount: row.base_amount || row.monto_base || 0,
        category: row.categoria || row.category || null,
        type: row.tipo || row.type || row.tipo_contrato || row.contract_type || null,
        is_active: row.activo || row.is_active || true,
        requires_hours: row.requires_hours || row.requiere_horas || false,
        is_taxable: row.is_taxable || row.afecto_impuesto || true,
        valid_from: row.valido_desde || row.valid_from || null,
        valid_until: row.valido_hasta || row.valid_until || null
    }));
    
    console.log('✅ Mapeo completado:');
    console.log(`- Registros mapeados: ${mappedData.length}`);
    
    mappedData.forEach((record, index) => {
        console.log(`\n📝 Registro ${index + 1}:`);
        Object.entries(record).forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`);
        });
    });
    
    console.log('\n📄 JSON a enviar al SP:');
    const jsonToSend = JSON.stringify(mappedData, null, 2);
    console.log(jsonToSend);
    
} catch (error) {
    console.error('❌ Error en la simulación:', error.message);
}
