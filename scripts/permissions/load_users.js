const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

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
 * Script para cargar usuarios y permisos (Archivo A)
 * Procesa archivo Excel/CSV con información de usuarios y los inserta en permisos_pendientes
 */
async function loadUsers(filePath, bimestreId = null) {
    let connection;
    
    try {
        console.log('🚀 Iniciando carga de usuarios...');
        console.log(`📁 Archivo: ${filePath}`);
        if (bimestreId) {
            console.log(`📅 Bimestre ID especificado: ${bimestreId}`);
        }
        
        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`El archivo no existe: ${filePath}`);
        }
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión a base de datos establecida');
        
        // Leer archivo Excel
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`📊 Registros encontrados: ${data.length}`);
        
        if (data.length === 0) {
            throw new Error('El archivo está vacío o no tiene datos válidos');
        }
        
        // Validar estructura del archivo
        const requiredColumns = ['Mail', 'Nombre'];
        const optionalColumns = ['Usuario', 'Cargo', 'Carrera', 'Tipo de Rol', 'Categoria', 'Expiracion'];
        const firstRow = data[0];
        
        // Verificar columnas requeridas
        const missingRequired = requiredColumns.filter(col => !(col in firstRow));
        if (missingRequired.length > 0) {
            throw new Error(`Columnas requeridas faltantes: ${missingRequired.join(', ')}`);
        }
        
        console.log('📋 Estructura del archivo validada');
        
        // Procesar usuarios
        const stats = await processUsers(connection, data, bimestreId);
        
        console.log('\n📈 Estadísticas de procesamiento:');
        console.log(`   ✅ Registros procesados: ${stats.procesados}`);
        console.log(`   ❌ Registros con error: ${stats.errores}`);
        console.log(`   📧 Emails únicos: ${stats.emailsUnicos}`);
        
        console.log('\n✅ Carga de usuarios completada exitosamente');
        
        // Ejecutar resolución de permisos
        console.log('\n🔄 Iniciando resolución de permisos...');
        await ejecutarResolucionPermisos();
        
    } catch (error) {
        console.error('❌ Error en carga de usuarios:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión a base de datos cerrada');
        }
    }
}

/**
 * Procesar usuarios del archivo y insertarlos en permisos_pendientes
 */
async function processUsers(connection, data, bimestreId = null) {
    let procesados = 0;
    let errores = 0;
    const emailsUnicos = new Set();
    
    // Obtener el bimestre a usar
    let finalBimestreId;
    if (bimestreId) {
        // Verificar que el bimestre especificado existe
        const [bimestreRows] = await connection.execute(
            'SELECT id FROM bimestres WHERE id = ? LIMIT 1',
            [bimestreId]
        );
        
        if (bimestreRows.length === 0) {
            throw new Error(`No se encontró el bimestre con ID: ${bimestreId}`);
        }
        
        finalBimestreId = bimestreId;
        console.log(`📅 Usando bimestre especificado ID: ${finalBimestreId}`);
    } else {
        // Obtener el bimestre activo
        const [bimestreRows] = await connection.execute(
            'SELECT id FROM bimestres WHERE activo = 1 LIMIT 1'
        );
        
        if (bimestreRows.length === 0) {
            throw new Error('No se encontró un bimestre activo en la base de datos');
        }
        
        finalBimestreId = bimestreRows[0].id;
        console.log(`📅 Usando bimestre activo ID: ${finalBimestreId}`);
    }
    
    console.log('\n👥 Procesando usuarios...');
    
    for (let i = 0; i < data.length; i++) {
        const fila = data[i];
        
        try {
            // Validar email
            const email = fila.Mail || fila.mail || fila.EMAIL;
            if (!email || !isValidEmail(email)) {
                console.error(`   ⚠️  Fila ${i + 1}: Email inválido o faltante: ${email}`);
                errores++;
                continue;
            }
            
            emailsUnicos.add(email.toLowerCase());
            
            // Procesar fecha de expiración
            let fechaExpiracion = null;
            if (fila.Expiracion || fila.expiracion || fila.EXPIRACION) {
                fechaExpiracion = procesarFechaExpiracion(fila.Expiracion || fila.expiracion || fila.EXPIRACION);
            }
            
            // Insertar en permisos_pendientes
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
                email.toLowerCase(),
                fila.Nombre || fila.nombre || fila.NOMBRE || '',
                fila.Cargo || fila.cargo || fila.CARGO || null,
                fila.Carrera || fila.carrera || fila.CARRERA || null,
                fila['Tipo de Rol'] || fila.tipo_rol || fila.TIPO_ROL || null,
                fila.Categoria || fila.categoria || fila.CATEGORIA || null,
                fechaExpiracion,
                finalBimestreId
            ]);
            
            procesados++;
            
            if (procesados % 100 === 0) {
                console.log(`   📊 Procesados: ${procesados}/${data.length}`);
            }
            
        } catch (error) {
            console.error(`   ⚠️  Error en fila ${i + 1}:`, error.message);
            errores++;
        }
    }
    
    return {
        procesados,
        errores,
        emailsUnicos: emailsUnicos.size
    };
}

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Procesar fecha de expiración desde diferentes formatos
 */
function procesarFechaExpiracion(fechaStr) {
    if (!fechaStr) return null;
    
    try {
        // Si es un número (fecha de Excel)
        if (typeof fechaStr === 'number') {
            const fecha = xlsx.SSF.parse_date_code(fechaStr);
            return new Date(fecha.y, fecha.m - 1, fecha.d);
        }
        
        // Si es string, intentar varios formatos
        const str = fechaStr.toString().trim();
        
        // Formato DD-MM-YYYY
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
            const [dia, mes, año] = str.split('-');
            return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        }
        
        // Formato DD/MM/YYYY
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
            const [dia, mes, año] = str.split('/');
            return new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        }
        
        // Formato YYYY-MM-DD
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
            return new Date(str);
        }
        
        // Intentar parseo directo
        const fecha = new Date(str);
        if (!isNaN(fecha.getTime())) {
            return fecha;
        }
        
        console.warn(`   ⚠️  Formato de fecha no reconocido: ${fechaStr}`);
        return null;
        
    } catch (error) {
        console.warn(`   ⚠️  Error procesando fecha ${fechaStr}:`, error.message);
        return null;
    }
}

/**
 * Ejecutar el proceso de resolución de permisos
 */
async function ejecutarResolucionPermisos() {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
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
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    let filePath = null;
    let bimestreId = null;
    
    // Parsear argumentos
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--bimestre-id' && i + 1 < args.length) {
            bimestreId = parseInt(args[i + 1]);
            i++; // Saltar el siguiente argumento ya que es el valor
        } else if (!filePath) {
            filePath = args[i];
        }
    }
    
    if (!filePath) {
        console.error('❌ Uso: node load_users.js <ruta_archivo_excel> [--bimestre-id <id>]');
        console.error('   Ejemplo: node load_users.js ../uploads/usuarios.xlsx');
        console.error('   Ejemplo con bimestre: node load_users.js ../uploads/usuarios.xlsx --bimestre-id 5');
        process.exit(1);
    }
    
    if (bimestreId !== null && isNaN(bimestreId)) {
        console.error('❌ El bimestre_id debe ser un número válido');
        process.exit(1);
    }
    
    loadUsers(filePath, bimestreId)
        .then(() => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { loadUsers };