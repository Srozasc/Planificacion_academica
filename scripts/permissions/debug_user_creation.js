const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'planificacion_user',
    password: 'PlanUser2025!',
    database: 'planificacion_academica'
};

async function debugUserCreation() {
    let connection;
    
    try {
        console.log('🔍 DIAGNÓSTICO: Creación de Usuarios');
        console.log('=' .repeat(50));
        
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Verificar bimestres disponibles
        console.log('\n1. BIMESTRES DISPONIBLES:');
        const [bimestres] = await connection.execute(`
            SELECT id, nombre, activo, fechaInicio, fechaFin 
            FROM bimestres 
            ORDER BY id DESC
        `);
        
        bimestres.forEach(b => {
            console.log(`   - ID: ${b.id}, Nombre: ${b.nombre}, Activo: ${b.activo ? 'Sí' : 'No'}`);
            console.log(`     Fechas: ${b.fechaInicio} - ${b.fechaFin}`);
        });
        
        // 2. Verificar último usuario creado
        console.log('\n2. ÚLTIMOS USUARIOS CREADOS:');
        const [usuarios] = await connection.execute(`
            SELECT id, name, email_institucional, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        usuarios.forEach(u => {
            console.log(`   - ID: ${u.id}, Nombre: ${u.name}, Email: ${u.email_institucional}`);
            console.log(`     Creado: ${u.created_at}`);
        });
        
        // 3. Verificar estructura de tabla permisos_pendientes primero
        console.log('\n3. ESTRUCTURA TABLA PERMISOS_PENDIENTES:');
        const [estructura] = await connection.execute(`
            DESCRIBE permisos_pendientes
        `);
        
        estructura.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
        });
        
        // 4. Verificar permisos pendientes recientes (usando solo columnas que sabemos que existen)
        console.log('\n4. PERMISOS PENDIENTES RECIENTES:');
        const [permisos] = await connection.execute(`
            SELECT id, usuario_mail, bimestre_id 
            FROM permisos_pendientes 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        permisos.forEach(p => {
            console.log(`   - ID: ${p.id}, Usuario: ${p.usuario_mail}, Bimestre: ${p.bimestre_id}`);
        });
        
        // 5. Verificar conteo total de registros
        console.log('\n5. CONTEO DE REGISTROS:');
        const [conteos] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM permisos_pendientes) as permisos_pendientes,
                (SELECT COUNT(*) FROM users) as usuarios_total,
                (SELECT COUNT(*) FROM bimestres) as bimestres_total
        `);
        
        console.log(`   - Permisos pendientes: ${conteos[0].permisos_pendientes}`);
        console.log(`   - Usuarios total: ${conteos[0].usuarios_total}`);
        console.log(`   - Bimestres total: ${conteos[0].bimestres_total}`);
        
        console.log('\n✅ Diagnóstico completado');
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar diagnóstico
debugUserCreation();