const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script de configuración inicial para los scripts de permisos
 */
async function setup() {
    console.log('🚀 Iniciando configuración de scripts de permisos...');
    
    try {
        // 1. Verificar Node.js
        console.log('\n📋 Verificando requisitos...');
        const nodeVersion = process.version;
        console.log(`   ✅ Node.js: ${nodeVersion}`);
        
        if (parseInt(nodeVersion.slice(1)) < 14) {
            throw new Error('Se requiere Node.js 14 o superior');
        }
        
        // 2. Instalar dependencias
        console.log('\n📦 Instalando dependencias...');
        try {
            execSync('npm install', { stdio: 'inherit', cwd: __dirname });
            console.log('   ✅ Dependencias instaladas correctamente');
        } catch (error) {
            throw new Error('Error instalando dependencias: ' + error.message);
        }
        
        // 3. Verificar estructura de directorios
        console.log('\n📁 Verificando estructura de directorios...');
        const directorios = [
            path.join(__dirname, 'ejemplos'),
            path.join(__dirname, 'logs')
        ];
        
        for (const dir of directorios) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`   📂 Creado: ${path.relative(__dirname, dir)}`);
            } else {
                console.log(`   ✅ Existe: ${path.relative(__dirname, dir)}`);
            }
        }
        
        // 4. Crear archivo de configuración de ejemplo
        console.log('\n⚙️  Creando archivo de configuración...');
        const configPath = path.join(__dirname, '.env.example');
        const configContent = `# Configuración de Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=planificacion_academica

# Configuración de Logs
LOG_LEVEL=info
LOG_FILE=logs/permissions.log
`;
        
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, configContent);
            console.log('   ✅ Archivo .env.example creado');
        } else {
            console.log('   ✅ Archivo .env.example ya existe');
        }
        
        // 5. Verificar archivos principales
        console.log('\n📄 Verificando archivos principales...');
        const archivos = [
            'load_users.js',
            'load_plans.js',
            'resolve_permissions.js',
            'package.json'
        ];
        
        for (const archivo of archivos) {
            const rutaArchivo = path.join(__dirname, archivo);
            if (fs.existsSync(rutaArchivo)) {
                console.log(`   ✅ ${archivo}`);
            } else {
                console.log(`   ❌ ${archivo} - FALTANTE`);
            }
        }
        
        // 6. Mostrar instrucciones finales
        console.log('\n🎉 Configuración completada exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Copiar .env.example a .env y configurar credenciales de BD');
        console.log('   2. Ejecutar las migraciones de base de datos (014-create-permissions-tables.sql)');
        console.log('   3. Preparar archivos de entrada según ejemplos en /ejemplos/');
        console.log('   4. Ejecutar carga de planes: node load_plans.js archivo_planes.xlsx');
        console.log('   5. Ejecutar carga de usuarios: node load_users.js archivo_usuarios.xlsx');
        
        console.log('\n📚 Documentación disponible en README.md');
        
    } catch (error) {
        console.error('\n❌ Error en configuración:', error.message);
        process.exit(1);
    }
}

/**
 * Verificar estado del sistema
 */
async function checkStatus() {
    console.log('🔍 Verificando estado del sistema...');
    
    try {
        // Verificar dependencias
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
        const nodeModules = path.join(__dirname, 'node_modules');
        
        console.log('\n📦 Dependencias:');
        for (const [dep, version] of Object.entries(packageJson.dependencies)) {
            const depPath = path.join(nodeModules, dep);
            if (fs.existsSync(depPath)) {
                console.log(`   ✅ ${dep}@${version}`);
            } else {
                console.log(`   ❌ ${dep}@${version} - NO INSTALADO`);
            }
        }
        
        // Verificar configuración
        console.log('\n⚙️  Configuración:');
        const envFile = path.join(__dirname, '.env');
        if (fs.existsSync(envFile)) {
            console.log('   ✅ Archivo .env encontrado');
        } else {
            console.log('   ⚠️  Archivo .env no encontrado (usando valores por defecto)');
        }
        
        // Verificar permisos de escritura
        console.log('\n📝 Permisos:');
        try {
            const testFile = path.join(__dirname, 'test_write.tmp');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            console.log('   ✅ Permisos de escritura OK');
        } catch (error) {
            console.log('   ❌ Sin permisos de escritura');
        }
        
        console.log('\n✅ Verificación completada');
        
    } catch (error) {
        console.error('\n❌ Error en verificación:', error.message);
    }
}

// Ejecutar según argumentos
const comando = process.argv[2];

switch (comando) {
    case 'check':
    case 'status':
        checkStatus();
        break;
    case 'setup':
    case undefined:
        setup();
        break;
    default:
        console.log('Uso: node setup.js [setup|check]');
        console.log('  setup - Configuración inicial (por defecto)');
        console.log('  check - Verificar estado del sistema');
        process.exit(1);
}

module.exports = { setup, checkStatus };