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
    charset: 'utf8mb4',
    multipleStatements: true
};

async function createAdolStoredProcedure() {
    let connection;
    
    try {
        console.log('🔗 Conectando a la base de datos...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida exitosamente');
        
        console.log('\n🗑️ Eliminando procedimiento existente...');
        await connection.query('DROP PROCEDURE IF EXISTS sp_migrate_staging_adol_to_aprobados');
        console.log('✅ Procedimiento eliminado (si existía)');
        
        console.log('\n🔧 Creando procedimiento almacenado...');
        
        const createProcedureSQL = `
CREATE PROCEDURE sp_migrate_staging_adol_to_aprobados(
    IN p_aprobado_por VARCHAR(255)
)
BEGIN
    DECLARE v_affected_rows INT DEFAULT 0;

    -- Migrar datos de staging_adol_simple a adol_aprobados
    INSERT INTO adol_aprobados (
        sigla,
        descripcion,
        id_bimestre,
        aprobado_por,
        fecha_aprobacion,
        fecha_creacion,
        fecha_actualizacion,
        activo
    )
    SELECT
        s.SIGLA,
        s.DESCRIPCION,
        s.id_bimestre,
        COALESCE(p_aprobado_por, 'SISTEMA'),
        NOW(),
        NOW(),
        NOW(),
        1
    FROM staging_adol_simple s
    WHERE s.SIGLA IS NOT NULL AND s.SIGLA != ''
      AND s.DESCRIPCION IS NOT NULL AND s.DESCRIPCION != ''
      AND s.id_bimestre IS NOT NULL
    ON DUPLICATE KEY UPDATE
        descripcion = VALUES(descripcion),
        fecha_aprobacion = NOW(),
        aprobado_por = COALESCE(p_aprobado_por, 'SISTEMA'),
        fecha_actualizacion = NOW(),
        activo = 1;

    -- Obtener el número de filas afectadas
    SET v_affected_rows = ROW_COUNT();

    -- Retornar resultado
    SELECT 
        'SUCCESS' as status,
        v_affected_rows as affected_rows,
        CONCAT('Migración ADOL completada exitosamente. Registros procesados: ', v_affected_rows) as message;

END`;
        
        await connection.query(createProcedureSQL);
        console.log('✅ Procedimiento almacenado creado exitosamente');
        
        console.log('\n🔍 Verificando procedimiento creado...');
        
        // Verificar procedimiento almacenado
        const [procedures] = await connection.query(`
            SELECT ROUTINE_NAME, ROUTINE_TYPE
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'sp_migrate_staging_adol_to_aprobados'
        `, [dbConfig.database]);
        
        if (procedures.length > 0) {
            console.log('\n🎉 Procedimiento almacenado verificado:');
            console.log(`   ✅ ${procedures[0].ROUTINE_NAME} (${procedures[0].ROUTINE_TYPE})`);
        } else {
            console.log('\n⚠️ No se pudo verificar el procedimiento almacenado');
        }
        
        console.log('\n🎉 Creación del procedimiento ADOL completada exitosamente');
        
    } catch (error) {
        console.error('\n❌ Error creando procedimiento:', error.message);
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

// Ejecutar creación del procedimiento
createAdolStoredProcedure();