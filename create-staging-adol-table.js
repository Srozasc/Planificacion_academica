const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createStagingAdolTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'DuocAdmin123.',
        database: 'planificacion_academica'
    });

    try {
        console.log('Conectado a MySQL');
        
        // Leer el archivo SQL
        const sqlContent = fs.readFileSync(
            path.join(__dirname, 'create-staging-adol-simple.sql'), 
            'utf8'
        );
        
        // Dividir el contenido en declaraciones individuales
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('USE'));
        
        console.log(`Ejecutando ${statements.length} declaraciones SQL...`);
        
        // Ejecutar cada declaración
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                console.log(`Ejecutando declaración ${i + 1}: ${statement.substring(0, 50)}...`);
                try {
                    const [results] = await connection.execute(statement);
                    if (results && results.length > 0) {
                        console.log('Resultado:', results);
                    }
                } catch (error) {
                    console.error(`Error en declaración ${i + 1}:`, error.message);
                    console.error('Declaración:', statement);
                }
            }
        }
        
        // Verificar que la tabla fue creada
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'staging_adol_simple'"
        );
        
        if (tables.length > 0) {
            console.log('✅ Tabla staging_adol_simple creada exitosamente');
            
            // Mostrar estructura de la tabla
            const [structure] = await connection.execute(
                'DESCRIBE staging_adol_simple'
            );
            console.log('\n📋 Estructura de la tabla:');
            console.table(structure);
            
            // Mostrar índices
            const [indexes] = await connection.execute(
                'SHOW INDEX FROM staging_adol_simple'
            );
            console.log('\n🔍 Índices creados:');
            console.table(indexes.map(idx => ({
                Nombre: idx.Key_name,
                Columna: idx.Column_name,
                Unico: idx.Non_unique === 0 ? 'Sí' : 'No'
            })));
        } else {
            console.log('❌ Error: La tabla no fue creada');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
        console.log('Conexión cerrada');
    }
}

// Ejecutar la función
createStagingAdolTable().catch(console.error);