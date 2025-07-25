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
 * Script para diagnosticar el estado de las tablas de permisos
 */
async function diagnosticarPermisos() {
    let connection;
    
    try {
        console.log('🔍 Iniciando diagnóstico de permisos...');
        console.log('📊 Configuración de BD:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database
        });
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // 1. Verificar tabla permisos_pendientes
        console.log('\n📋 Estado de permisos_pendientes:');
        const [pendientes] = await connection.execute('SELECT COUNT(*) as total FROM permisos_pendientes');
        console.log(`   Total registros: ${pendientes[0].total}`);
        
        if (pendientes[0].total > 0) {
            const [estados] = await connection.execute(`
                SELECT estado, COUNT(*) as cantidad 
                FROM permisos_pendientes 
                GROUP BY estado
            `);
            estados.forEach(row => {
                console.log(`   ${row.estado}: ${row.cantidad}`);
            });
            
            // Mostrar algunos registros de ejemplo
            const [ejemplos] = await connection.execute(`
                SELECT id, usuario_mail, usuario_nombre, permiso_carrera_codigo, 
                       permiso_categoria, estado, mensaje_error
                FROM permisos_pendientes 
                ORDER BY fecha_creacion DESC 
                LIMIT 5
            `);
            
            console.log('\n   📝 Últimos 5 registros:');
            ejemplos.forEach((reg, i) => {
                console.log(`   ${i+1}. ID:${reg.id} | ${reg.usuario_mail} | Estado:${reg.estado}`);
                if (reg.mensaje_error) {
                    console.log(`      Error: ${reg.mensaje_error}`);
                }
            });
        }
        
        // 2. Verificar tabla usuario_permisos_carrera
        console.log('\n🎓 Estado de usuario_permisos_carrera:');
        const [carrera] = await connection.execute('SELECT COUNT(*) as total FROM usuario_permisos_carrera');
        console.log(`   Total registros: ${carrera[0].total}`);
        
        // 3. Verificar tabla usuario_permisos_categoria
        console.log('\n📚 Estado de usuario_permisos_categoria:');
        const [categoria] = await connection.execute('SELECT COUNT(*) as total FROM usuario_permisos_categoria');
        console.log(`   Total registros: ${categoria[0].total}`);
        
        // 4. Verificar tabla carreras
        console.log('\n🏫 Estado de carreras:');
        const [carreras] = await connection.execute('SELECT COUNT(*) as total FROM carreras WHERE activo = TRUE');
        console.log(`   Total carreras activas: ${carreras[0].total}`);
        
        if (carreras[0].total > 0) {
            const [ejemplosCarreras] = await connection.execute(`
                SELECT codigo_plan, nombre_carrera 
                FROM carreras 
                WHERE activo = TRUE 
                LIMIT 3
            `);
            console.log('   Ejemplos:');
            ejemplosCarreras.forEach(c => {
                console.log(`   - ${c.codigo_plan}: ${c.nombre_carrera}`);
            });
        }
        
        // 5. Verificar usuarios recientes
        console.log('\n👥 Usuarios recientes:');
        const [usuarios] = await connection.execute(`
            SELECT COUNT(*) as total 
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        `);
        console.log(`   Usuarios creados en las últimas 24h: ${usuarios[0].total}`);
        
        // 6. Verificar si existe archivo lock
        const fs = require('fs');
        const lockFile = path.join(process.cwd(), 'resolve_permissions.lock');
        if (fs.existsSync(lockFile)) {
            console.log('\n⚠️  ADVERTENCIA: Archivo lock existe - puede estar bloqueando el proceso');
            const stats = fs.statSync(lockFile);
            console.log(`   Creado: ${stats.mtime}`);
            const lockAge = Date.now() - stats.mtime.getTime();
            console.log(`   Antigüedad: ${Math.round(lockAge / 1000 / 60)} minutos`);
        } else {
            console.log('\n✅ No hay archivo lock activo');
        }
        
        console.log('\n🎯 Diagnóstico completado');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnosticarPermisos()
        .then(() => {
            console.log('\n✅ Diagnóstico completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { diagnosticarPermisos };