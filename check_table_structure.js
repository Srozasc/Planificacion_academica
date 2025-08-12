const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function checkTableStructure() {
  let connection;
  
  try {
    console.log('🔍 Verificando estructura de la tabla staging_dol...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'planificacion_academica',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('🔗 Configuración de conexión:');
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`Database: ${process.env.DB_DATABASE || 'planificacion_academica'}`);
    console.log(`User: ${process.env.DB_USERNAME || 'root'}`);
    
    console.log('✅ Conexión establecida');

    // Verificar estructura de la tabla
    console.log('\n📋 Estructura de la tabla staging_dol:');
    const [structure] = await connection.query('DESCRIBE staging_dol');
    console.table(structure);

    // Verificar índices y claves
    console.log('\n🔑 Índices de la tabla staging_dol:');
    const [indexes] = await connection.query('SHOW INDEX FROM staging_dol');
    console.table(indexes.map(idx => ({
      Key_name: idx.Key_name,
      Column_name: idx.Column_name,
      Seq_in_index: idx.Seq_in_index,
      Non_unique: idx.Non_unique
    })));

    // Verificar la definición completa de la tabla
    console.log('\n🏗️ Definición completa de la tabla:');
    const [createTable] = await connection.query('SHOW CREATE TABLE staging_dol');
    console.log(createTable[0]['Create Table']);
    
    // Verificar datos actuales
    console.log('\n📊 Datos actuales en staging_dol:');
    const [data] = await connection.query('SELECT * FROM staging_dol ORDER BY sigla, plan');
    console.table(data);

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

checkTableStructure();