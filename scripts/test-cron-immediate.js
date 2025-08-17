/**
 * Script para Testing Inmediato del Cron Job
 * 
 * Este script permite probar el cron job de limpieza modificando temporalmente
 * su programación para que se ejecute cada minuto durante las pruebas.
 * 
 * IMPORTANTE: Solo usar en ambiente de desarrollo/testing
 * 
 * Uso:
 * node scripts/test-cron-immediate.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const mysql = require('mysql2/promise');

class CronTester {
  constructor() {
    this.servicePath = path.join(__dirname, '../backend/src/modules/bimestres/bimestre-cleanup.service.ts');
    this.originalContent = null;
    this.connection = null;
    this.testRunning = false;
  }

  async init() {
    console.log('🚀 Iniciando Test de Cron Job Inmediato\n');
    
    // Verificar que estamos en desarrollo
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ ERROR: Este script NO debe ejecutarse en producción');
      process.exit(1);
    }
    
    try {
      // Conectar a la base de datos
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'planificacion_academica'
      });
      
      console.log('✅ Conexión a base de datos establecida');
      return true;
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error.message);
      return false;
    }
  }

  async backupServiceFile() {
    console.log('📦 Creando backup del archivo de servicio...');
    
    try {
      if (!fs.existsSync(this.servicePath)) {
        throw new Error('Archivo de servicio no encontrado');
      }
      
      this.originalContent = fs.readFileSync(this.servicePath, 'utf8');
      
      // Crear backup físico
      const backupPath = this.servicePath + '.backup';
      fs.writeFileSync(backupPath, this.originalContent);
      
      console.log('✅ Backup creado exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error creando backup:', error.message);
      return false;
    }
  }

  async modifyServiceForTesting() {
    console.log('🔧 Modificando servicio para testing inmediato...');
    
    try {
      let modifiedContent = this.originalContent;
      
      // Buscar y reemplazar la configuración del cron original
      const originalCronPattern = /@Cron\(['"](.*?)['"]\)/;
      const match = modifiedContent.match(originalCronPattern);
      
      if (match) {
        console.log(`📅 Configuración original encontrada: ${match[1]}`);
        
        // Reemplazar con configuración de testing (cada minuto)
        modifiedContent = modifiedContent.replace(
          originalCronPattern,
          "@Cron('*/1 * * * *') // TESTING: Cada minuto"
        );
        
        // Agregar método de testing específico
        const testMethod = `
  // MÉTODO AGREGADO PARA TESTING - REMOVER EN PRODUCCIÓN
  @Cron('*/1 * * * *')
  async executeTestCleanup() {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('Test cleanup bloqueado en producción');
      return;
    }
    
    this.logger.log('🧪 EJECUTANDO CLEANUP DE PRUEBA (cada minuto)');
    
    try {
      // Ejecutar con parámetros de testing
      await this.executeCleanup(5); // Mantener solo 5 bimestres para pruebas
      this.logger.log('✅ Cleanup de prueba completado exitosamente');
    } catch (error) {
      this.logger.error('❌ Error en cleanup de prueba:', error.message);
    }
  }
`;
        
        // Insertar el método antes del último }
        const lastBraceIndex = modifiedContent.lastIndexOf('}');
        modifiedContent = modifiedContent.slice(0, lastBraceIndex) + testMethod + modifiedContent.slice(lastBraceIndex);
        
        // Escribir archivo modificado
        fs.writeFileSync(this.servicePath, modifiedContent);
        
        console.log('✅ Servicio modificado para testing');
        console.log('⏰ Nuevo cron: Cada minuto (*/1 * * * *)');
        return true;
      } else {
        console.error('❌ No se encontró configuración de cron en el servicio');
        return false;
      }
    } catch (error) {
      console.error('❌ Error modificando servicio:', error.message);
      return false;
    }
  }

  async restoreServiceFile() {
    console.log('🔄 Restaurando archivo de servicio original...');
    
    try {
      if (this.originalContent) {
        fs.writeFileSync(this.servicePath, this.originalContent);
        console.log('✅ Archivo de servicio restaurado');
        
        // Eliminar backup
        const backupPath = this.servicePath + '.backup';
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
          console.log('🗑️ Archivo de backup eliminado');
        }
      }
    } catch (error) {
      console.error('❌ Error restaurando archivo:', error.message);
    }
  }

  async createTestData() {
    console.log('📊 Creando datos de prueba para el cron...');
    
    try {
      // Limpiar datos existentes
      await this.connection.execute('DELETE FROM bimestres');
      
      // Crear 8 bimestres (para que el cron mantenga 5 y elimine 3)
      const testData = [
        { nombre: 'Bimestre 2020-1', fecha: '2020-01-01' },
        { nombre: 'Bimestre 2020-2', fecha: '2020-03-01' },
        { nombre: 'Bimestre 2021-1', fecha: '2021-01-01' },
        { nombre: 'Bimestre 2021-2', fecha: '2021-03-01' },
        { nombre: 'Bimestre 2022-1', fecha: '2022-01-01' },
        { nombre: 'Bimestre 2022-2', fecha: '2022-03-01' },
        { nombre: 'Bimestre 2023-1', fecha: '2023-01-01' },
        { nombre: 'Bimestre 2023-2', fecha: '2023-03-01' }
      ];
      
      for (const data of testData) {
        await this.connection.execute(`
          INSERT INTO bimestres (nombre, fecha_inicio, fecha_fin, activo) 
          VALUES (?, ?, DATE_ADD(?, INTERVAL 2 MONTH), 0)
        `, [data.nombre, data.fecha, data.fecha]);
      }
      
      console.log(`✅ Creados ${testData.length} bimestres de prueba`);
      return true;
    } catch (error) {
      console.error('❌ Error creando datos de prueba:', error.message);
      return false;
    }
  }

  async restartBackend() {
    console.log('🔄 Reiniciando backend para aplicar cambios...');
    
    return new Promise((resolve) => {
      console.log('⚠️ INSTRUCCIÓN MANUAL:');
      console.log('   1. Detén el servidor backend (Ctrl+C en la terminal del backend)');
      console.log('   2. Ejecuta: npm run start:dev');
      console.log('   3. Espera a que el servidor inicie completamente');
      console.log('   4. Presiona ENTER aquí para continuar...');
      
      process.stdin.once('data', () => {
        console.log('✅ Continuando con el test...');
        resolve();
      });
    });
  }

  async monitorCronExecution() {
    console.log('👀 Monitoreando ejecución del cron job...');
    console.log('⏰ El cron debería ejecutarse cada minuto');
    console.log('📊 Monitoreando por 3 minutos...');
    
    const startTime = Date.now();
    const monitorDuration = 3 * 60 * 1000; // 3 minutos
    let executionCount = 0;
    
    const checkInterval = setInterval(async () => {
      try {
        // Verificar logs de cleanup
        const [logs] = await this.connection.execute(`
          SELECT * FROM cleanup_logs 
          WHERE execution_date >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
          ORDER BY execution_date DESC
        `);
        
        if (logs.length > executionCount) {
          const newExecutions = logs.length - executionCount;
          executionCount = logs.length;
          
          console.log(`\n🎯 Nueva ejecución detectada! (Total: ${executionCount})`);
          
          const lastLog = logs[0];
          console.log('📝 Último log:', {
            fecha: lastLog.execution_date,
            eliminados: lastLog.bimestres_eliminados,
            status: lastLog.status,
            error: lastLog.error_message || 'Ninguno'
          });
          
          // Verificar estado actual de bimestres
          const [count] = await this.connection.execute('SELECT COUNT(*) as total FROM bimestres');
          console.log(`📊 Bimestres actuales: ${count[0].total}`);
        }
        
        // Verificar si ha pasado el tiempo de monitoreo
        if (Date.now() - startTime >= monitorDuration) {
          clearInterval(checkInterval);
          this.finishMonitoring(executionCount);
        }
      } catch (error) {
        console.error('❌ Error monitoreando:', error.message);
      }
    }, 10000); // Verificar cada 10 segundos
    
    // Mensaje inicial
    console.log('\n⏳ Esperando primera ejecución del cron...');
    console.log('   (Si no ves actividad en 2 minutos, verifica que el backend esté ejecutándose)');
  }

  finishMonitoring(executionCount) {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADO DEL MONITOREO');
    console.log('='.repeat(50));
    
    if (executionCount > 0) {
      console.log(`✅ Cron job ejecutado ${executionCount} veces`);
      console.log('✅ El proceso automático está funcionando correctamente');
      
      console.log('\n💡 Próximos pasos:');
      console.log('   1. El archivo de servicio será restaurado automáticamente');
      console.log('   2. Reinicia el backend para aplicar la configuración original');
      console.log('   3. Verifica que la configuración vuelva a ser anual (0 2 1 1 *)');
    } else {
      console.log('❌ No se detectaron ejecuciones del cron job');
      console.log('\n🔍 Posibles causas:');
      console.log('   - El backend no está ejecutándose');
      console.log('   - Error en la configuración del cron');
      console.log('   - Problema con el servicio de cleanup');
      
      console.log('\n🛠️ Acciones recomendadas:');
      console.log('   1. Verificar logs del backend');
      console.log('   2. Comprobar que el servicio esté registrado');
      console.log('   3. Revisar configuración de la base de datos');
    }
    
    this.testRunning = false;
  }

  async cleanup() {
    console.log('\n🧹 Limpiando recursos...');
    
    // Restaurar archivo de servicio
    await this.restoreServiceFile();
    
    // Cerrar conexión de base de datos
    if (this.connection) {
      await this.connection.end();
    }
    
    console.log('✅ Limpieza completada');
  }

  // Manejar interrupción del usuario (Ctrl+C)
  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log('\n\n⚠️ Interrupción detectada. Limpiando...');
      this.testRunning = false;
      await this.cleanup();
      process.exit(0);
    });
  }

  async runTest() {
    this.setupGracefulShutdown();
    
    try {
      // Inicializar
      const connected = await this.init();
      if (!connected) return;
      
      // Crear backup del servicio
      const backupCreated = await this.backupServiceFile();
      if (!backupCreated) return;
      
      // Modificar servicio para testing
      const serviceModified = await this.modifyServiceForTesting();
      if (!serviceModified) {
        await this.restoreServiceFile();
        return;
      }
      
      // Crear datos de prueba
      await this.createTestData();
      
      // Instrucciones para reiniciar backend
      await this.restartBackend();
      
      // Monitorear ejecución
      this.testRunning = true;
      await this.monitorCronExecution();
      
      // Esperar a que termine el monitoreo
      while (this.testRunning) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error('❌ Error durante el test:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Ejecutar test si el script se ejecuta directamente
if (require.main === module) {
  console.log('⚠️ ADVERTENCIA: Este script modificará temporalmente el código del servicio');
  console.log('⚠️ Solo usar en ambiente de desarrollo/testing');
  console.log('⚠️ Asegúrate de tener backup de tu código');
  console.log('\n¿Continuar? (y/N): ');
  
  process.stdin.once('data', (data) => {
    const input = data.toString().trim().toLowerCase();
    
    if (input === 'y' || input === 'yes') {
      const tester = new CronTester();
      tester.runTest().catch(console.error);
    } else {
      console.log('Test cancelado por el usuario');
      process.exit(0);
    }
  });
}

module.exports = CronTester;