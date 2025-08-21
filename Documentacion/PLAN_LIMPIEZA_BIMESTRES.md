# Plan de Implementación: Limpieza Automática de Bimestres

## Objetivo
Implementar un sistema automático que elimine bimestres antiguos, **GARANTIZANDO que SIEMPRE se mantengan los 10 bimestres más recientes**, independientemente de su antigüedad. El sistema se ejecuta automáticamente y utiliza criterios de antigüedad solo para bimestres que excedan los 10 más recientes.

## ⚠️ PROBLEMA IDENTIFICADO Y SOLUCIONADO

**Problema original:** El stored procedure inicial eliminaba bimestres basándose únicamente en criterios de antigüedad (meses), sin garantizar que se mantuvieran los 10 más recientes. Esto causó que en las pruebas se eliminaran TODOS los bimestres cuando solo había 5.

**Solución implementada:** 
- ✅ **Protección absoluta**: NUNCA elimina los 10 bimestres más recientes
- ✅ **Validación de seguridad**: Si hay ≤10 bimestres totales, no elimina nada
- ✅ **Lógica combinada**: Solo elimina bimestres que sean >10° más reciente Y cumplan criterios de antigüedad

## Arquitectura de la Solución
- **Stored Procedure**: `sp_cleanup_old_bimestres` en la base de datos (CORREGIDO)
- **Servicio NestJS**: `BimestreCleanupService` con cron job
- **Controlador opcional**: Para ejecución manual
- **Tests de protección**: Validación específica de la protección de bimestres recientes

---

## FASE 1: Análisis y Preparación

### Paso 1.1: Verificar estructura actual de bimestres
- [ ] Revisar tabla `bimestres` y sus campos
- [ ] Identificar relaciones y dependencias (FK)
- [ ] Verificar método `deleteWithEvents()` existente
- [ ] Documentar tablas relacionadas que se afectan

### Paso 1.2: Backup y seguridad
- [ ] Crear backup completo de la base de datos
- [ ] Documentar proceso de rollback
- [ ] Verificar permisos de usuario para SP

---

## FASE 2: Desarrollo del Stored Procedure

### Paso 2.1: Crear el Stored Procedure base ✅ COMPLETADO
```sql
-- Archivo: create_sp_cleanup_old_bimestres.sql
CREATE PROCEDURE sp_cleanup_old_bimestres(
    IN p_months_threshold INT,
    IN p_max_bimestres_per_execution INT,
    IN p_debug_mode BOOLEAN,
    IN p_perform_backup BOOLEAN,
    OUT p_execution_id VARCHAR(36),
    OUT p_bimestres_deleted INT,
    OUT p_total_records_deleted INT,
    OUT p_status VARCHAR(50),
    OUT p_error_message TEXT
)
```

**Características implementadas:**
- ✅ **PROTECCIÓN GARANTIZADA**: Mantiene SIEMPRE los 10 bimestres más recientes
- ✅ **Validación de seguridad**: Si hay ≤10 bimestres totales, NO elimina nada
- ✅ **Lógica ROW_NUMBER()**: Usa ranking para identificar los más recientes
- ✅ **Criterios combinados**: Solo elimina bimestres que sean >10° más reciente Y cumplan antigüedad
- ✅ **Manejo completo de transacciones y errores**
- ✅ **Logging detallado en tabla cleanup_logs**

### Paso 2.2: Probar el Stored Procedure
- [ ] Ejecutar en modo de prueba (SELECT sin DELETE)
- [ ] Verificar que identifica correctamente los bimestres
- [ ] Probar con diferentes valores de parámetro
- [ ] Validar manejo de errores

---

## FASE 3: Desarrollo del Servicio NestJS

### Paso 3.1: Crear el servicio de limpieza
**Archivo:** `backend/src/bimestres/bimestre-cleanup.service.ts`

- [ ] Crear clase `BimestreCleanupService`
- [ ] Implementar método `executeAnnualCleanup()` con cron
- [ ] Implementar método `executeManualCleanup()`
- [ ] Agregar logging y manejo de errores
- [ ] Configurar cron job para 1 de enero 2:00 AM

### Paso 3.2: Crear controlador opcional
**Archivo:** `backend/src/bimestres/bimestre-cleanup.controller.ts`

- [ ] Crear `BimestreCleanupController`
- [ ] Implementar endpoint `POST /bimestres/cleanup`
- [ ] Agregar protección con roles (`@Roles('Maestro')`)
- [ ] Implementar validación de parámetros

### Paso 3.3: Integrar en el módulo
- [ ] Actualizar `bimestre.module.ts`
- [ ] Registrar el nuevo servicio
- [ ] Registrar el controlador
- [ ] Verificar imports necesarios

---

## FASE 4: Testing y Validación

### Paso 4.1: Pruebas unitarias
- [ ] Crear tests para `BimestreCleanupService`
- [ ] Mockear llamadas a base de datos
- [ ] Probar diferentes escenarios (éxito, error, pocos bimestres)
- [ ] Verificar logging

### Paso 4.2: Pruebas de integración
- [ ] Probar SP directamente en base de datos
- [ ] Probar servicio NestJS completo
- [ ] Probar endpoint REST
- [ ] Verificar cron job (cambiar temporalmente la programación)

### Paso 4.3: Pruebas de seguridad
- [ ] Verificar que solo usuarios con rol 'Maestro' pueden ejecutar
- [ ] Probar con usuarios sin permisos
- [ ] Verificar que el cron job funciona sin autenticación

---

## FASE 5: Despliegue y Monitoreo

### Paso 5.1: Despliegue en desarrollo
- [ ] Ejecutar migración del SP en BD de desarrollo
- [ ] Desplegar código NestJS
- [ ] Probar funcionamiento completo
- [ ] Verificar logs

### Paso 5.2: Despliegue en producción
- [ ] Crear backup de producción
- [ ] Ejecutar migración del SP
- [ ] Desplegar código
- [ ] Configurar monitoreo de logs
- [ ] Documentar proceso para el equipo

### Paso 5.3: Monitoreo post-despliegue
- [ ] Configurar alertas para errores del cron job
- [ ] Establecer revisión mensual de logs
- [ ] Documentar métricas de limpieza

---

## ARCHIVOS A CREAR/MODIFICAR

### Nuevos archivos:
1. `database/migrations/create-sp-cleanup-bimestres.sql`
2. `backend/src/bimestres/bimestre-cleanup.service.ts`
3. `backend/src/bimestres/bimestre-cleanup.controller.ts`
4. `backend/src/bimestres/dto/cleanup-bimestre.dto.ts`
5. `backend/tests/unit/bimestre-cleanup.service.spec.ts`
6. `backend/tests/integration/bimestre-cleanup.integration.spec.ts`

### Archivos a modificar:
1. `backend/src/bimestres/bimestre.module.ts`
2. `backend/package.json` (si se necesitan nuevas dependencias)

---

## CONFIGURACIONES NECESARIAS

### Variables de entorno
```env
# Configuración del cron job
CLEANUP_ENABLED=true
CLEANUP_BIMESTRES_TO_KEEP=10
CLEANUP_CRON_SCHEDULE="0 2 1 1 *"
```

### Dependencias adicionales
- `@nestjs/schedule` (para cron jobs)
- `@nestjs/cqrs` (si se usa patrón CQRS)

---

## CRITERIOS DE ACEPTACIÓN

- [ ] El SP elimina correctamente bimestres antiguos sin restricción de estado activo
- [ ] Se mantienen exactamente los N bimestres más recientes (por defecto 10)
- [ ] El cron job se ejecuta automáticamente el 1 de enero
- [ ] Existe endpoint manual para ejecución bajo demanda
- [ ] Solo usuarios con rol 'Maestro' pueden ejecutar manualmente
- [ ] Se registran logs detallados de cada ejecución
- [ ] El proceso es transaccional (rollback en caso de error)
- [ ] Existe documentación completa del proceso

---

## RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Eliminación accidental de datos críticos | Media | Alto | Backups automáticos, testing exhaustivo |
| Fallo del cron job | Baja | Medio | Monitoreo, alertas, ejecución manual |
| Problemas de rendimiento | Baja | Medio | Ejecución en horario de baja actividad |
| Dependencias no identificadas | Media | Alto | Análisis detallado de FK, testing |

---

## CRONOGRAMA ESTIMADO

- **Fase 1**: 1 día
- **Fase 2**: 2 días
- **Fase 3**: 2 días
- **Fase 4**: 2 días
- **Fase 5**: 1 día

**Total estimado**: 8 días laborales

---

## PRÓXIMOS PASOS

1. Revisar y aprobar este plan
2. Comenzar con la Fase 1: Análisis y Preparación
3. Ejecutar cada fase secuencialmente
4. Documentar cualquier desviación del plan
5. Actualizar este documento según sea necesario

---

*Documento creado: [Fecha]*  
*Última actualización: [Fecha]*  
*Responsable: [Nombre]*