require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planificacion_academica',
    charset: 'utf8mb4'
};

/**
 * Script para verificar el estado de staging_estructura_academica
 * Útil para debugging y verificación antes de ejecutar load_plans.js
 */
async function checkStaging() {
    let connection;
    
    try {
        console.log('🔍 Verificando estado de staging_estructura_academica...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Verificar si la tabla existe
        const [tables] = await connection.execute(`
            SHOW TABLES LIKE 'staging_estructura_academica'
        `);
        
        if (tables.length === 0) {
            console.log('❌ La tabla staging_estructura_academica no existe');
            return;
        }
        
        console.log('✅ Tabla staging_estructura_academica encontrada');
        
        // Contar registros totales
        const [countResult] = await connection.execute(`
            SELECT COUNT(*) as total FROM staging_estructura_academica
        `);
        
        const totalRegistros = countResult[0].total;
        console.log(`📊 Total de registros: ${totalRegistros}`);
        
        if (totalRegistros === 0) {
            console.log('⚠️  No hay datos en staging_estructura_academica');
            return;
        }
        
        // Contar registros válidos para procesamiento
        const [validResult] = await connection.execute(`
            SELECT COUNT(*) as validos 
            FROM staging_estructura_academica 
            WHERE plan IS NOT NULL 
            AND sigla IS NOT NULL
        `);
        
        const registrosValidos = validResult[0].validos;
        console.log(`✅ Registros válidos para procesamiento: ${registrosValidos}`);
        
        // Mostrar carreras únicas
        const [carrerasResult] = await connection.execute(`
            SELECT DISTINCT plan, carrera 
            FROM staging_estructura_academica 
            WHERE plan IS NOT NULL 
            ORDER BY plan
        `);
        
        console.log(`\n🎓 Carreras encontradas (${carrerasResult.length}):`);
        carrerasResult.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.plan} - ${row.carrera || 'Sin nombre'}`);
        });
        
        // Mostrar estadísticas por categoría
        const [categoriasResult] = await connection.execute(`
            SELECT 
                categoria,
                COUNT(*) as cantidad
            FROM staging_estructura_academica 
            WHERE categoria IS NOT NULL
            GROUP BY categoria
            ORDER BY cantidad DESC
        `);
        
        if (categoriasResult.length > 0) {
            console.log(`\n📚 Distribución por categorías:`);
            categoriasResult.forEach(row => {
                console.log(`   ${row.categoria}: ${row.cantidad} asignaturas`);
            });
        }
        
        // Verificar registros con datos faltantes
        const [problemasResult] = await connection.execute(`
            SELECT 
                SUM(CASE WHEN plan IS NULL THEN 1 ELSE 0 END) as sin_plan,
                SUM(CASE WHEN carrera IS NULL THEN 1 ELSE 0 END) as sin_carrera,
                SUM(CASE WHEN sigla IS NULL THEN 1 ELSE 0 END) as sin_sigla,
                SUM(CASE WHEN asignatura IS NULL THEN 1 ELSE 0 END) as sin_asignatura
            FROM staging_estructura_academica
        `);
        
        const problemas = problemasResult[0];
        if (problemas.sin_plan > 0 || problemas.sin_carrera > 0 || 
            problemas.sin_sigla > 0 || problemas.sin_asignatura > 0) {
            
            console.log(`\n⚠️  Registros con datos faltantes:`);
            if (problemas.sin_plan > 0) console.log(`   Sin plan: ${problemas.sin_plan}`);
            if (problemas.sin_carrera > 0) console.log(`   Sin carrera: ${problemas.sin_carrera}`);
            if (problemas.sin_sigla > 0) console.log(`   Sin sigla: ${problemas.sin_sigla}`);
            if (problemas.sin_asignatura > 0) console.log(`   Sin asignatura: ${problemas.sin_asignatura}`);
        }
        
        // Mostrar muestra de datos
        const [muestraResult] = await connection.execute(`
            SELECT plan, carrera, sigla, asignatura, creditos, categoria
            FROM staging_estructura_academica 
            WHERE plan IS NOT NULL AND sigla IS NOT NULL
            LIMIT 5
        `);
        
        if (muestraResult.length > 0) {
            console.log(`\n📋 Muestra de datos (primeros 5 registros):`);
            muestraResult.forEach((row, index) => {
                console.log(`   ${index + 1}. ${row.plan} | ${row.sigla} | ${row.asignatura} | ${row.categoria || 'Sin categoría'}`);
            });
        }
        
        // Verificar estado de tablas finales
        console.log(`\n🔍 Estado de tablas finales:`);
        
        const [carrerasFinales] = await connection.execute(`
            SELECT COUNT(*) as total FROM carreras WHERE activo = TRUE
        `);
        console.log(`   Carreras activas: ${carrerasFinales[0].total}`);
        
        const [asignaturasFinales] = await connection.execute(`
            SELECT COUNT(*) as total FROM asignaturas WHERE activo = TRUE
        `);
        console.log(`   Asignaturas activas: ${asignaturasFinales[0].total}`);
        
        console.log('\n✅ Verificación completada');
        
        if (registrosValidos > 0) {
            console.log('\n💡 Puedes ejecutar: node load_plans.js');
        } else {
            console.log('\n⚠️  Necesitas cargar datos en staging_estructura_academica primero');
        }
        
    } catch (error) {
        console.error('❌ Error verificando staging:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión a base de datos cerrada');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    checkStaging()
        .then(() => {
            console.log('🎉 Verificación completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { checkStaging };