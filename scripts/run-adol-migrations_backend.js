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

async function runAdolMigrations() {
    let connection;
    
    try {
        console.log('🔗 Conectando a la base de datos...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida exitosamente');
        
        // Lista de migraciones a ejecutar
        const migrations = [
            '020-create-adol-permanente-table.sql',
            '021-create-sp-migrate-adol.sql'
        ];
        
        console.log('\n🚀 Ejecutando migraciones de ADOL...');
        
        for (const migration of migrations) {
            const migrationPath = path.join(__dirname, 'database', 'migrations', migration);
            
            if (!fs.existsSync(migrationPath)) {
                console.log(`⚠️ Archivo no encontrado: ${migration}`);
                continue;
            }
            
            console.log(`\n📄 Ejecutando: ${migration}`);
            
            try {
                const sql = fs.readFileSync(migrationPath, 'utf8');
                
                // Dividir por punto y coma para ejecutar múltiples statements
                const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        // Usar query() en lugar de execute() para evitar problemas con prepared statements
                        await connection.query(statement);
                    }
                }
                
                console.log(`   ✅ ${migration} ejecutada exitosamente`);
            } catch (error) {
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
                    console.log(`   ⚠️ ${migration} ya fue aplicada anteriormente`);
                } else {
                    throw error;
                }
            }
        }
        
        console.log('\n🔍 Verificando tablas creadas...');
        
        // Verificar tabla adol_aprobados
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_COMMENT
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'adol_aprobados'
        `, [dbConfig.database]);
        
        if (tables.length > 0) {
            console.log('\n📋 Tabla ADOL creada:');
            console.log(`   ✅ ${tables[0].TABLE_NAME}`);
        }
        
        // Verificar procedimiento almacenado
        const [procedures] = await connection.execute(`
            SELECT ROUTINE_NAME
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_SCHEMA = ? AND ROUTINE_NAME = 'sp_migrate_staging_adol_to_aprobados'
        `, [dbConfig.database]);
        
        if (procedures.length > 0) {
            console.log('\n🔧 Procedimiento almacenado creado:');
            console.log(`   ✅ ${procedures[0].ROUTINE_NAME}`);
        }
        
        console.log('\n🎉 Migraciones de ADOL completadas exitosamente');
        
    } catch (error) {
        console.error('\n❌ Error ejecutando migraciones:', error.message);
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

// Ejecutar migraciones
runAdolMigrations();