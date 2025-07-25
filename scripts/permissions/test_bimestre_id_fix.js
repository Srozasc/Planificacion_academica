const mysql = require('mysql2/promise');
const path = require('path');

// Cargar variables de entorno
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
 * Script para probar que el bimestreId se usa correctamente
 * sin fallback automático al bimestre activo
 */
async function testBimestreIdFix() {
    let connection;
    
    try {
        console.log('🧪 Iniciando prueba de corrección bimestreId...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // 1. Obtener información de bimestres disponibles
        console.log('\n📅 Bimestres disponibles:');
        const [bimestres] = await connection.execute(
            'SELECT id, nombre, activo FROM bimestres ORDER BY id'
        );
        
        bimestres.forEach(b => {
            console.log(`   ${b.activo ? '🟢' : '⚪'} ID:${b.id} - ${b.nombre}`);
        });
        
        // 2. Identificar bimestre activo actual
        const bimestreActivo = bimestres.find(b => b.activo === 1);
        console.log(`\n🎯 Bimestre activo actual: ID ${bimestreActivo.id} - ${bimestreActivo.nombre}`);
        
        // 3. Seleccionar un bimestre diferente para la prueba
        const bimestrePrueba = bimestres.find(b => b.id !== bimestreActivo.id);
        if (!bimestrePrueba) {
            throw new Error('No hay bimestres alternativos para la prueba');
        }
        
        console.log(`🧪 Bimestre para prueba: ID ${bimestrePrueba.id} - ${bimestrePrueba.nombre}`);
        
        // 4. Simular inserción en permisos_pendientes con bimestre específico
        const testEmail = `test_bimestre_${Date.now()}@test.com`;
        const testData = {
            usuario_mail: testEmail,
            usuario_nombre: 'Usuario Prueba Bimestre',
            cargo: 'Prueba',
            permiso_carrera_codigo: null,
            tipo_rol: 'Visualizador',
            permiso_categoria: 'GENERAL',
            fecha_expiracion: null,
            estado: 'PENDIENTE',
            bimestre_id: bimestrePrueba.id  // Usar bimestre específico
        };
        
        console.log(`\n📝 Insertando registro de prueba con bimestre_id: ${bimestrePrueba.id}`);
        
        const [insertResult] = await connection.execute(
            `INSERT INTO permisos_pendientes 
             (usuario_mail, usuario_nombre, cargo, permiso_carrera_codigo, tipo_rol, 
              permiso_categoria, fecha_expiracion, estado, bimestre_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                testData.usuario_mail,
                testData.usuario_nombre,
                testData.cargo,
                testData.permiso_carrera_codigo,
                testData.tipo_rol,
                testData.permiso_categoria,
                testData.fecha_expiracion,
                testData.estado,
                testData.bimestre_id
            ]
        );
        
        const insertedId = insertResult.insertId;
        console.log(`✅ Registro insertado con ID: ${insertedId}`);
        
        // 5. Verificar que se insertó con el bimestre correcto
        const [verifyResult] = await connection.execute(
            'SELECT id, usuario_mail, bimestre_id FROM permisos_pendientes WHERE id = ?',
            [insertedId]
        );
        
        if (verifyResult.length === 0) {
            throw new Error('No se encontró el registro insertado');
        }
        
        const insertedRecord = verifyResult[0];
        console.log(`\n🔍 Verificación del registro insertado:`);
        console.log(`   ID: ${insertedRecord.id}`);
        console.log(`   Email: ${insertedRecord.usuario_mail}`);
        console.log(`   Bimestre ID insertado: ${insertedRecord.bimestre_id}`);
        console.log(`   Bimestre ID esperado: ${bimestrePrueba.id}`);
        
        // 6. Validar resultado
        if (insertedRecord.bimestre_id === bimestrePrueba.id) {
            console.log('\n✅ PRUEBA EXITOSA: El bimestre_id se insertó correctamente');
            console.log('✅ La corrección funciona: no se usa fallback al bimestre activo');
        } else {
            console.log('\n❌ PRUEBA FALLIDA: El bimestre_id no coincide');
            console.log(`❌ Se esperaba: ${bimestrePrueba.id}, se obtuvo: ${insertedRecord.bimestre_id}`);
            
            if (insertedRecord.bimestre_id === bimestreActivo.id) {
                console.log('❌ ERROR: Se está usando el bimestre activo en lugar del especificado');
            }
        }
        
        // 7. Limpiar registro de prueba
        await connection.execute(
            'DELETE FROM permisos_pendientes WHERE id = ?',
            [insertedId]
        );
        console.log(`\n🧹 Registro de prueba eliminado (ID: ${insertedId})`);
        
    } catch (error) {
        console.error('❌ Error en prueba:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testBimestreIdFix()
        .then(() => {
            console.log('\n🎉 Prueba completada');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error en prueba:', error);
            process.exit(1);
        });
}

module.exports = { testBimestreIdFix };