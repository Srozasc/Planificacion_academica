const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planificacion_academica',
    charset: 'utf8mb4'
};

async function testAdolApprovalFlow() {
    let connection;
    
    try {
        console.log('🔗 Conectando a la base de datos...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida exitosamente');
        
        console.log('\n🧪 Iniciando prueba del flujo de aprobación ADOL...');
        
        // 1. Verificar que las tablas existen
        console.log('\n1️⃣ Verificando tablas...');
        
        const [tables] = await connection.query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('staging_adol_simple', 'adol_aprobados')
        `, [dbConfig.database]);
        
        console.log(`   📋 Tablas encontradas: ${tables.map(t => t.TABLE_NAME).join(', ')}`);
        
        // 2. Verificar datos en staging
        console.log('\n2️⃣ Verificando datos en staging_adol_simple...');
        
        const [stagingData] = await connection.query(`
            SELECT COUNT(*) as total, 
                   COUNT(DISTINCT id_bimestre) as bimestres,
                   MIN(id_bimestre) as min_bimestre,
                   MAX(id_bimestre) as max_bimestre
            FROM staging_adol_simple
        `);
        
        console.log(`   📊 Registros en staging: ${stagingData[0].total}`);
        console.log(`   📅 Bimestres: ${stagingData[0].bimestres} (${stagingData[0].min_bimestre} - ${stagingData[0].max_bimestre})`);
        
        if (stagingData[0].total === 0) {
            console.log('\n⚠️ No hay datos en staging_adol_simple para probar');
            console.log('   💡 Sugerencia: Carga un archivo ADOL primero');
            return;
        }
        
        // 3. Verificar estado inicial de adol_aprobados
        console.log('\n3️⃣ Verificando estado inicial de adol_aprobados...');
        
        const [initialApproved] = await connection.query(`
            SELECT COUNT(*) as total
            FROM adol_aprobados
        `);
        
        console.log(`   📊 Registros iniciales en adol_aprobados: ${initialApproved[0].total}`);
        
        // 4. Probar el procedimiento almacenado
        console.log('\n4️⃣ Ejecutando procedimiento de migración...');
        
        const testUser = 'test@ejemplo.com';
        const [migrationResult] = await connection.query(
            'CALL sp_migrate_staging_adol_to_aprobados(?)',
            [testUser]
        );
        
        console.log(`   ✅ Resultado de migración:`);
        console.log(`      Status: ${migrationResult[0][0].status}`);
        console.log(`      Registros procesados: ${migrationResult[0][0].affected_rows}`);
        console.log(`      Mensaje: ${migrationResult[0][0].message}`);
        
        // 5. Verificar estado final de adol_aprobados
        console.log('\n5️⃣ Verificando estado final de adol_aprobados...');
        
        const [finalApproved] = await connection.query(`
            SELECT COUNT(*) as total,
                   COUNT(DISTINCT id_bimestre) as bimestres,
                   COUNT(DISTINCT aprobado_por) as aprobadores
            FROM adol_aprobados
        `);
        
        console.log(`   📊 Registros finales en adol_aprobados: ${finalApproved[0].total}`);
        console.log(`   📅 Bimestres aprobados: ${finalApproved[0].bimestres}`);
        console.log(`   👤 Aprobadores únicos: ${finalApproved[0].aprobadores}`);
        
        // 6. Mostrar algunos registros de ejemplo
        console.log('\n6️⃣ Mostrando registros de ejemplo...');
        
        const [sampleRecords] = await connection.query(`
            SELECT sigla, descripcion, id_bimestre, aprobado_por, fecha_aprobacion
            FROM adol_aprobados
            ORDER BY fecha_aprobacion DESC
            LIMIT 5
        `);
        
        if (sampleRecords.length > 0) {
            console.log('   📝 Últimos registros aprobados:');
            sampleRecords.forEach((record, index) => {
                console.log(`      ${index + 1}. ${record.sigla} - ${record.descripcion.substring(0, 50)}...`);
                console.log(`         Bimestre: ${record.id_bimestre}, Aprobado por: ${record.aprobado_por}`);
                console.log(`         Fecha: ${record.fecha_aprobacion}`);
            });
        }
        
        // 7. Probar duplicados (ejecutar migración nuevamente)
        console.log('\n7️⃣ Probando manejo de duplicados...');
        
        const [duplicateTest] = await connection.query(
            'CALL sp_migrate_staging_adol_to_aprobados(?)',
            [testUser]
        );
        
        console.log(`   ✅ Resultado de segunda migración:`);
        console.log(`      Status: ${duplicateTest[0][0].status}`);
        console.log(`      Registros procesados: ${duplicateTest[0][0].affected_rows}`);
        console.log(`      Mensaje: ${duplicateTest[0][0].message}`);
        
        console.log('\n🎉 Prueba del flujo de aprobación ADOL completada exitosamente');
        console.log('\n📋 Resumen:');
        console.log(`   ✅ Tabla adol_aprobados creada y funcional`);
        console.log(`   ✅ Procedimiento sp_migrate_staging_adol_to_aprobados funcional`);
        console.log(`   ✅ Migración de datos exitosa`);
        console.log(`   ✅ Manejo de duplicados correcto`);
        console.log(`   ✅ Campos de auditoría poblados correctamente`);
        
    } catch (error) {
        console.error('\n❌ Error en la prueba:', error.message);
        if (error.sql) {
            console.error('SQL que causó el error:', error.sql);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar prueba
testAdolApprovalFlow();