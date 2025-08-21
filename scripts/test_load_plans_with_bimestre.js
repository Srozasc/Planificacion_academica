const mysql = require('mysql2/promise');
const path = require('path');
const { loadPlans } = require('./scripts/permissions/load_plans');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planificacion_academica',
    charset: 'utf8mb4'
};

/**
 * Script de prueba para verificar la funcionalidad de load_plans.js con bimestre_id
 */
async function testLoadPlansWithBimestre() {
    let connection;
    
    try {
        console.log('🧪 === INICIANDO PRUEBA DE LOAD_PLANS CON BIMESTRE ===');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Paso 1: Verificar datos en staging_estructura_academica
        console.log('\n📊 Paso 1: Verificando datos en staging_estructura_academica...');
        const [stagingData] = await connection.execute(`
            SELECT COUNT(*) as total,
                   COUNT(DISTINCT plan) as planes_unicos,
                   COUNT(DISTINCT id_bimestre) as bimestres_unicos,
                   COUNT(DISTINCT CONCAT(plan, '_', id_bimestre)) as combinaciones_plan_bimestre
            FROM staging_estructura_academica 
            WHERE plan IS NOT NULL 
            AND sigla IS NOT NULL
            AND id_bimestre IS NOT NULL
        `);
        
        console.log(`   Total registros válidos: ${stagingData[0].total}`);
        console.log(`   Planes únicos: ${stagingData[0].planes_unicos}`);
        console.log(`   Bimestres únicos: ${stagingData[0].bimestres_unicos}`);
        console.log(`   Combinaciones plan-bimestre: ${stagingData[0].combinaciones_plan_bimestre}`);
        
        if (stagingData[0].total === 0) {
            console.log('⚠️  No hay datos válidos en staging para procesar');
            return;
        }
        
        // Mostrar muestra de datos
        const [sampleData] = await connection.execute(`
            SELECT plan, carrera, sigla, asignatura, id_bimestre
            FROM staging_estructura_academica 
            WHERE plan IS NOT NULL 
            AND sigla IS NOT NULL
            AND id_bimestre IS NOT NULL
            LIMIT 5
        `);
        
        console.log('\n📋 Muestra de datos en staging:');
        sampleData.forEach((row, index) => {
            console.log(`   ${index + 1}. Plan: ${row.plan}, Carrera: ${row.carrera}, Sigla: ${row.sigla}, Bimestre: ${row.id_bimestre}`);
        });
        
        // Paso 2: Verificar estado antes de load_plans
        console.log('\n📈 Paso 2: Estado de tablas ANTES de ejecutar load_plans...');
        const [carrerasAntes] = await connection.execute('SELECT COUNT(*) as total FROM carreras WHERE activo = TRUE');
        const [asignaturasAntes] = await connection.execute('SELECT COUNT(*) as total FROM asignaturas WHERE activo = TRUE');
        
        console.log(`   Carreras activas: ${carrerasAntes[0].total}`);
        console.log(`   Asignaturas activas: ${asignaturasAntes[0].total}`);
        
        // Paso 3: Ejecutar load_plans
        console.log('\n🚀 Paso 3: Ejecutando load_plans...');
        await loadPlans();
        
        // Paso 4: Verificar estado después de load_plans
        console.log('\n📈 Paso 4: Estado de tablas DESPUÉS de ejecutar load_plans...');
        const [carrerasDespues] = await connection.execute('SELECT COUNT(*) as total FROM carreras WHERE activo = TRUE');
        const [asignaturasDespues] = await connection.execute('SELECT COUNT(*) as total FROM asignaturas WHERE activo = TRUE');
        
        console.log(`   Carreras activas: ${carrerasDespues[0].total} (cambio: +${carrerasDespues[0].total - carrerasAntes[0].total})`);
        console.log(`   Asignaturas activas: ${asignaturasDespues[0].total} (cambio: +${asignaturasDespues[0].total - asignaturasAntes[0].total})`);
        
        // Paso 5: Verificar carreras con bimestre_id
        console.log('\n🔍 Paso 5: Verificando carreras con bimestre_id...');
        const [carrerasConBimestre] = await connection.execute(`
            SELECT codigo_plan, nombre_carrera, bimestre_id, COUNT(*) as asignaturas_count
            FROM carreras c
            LEFT JOIN asignaturas a ON c.id = a.carrera_id
            WHERE c.activo = TRUE AND c.bimestre_id IS NOT NULL
            GROUP BY c.id, c.codigo_plan, c.nombre_carrera, c.bimestre_id
            ORDER BY c.bimestre_id, c.codigo_plan
            LIMIT 10
        `);
        
        console.log('   Carreras con bimestre_id (primeras 10):');
        carrerasConBimestre.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.codigo_plan} - ${row.nombre_carrera} (Bimestre: ${row.bimestre_id}, Asignaturas: ${row.asignaturas_count})`);
        });
        
        // Paso 6: Verificar asignaturas con bimestre_id
        console.log('\n🔍 Paso 6: Verificando asignaturas con bimestre_id...');
        const [asignaturasConBimestre] = await connection.execute(`
            SELECT a.sigla, a.nombre, a.bimestre_id, c.codigo_plan
            FROM asignaturas a
            JOIN carreras c ON a.carrera_id = c.id
            WHERE a.activo = TRUE AND a.bimestre_id IS NOT NULL
            ORDER BY a.bimestre_id, c.codigo_plan, a.sigla
            LIMIT 10
        `);
        
        console.log('   Asignaturas con bimestre_id (primeras 10):');
        asignaturasConBimestre.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.sigla} - ${row.nombre} (Plan: ${row.codigo_plan}, Bimestre: ${row.bimestre_id})`);
        });
        
        console.log('\n✅ === PRUEBA COMPLETADA EXITOSAMENTE ===');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión a base de datos cerrada');
        }
    }
}

// Ejecutar la prueba
if (require.main === module) {
    testLoadPlansWithBimestre()
        .then(() => {
            console.log('🎉 Prueba completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal en la prueba:', error.message);
            process.exit(1);
        });
}

module.exports = { testLoadPlansWithBimestre };