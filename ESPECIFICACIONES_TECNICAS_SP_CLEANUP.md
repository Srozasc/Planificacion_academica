# Especificaciones Técnicas - Stored Procedure de Limpieza de Bimestres

## 1. Información General

### Nombre del Stored Procedure
`sp_cleanup_old_bimestres`

### Propósito
Eliminar automáticamente bimestres antiguos y todos sus registros dependientes para optimizar el rendimiento de la base de datos y mantener un tamaño manejable de datos históricos.

### Versión
1.0.0

### Fecha de Especificación
2025-01-14

## 2. Arquitectura y Diseño

### 2.1 Parámetros de Entrada

```sql
CREATE PROCEDURE sp_cleanup_old_bimestres(
    IN p_meses_antiguedad INT DEFAULT 24,
    IN p_max_bimestres_por_ejecucion INT DEFAULT 10,
    IN p_modo_debug BOOLEAN DEFAULT FALSE,
    IN p_realizar_backup BOOLEAN DEFAULT TRUE,
    OUT p_bimestres_eliminados INT,
    OUT p_total_registros_eliminados INT,
    OUT p_mensaje_resultado VARCHAR(500)
)
```

#### Descripción de Parámetros

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `p_meses_antiguedad` | INT | 24 | Meses de antigüedad mínima para considerar un bimestre eliminable |
| `p_max_bimestres_por_ejecucion` | INT | 10 | Límite máximo de bimestres a eliminar por ejecución |
| `p_modo_debug` | BOOLEAN | FALSE | Si es TRUE, solo muestra qué se eliminaría sin ejecutar |
| `p_realizar_backup` | BOOLEAN | TRUE | Si es TRUE, verifica que exista backup reciente |
| `p_bimestres_eliminados` | INT | OUT | Número de bimestres eliminados |
| `p_total_registros_eliminados` | INT | OUT | Total de registros eliminados en todas las tablas |
| `p_mensaje_resultado` | VARCHAR(500) | OUT | Mensaje descriptivo del resultado |

### 2.2 Criterios de Selección

#### Condiciones para Eliminación
```sql
WHERE (
    -- Bimestres inactivos
    activo = 0 
    OR 
    -- Bimestres que finalizaron hace más de X meses
    fechaFin < DATE_SUB(NOW(), INTERVAL p_meses_antiguedad MONTH)
)
-- Excluir bimestres con fechas inconsistentes (requieren revisión manual)
AND fechaInicio >= '2000-01-01' 
AND fechaFin >= '2000-01-01'
AND fechaFin > fechaInicio
```

#### Orden de Selección
```sql
ORDER BY createdAt ASC, anoAcademico ASC, numeroBimestre ASC, id ASC
LIMIT p_max_bimestres_por_ejecucion
```

## 3. Estructura de Eliminación

### 3.1 Orden de Eliminación de Tablas

Basado en el análisis de dependencias y el método `deleteWithEvents` existente:

```sql
-- 1. Tablas de permisos y configuración
DELETE FROM usuario_permisos_carrera WHERE bimestre_id IN (@bimestre_ids);

-- 2. Tablas de staging y temporales
DELETE FROM staging_dol WHERE bimestre_id IN (@bimestre_ids);
DELETE FROM staging_adol WHERE bimestre_id IN (@bimestre_ids);

-- 3. Tablas de eventos y profesores
DELETE FROM event_teachers WHERE event_id IN (
    SELECT id FROM schedule_events WHERE bimestre_id IN (@bimestre_ids)
);
DELETE FROM schedule_events WHERE bimestre_id IN (@bimestre_ids);

-- 4. Tablas de logs y auditoría
DELETE FROM upload_logs WHERE bimestre_id IN (@bimestre_ids);

-- 5. Tablas de aprobaciones
DELETE FROM dol_aprobados WHERE bimestre_id IN (@bimestre_ids);
DELETE FROM asignaturas_optativas_aprobadas WHERE bimestre_id IN (@bimestre_ids);

-- 6. Tablas principales de estructura académica
DELETE FROM asignaturas WHERE bimestre_id IN (@bimestre_ids);
DELETE FROM carreras WHERE bimestre_id IN (@bimestre_ids);

-- 7. Otras tablas dependientes identificadas
DELETE FROM academic_structures WHERE bimestre_id IN (@bimestre_ids);
DELETE FROM vacantes_inicio_permanente WHERE bimestre_id IN (@bimestre_ids);

-- 8. Finalmente, la tabla principal
DELETE FROM bimestres WHERE id IN (@bimestre_ids);
```

### 3.2 Manejo de Transacciones

```sql
START TRANSACTION;

DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    GET DIAGNOSTICS CONDITION 1
        @error_code = MYSQL_ERRNO,
        @error_message = MESSAGE_TEXT;
    
    SET p_mensaje_resultado = CONCAT('Error: ', @error_code, ' - ', @error_message);
    
    -- Log del error
    INSERT INTO cleanup_logs (fecha_ejecucion, tipo_operacion, estado, mensaje_error)
    VALUES (NOW(), 'CLEANUP_BIMESTRES', 'ERROR', p_mensaje_resultado);
END;

-- Lógica de eliminación aquí

COMMIT;
```

## 4. Validaciones y Controles

### 4.1 Validaciones Previas

```sql
-- Validar parámetros de entrada
IF p_meses_antiguedad < 6 THEN
    SET p_mensaje_resultado = 'Error: meses_antiguedad debe ser al menos 6';
    LEAVE sp_main;
END IF;

IF p_max_bimestres_por_ejecucion < 1 OR p_max_bimestres_por_ejecucion > 50 THEN
    SET p_mensaje_resultado = 'Error: max_bimestres_por_ejecucion debe estar entre 1 y 50';
    LEAVE sp_main;
END IF;

-- Validar que existan bimestres para eliminar
SELECT COUNT(*) INTO @bimestres_candidatos FROM bimestres WHERE [criterios];
IF @bimestres_candidatos = 0 THEN
    SET p_mensaje_resultado = 'No hay bimestres que cumplan los criterios de eliminación';
    LEAVE sp_main;
END IF;
```

### 4.2 Validaciones de Seguridad

```sql
-- Verificar backup reciente (si está habilitado)
IF p_realizar_backup = TRUE THEN
    -- Lógica para verificar backup reciente
    -- (implementación específica según sistema de backup)
END IF;

-- Verificar integridad antes de eliminar
SELECT COUNT(*) INTO @registros_huerfanos 
FROM schedule_events se 
LEFT JOIN bimestres b ON se.bimestre_id = b.id 
WHERE b.id IS NULL;

IF @registros_huerfanos > 0 THEN
    SET p_mensaje_resultado = CONCAT('Advertencia: ', @registros_huerfanos, ' registros huérfanos detectados');
END IF;
```

## 5. Logging y Auditoría

### 5.1 Tabla de Logs

```sql
CREATE TABLE IF NOT EXISTS cleanup_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_ejecucion DATETIME NOT NULL,
    tipo_operacion VARCHAR(50) NOT NULL,
    estado ENUM('INICIADO', 'COMPLETADO', 'ERROR', 'DEBUG') NOT NULL,
    parametros JSON,
    bimestres_eliminados INT DEFAULT 0,
    registros_eliminados_detalle JSON,
    total_registros_eliminados INT DEFAULT 0,
    tiempo_ejecucion_ms INT,
    mensaje_error TEXT,
    usuario_ejecucion VARCHAR(100),
    INDEX idx_fecha_ejecucion (fecha_ejecucion),
    INDEX idx_tipo_operacion (tipo_operacion)
);
```

### 5.2 Registro de Actividad

```sql
-- Al inicio
INSERT INTO cleanup_logs (fecha_ejecucion, tipo_operacion, estado, parametros, usuario_ejecucion)
VALUES (
    NOW(), 
    'CLEANUP_BIMESTRES', 
    'INICIADO',
    JSON_OBJECT(
        'meses_antiguedad', p_meses_antiguedad,
        'max_bimestres', p_max_bimestres_por_ejecucion,
        'modo_debug', p_modo_debug,
        'realizar_backup', p_realizar_backup
    ),
    USER()
);

-- Al completar
UPDATE cleanup_logs 
SET estado = 'COMPLETADO',
    bimestres_eliminados = p_bimestres_eliminados,
    total_registros_eliminados = p_total_registros_eliminados,
    registros_eliminados_detalle = JSON_OBJECT(
        'usuario_permisos_carrera', @count_permisos,
        'staging_dol', @count_staging_dol,
        'schedule_events', @count_events,
        -- ... otros conteos
    ),
    tiempo_ejecucion_ms = TIMESTAMPDIFF(MICROSECOND, @inicio, NOW()) / 1000
WHERE id = @log_id;
```

## 6. Configuración de Entornos

### 6.1 Producción
```sql
CALL sp_cleanup_old_bimestres(
    36,    -- 3 años de antigüedad
    5,     -- máximo 5 bimestres por ejecución
    FALSE, -- no debug
    TRUE   -- verificar backup
);
```

### 6.2 Desarrollo
```sql
CALL sp_cleanup_old_bimestres(
    12,    -- 1 año de antigüedad
    20,    -- máximo 20 bimestres por ejecución
    TRUE,  -- modo debug
    FALSE  -- no verificar backup
);
```

### 6.3 Testing
```sql
CALL sp_cleanup_old_bimestres(
    6,     -- 6 meses de antigüedad
    50,    -- máximo 50 bimestres por ejecución
    TRUE,  -- modo debug
    FALSE  -- no verificar backup
);
```

## 7. Integración con NestJS

### 7.1 Servicio de Limpieza

```typescript
// cleanup.service.ts
@Injectable()
export class CleanupService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async executeCleanupBimestres(options: CleanupOptions = {}): Promise<CleanupResult> {
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
```

### 7.2 Configuración de Cron Job

```typescript
// cleanup.cron.ts
@Injectable()
export class CleanupCronService {
  private readonly logger = new Logger(CleanupCronService.name);

  constructor(private cleanupService: CleanupService) {}

  @Cron('0 2 * * 0') // Domingos a las 2:00 AM
  async handleWeeklyCleanup() {
    this.logger.log('Iniciando limpieza automática de bimestres');
    
    try {
      const result = await this.cleanupService.executeCleanupBimestres({
        mesesAntiguedad: 36,
        maxBimestresPorEjecucion: 5,
        modoDebug: false,
        realizarBackup: true
      });
      
      this.logger.log(`Limpieza completada: ${result.bimestresEliminados} bimestres eliminados, ${result.totalRegistrosEliminados} registros totales`);
    } catch (error) {
      this.logger.error('Error en limpieza automática:', error);
    }
  }
}
```

## 8. Testing y Validación

### 8.1 Scripts de Testing

```sql
-- test_cleanup_sp.sql

-- 1. Crear datos de prueba
INSERT INTO bimestres (nombre, fechaInicio, fechaFin, anoAcademico, numeroBimestre, activo, createdAt)
VALUES 
('Test Bimestre Antiguo', '2020-01-01', '2020-03-01', 2020, 1, 0, '2020-01-01 00:00:00'),
('Test Bimestre Reciente', '2024-01-01', '2024-03-01', 2024, 1, 1, '2024-01-01 00:00:00');

-- 2. Ejecutar en modo debug
CALL sp_cleanup_old_bimestres(12, 10, TRUE, FALSE, @eliminados, @total, @mensaje);
SELECT @eliminados, @total, @mensaje;

-- 3. Verificar que no se eliminó nada en modo debug
SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'Test Bimestre%';

-- 4. Ejecutar en modo real
CALL sp_cleanup_old_bimestres(12, 10, FALSE, FALSE, @eliminados, @total, @mensaje);
SELECT @eliminados, @total, @mensaje;

-- 5. Verificar eliminación
SELECT COUNT(*) FROM bimestres WHERE nombre LIKE 'Test Bimestre%';

-- 6. Limpiar datos de prueba
DELETE FROM bimestres WHERE nombre LIKE 'Test Bimestre%';
```

### 8.2 Casos de Prueba

1. **Modo Debug**: Verificar que no elimina datos reales
2. **Parámetros Inválidos**: Validar manejo de errores
3. **Sin Datos para Eliminar**: Verificar mensaje apropiado
4. **Eliminación Parcial**: Probar límite de bimestres por ejecución
5. **Error de Transacción**: Verificar rollback automático
6. **Logging**: Confirmar registro correcto de actividad

## 9. Monitoreo y Mantenimiento

### 9.1 Métricas a Monitorear

- Tiempo de ejecución del SP
- Número de bimestres eliminados por ejecución
- Errores o advertencias generadas
- Crecimiento de la tabla de logs
- Impacto en rendimiento de la base de datos

### 9.2 Alertas Recomendadas

- Ejecución que tome más de 30 minutos
- Eliminación de más de 20 bimestres en una ejecución
- Errores consecutivos en el cron job
- Tabla de logs que supere 10,000 registros

## 10. Consideraciones de Seguridad

### 10.1 Permisos Requeridos

- `CREATE ROUTINE`: Para crear el stored procedure
- `EXECUTE`: Para ejecutar el stored procedure
- `SELECT, INSERT, UPDATE, DELETE`: En todas las tablas involucradas
- `CREATE TEMPORARY TABLES`: Para tablas temporales durante el proceso

### 10.2 Backup y Recuperación

- **Backup automático**: Antes de cada ejecución en producción
- **Punto de restauración**: Crear snapshot antes de limpiezas grandes
- **Procedimiento de rollback**: Documentar pasos para revertir eliminaciones

## 11. Roadmap y Mejoras Futuras

### Versión 1.1
- Soporte para eliminación selectiva por año académico
- Interfaz web para configuración de parámetros
- Reportes detallados de limpieza

### Versión 1.2
- Compresión de datos antes de eliminación
- Archivado automático de datos históricos
- Integración con sistema de notificaciones

### Versión 2.0
- Limpieza inteligente basada en uso de datos
- Predicción de crecimiento de base de datos
- Optimización automática de índices post-limpieza

---

**Documento generado el**: 2025-01-14  
**Versión**: 1.0.0  
**Autor**: Sistema de Planificación Académica  
**Próxima revisión**: 2025-04-14