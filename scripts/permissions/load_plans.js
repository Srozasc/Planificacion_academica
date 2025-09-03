const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno desde el backend usando ruta absoluta
const envPath = path.resolve(process.cwd(), 'backend', '.env');
console.log('🔍 Intentando cargar .env desde:', envPath);

if (fs.existsSync(envPath)) {
    require('dotenv').config();
    console.log('✅ Archivo .env cargado exitosamente');
} else {
    console.log('⚠️  Archivo .env no encontrado, usando variables de entorno del sistema');
    console.log('📂 Directorio de trabajo actual:', process.cwd());
    console.log('📁 Directorio del script:', __dirname);
}

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'planificacion_academica',
    charset: 'utf8mb4'
};

/**
 * Script para cargar planes de estudio desde staging_estructura_academica
 * Sincroniza carreras y asignaturas desde la tabla staging hacia las tablas finales
 */
async function loadPlans() {
    let connection;
    
    try {
        console.log('🚀 Iniciando carga de planes de estudio desde staging_estructura_academica...');
        
        // Conectar a la base de datos
        console.log('🔗 Configuración de base de datos:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            charset: dbConfig.charset
        });
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Obtener datos desde staging_estructura_academica
        const [data] = await connection.execute(`
            SELECT DISTINCT 
                plan as codigo_plan,
                carrera as nombre_carrera,
                sigla,
                asignatura as nombre,
                creditos,
                categoria,
                id_bimestre
            FROM staging_estructura_academica 
            WHERE plan IS NOT NULL 
            AND sigla IS NOT NULL
            AND id_bimestre IS NOT NULL
            ORDER BY plan, sigla
        `);
        
        console.log(`📊 Registros encontrados en staging: ${data.length}`);
        
        if (data.length === 0) {
            console.log('ℹ️  No hay datos en staging_estructura_academica para procesar');
            return;
        }

        
        // Paso 1: Sincronizar Carreras
        console.log('\n📚 Paso 1: Sincronizando carreras...');
        await syncCarreras(connection, data);
        
        // Paso 2: Sincronizar Asignaturas
        console.log('\n📖 Paso 2: Sincronizando asignaturas...');
        await syncAsignaturas(connection, data);
        
        console.log('\n✅ Carga de planes completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en carga de planes:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión a base de datos cerrada');
        }
    }
}

/**
 * Sincronizar carreras únicas del archivo con la base de datos
 */
async function syncCarreras(connection, data) {
    // Extraer carreras únicas (incluyendo bimestre)
    const carrerasUnicas = new Map();
    
    for (const fila of data) {
        const key = `${fila.codigo_plan}_${fila.id_bimestre}`;
        if (fila.codigo_plan && fila.id_bimestre && !carrerasUnicas.has(key)) {
            carrerasUnicas.set(key, {
                codigo_plan: fila.codigo_plan,
                nombre_carrera: fila.nombre_carrera || `Carrera ${fila.codigo_plan}`,
                bimestre_id: fila.id_bimestre
            });
        }
    }
    
    console.log(`   📋 Carreras únicas encontradas: ${carrerasUnicas.size}`);
    
    let carrerasCreadas = 0;
    let carrerasActualizadas = 0;
    
    // Sincronizar cada carrera
    for (const [codigo, carrera] of carrerasUnicas) {
        try {
            const [result] = await connection.execute(`
                INSERT INTO carreras (codigo_plan, nombre_carrera, bimestre_id) 
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    nombre_carrera = VALUES(nombre_carrera),
                    activo = TRUE
            `, [carrera.codigo_plan, carrera.nombre_carrera, carrera.bimestre_id]);
            
            if (result.insertId > 0) {
                carrerasCreadas++;
            } else {
                carrerasActualizadas++;
            }
            
        } catch (error) {
            console.error(`   ⚠️  Error procesando carrera ${codigo}:`, error.message);
        }
    }
    
    console.log(`   ✅ Carreras creadas: ${carrerasCreadas}`);
    console.log(`   🔄 Carreras actualizadas: ${carrerasActualizadas}`);
}

/**
 * Sincronizar asignaturas del archivo con la base de datos
 */
async function syncAsignaturas(connection, data) {
    // Obtener mapa de carreras existentes (incluyendo bimestre)
    const [carrerasRows] = await connection.execute('SELECT id, codigo_plan, bimestre_id FROM carreras WHERE activo = TRUE');
    const carrerasMap = new Map();
    
    for (const row of carrerasRows) {
        const key = `${row.codigo_plan}_${row.bimestre_id}`;
        carrerasMap.set(key, row.id);
    }
    
    console.log(`   🗂️  Carreras disponibles: ${carrerasMap.size}`);
    
    let asignaturasCreadas = 0;
    let asignaturasActualizadas = 0;
    let asignaturasError = 0;
    
    // Procesar cada asignatura
    for (const fila of data) {
        try {
            const carreraKey = `${fila.codigo_plan}_${fila.id_bimestre}`;
            const carreraId = carrerasMap.get(carreraKey);
            
            if (!carreraId) {
                console.error(`   ⚠️  Carrera no encontrada: ${fila.codigo_plan} (bimestre: ${fila.id_bimestre})`);
                asignaturasError++;
                continue;
            }
            
            if (!fila.sigla) {
                console.error(`   ⚠️  Sigla faltante en fila:`, fila);
                asignaturasError++;
                continue;
            }
            
            const [result] = await connection.execute(`
                INSERT INTO asignaturas 
                (carrera_id, sigla, nombre, creditos, categoria_asignatura, bimestre_id) 
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    nombre = VALUES(nombre),
                    creditos = VALUES(creditos),
                    categoria_asignatura = VALUES(categoria_asignatura),
                    activo = TRUE
            `, [
                carreraId,
                fila.sigla,
                fila.nombre || fila.sigla,
                fila.creditos || null,
                fila.categoria || fila.categoria_asignatura || null,
                fila.id_bimestre
            ]);
            
            if (result.insertId > 0) {
                asignaturasCreadas++;
            } else {
                asignaturasActualizadas++;
            }
            
        } catch (error) {
            console.error(`   ⚠️  Error procesando asignatura ${fila.sigla}:`, error.message);
            asignaturasError++;
        }
    }
    
    console.log(`   ✅ Asignaturas creadas: ${asignaturasCreadas}`);
    console.log(`   🔄 Asignaturas actualizadas: ${asignaturasActualizadas}`);
    console.log(`   ❌ Asignaturas con error: ${asignaturasError}`);
}

// NOTA: La función ejecutarResolucionPermisos() fue removida para separar responsabilidades.
// Para resolver permisos, ejecutar directamente: node resolve_permissions.js
// o usar el backend que maneja ambos procesos de forma independiente.

// Ejecutar si se llama directamente
if (require.main === module) {
    loadPlans()
        .then(() => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { loadPlans };