const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
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

// Cache de roles - se carga dinámicamente desde la base de datos
let ROLES_CACHE = null;

/**
 * Cargar roles dinámicamente desde la base de datos
 */
async function cargarRoles(connection) {
    if (ROLES_CACHE) {
        return ROLES_CACHE;
    }
    
    const [roles] = await connection.execute('SELECT id, name FROM roles WHERE is_active = TRUE');
    
    ROLES_CACHE = {};
    for (const rol of roles) {
        ROLES_CACHE[rol.name] = rol.id;
        // Agregar alias para compatibilidad
        if (rol.name === 'Editor') {
            ROLES_CACHE['Editor temporal'] = rol.id;
        }
    }
    
    console.log('🔑 Roles cargados:', ROLES_CACHE);
    return ROLES_CACHE;
}

/**
 * Script para resolver permisos pendientes
 * Procesa registros en estado 'PENDIENTE' y crea usuarios y permisos reales
 */
async function resolvePermissions() {
    const lockFile = acquireLock();
    if (!lockFile) {
        console.log('⏳ Proceso ya en ejecución, saltando...');
        return;
    }
    
    let connection;
    
    try {
        console.log('🚀 Iniciando resolución de permisos...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Obtener registros pendientes
        const registrosPendientes = await obtenerRegistrosPendientes(connection);
        
        if (registrosPendientes.length === 0) {
            console.log('ℹ️  No hay registros pendientes para procesar');
            return;
        }
        
        console.log(`📊 Registros pendientes encontrados: ${registrosPendientes.length}`);
        
        // Crear caches para optimizar consultas
        const caches = await crearCaches(connection);
        
        // Procesar cada registro
        const stats = {
            procesados: 0,
            errores: 0,
            usuariosCreados: 0,
            usuariosActualizados: 0,
            permisosCarrera: 0,
            permisosCategoria: 0
        };
        
        for (const registro of registrosPendientes) {
            try {
                await procesarRegistro(connection, registro, caches, stats);
                stats.procesados++;
                
                if (stats.procesados % 50 === 0) {
                    console.log(`   📊 Procesados: ${stats.procesados}/${registrosPendientes.length}`);
                }
                
            } catch (error) {
                console.error(`   ⚠️  Error procesando registro ${registro.id}:`, error.message);
                await marcarError(connection, registro.id, error.message);
                stats.errores++;
            }
        }
        
        // Mostrar estadísticas finales
        console.log('\n📈 Estadísticas de procesamiento:');
        console.log(`   ✅ Registros procesados: ${stats.procesados}`);
        console.log(`   ❌ Registros con error: ${stats.errores}`);
        console.log(`   👤 Usuarios creados: ${stats.usuariosCreados}`);
        console.log(`   🔄 Usuarios actualizados: ${stats.usuariosActualizados}`);
        console.log(`   🎓 Permisos por carrera: ${stats.permisosCarrera}`);
        console.log(`   📚 Permisos por categoría: ${stats.permisosCategoria}`);
        
        console.log('\n✅ Resolución de permisos completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en resolución de permisos:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión a base de datos cerrada');
        }
        releaseLock(lockFile);
    }
}

/**
 * Adquirir lock para evitar ejecuciones concurrentes
 */
function acquireLock() {
    const lockFile = path.join(process.cwd(), 'resolve_permissions.lock');
    
    try {
        // Verificar si el lock ya existe
        if (fs.existsSync(lockFile)) {
            const stats = fs.statSync(lockFile);
            const now = new Date();
            const lockAge = now - stats.mtime;
            
            // Si el lock tiene más de 30 minutos, considerarlo stale
            if (lockAge > 30 * 60 * 1000) {
                fs.unlinkSync(lockFile);
            } else {
                return null;
            }
        }
        
        // Crear el lock
        fs.writeFileSync(lockFile, process.pid.toString());
        return lockFile;
        
    } catch (error) {
        return null;
    }
}

/**
 * Liberar lock
 */
function releaseLock(lockFile) {
    if (lockFile && fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
    }
}

/**
 * Obtener registros pendientes de procesar
 */
async function obtenerRegistrosPendientes(connection) {
    const [rows] = await connection.execute(`
        SELECT id, usuario_mail, usuario_nombre, cargo, 
               permiso_carrera_codigo, tipo_rol, permiso_categoria, 
               fecha_expiracion, bimestre_id
        FROM permisos_pendientes 
        WHERE estado = 'PENDIENTE' 
        ORDER BY fecha_creacion 
        LIMIT 500
    `);
    
    return rows;
}

/**
 * Crear caches para optimizar consultas
 */
async function crearCaches(connection) {
    console.log('🗂️  Creando caches...');
    
    // Cache de usuarios existentes
    const usuariosCache = new Map();
    const [usuarios] = await connection.execute('SELECT id, email_institucional FROM users');
    for (const usuario of usuarios) {
        usuariosCache.set(usuario.email_institucional.toLowerCase(), usuario.id);
    }
    
    // Cache de carreras por bimestre (clave: "codigo_plan:bimestre_id")
    const carrerasCache = new Map();
    const [carreras] = await connection.execute('SELECT id, codigo_plan, bimestre_id FROM carreras WHERE activo = TRUE');
    for (const carrera of carreras) {
        const clave = `${carrera.codigo_plan}:${carrera.bimestre_id}`;
        carrerasCache.set(clave, carrera.id);
    }
    
    console.log(`   👥 Usuarios en cache: ${usuariosCache.size}`);
    console.log(`   🎓 Carreras en cache: ${carrerasCache.size}`);
    
    return { usuariosCache, carrerasCache };
}

/**
 * Procesar un registro individual
 */
async function procesarRegistro(connection, registro, caches, stats) {
    const { id: registroId, usuario_mail, usuario_nombre, cargo, 
            permiso_carrera_codigo, tipo_rol, permiso_categoria, fecha_expiracion, bimestre_id } = registro;
    
    // 1. Resolver Usuario
    const usuarioId = await resolverUsuario(connection, {
        email: usuario_mail.toLowerCase(),
        nombre: usuario_nombre,
        cargo,
        tipo_rol,
        fecha_expiracion
    }, caches.usuariosCache, stats);
    
    // 2. Crear permisos por carrera
    if (permiso_carrera_codigo) {
        await crearPermisoCarrera(connection, usuarioId, permiso_carrera_codigo, bimestre_id, caches.carrerasCache, stats);
    }
    
    // 3. Crear permisos por categoría
    if (permiso_categoria) {
        await crearPermisoCategoria(connection, usuarioId, permiso_categoria, bimestre_id, stats);
    }
    
    // 4. Marcar registro como procesado
    await marcarProcesado(connection, registroId);
}

/**
 * Resolver usuario (crear o actualizar)
 */
async function resolverUsuario(connection, userData, usuariosCache, stats) {
    const { email, nombre, cargo, tipo_rol, fecha_expiracion } = userData;
    
    // Obtener roles dinámicamente
    const roles = await cargarRoles(connection);
    
    // Determinar role_id
    const roleId = roles[tipo_rol] || roles['Visualizador'];
    
    // Procesar fecha de expiración para roles temporales
    let roleExpiresAt = null;
    if (fecha_expiracion) {
        roleExpiresAt = fecha_expiracion;
    }
    
    // Determinar previous_role_id para roles temporales
    let previousRoleId = null;
    if (fecha_expiracion) {
        const [visualizadorRole] = await connection.execute(
            'SELECT id FROM roles WHERE name = "Visualizador" LIMIT 1'
        );
        previousRoleId = visualizadorRole.length > 0 ? visualizadorRole[0].id : null;
    }
    
    if (usuariosCache.has(email)) {
        // Usuario existe, actualizar
        const usuarioId = usuariosCache.get(email);
        
        await connection.execute(`
            UPDATE users 
            SET name = COALESCE(?, name),
                role_id = ?,
                role_expires_at = ?,
                previous_role_id = ?,
                is_active = TRUE
            WHERE id = ?
        `, [nombre, roleId, roleExpiresAt, previousRoleId, usuarioId]);
        
        stats.usuariosActualizados++;
        return usuarioId;
        
    } else {
        // Usuario no existe, crear
        const [result] = await connection.execute(`
            INSERT INTO users (
                email_institucional, 
                name, 
                role_id, 
                role_expires_at, 
                previous_role_id,
                is_active,
                password_hash
            ) VALUES (?, ?, ?, ?, ?, TRUE, ?)
        `, [email, nombre || email, roleId, roleExpiresAt, previousRoleId, await bcrypt.hash('temporal123', 10)]);
        
        const usuarioId = result.insertId;
        usuariosCache.set(email, usuarioId);
        stats.usuariosCreados++;
        return usuarioId;
    }
}

/**
 * Crear permiso por carrera
 */
async function crearPermisoCarrera(connection, usuarioId, codigoCarrera, bimestreId, carrerasCache, stats) {
    // Buscar carrera específica para el bimestre
    const claveCarrera = `${codigoCarrera}:${bimestreId}`;
    const carreraId = carrerasCache.get(claveCarrera);
    
    if (!carreraId) {
        throw new Error(`Carrera no encontrada para bimestre: ${codigoCarrera} (bimestre_id: ${bimestreId})`);
    }
    
    await connection.execute(`
        INSERT INTO usuario_permisos_carrera (usuario_id, carrera_id, bimestre_id, activo)
        VALUES (?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE activo = TRUE
    `, [usuarioId, carreraId, bimestreId]);
    
    stats.permisosCarrera++;
}

/**
 * Crear permiso por categoría
 */
async function crearPermisoCategoria(connection, usuarioId, categoria, bimestreId, stats) {
    await connection.execute(`
        INSERT INTO usuario_permisos_categoria (usuario_id, categoria, bimestre_id, activo)
        VALUES (?, ?, ?, TRUE)
        ON DUPLICATE KEY UPDATE activo = TRUE
    `, [usuarioId, categoria, bimestreId]);
    
    stats.permisosCategoria++;
}

/**
 * Marcar registro como procesado
 */
async function marcarProcesado(connection, registroId) {
    await connection.execute(`
        UPDATE permisos_pendientes 
        SET estado = 'PROCESADO', 
            fecha_procesado = NOW()
        WHERE id = ?
    `, [registroId]);
}

/**
 * Marcar registro con error
 */
async function marcarError(connection, registroId, mensajeError) {
    await connection.execute(`
        UPDATE permisos_pendientes 
        SET estado = 'ERROR', 
            mensaje_error = ?,
            intentos_procesamiento = intentos_procesamiento + 1
        WHERE id = ?
    `, [mensajeError, registroId]);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    resolvePermissions()
        .then(() => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { resolvePermissions };