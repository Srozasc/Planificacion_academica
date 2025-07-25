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
 * Script para probar la carga de usuarios con datos de ejemplo
 */
async function testCargaUsuarios() {
    let connection;
    
    try {
        console.log('🧪 Iniciando prueba de carga de usuarios...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Obtener el bimestre activo
        const [bimestreRows] = await connection.execute(
            'SELECT id FROM bimestres WHERE activo = 1 LIMIT 1'
        );
        
        if (bimestreRows.length === 0) {
            throw new Error('No se encontró un bimestre activo en la base de datos');
        }
        
        const bimestreId = bimestreRows[0].id;
        console.log(`📅 Usando bimestre activo ID: ${bimestreId}`);
        
        // Obtener carreras disponibles
        const [carreras] = await connection.execute('SELECT codigo_plan, nombre_carrera FROM carreras WHERE activo = TRUE LIMIT 3');
        
        if (carreras.length === 0) {
            throw new Error('No hay carreras disponibles. Ejecuta load_plans.js primero.');
        }
        
        console.log('🎓 Carreras disponibles:');
        carreras.forEach(c => {
            console.log(`   - ${c.codigo_plan}: ${c.nombre_carrera}`);
        });
        
        // Crear usuarios de prueba
        const usuariosPrueba = [
            {
                mail: 'test.editor@duoc.cl',
                nombre: 'Editor de Prueba',
                cargo: 'Coordinador',
                carrera: carreras[0].codigo_plan,
                tipo_rol: 'Editor',
                categoria: null,
                expiracion: null
            },
            {
                mail: 'test.visualizador@duoc.cl',
                nombre: 'Visualizador de Prueba',
                cargo: 'Docente',
                carrera: carreras[1].codigo_plan,
                tipo_rol: 'Visualizador',
                categoria: null,
                expiracion: null
            },
            {
                mail: 'test.categoria@duoc.cl',
                nombre: 'Usuario Categoría TRAN',
                cargo: 'Coordinador',
                carrera: null,
                tipo_rol: 'Editor',
                categoria: 'TRAN',
                expiracion: null
            }
        ];
        
        console.log('\n👥 Insertando usuarios de prueba en permisos_pendientes...');
        
        for (const usuario of usuariosPrueba) {
            await connection.execute(`
                INSERT INTO permisos_pendientes (
                    usuario_mail, 
                    usuario_nombre, 
                    cargo, 
                    permiso_carrera_codigo, 
                    tipo_rol, 
                    permiso_categoria, 
                    fecha_expiracion, 
                    bimestre_id,
                    estado
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')
            `, [
                usuario.mail,
                usuario.nombre,
                usuario.cargo,
                usuario.carrera,
                usuario.tipo_rol,
                usuario.categoria,
                usuario.expiracion,
                bimestreId
            ]);
            
            console.log(`   ✅ ${usuario.mail} - ${usuario.tipo_rol}`);
        }
        
        console.log('\n🔄 Ejecutando resolución de permisos...');
        
        // Ejecutar resolución de permisos
        const { spawn } = require('child_process');
        
        await new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, 'resolve_permissions.js');
            const proceso = spawn('node', [scriptPath], {
                stdio: 'inherit',
                cwd: __dirname
            });
            
            proceso.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Resolución de permisos completada');
                    resolve();
                } else {
                    console.error(`❌ Error en resolución de permisos (código: ${code})`);
                    reject(new Error(`Proceso terminó con código ${code}`));
                }
            });
            
            proceso.on('error', (error) => {
                console.error('❌ Error ejecutando resolución de permisos:', error.message);
                reject(error);
            });
        });
        
        // Verificar resultados
        console.log('\n📊 Verificando resultados...');
        
        const [pendientes] = await connection.execute('SELECT COUNT(*) as total FROM permisos_pendientes WHERE estado = "PROCESADO"');
        const [carreraPermisos] = await connection.execute('SELECT COUNT(*) as total FROM usuario_permisos_carrera');
        const [categoriaPermisos] = await connection.execute('SELECT COUNT(*) as total FROM usuario_permisos_categoria');
        
        console.log(`   ✅ Registros procesados: ${pendientes[0].total}`);
        console.log(`   🎓 Permisos por carrera: ${carreraPermisos[0].total}`);
        console.log(`   📚 Permisos por categoría: ${categoriaPermisos[0].total}`);
        
        if (carreraPermisos[0].total > 0 || categoriaPermisos[0].total > 0) {
            console.log('\n🎉 ¡Prueba exitosa! Los permisos se están procesando correctamente.');
        } else {
            console.log('\n⚠️  Los permisos no se procesaron. Revisar logs de resolve_permissions.js');
        }
        
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

// Ejecutar prueba
if (require.main === module) {
    testCargaUsuarios()
        .then(() => {
            console.log('\n✅ Prueba completada exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { testCargaUsuarios };