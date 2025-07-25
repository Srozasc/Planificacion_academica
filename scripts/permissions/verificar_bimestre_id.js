/**
 * Script para verificar que el bimestre_id se está manejando correctamente
 * en todas las tablas de permisos
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'planificacion_user',
    password: 'planificacion_2024',
    database: 'planificacion_academica',
    charset: 'utf8mb4'
};

async function verificarBimestreId() {
    let connection;
    
    try {
        console.log('🔍 Verificando manejo de bimestre_id en tablas de permisos...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Verificar permisos_pendientes
        console.log('\n📋 Verificando permisos_pendientes:');
        const [pendientes] = await connection.execute(`
            SELECT 
                bimestre_id,
                COUNT(*) as total,
                COUNT(CASE WHEN estado = 'PROCESADO' THEN 1 END) as procesados,
                COUNT(CASE WHEN estado = 'ERROR' THEN 1 END) as errores
            FROM permisos_pendientes 
            GROUP BY bimestre_id
            ORDER BY bimestre_id
        `);
        
        pendientes.forEach(row => {
            console.log(`   📅 Bimestre ${row.bimestre_id}: ${row.total} registros (${row.procesados} procesados, ${row.errores} errores)`);
        });
        
        // Verificar usuario_permisos_carrera
        console.log('\n🎓 Verificando usuario_permisos_carrera:');
        const [carrera] = await connection.execute(`
            SELECT 
                upc.bimestre_id,
                COUNT(*) as total,
                COUNT(CASE WHEN upc.activo = 1 THEN 1 END) as activos,
                b.nombre as nombre_bimestre
            FROM usuario_permisos_carrera upc
            LEFT JOIN bimestres b ON upc.bimestre_id = b.id
            GROUP BY upc.bimestre_id, b.nombre
            ORDER BY upc.bimestre_id
        `);
        
        carrera.forEach(row => {
            console.log(`   📅 Bimestre ${row.bimestre_id} (${row.nombre_bimestre}): ${row.total} permisos (${row.activos} activos)`);
        });
        
        // Verificar usuario_permisos_categoria
        console.log('\n📚 Verificando usuario_permisos_categoria:');
        const [categoria] = await connection.execute(`
            SELECT 
                upc.bimestre_id,
                COUNT(*) as total,
                COUNT(CASE WHEN upc.activo = 1 THEN 1 END) as activos,
                b.nombre as nombre_bimestre
            FROM usuario_permisos_categoria upc
            LEFT JOIN bimestres b ON upc.bimestre_id = b.id
            GROUP BY upc.bimestre_id, b.nombre
            ORDER BY upc.bimestre_id
        `);
        
        categoria.forEach(row => {
            console.log(`   📅 Bimestre ${row.bimestre_id} (${row.nombre_bimestre}): ${row.total} permisos (${row.activos} activos)`);
        });
        
        // Verificar consistencia temporal
        console.log('\n🔍 Verificando consistencia temporal:');
        const [consistencia] = await connection.execute(`
            SELECT 
                'permisos_pendientes' as tabla,
                COUNT(*) as registros_sin_bimestre
            FROM permisos_pendientes 
            WHERE bimestre_id IS NULL
            
            UNION ALL
            
            SELECT 
                'usuario_permisos_carrera' as tabla,
                COUNT(*) as registros_sin_bimestre
            FROM usuario_permisos_carrera 
            WHERE bimestre_id IS NULL
            
            UNION ALL
            
            SELECT 
                'usuario_permisos_categoria' as tabla,
                COUNT(*) as registros_sin_bimestre
            FROM usuario_permisos_categoria 
            WHERE bimestre_id IS NULL
        `);
        
        let todoOk = true;
        consistencia.forEach(row => {
            if (row.registros_sin_bimestre > 0) {
                console.log(`   ❌ ${row.tabla}: ${row.registros_sin_bimestre} registros sin bimestre_id`);
                todoOk = false;
            } else {
                console.log(`   ✅ ${row.tabla}: Todos los registros tienen bimestre_id`);
            }
        });
        
        // Verificar integridad referencial
        console.log('\n🔗 Verificando integridad referencial:');
        const [integridad] = await connection.execute(`
            SELECT 
                'permisos_pendientes' as tabla,
                COUNT(*) as registros_huerfanos
            FROM permisos_pendientes pp
            LEFT JOIN bimestres b ON pp.bimestre_id = b.id
            WHERE b.id IS NULL
            
            UNION ALL
            
            SELECT 
                'usuario_permisos_carrera' as tabla,
                COUNT(*) as registros_huerfanos
            FROM usuario_permisos_carrera upc
            LEFT JOIN bimestres b ON upc.bimestre_id = b.id
            WHERE b.id IS NULL
            
            UNION ALL
            
            SELECT 
                'usuario_permisos_categoria' as tabla,
                COUNT(*) as registros_huerfanos
            FROM usuario_permisos_categoria upcat
            LEFT JOIN bimestres b ON upcat.bimestre_id = b.id
            WHERE b.id IS NULL
        `);
        
        integridad.forEach(row => {
            if (row.registros_huerfanos > 0) {
                console.log(`   ❌ ${row.tabla}: ${row.registros_huerfanos} registros con bimestre_id inválido`);
                todoOk = false;
            } else {
                console.log(`   ✅ ${row.tabla}: Todas las referencias a bimestre son válidas`);
            }
        });
        
        // Mostrar últimos registros creados con bimestre_id
        console.log('\n📝 Últimos registros creados:');
        const [ultimos] = await connection.execute(`
            SELECT 
                pp.id,
                pp.usuario_mail,
                pp.bimestre_id,
                b.nombre as nombre_bimestre,
                pp.estado,
                pp.created_at
            FROM permisos_pendientes pp
            LEFT JOIN bimestres b ON pp.bimestre_id = b.id
            ORDER BY pp.created_at DESC
            LIMIT 5
        `);
        
        ultimos.forEach(row => {
            console.log(`   📧 ${row.usuario_mail} | Bimestre: ${row.bimestre_id} (${row.nombre_bimestre}) | Estado: ${row.estado}`);
        });
        
        console.log('\n' + (todoOk ? '✅ ¡Verificación exitosa! El bimestre_id se está manejando correctamente.' : '❌ Se encontraron problemas con el manejo de bimestre_id.'));
        
    } catch (error) {
        console.error('❌ Error en la verificación:', error.message);
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
    verificarBimestreId()
        .then(() => {
            console.log('🎉 Verificación completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarBimestreId };