const mysql = require('mysql2/promise');

// Cargar variables de entorno
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planificacion_academica',
    charset: 'utf8mb4'
};

async function checkUploadLogsStructure() {
    let connection;
    
    try {
        console.log('🔗 Conectando a la base de datos...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida');
        
        console.log('\n📋 Estructura de la tabla upload_logs:');
        const [columns] = await connection.query('DESCRIBE upload_logs');
        
        columns.forEach(column => {
            console.log(`   ${column.Field} - ${column.Type} - ${column.Null} - ${column.Key} - ${column.Default}`);
        });
        
        console.log('\n📊 Datos existentes en upload_logs:');
        const [data] = await connection.query('SELECT * FROM upload_logs LIMIT 3');
        
        if (data.length > 0) {
            console.log('   Columnas disponibles:', Object.keys(data[0]).join(', '));
            data.forEach((row, index) => {
                console.log(`   Registro ${index + 1}:`, JSON.stringify(row, null, 2));
            });
        } else {
            console.log('   No hay datos en la tabla');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

checkUploadLogsStructure();