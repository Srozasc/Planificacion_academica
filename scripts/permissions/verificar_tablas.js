const mysql = require('mysql2/promise');
const path = require('path');

// Cargar variables de entorno desde el backend
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planificacion_academica',
    charset: 'utf8mb4'
};

/**
 * Script para verificar si las tablas de permisos existen
 */
async function verificarTablas() {
    let connection;
    
    try {
        console.log('🔍 Verificando existencia de tablas...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Lista de tablas requeridas
        const tablasRequeridas = [
            'permisos_pendientes',
            'carreras',
            'asignaturas',
            'usuario_permisos_carrera',
            'usuario_permisos_categoria',
            'staging_estructura_academica'
        ];
        
        console.log('\n📋 Verificando tablas:');
        
        for (const tabla of tablasRequeridas) {
            try {
                const [result] = await connection.execute(`SHOW TABLES LIKE '${tabla}'`);
                if (result.length > 0) {
                    console.log(`   ✅ ${tabla} - EXISTE`);
                    
                    // Obtener estructura de la tabla
                    const [estructura] = await connection.execute(`DESCRIBE ${tabla}`);
                    console.log(`      Columnas: ${estructura.length}`);
                    
                    // Obtener conteo de registros
                    const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tabla}`);
                    console.log(`      Registros: ${count[0].total}`);
                    
                } else {
                    console.log(`   ❌ ${tabla} - NO EXISTE`);
                }
            } catch (error) {
                console.log(`   ⚠️  ${tabla} - ERROR: ${error.message}`);
            }
        }
        
        // Verificar staging_estructura_academica específicamente
        console.log('\n🏗️  Verificando datos en staging_estructura_academica:');
        try {
            const [staging] = await connection.execute(`
                SELECT COUNT(*) as total,
                       COUNT(DISTINCT plan) as planes_unicos,
                       COUNT(DISTINCT carrera) as carreras_unicas
                FROM staging_estructura_academica
            `);
            
            console.log(`   Total registros: ${staging[0].total}`);
            console.log(`   Planes únicos: ${staging[0].planes_unicos}`);
            console.log(`   Carreras únicas: ${staging[0].carreras_unicas}`);
            
            if (staging[0].total > 0) {
                const [ejemplos] = await connection.execute(`
                    SELECT DISTINCT plan, carrera 
                    FROM staging_estructura_academica 
                    WHERE plan IS NOT NULL AND carrera IS NOT NULL
                    LIMIT 5
                `);
                
                console.log('   Ejemplos de planes:');
                ejemplos.forEach(e => {
                    console.log(`   - ${e.plan}: ${e.carrera}`);
                });
            }
            
        } catch (error) {
            console.log(`   ❌ Error consultando staging: ${error.message}`);
        }
        
        console.log('\n🎯 Verificación completada');
        
    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar verificación
if (require.main === module) {
    verificarTablas()
        .then(() => {
            console.log('\n✅ Verificación completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarTablas };