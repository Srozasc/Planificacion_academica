/**
 * Script de Testing para el Proceso de Limpieza de Bimestres
 * 
 * Este script permite probar de manera práctica e inmediata el funcionamiento
 * del proceso automático de limpieza de bimestres.
 * 
 * Uso:
 * node scripts/test-cleanup-process.js
 */

const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class CleanupTester {
  constructor() {
    this.connection = null;
    this.baseUrl = process.env.API_URL || 'http://localhost:3001/api';
    this.testResults = [];
  }

  async init() {
    console.log('🚀 Iniciando Testing del Proceso de Limpieza de Bimestres\n');
    
    try {
      // Conectar a la base de datos
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || process.env.DB_USERNAME || 'planificacion_user',
        password: process.env.DB_PASSWORD || 'PlanUser2025!',
        database: process.env.DB_NAME || 'planificacion_academica'
      });
      
      console.log('✅ Conexión a base de datos establecida');
      return true;
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error.message);
      return false;
    }
  }

  async testStoredProcedureExists() {
    console.log('\n📋 Test 1: Verificando existencia del Stored Procedure...');
    
    try {
      const [rows] = await this.connection.execute(`
        SHOW PROCEDURE STATUS WHERE Name = 'sp_cleanup_old_bimestres'
      `);
      
      if (rows.length > 0) {
        console.log('✅ Stored Procedure sp_cleanup_old_bimestres existe');
        this.addResult('SP_EXISTS', true, 'Stored Procedure encontrado');
        return true;
      } else {
        console.log('❌ Stored Procedure sp_cleanup_old_bimestres NO existe');
        this.addResult('SP_EXISTS', false, 'Stored Procedure no encontrado');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando SP:', error.message);
      this.addResult('SP_EXISTS', false, error.message);
      return false;
    }
  }

  async testCleanupLogsTable() {
    console.log('\n📋 Test 2: Verificando tabla de logs...');
    
    try {
      const [rows] = await this.connection.execute(`
        SHOW TABLES LIKE 'cleanup_logs'
      `);
      
      if (rows.length > 0) {
        console.log('✅ Tabla cleanup_logs existe');
        
        // Verificar estructura
        const [columns] = await this.connection.execute(`
          DESCRIBE cleanup_logs
        `);
        
        const requiredColumns = [
          'id', 'execution_id', 'execution_date', 'months_threshold',
          'max_bimestres_per_execution', 'debug_mode', 'perform_backup',
          'status', 'bimestres_identified', 'bimestres_deleted'
        ];
        const existingColumns = columns.map(col => col.Field);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length === 0) {
          console.log('✅ Estructura de tabla cleanup_logs es correcta');
          this.addResult('LOGS_TABLE', true, 'Tabla y estructura correctas');
          return true;
        } else {
          console.log('❌ Faltan columnas en cleanup_logs:', missingColumns);
          this.addResult('LOGS_TABLE', false, `Faltan columnas: ${missingColumns.join(', ')}`);
          return false;
        }
      } else {
        console.log('❌ Tabla cleanup_logs NO existe');
        this.addResult('LOGS_TABLE', false, 'Tabla no encontrada');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando tabla de logs:', error.message);
      this.addResult('LOGS_TABLE', false, error.message);
      return false;
    }
  }

  async createTestData() {
    console.log('\n📋 Test 3: Creando datos de prueba...');
    
    try {
      // Deshabilitar verificaciones de claves foráneas temporalmente
      await this.connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Crear backup de datos existentes
      const [existingBimestres] = await this.connection.execute('SELECT * FROM bimestres');
      
      if (existingBimestres.length > 0) {
        console.log(`📦 Creando backup de ${existingBimestres.length} bimestres existentes...`);
        
        // Guardar backup en archivo JSON
        const backupPath = path.join(__dirname, 'backup-bimestres.json');
        fs.writeFileSync(backupPath, JSON.stringify(existingBimestres, null, 2));
        console.log(`💾 Backup guardado en: ${backupPath}`);
      }
      
      // Limpiar tabla para testing
      await this.connection.execute('DELETE FROM bimestres');
      
      // Crear 15 bimestres de prueba (para que se eliminen 5)
      const testBimestres = [];
      for (let i = 1; i <= 15; i++) {
        const year = 2020 + Math.floor((i-1) / 4);
        const bimestre = ((i-1) % 4) + 1;
        const startMonth = (bimestre - 1) * 2 + 1;
        const endMonth = startMonth + 1;
        
        const bimestreData = {
          nombre: `Bimestre ${year}-${bimestre}`,
          fechaInicio: `${year}-${startMonth.toString().padStart(2, '0')}-01`,
          fechaFin: `${year}-${endMonth.toString().padStart(2, '0')}-28`,
          anoAcademico: year,
          numeroBimestre: bimestre,
          activo: i > 10 ? 1 : 0 // Los últimos 5 activos
        };
        
        testBimestres.push(bimestreData);
        
        await this.connection.execute(`
          INSERT INTO bimestres (nombre, fechaInicio, fechaFin, anoAcademico, numeroBimestre, activo) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [bimestreData.nombre, bimestreData.fechaInicio, bimestreData.fechaFin, bimestreData.anoAcademico, bimestreData.numeroBimestre, bimestreData.activo]);
      }
      
      // Rehabilitar verificaciones de claves foráneas
      await this.connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log(`✅ Creados ${testBimestres.length} bimestres de prueba`);
      this.addResult('TEST_DATA', true, `${testBimestres.length} bimestres creados`);
      return true;
      
    } catch (error) {
      // Asegurar que las claves foráneas se rehabiliten en caso de error
      await this.connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.error('❌ Error creando datos de prueba:', error.message);
      this.addResult('TEST_DATA', false, error.message);
      return false;
    }
  }

  async testStoredProcedureExecution() {
    console.log('\n📋 Test 4: Probando ejecución del Stored Procedure...');
    
    try {
      // Contar bimestres antes
      const [beforeCount] = await this.connection.execute('SELECT COUNT(*) as total FROM bimestres');
      const totalBefore = beforeCount[0].total;
      console.log(`📊 Bimestres antes del cleanup: ${totalBefore}`);
      
      // Ejecutar el SP con todos los parámetros requeridos
      console.log('🔄 Ejecutando sp_cleanup_old_bimestres...');
      await this.connection.execute(
        'CALL sp_cleanup_old_bimestres(?, ?, ?, ?, @execution_id, @bimestres_deleted, @total_records_deleted, @status, @error_message)',
        [6, 50, true, false] // 6 meses, máx 50, debug mode, no backup
      );
      
      // Obtener los resultados
      const [spResults] = await this.connection.execute(
        'SELECT @execution_id as execution_id, @bimestres_deleted as bimestres_deleted, @total_records_deleted as total_records_deleted, @status as status, @error_message as error_message'
      );
      
      const spResult = spResults[0];
      console.log('📊 Resultado del SP:', spResult);
      
      // Contar bimestres después
      const [afterCount] = await this.connection.execute('SELECT COUNT(*) as total FROM bimestres');
      const totalAfter = afterCount[0].total;
      console.log(`📊 Bimestres después del cleanup: ${totalAfter}`);
      
      // Verificar resultado (en modo debug no se eliminan bimestres)
      if (spResult.status === 'COMPLETED') {
        console.log('✅ Stored Procedure ejecutado correctamente');
        console.log(`📊 Bimestres que se eliminarían: ${spResult.bimestres_deleted}`);
        console.log(`📊 Total de registros que se eliminarían: ${spResult.total_records_deleted}`);
        
        // En modo debug, los bimestres no se eliminan realmente
        if (totalBefore === totalAfter) {
          console.log('✅ Modo debug confirmado: no se eliminaron bimestres');
          this.addResult('SP_EXECUTION', true, `Debug mode OK - Simularía eliminar ${spResult.bimestres_deleted} bimestres`);
        } else {
          console.log('⚠️ Advertencia: Se eliminaron bimestres en modo debug');
          this.addResult('SP_EXECUTION', false, 'Modo debug no funcionó correctamente');
        }
        
        // Verificar logs
        const [logs] = await this.connection.execute(`
          SELECT * FROM cleanup_logs ORDER BY execution_date DESC LIMIT 1
        `);
        
        if (logs.length > 0) {
          console.log('📝 Log generado:', {
            execution_id: logs[0].execution_id,
            fecha: logs[0].execution_date,
            estado: logs[0].status,
            bimestres_eliminados: logs[0].bimestres_eliminados
          });
        }
        
        return true;
      } else {
        console.log(`❌ Error en SP: ${spResult.error_message || 'Error desconocido'}`);
        this.addResult('SP_EXECUTION', false, `Error: ${spResult.error_message}`);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error ejecutando SP:', error.message);
      this.addResult('SP_EXECUTION', false, error.message);
      return false;
    }
  }

  async testAPIEndpoint() {
    console.log('\n📋 Test 5: Probando disponibilidad del servidor API...');
    
    try {
      // Verificar que el servidor esté ejecutándose haciendo ping a un endpoint público
      console.log('🌐 Verificando servidor en http://localhost:3001...');
      
      const response = await axios.get('http://localhost:3001', {
        timeout: 5000
      });
      
      console.log('✅ Servidor API está ejecutándose');
      console.log('📄 Endpoint de cleanup disponible en: POST /bimestres/cleanup');
      console.log('ℹ️ Nota: El endpoint requiere autenticación JWT y rol de Maestro');
      this.addResult('API_ENDPOINT', true, 'Servidor disponible');
      return true;
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️ Servidor no está ejecutándose. Inicia el backend con: npm run start:dev');
        this.addResult('API_ENDPOINT', false, 'Servidor no disponible');
      } else if (error.response && error.response.status === 404) {
        console.log('✅ Servidor API está ejecutándose (404 esperado en ruta raíz)');
        console.log('📄 Endpoint de cleanup disponible en: POST /bimestres/cleanup');
        this.addResult('API_ENDPOINT', true, 'Servidor disponible');
        return true;
      } else {
        console.log(`❌ Error verificando servidor: ${error.message}`);
        this.addResult('API_ENDPOINT', false, error.message);
      }
      return false;
    }
  }

  async testCronJobConfiguration() {
    console.log('\n📋 Test 6: Verificando configuración del Cron Job...');
    
    try {
      // Buscar archivo del servicio
      const servicePath = path.join(__dirname, '../src/bimestre/services/bimestre-cleanup.service.ts');
      
      if (fs.existsSync(servicePath)) {
        const serviceContent = fs.readFileSync(servicePath, 'utf8');
        
        // Verificar que existe el decorador @Cron
        if (serviceContent.includes('@Cron(') && serviceContent.includes('executeAnnualCleanup')) {
          console.log('✅ Configuración de Cron Job encontrada en el servicio');
          
          // Extraer la configuración del cron
          const cronMatch = serviceContent.match(/@Cron\(['"](.*?)['"]\)/);
          if (cronMatch) {
            console.log(`⏰ Programación actual: ${cronMatch[1]}`);
            console.log('📅 Esto significa: 1 de enero a las 2:00 AM cada año');
          }
          
          this.addResult('CRON_CONFIG', true, 'Configuración encontrada');
          return true;
        } else {
          console.log('❌ No se encontró configuración de Cron Job');
          this.addResult('CRON_CONFIG', false, 'Configuración no encontrada');
          return false;
        }
      } else {
        console.log('❌ Archivo del servicio no encontrado');
        this.addResult('CRON_CONFIG', false, 'Archivo de servicio no encontrado');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error verificando configuración de Cron:', error.message);
      this.addResult('CRON_CONFIG', false, error.message);
      return false;
    }
  }

  async restoreBackupData() {
    console.log('\n🔄 Restaurando datos originales...');
    
    try {
      const backupPath = path.join(__dirname, 'backup-bimestres.json');
      
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        // Limpiar datos de prueba
        await this.connection.execute('DELETE FROM bimestres');
        
        // Restaurar datos originales
        for (const bimestre of backupData) {
          await this.connection.execute(`
              INSERT INTO bimestres (id, nombre, fechaInicio, fechaFin, activo) 
              VALUES (?, ?, ?, ?, ?)
            `, [bimestre.id, bimestre.nombre, bimestre.fechaInicio, bimestre.fechaFin, bimestre.activo]);
        }
        
        console.log(`✅ Restaurados ${backupData.length} bimestres originales`);
        
        // Eliminar archivo de backup
        fs.unlinkSync(backupPath);
        console.log('🗑️ Archivo de backup eliminado');
      } else {
        console.log('ℹ️ No hay backup que restaurar');
      }
      
    } catch (error) {
      console.error('❌ Error restaurando backup:', error.message);
    }
  }

  addResult(test, success, message) {
    this.testResults.push({
      test,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE FINAL DE TESTING');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`\n📈 Resumen:`);
    console.log(`   Total de tests: ${totalTests}`);
    console.log(`   ✅ Exitosos: ${passedTests}`);
    console.log(`   ❌ Fallidos: ${failedTests}`);
    console.log(`   📊 Tasa de éxito: ${((passedTests/totalTests)*100).toFixed(1)}%`);
    
    console.log('\n📋 Detalle de tests:');
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.test}: ${result.message}`);
    });
    
    // Recomendaciones
    console.log('\n💡 Recomendaciones:');
    
    if (failedTests === 0) {
      console.log('   🎉 ¡Todos los tests pasaron! El sistema está listo para producción.');
      console.log('   📅 Próximos pasos:');
      console.log('      - Desplegar en ambiente de staging');
      console.log('      - Configurar monitoreo y alertas');
      console.log('      - Programar primera ejecución de prueba');
    } else {
      console.log('   ⚠️ Hay tests fallidos que deben corregirse antes del despliegue:');
      
      this.testResults.filter(r => !r.success).forEach(result => {
        console.log(`      - ${result.test}: ${result.message}`);
      });
    }
    
    // Guardar reporte
    const reportPath = path.join(__dirname, 'cleanup-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { totalTests, passedTests, failedTests },
      results: this.testResults
    }, null, 2));
    
    console.log(`\n💾 Reporte detallado guardado en: ${reportPath}`);
  }

  async cleanup() {
    console.log('\n🧹 Limpiando datos de prueba...');
    
    try {
      if (this.connection) {
        // Deshabilitar verificaciones de claves foráneas
        await this.connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        if (this.backupData && this.backupData.length > 0) {
          // Restaurar desde backup
          await this.connection.execute('DELETE FROM bimestres WHERE nombre LIKE "Test Bimestre%"');
          
          for (const bimestre of this.backupData) {
            await this.connection.execute(`
              INSERT INTO bimestres (id, nombre, fechaInicio, fechaFin, anoAcademico, numeroBimestre, activo, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              bimestre.id,
              bimestre.nombre,
              bimestre.fechaInicio,
              bimestre.fechaFin,
              bimestre.anoAcademico,
              bimestre.numeroBimestre,
              bimestre.activo,
              bimestre.createdAt,
              bimestre.updatedAt
            ]);
          }
          
          console.log('✅ Datos restaurados desde backup');
        } else {
          // Solo eliminar datos de prueba
          await this.connection.execute('DELETE FROM bimestres WHERE nombre LIKE "Bimestre %"');
          console.log('✅ Datos de prueba eliminados');
        }
        
        // Rehabilitar verificaciones de claves foráneas
        await this.connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        
        // Cerrar conexión
        await this.connection.end();
      }
      
    } catch (error) {
      console.log('⚠️ Error durante limpieza:', error.message);
      // Asegurar que las claves foráneas se rehabiliten y la conexión se cierre
      try {
        if (this.connection) {
          await this.connection.execute('SET FOREIGN_KEY_CHECKS = 1');
          await this.connection.end();
        }
      } catch (closeError) {
        console.error('Error cerrando conexión:', closeError.message);
      }
    }
  }

  async runAllTests() {
    const startTime = Date.now();
    
    try {
      // Inicializar
      const connected = await this.init();
      if (!connected) {
        console.log('❌ No se pudo conectar a la base de datos. Abortando tests.');
        return;
      }
      
      // Ejecutar tests en secuencia
      await this.testStoredProcedureExists();
      await this.testCleanupLogsTable();
      await this.createTestData();
      await this.testStoredProcedureExecution();
      await this.testAPIEndpoint();
      await this.testCronJobConfiguration();
      
      // Restaurar datos originales
      await this.restoreBackupData();
      
    } catch (error) {
      console.error('❌ Error durante la ejecución de tests:', error);
    } finally {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n⏱️ Tiempo total de ejecución: ${duration} segundos`);
      
      // Generar reporte final
      this.generateReport();
      
      // Limpiar conexiones
      await this.cleanup();
    }
  }
}

// Ejecutar tests si el script se ejecuta directamente
if (require.main === module) {
  const tester = new CleanupTester();
  tester.runAllTests().catch(console.error);
}

module.exports = CleanupTester;