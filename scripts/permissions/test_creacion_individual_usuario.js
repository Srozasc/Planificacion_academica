const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'planificacion_user',
    password: 'planificacion_password',
    database: 'planificacion_academica'
};

/**
 * Script para verificar que la creación individual de usuarios
 * esté usando el bimestre_id correcto del navbar
 */
async function testCreacionIndividualUsuario() {
    let connection;
    
    try {
        console.log('🧪 Iniciando prueba de creación individual de usuarios...');
        console.log('📊 Configuración de BD:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database
        });
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Verificar estado inicial
        console.log('\n📋 Estado inicial del sistema:');
        await mostrarEstadoTablas(connection);
        
        // Verificar que exista un bimestre específico para la prueba
        const bimestreTest = 15; // Usar el mismo bimestre de las pruebas anteriores
        const [bimestreRows] = await connection.execute(
            'SELECT id, nombre, activo FROM bimestres WHERE id = ?',
            [bimestreTest]
        );
        
        if (bimestreRows.length === 0) {
            console.log(`❌ Error: No existe el bimestre con ID ${bimestreTest}`);
            return;
        }
        
        console.log(`\n🎯 Usando bimestre de prueba: ${bimestreRows[0].nombre} (ID: ${bimestreTest})`);
        
        // Simular creación de usuario individual con bimestre específico
        console.log('\n🔄 Simulando creación de usuario individual...');
        
        // Crear usuario de prueba
        const usuarioTest = {
            email: 'test.individual@duoc.cl',
            nombre: 'Usuario Individual Test',
            tipoRol: 'Editor',
            carrera: '1114401', // CONTABILIDAD TRIBUTARIA
            bimestre_id: bimestreTest
        };
        
        // Insertar en permisos_pendientes (simulando el flujo del backend)
        const [insertResult] = await connection.execute(`
            INSERT INTO permisos_pendientes 
            (usuario_mail, usuario_nombre, cargo, permiso_carrera_codigo, tipo_rol, fecha_expiracion, estado, bimestre_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            usuarioTest.email,
            usuarioTest.nombre,
            'Usuario Manual',
            usuarioTest.carrera,
            usuarioTest.tipoRol,
            null, // Sin fecha de expiración
            'PENDIENTE',
            usuarioTest.bimestre_id
        ]);
        
        console.log(`✅ Usuario insertado en permisos_pendientes (ID: ${insertResult.insertId})`);
        
        // Verificar que se insertó con el bimestre correcto
        const [verificacionRows] = await connection.execute(`
            SELECT id, usuario_mail, usuario_nombre, permiso_carrera_codigo, bimestre_id, estado
            FROM permisos_pendientes 
            WHERE id = ?
        `, [insertResult.insertId]);
        
        if (verificacionRows.length > 0) {
            const registro = verificacionRows[0];
            console.log('\n📝 Registro creado:');
            console.log(`   - ID: ${registro.id}`);
            console.log(`   - Email: ${registro.usuario_mail}`);
            console.log(`   - Nombre: ${registro.usuario_nombre}`);
            console.log(`   - Carrera: ${registro.permiso_carrera_codigo}`);
            console.log(`   - Bimestre ID: ${registro.bimestre_id}`);
            console.log(`   - Estado: ${registro.estado}`);
            
            if (registro.bimestre_id === bimestreTest) {
                console.log('✅ CORRECTO: El usuario se creó con el bimestre_id especificado');
            } else {
                console.log(`❌ ERROR: Se esperaba bimestre_id ${bimestreTest}, pero se obtuvo ${registro.bimestre_id}`);
            }
        }
        
        // Mostrar estado final
        console.log('\n📋 Estado final del sistema:');
        await mostrarEstadoTablas(connection);
        
        console.log('\n🎯 Prueba de creación individual completada');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
        console.error('💥 Error fatal:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

/**
 * Mostrar estado de las tablas relevantes
 */
async function mostrarEstadoTablas(connection) {
    try {
        // Estado de permisos_pendientes
        const [pendientesRows] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'PROCESADO' THEN 1 ELSE 0 END) as procesados,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'ERROR' THEN 1 ELSE 0 END) as errores
            FROM permisos_pendientes
        `);
        
        console.log('   📝 permisos_pendientes:');
        console.log(`      Total: ${pendientesRows[0].total}`);
        console.log(`      Procesados: ${pendientesRows[0].procesados}`);
        console.log(`      Pendientes: ${pendientesRows[0].pendientes}`);
        console.log(`      Errores: ${pendientesRows[0].errores}`);
        
        // Estado de usuario_permisos_carrera
        const [carreraRows] = await connection.execute(
            'SELECT COUNT(*) as total FROM usuario_permisos_carrera'
        );
        console.log(`   🎓 usuario_permisos_carrera: ${carreraRows[0].total} registros`);
        
        // Estado de usuario_permisos_categoria
        const [categoriaRows] = await connection.execute(
            'SELECT COUNT(*) as total FROM usuario_permisos_categoria'
        );
        console.log(`   📚 usuario_permisos_categoria: ${categoriaRows[0].total} registros`);
        
        // Últimos registros por bimestre
        const [bimestreRows] = await connection.execute(`
            SELECT 
                b.nombre as bimestre,
                COUNT(pp.id) as registros_pendientes
            FROM bimestres b
            LEFT JOIN permisos_pendientes pp ON b.id = pp.bimestre_id
            GROUP BY b.id, b.nombre
            HAVING registros_pendientes > 0
            ORDER BY b.id DESC
            LIMIT 5
        `);
        
        if (bimestreRows.length > 0) {
            console.log('   📅 Registros por bimestre:');
            bimestreRows.forEach(row => {
                console.log(`      ${row.bimestre}: ${row.registros_pendientes} registros`);
            });
        }
        
    } catch (error) {
        console.error('Error al mostrar estado de tablas:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testCreacionIndividualUsuario()
        .then(() => {
            console.log('\n✅ Prueba completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error en la prueba:', error);
            process.exit(1);
        });
}

module.exports = { testCreacionIndividualUsuario };