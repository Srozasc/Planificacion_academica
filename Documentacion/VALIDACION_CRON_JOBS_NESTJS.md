# Validación de Configuración de Cron Jobs en NestJS

## Estado Actual del Proyecto

### Dependencias Instaladas
✅ **@nestjs/schedule**: Versión 2.2.0 instalada
- Ubicación: `backend/package.json`
- Estado: Disponible para uso

### Configuración de Módulos
❌ **ScheduleModule**: No configurado en AppModule
- El `ScheduleModule.forRoot()` no está importado en `app.module.ts`
- Necesario para habilitar funcionalidad de cron jobs

### Servicios de Tareas Programadas
❌ **TasksService o CleanupService**: No existe
- No se encontraron servicios con decoradores `@Cron`
- No hay implementación actual de tareas programadas

## Análisis de Configuración Requerida

### 1. Importación del ScheduleModule

**Estado**: ❌ Pendiente  
**Archivo a modificar**: `backend/src/app.module.ts`

```typescript
// Agregar import
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(), // ← AGREGAR ESTA LÍNEA
    CommonModule,
    // ... otros módulos
  ],
  // ...
})
export class AppModule {}
```

### 2. Configuración de Variables de Entorno

**Estado**: ❌ Pendiente  
**Archivo a crear/modificar**: `backend/.env`

```env
# Configuración del cron job de limpieza
CLEANUP_ENABLED=true
CLEANUP_MESES_ANTIGUEDAD=24
CLEANUP_MAX_BIMESTRES_POR_EJECUCION=10
CLEANUP_CRON_SCHEDULE="0 2 * * 0"  # Domingos a las 2:00 AM
CLEANUP_REALIZAR_BACKUP=true
CLEANUP_MODO_DEBUG=false
```

### 3. Servicio de Limpieza con Cron Jobs

**Estado**: ❌ Pendiente  
**Archivo a crear**: `backend/src/bimestres/bimestre-cleanup.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BimestreCleanupService {
  private readonly logger = new Logger(BimestreCleanupService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_SUNDAY_AT_2AM)
  async handleWeeklyCleanup() {
    const isEnabled = this.configService.get<boolean>('CLEANUP_ENABLED', true);
    
    if (!isEnabled) {
      this.logger.log('Limpieza automática deshabilitada por configuración');
      return;
    }

    this.logger.log('Iniciando limpieza automática de bimestres');
    
    try {
      const result = await this.executeCleanupBimestres({
        mesesAntiguedad: this.configService.get<number>('CLEANUP_MESES_ANTIGUEDAD', 24),
        maxBimestresPorEjecucion: this.configService.get<number>('CLEANUP_MAX_BIMESTRES_POR_EJECUCION', 10),
        modoDebug: this.configService.get<boolean>('CLEANUP_MODO_DEBUG', false),
        realizarBackup: this.configService.get<boolean>('CLEANUP_REALIZAR_BACKUP', true)
      });
      
      this.logger.log(`Limpieza completada: ${result.bimestresEliminados} bimestres eliminados, ${result.totalRegistrosEliminados} registros totales`);
    } catch (error) {
      this.logger.error('Error en limpieza automática:', error);
    }
  }

  // Método manual para testing y ejecución bajo demanda
  async executeManualCleanup(options: CleanupOptions = {}): Promise<CleanupResult> {
    this.logger.log('Ejecutando limpieza manual de bimestres');
    return this.executeCleanupBimestres(options);
  }

  private async executeCleanupBimestres(options: CleanupOptions): Promise<CleanupResult> {
    const {
      mesesAntiguedad = 24,
      maxBimestresPorEjecucion = 10,
      modoDebug = false,
      realizarBackup = true
    } = options;

    const result = await this.dataSource.query(
      'CALL sp_cleanup_old_bimestres(?, ?, ?, ?, @bimestres_eliminados, @total_registros, @mensaje)',
      [mesesAntiguedad, maxBimestresPorEjecucion, modoDebug, realizarBackup]
    );

    const [output] = await this.dataSource.query(
      'SELECT @bimestres_eliminados as bimestresEliminados, @total_registros as totalRegistros, @mensaje as mensaje'
    );

    return {
      bimestresEliminados: output.bimestresEliminados,
      totalRegistrosEliminados: output.totalRegistros,
      mensaje: output.mensaje,
      timestamp: new Date()
    };
  }
}

interface CleanupOptions {
  mesesAntiguedad?: number;
  maxBimestresPorEjecucion?: number;
  modoDebug?: boolean;
  realizarBackup?: boolean;
}

interface CleanupResult {
  bimestresEliminados: number;
  totalRegistrosEliminados: number;
  mensaje: string;
  timestamp: Date;
}
```

### 4. Controlador para Ejecución Manual

**Estado**: ❌ Pendiente  
**Archivo a crear**: `backend/src/bimestres/bimestre-cleanup.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BimestreCleanupService } from './bimestre-cleanup.service';
import { ResponseService } from '../common/services/response.service';

@Controller('bimestres/cleanup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BimestreCleanupController {
  private readonly logger = new Logger(BimestreCleanupController.name);

  constructor(
    private readonly cleanupService: BimestreCleanupService,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @Roles('Maestro')
  async executeManualCleanup(@Body() options: any = {}) {
    try {
      this.logger.log('Ejecutando limpieza manual de bimestres');
      
      const result = await this.cleanupService.executeManualCleanup(options);
      
      return this.responseService.success(
        result,
        'Limpieza de bimestres ejecutada exitosamente'
      );
    } catch (error) {
      this.logger.error('Error en limpieza manual:', error);
      throw error;
    }
  }
}
```

### 5. Actualización del BimestresModule

**Estado**: ❌ Pendiente  
**Archivo a modificar**: `backend/src/bimestres/bimestres.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BimestresService } from './bimestres.service';
import { BimestresController } from './bimestres.controller';
import { BimestreCleanupService } from './bimestre-cleanup.service'; // ← AGREGAR
import { BimestreCleanupController } from './bimestre-cleanup.controller'; // ← AGREGAR
import { Bimestre } from './entities/bimestre.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bimestre]),
    CommonModule,
  ],
  controllers: [
    BimestresController,
    BimestreCleanupController, // ← AGREGAR
  ],
  providers: [
    BimestresService,
    BimestreCleanupService, // ← AGREGAR
  ],
  exports: [
    BimestresService,
    BimestreCleanupService, // ← AGREGAR
  ],
})
export class BimestresModule {}
```

## Configuraciones de Cron Disponibles

### Expresiones Cron Predefinidas

```typescript
import { CronExpression } from '@nestjs/schedule';

// Opciones disponibles:
CronExpression.EVERY_SECOND        // '* * * * * *'
CronExpression.EVERY_5_SECONDS     // '*/5 * * * * *'
CronExpression.EVERY_10_SECONDS    // '*/10 * * * * *'
CronExpression.EVERY_30_SECONDS    // '*/30 * * * * *'
CronExpression.EVERY_MINUTE        // '0 * * * * *'
CronExpression.EVERY_5_MINUTES     // '0 */5 * * * *'
CronExpression.EVERY_10_MINUTES    // '0 */10 * * * *'
CronExpression.EVERY_30_MINUTES    // '0 */30 * * * *'
CronExpression.EVERY_HOUR          // '0 0 * * * *'
CronExpression.EVERY_2_HOURS       // '0 0 */2 * * *'
CronExpression.EVERY_3_HOURS       // '0 0 */3 * * *'
CronExpression.EVERY_6_HOURS       // '0 0 */6 * * *'
CronExpression.EVERY_12_HOURS      // '0 0 */12 * * *'
CronExpression.EVERY_DAY_AT_1AM    // '0 0 1 * * *'
CronExpression.EVERY_DAY_AT_2AM    // '0 0 2 * * *'
CronExpression.EVERY_DAY_AT_MIDNIGHT // '0 0 0 * * *'
CronExpression.EVERY_WEEK          // '0 0 0 * * 0'
CronExpression.EVERY_WEEKDAY       // '0 0 0 * * 1-5'
CronExpression.EVERY_WEEKEND       // '0 0 0 * * 6,0'
CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT // '0 0 0 1 * *'
CronExpression.EVERY_2ND_HOUR      // '0 0 */2 * * *'
CronExpression.EVERY_2ND_HOUR_FROM_1AM_THROUGH_11PM // '0 0 1-23/2 * * *'
```

### Expresiones Personalizadas

```typescript
// Formato: segundo minuto hora día mes día_semana
@Cron('0 2 * * 0')    // Domingos a las 2:00 AM
@Cron('0 0 1 1 *')    // 1 de enero a medianoche
@Cron('0 30 2 * * 1') // Lunes a las 2:30 AM
@Cron('0 0 */6 * * *') // Cada 6 horas
```

## Configuraciones Recomendadas por Entorno

### Desarrollo
```env
CLEANUP_ENABLED=true
CLEANUP_MESES_ANTIGUEDAD=6
CLEANUP_MAX_BIMESTRES_POR_EJECUCION=20
CLEANUP_CRON_SCHEDULE="0 */30 * * * *"  # Cada 30 minutos para testing
CLEANUP_REALIZAR_BACKUP=false
CLEANUP_MODO_DEBUG=true
```

### Testing
```env
CLEANUP_ENABLED=false  # Deshabilitado para evitar interferencias
CLEANUP_MESES_ANTIGUEDAD=1
CLEANUP_MAX_BIMESTRES_POR_EJECUCION=50
CLEANUP_CRON_SCHEDULE="0 0 * * * *"  # Cada hora (si se habilita)
CLEANUP_REALIZAR_BACKUP=false
CLEANUP_MODO_DEBUG=true
```

### Producción
```env
CLEANUP_ENABLED=true
CLEANUP_MESES_ANTIGUEDAD=36
CLEANUP_MAX_BIMESTRES_POR_EJECUCION=5
CLEANUP_CRON_SCHEDULE="0 2 * * 0"  # Domingos a las 2:00 AM
CLEANUP_REALIZAR_BACKUP=true
CLEANUP_MODO_DEBUG=false
```

## Monitoreo y Logging

### Logs de Cron Jobs

```typescript
// En el servicio de limpieza
private readonly logger = new Logger(BimestreCleanupService.name);

@Cron(CronExpression.EVERY_SUNDAY_AT_2AM)
async handleWeeklyCleanup() {
  this.logger.log('=== INICIO CRON JOB LIMPIEZA BIMESTRES ===');
  this.logger.log(`Configuración: ${JSON.stringify({
    enabled: this.configService.get('CLEANUP_ENABLED'),
    mesesAntiguedad: this.configService.get('CLEANUP_MESES_ANTIGUEDAD'),
    maxBimestres: this.configService.get('CLEANUP_MAX_BIMESTRES_POR_EJECUCION')
  })}`);
  
  // ... lógica de limpieza
  
  this.logger.log('=== FIN CRON JOB LIMPIEZA BIMESTRES ===');
}
```

### Verificación de Estado del Cron

```typescript
// Endpoint para verificar estado del cron job
@Get('status')
@Roles('Maestro')
async getCleanupStatus() {
  return {
    enabled: this.configService.get<boolean>('CLEANUP_ENABLED'),
    schedule: this.configService.get<string>('CLEANUP_CRON_SCHEDULE'),
    lastExecution: await this.getLastExecutionFromLogs(),
    nextExecution: this.calculateNextExecution(),
    configuration: {
      mesesAntiguedad: this.configService.get<number>('CLEANUP_MESES_ANTIGUEDAD'),
      maxBimestres: this.configService.get<number>('CLEANUP_MAX_BIMESTRES_POR_EJECUCION'),
      modoDebug: this.configService.get<boolean>('CLEANUP_MODO_DEBUG')
    }
  };
}
```

## Testing de Cron Jobs

### Pruebas Unitarias

```typescript
// bimestre-cleanup.service.spec.ts
import { Test } from '@nestjs/testing';
import { BimestreCleanupService } from './bimestre-cleanup.service';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('BimestreCleanupService', () => {
  let service: BimestreCleanupService;
  let mockDataSource: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn()
    };
    
    mockConfigService = {
      get: jest.fn()
    };

    const module = await Test.createTestingModule({
      providers: [
        BimestreCleanupService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService }
      ]
    }).compile();

    service = module.get<BimestreCleanupService>(BimestreCleanupService);
  });

  it('should execute cleanup with correct parameters', async () => {
    mockConfigService.get.mockImplementation((key, defaultValue) => {
      const config = {
        'CLEANUP_ENABLED': true,
        'CLEANUP_MESES_ANTIGUEDAD': 24,
        'CLEANUP_MAX_BIMESTRES_POR_EJECUCION': 10
      };
      return config[key] ?? defaultValue;
    });

    mockDataSource.query
      .mockResolvedValueOnce(undefined) // CALL result
      .mockResolvedValueOnce([{ // SELECT result
        bimestresEliminados: 3,
        totalRegistros: 150,
        mensaje: 'Limpieza completada exitosamente'
      }]);

    const result = await service.executeManualCleanup();

    expect(result.bimestresEliminados).toBe(3);
    expect(result.totalRegistrosEliminados).toBe(150);
    expect(mockDataSource.query).toHaveBeenCalledWith(
      'CALL sp_cleanup_old_bimestres(?, ?, ?, ?, @bimestres_eliminados, @total_registros, @mensaje)',
      [24, 10, false, true]
    );
  });
});
```

### Testing Manual del Cron

```typescript
// Para testing, cambiar temporalmente el cron a cada minuto
@Cron('0 * * * * *') // Cada minuto
async handleTestCleanup() {
  if (process.env.NODE_ENV !== 'development') {
    return; // Solo en desarrollo
  }
  
  this.logger.log('TEST: Ejecutando cron job de limpieza');
  // ... lógica de prueba
}
```

## Checklist de Implementación

### Configuración Base
- [ ] ✅ Verificar que `@nestjs/schedule` está instalado (v2.2.0)
- [ ] ❌ Importar `ScheduleModule.forRoot()` en `AppModule`
- [ ] ❌ Configurar variables de entorno para cron jobs

### Servicios y Controladores
- [ ] ❌ Crear `BimestreCleanupService` con decorador `@Cron`
- [ ] ❌ Crear `BimestreCleanupController` para ejecución manual
- [ ] ❌ Actualizar `BimestresModule` con nuevos servicios

### Testing y Validación
- [ ] ❌ Crear pruebas unitarias para el servicio de limpieza
- [ ] ❌ Probar cron job en desarrollo con frecuencia alta
- [ ] ❌ Validar ejecución manual desde endpoint REST
- [ ] ❌ Verificar logs y monitoreo

### Despliegue
- [ ] ❌ Configurar variables de entorno por ambiente
- [ ] ❌ Documentar proceso de monitoreo
- [ ] ❌ Establecer alertas para fallos del cron job

## Próximos Pasos

1. **Implementar configuración base** del ScheduleModule
2. **Crear servicio de limpieza** con cron job
3. **Desarrollar controlador** para ejecución manual
4. **Configurar testing** y validación
5. **Desplegar y monitorear** en diferentes entornos

## Consideraciones Adicionales

### Timezone
```typescript
// Configurar timezone si es necesario
ScheduleModule.forRoot({
  timezone: 'America/Argentina/Buenos_Aires'
})
```

### Múltiples Cron Jobs
```typescript
@Injectable()
export class TasksService {
  @Cron('0 2 * * 0') // Limpieza semanal
  handleWeeklyCleanup() { /* ... */ }
  
  @Cron('0 0 1 * *') // Limpieza mensual
  handleMonthlyCleanup() { /* ... */ }
  
  @Cron('0 0 1 1 *') // Limpieza anual
  handleYearlyCleanup() { /* ... */ }
}
```

### Deshabilitación Dinámica
```typescript
@Cron('0 2 * * 0')
async handleCleanup() {
  const isEnabled = await this.configService.get('CLEANUP_ENABLED');
  if (!isEnabled) {
    this.logger.log('Cron job deshabilitado por configuración');
    return;
  }
  // ... lógica del cron
}
```

---

**Estado**: ❌ Configuración pendiente  
**Prioridad**: Alta  
**Tiempo estimado**: 4-6 horas de implementación  
**Dependencias**: Stored Procedure de limpieza completado