# Estrategias de Testing para el Proceso Automático de Limpieza de Bimestres

## Objetivo
Definir estrategias completas para probar que el proceso automático de limpieza de bimestres funcione correctamente en todos los escenarios posibles.

---

## 1. TESTING DEL CRON JOB AUTOMÁTICO

### 1.1 Testing de Programación del Cron

#### Estrategia de Testing Inmediato
```typescript
// Modificar temporalmente la programación para testing
// En bimestre-cleanup.service.ts

// ORIGINAL: @Cron('0 2 1 1 *') // 1 de enero a las 2:00 AM
// TESTING: @Cron('*/1 * * * *') // Cada minuto para pruebas

@Injectable()
export class BimestreCleanupService {
  private readonly logger = new Logger(BimestreCleanupService.name);
  
  // Método para testing con cron modificado
  @Cron('*/1 * * * *') // Solo para desarrollo
  async executeTestCleanup() {
    if (process.env.NODE_ENV !== 'development') return;
    
    this.logger.log('=== EJECUTANDO CLEANUP DE PRUEBA ===');
    await this.executeCleanup(5); // Mantener solo 5 para pruebas
  }
}
```

#### Script de Validación de Cron
```javascript
// test-cron-execution.js
const cron = require('node-cron');

// Simular la programación del cron
const testCronExecution = () => {
  console.log('Iniciando test de cron job...');
  
  // Programar para ejecutar cada 10 segundos durante testing
  const task = cron.schedule('*/10 * * * * *', () => {
    console.log(`[${new Date().toISOString()}] Cron job ejecutado`);
    // Aquí iría la llamada al servicio de cleanup
  }, {
    scheduled: false
  });
  
  task.start();
  
  // Detener después de 1 minuto
  setTimeout(() => {
    task.stop();
    console.log('Test de cron completado');
  }, 60000);
};

testCronExecution();
```

### 1.2 Testing con Mocks de Tiempo

```typescript
// bimestre-cleanup.service.spec.ts
import { Test } from '@nestjs/testing';
import { BimestreCleanupService } from './bimestre-cleanup.service';

describe('BimestreCleanupService - Cron Testing', () => {
  let service: BimestreCleanupService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [BimestreCleanupService]
    }).compile();
    
    service = module.get<BimestreCleanupService>(BimestreCleanupService);
  });
  
  it('should execute cleanup on January 1st', async () => {
    // Mock del sistema de tiempo
    const mockDate = new Date('2024-01-01T02:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    const cleanupSpy = jest.spyOn(service, 'executeCleanup');
    
    // Simular ejecución del cron
    await service.executeAnnualCleanup();
    
    expect(cleanupSpy).toHaveBeenCalledWith(10);
  });
});
```

---

## 2. TESTING DEL STORED PROCEDURE

### 2.1 Testing de Selección de Bimestres

```sql
-- test-sp-selection.sql
-- Crear datos de prueba
INSERT INTO bimestres (nombre, fecha_inicio, fecha_fin, activo) VALUES
('Bimestre 2020-1', '2020-01-01', '2020-02-28', 0),
('Bimestre 2020-2', '2020-03-01', '2020-04-30', 0),
('Bimestre 2021-1', '2021-01-01', '2021-02-28', 0),
('Bimestre 2021-2', '2021-03-01', '2021-04-30', 0),
('Bimestre 2022-1', '2022-01-01', '2022-02-28', 0),
('Bimestre 2022-2', '2022-03-01', '2022-04-30', 0),
('Bimestre 2023-1', '2023-01-01', '2023-02-28', 0),
('Bimestre 2023-2', '2023-03-01', '2023-04-30', 0),
('Bimestre 2024-1', '2024-01-01', '2024-02-28', 1),
('Bimestre 2024-2', '2024-03-01', '2024-04-30', 1),
('Bimestre 2024-3', '2024-05-01', '2024-06-30', 1),
('Bimestre 2024-4', '2024-07-01', '2024-08-31', 1),
('Bimestre 2025-1', '2025-01-01', '2025-02-28', 0);

-- Test 1: Verificar selección en modo SELECT (sin eliminar)
WITH bimestres_ordenados AS (
    SELECT 
        id, 
        nombre, 
        fecha_inicio,
        ROW_NUMBER() OVER (ORDER BY fecha_inicio DESC) as rn
    FROM bimestres
)
SELECT 
    id,
    nombre,
    fecha_inicio,
    CASE 
        WHEN rn <= 10 THEN 'MANTENER'
        ELSE 'ELIMINAR'
    END as accion
FROM bimestres_ordenados
ORDER BY fecha_inicio DESC;

-- Test 2: Contar cuántos se eliminarían
SELECT 
    COUNT(*) as total_bimestres,
    SUM(CASE WHEN rn > 10 THEN 1 ELSE 0 END) as a_eliminar,
    SUM(CASE WHEN rn <= 10 THEN 1 ELSE 0 END) as a_mantener
FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY fecha_inicio DESC) as rn
    FROM bimestres
) t;
```

### 2.2 Testing de Casos Edge

```sql
-- test-edge-cases.sql

-- Caso 1: Menos de 10 bimestres (no debe eliminar nada)
DELETE FROM bimestres;
INSERT INTO bimestres (nombre, fecha_inicio, fecha_fin, activo) VALUES
('Bimestre 1', '2024-01-01', '2024-02-28', 1),
('Bimestre 2', '2024-03-01', '2024-04-30', 1),
('Bimestre 3', '2024-05-01', '2024-06-30', 0);

CALL sp_cleanup_old_bimestres(10);
-- Verificar que no se eliminó nada
SELECT COUNT(*) as total_after_cleanup FROM bimestres; -- Debe ser 3

-- Caso 2: Exactamente 10 bimestres (no debe eliminar nada)
-- Caso 3: Más de 10 bimestres (debe eliminar los más antiguos)
```

### 2.3 Testing de Transacciones y Rollback

```sql
-- test-transaction-rollback.sql
BEGIN TRANSACTION;

-- Simular error en el SP
CALL sp_cleanup_old_bimestres(-1); -- Parámetro inválido

-- Verificar que no se hicieron cambios
SELECT COUNT(*) FROM bimestres;
SELECT COUNT(*) FROM cleanup_logs WHERE status = 'ERROR';

ROLLBACK;
```

---

## 3. TESTING DE INTEGRACIÓN COMPLETA

### 3.1 Script de Testing End-to-End

```javascript
// test-cleanup-integration.js
const mysql = require('mysql2/promise');
const axios = require('axios');

class CleanupIntegrationTest {
  constructor() {
    this.connection = null;
    this.baseUrl = 'http://localhost:3000/api';
  }
  
  async setup() {
    // Conectar a la base de datos
    this.connection = await mysql.createConnection({
      host: 'localhost',
      user: 'test_user',
      password: 'test_password',
      database: 'test_planificacion'
    });
    
    // Crear datos de prueba
    await this.createTestData();
  }
  
  async createTestData() {
    console.log('Creando datos de prueba...');
    
    // Limpiar datos existentes
    await this.connection.execute('DELETE FROM bimestres');
    
    // Crear 15 bimestres para probar eliminación
    for (let i = 1; i <= 15; i++) {
      const year = 2020 + Math.floor(i / 3);
      const month = ((i - 1) % 12) + 1;
      
      await this.connection.execute(`
        INSERT INTO bimestres (nombre, fecha_inicio, fecha_fin, activo) 
        VALUES (?, ?, ?, ?)
      `, [
        `Bimestre ${year}-${i}`,
        `${year}-${month.toString().padStart(2, '0')}-01`,
        `${year}-${month.toString().padStart(2, '0')}-28`,
        i > 12 ? 1 : 0
      ]);
    }
    
    console.log('Datos de prueba creados: 15 bimestres');
  }
  
  async testManualExecution() {
    console.log('\n=== TESTING EJECUCIÓN MANUAL ===');
    
    try {
      // Ejecutar cleanup manual
      const response = await axios.post(`${this.baseUrl}/bimestres/cleanup`, {
        bimestresToKeep: 10
      }, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log('Respuesta del cleanup:', response.data);
      
      // Verificar resultado
      const [rows] = await this.connection.execute('SELECT COUNT(*) as total FROM bimestres');
      const totalAfter = rows[0].total;
      
      console.log(`Bimestres después del cleanup: ${totalAfter}`);
      
      if (totalAfter === 10) {
        console.log('✅ Test PASADO: Se mantuvieron exactamente 10 bimestres');
      } else {
        console.log(`❌ Test FALLIDO: Se esperaban 10 bimestres, se encontraron ${totalAfter}`);
      }
      
    } catch (error) {
      console.error('❌ Error en ejecución manual:', error.message);
    }
  }
  
  async testCronJobSimulation() {
    console.log('\n=== TESTING SIMULACIÓN DE CRON JOB ===');
    
    // Recrear datos
    await this.createTestData();
    
    try {
      // Simular ejecución del cron job
      const response = await axios.post(`${this.baseUrl}/bimestres/test-cron`);
      
      console.log('Cron job simulado ejecutado');
      
      // Verificar logs
      const [logs] = await this.connection.execute(`
        SELECT * FROM cleanup_logs 
        ORDER BY execution_date DESC 
        LIMIT 1
      `);
      
      if (logs.length > 0) {
        const lastLog = logs[0];
        console.log('Último log de cleanup:', {
          status: lastLog.status,
          bimestresEliminados: lastLog.bimestres_eliminados,
          fecha: lastLog.execution_date
        });
        
        if (lastLog.status === 'SUCCESS') {
          console.log('✅ Test PASADO: Cron job ejecutado exitosamente');
        } else {
          console.log('❌ Test FALLIDO: Cron job falló');
        }
      } else {
        console.log('❌ Test FALLIDO: No se encontraron logs de ejecución');
      }
      
    } catch (error) {
      console.error('❌ Error en simulación de cron:', error.message);
    }
  }
  
  async testErrorHandling() {
    console.log('\n=== TESTING MANEJO DE ERRORES ===');
    
    try {
      // Test con parámetro inválido
      const response = await axios.post(`${this.baseUrl}/bimestres/cleanup`, {
        bimestresToKeep: -1
      }, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log('❌ Test FALLIDO: Debería haber rechazado parámetro inválido');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Test PASADO: Parámetro inválido rechazado correctamente');
      } else {
        console.log('❌ Test FALLIDO: Error inesperado:', error.message);
      }
    }
  }
  
  async cleanup() {
    if (this.connection) {
      await this.connection.end();
    }
  }
  
  async runAllTests() {
    try {
      await this.setup();
      await this.testManualExecution();
      await this.testCronJobSimulation();
      await this.testErrorHandling();
      
      console.log('\n=== TODOS LOS TESTS COMPLETADOS ===');
      
    } catch (error) {
      console.error('Error en tests:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Ejecutar tests
const tester = new CleanupIntegrationTest();
tester.runAllTests();
```

---

## 4. TESTING DE MONITOREO Y ALERTAS

### 4.1 Validación de Logs

```javascript
// test-logging.js
const fs = require('fs');
const path = require('path');

class LoggingTest {
  async testLogGeneration() {
    console.log('Testing generación de logs...');
    
    // Ejecutar cleanup
    // ... código de ejecución ...
    
    // Verificar que se generaron logs
    const logFile = path.join(__dirname, '../logs/cleanup.log');
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      const lines = logContent.split('\n');
      
      // Buscar entradas de cleanup
      const cleanupLogs = lines.filter(line => 
        line.includes('CLEANUP_EXECUTED') || 
        line.includes('BIMESTRES_ELIMINADOS')
      );
      
      if (cleanupLogs.length > 0) {
        console.log('✅ Logs generados correctamente');
        console.log('Últimas entradas:', cleanupLogs.slice(-3));
      } else {
        console.log('❌ No se encontraron logs de cleanup');
      }
    } else {
      console.log('❌ Archivo de log no encontrado');
    }
  }
}
```

### 4.2 Testing de Alertas

```typescript
// alert-testing.service.ts
@Injectable()
export class AlertTestingService {
  
  async testFailureAlert() {
    // Simular fallo del cleanup
    try {
      throw new Error('Simulated cleanup failure');
    } catch (error) {
      // Verificar que se envía alerta
      await this.sendAlert('CLEANUP_FAILED', error.message);
    }
  }
  
  async testSuccessNotification() {
    // Simular éxito del cleanup
    const result = {
      bimestresEliminados: 5,
      bimestresMantenidos: 10,
      duracion: '2.3s'
    };
    
    await this.sendAlert('CLEANUP_SUCCESS', result);
  }
  
  private async sendAlert(type: string, data: any) {
    // Implementar envío de alerta (email, Slack, etc.)
    console.log(`Alerta enviada: ${type}`, data);
  }
}
```

---

## 5. TESTING DE RENDIMIENTO

### 5.1 Testing con Grandes Volúmenes de Datos

```javascript
// performance-test.js
class PerformanceTest {
  async testLargeDataset() {
    console.log('Testing con dataset grande...');
    
    const startTime = Date.now();
    
    // Crear 1000 bimestres
    for (let i = 0; i < 1000; i++) {
      await this.createBimestre(`Test-${i}`);
    }
    
    console.log('Datos creados, ejecutando cleanup...');
    
    const cleanupStart = Date.now();
    await this.executeCleanup();
    const cleanupEnd = Date.now();
    
    const duration = cleanupEnd - cleanupStart;
    console.log(`Cleanup completado en ${duration}ms`);
    
    // Verificar que el rendimiento es aceptable (< 30 segundos)
    if (duration < 30000) {
      console.log('✅ Rendimiento aceptable');
    } else {
      console.log('❌ Rendimiento lento');
    }
  }
}
```

---

## 6. ESTRATEGIA DE DESPLIEGUE Y TESTING EN PRODUCCIÓN

### 6.1 Pre-deployment Testing

```bash
#!/bin/bash
# pre-deployment-test.sh

echo "Ejecutando tests pre-despliegue..."

# 1. Tests unitarios
npm test -- --testPathPattern=cleanup

# 2. Tests de integración
node test-cleanup-integration.js

# 3. Verificar configuración
node verify-cron-config.js

# 4. Test de backup/restore
node test-backup-restore.js

echo "Tests pre-despliegue completados"
```

### 6.2 Post-deployment Monitoring

```javascript
// post-deployment-monitor.js
class PostDeploymentMonitor {
  async monitorFirstExecution() {
    console.log('Monitoreando primera ejecución en producción...');
    
    // Cambiar temporalmente el cron a ejecutar en 5 minutos
    await this.updateCronSchedule('*/5 * * * *');
    
    // Monitorear por 10 minutos
    setTimeout(async () => {
      const logs = await this.getRecentLogs();
      
      if (logs.some(log => log.includes('CLEANUP_SUCCESS'))) {
        console.log('✅ Primera ejecución exitosa');
        // Restaurar programación original
        await this.updateCronSchedule('0 2 1 1 *');
      } else {
        console.log('❌ Primera ejecución falló');
        // Enviar alerta crítica
        await this.sendCriticalAlert();
      }
    }, 600000); // 10 minutos
  }
}
```

---

## 7. CHECKLIST DE TESTING COMPLETO

### ✅ Tests Obligatorios Antes del Despliegue

- [ ] **Stored Procedure**
  - [ ] Selección correcta de bimestres (mantiene los 10 más recientes)
  - [ ] Manejo de casos edge (< 10, = 10, > 10 bimestres)
  - [ ] Transacciones y rollback en caso de error
  - [ ] Validación de parámetros
  - [ ] Generación correcta de logs

- [ ] **Servicio NestJS**
  - [ ] Ejecución manual funciona correctamente
  - [ ] Cron job se programa correctamente
  - [ ] Manejo de errores y excepciones
  - [ ] Logging detallado
  - [ ] Validación de permisos (solo rol 'Maestro')

- [ ] **Integración Completa**
  - [ ] End-to-end test con datos reales
  - [ ] Testing de rendimiento con datasets grandes
  - [ ] Verificación de que no se rompen relaciones FK
  - [ ] Testing de backup y restore

- [ ] **Monitoreo y Alertas**
  - [ ] Logs se generan correctamente
  - [ ] Alertas se envían en caso de fallo
  - [ ] Métricas de éxito/fallo son precisas
  - [ ] Dashboard de monitoreo funciona

### ✅ Tests Post-Despliegue

- [ ] Primera ejecución monitoreada
- [ ] Verificación de logs en producción
- [ ] Confirmación de que el cron job está activo
- [ ] Testing de endpoint manual en producción
- [ ] Validación de alertas en ambiente real

---

## 8. HERRAMIENTAS Y SCRIPTS DE APOYO

### 8.1 Script de Verificación Rápida

```bash
#!/bin/bash
# quick-verify.sh

echo "Verificación rápida del sistema de cleanup..."

# Verificar que el SP existe
mysql -e "SHOW PROCEDURE STATUS WHERE Name='sp_cleanup_old_bimestres';"

# Verificar que la tabla de logs existe
mysql -e "DESCRIBE cleanup_logs;"

# Verificar configuración del cron
curl -X GET http://localhost:3000/api/bimestres/cleanup/status

echo "Verificación completada"
```

### 8.2 Dashboard de Monitoreo

```typescript
// cleanup-dashboard.controller.ts
@Controller('cleanup-dashboard')
export class CleanupDashboardController {
  
  @Get('status')
  async getCleanupStatus() {
    return {
      lastExecution: await this.getLastExecutionLog(),
      nextScheduledExecution: this.getNextCronExecution(),
      totalBimestres: await this.getTotalBimestres(),
      systemHealth: await this.checkSystemHealth()
    };
  }
  
  @Get('logs')
  async getRecentLogs(@Query('limit') limit = 10) {
    return await this.getCleanupLogs(limit);
  }
}
```

---

## CONCLUSIÓN

Esta estrategia de testing garantiza que el proceso automático de limpieza de bimestres funcione correctamente mediante:

1. **Testing exhaustivo** de todos los componentes
2. **Validación de automatización** del cron job
3. **Monitoreo continuo** post-despliegue
4. **Estrategias de recuperación** en caso de fallos
5. **Herramientas de diagnóstico** para mantenimiento

Siguiendo esta guía, se puede tener confianza en que el proceso automático funcionará correctamente en producción y se detectarán rápidamente cualquier problema que pueda surgir.