# Análisis de Impacto: Eliminación Automática de Registros ADOL Pendientes

## Problema Identificado

Actualmente, cuando se cargan múltiples archivos ADOL, cada carga genera un nuevo registro en la tabla `upload_logs`, resultando en múltiples registros ADOL con estado "Pendiente" para el mismo bimestre. Esto causa confusión en el historial de cargas.

## Comportamiento Actual

### Flujo de Carga ADOL
1. Usuario carga archivo ADOL → Se crea registro en `upload_logs` con estado "Pendiente"
2. Usuario carga otro archivo ADOL → Se crea OTRO registro en `upload_logs` con estado "Pendiente"
3. Resultado: Múltiples registros ADOL pendientes para el mismo bimestre

### Código Actual (método `logUpload`)
```typescript
private async logUpload(
  fileName: string,
  uploadType: string,
  bimestreId: number,
  // ... otros parámetros
): Promise<void> {
  try {
    const uploadLog = this.uploadLogRepository.create({
      fileName,
      uploadType,
      bimestreId,
      status,
      totalRecords,
      errorCount,
      userId,
      errorDetails,
      approvalStatus: 'Pendiente',
      isProcessed: false
    });

    await this.uploadLogRepository.save(uploadLog);
    // ...
  }
}
```

## Solución Implementada

### Nuevo Comportamiento
1. Usuario carga archivo ADOL → Se eliminan registros ADOL pendientes anteriores del mismo bimestre → Se crea nuevo registro
2. Usuario carga otro archivo ADOL → Se eliminan registros ADOL pendientes anteriores del mismo bimestre → Se crea nuevo registro
3. Resultado: Solo UN registro ADOL pendiente por bimestre

### Código Modificado
```typescript
private async logUpload(
  fileName: string,
  uploadType: string,
  bimestreId: number,
  // ... otros parámetros
): Promise<void> {
  try {
    // NUEVO: Si es un archivo ADOL, eliminar registros pendientes anteriores
    if (uploadType === 'ADOL') {
      this.logger.log(`Eliminando registros ADOL pendientes anteriores para bimestre ${bimestreId}...`);
      const deletedCount = await this.uploadLogRepository.delete({
        uploadType: 'ADOL',
        bimestreId: bimestreId,
        approvalStatus: 'Pendiente'
      });
      this.logger.log(`Registros ADOL pendientes eliminados: ${deletedCount.affected || 0}`);
    }

    const uploadLog = this.uploadLogRepository.create({
      // ... mismo código anterior
    });

    await this.uploadLogRepository.save(uploadLog);
    // ...
  }
}
```

## Análisis de Impacto

### ✅ Impactos Positivos

1. **Eliminación de Confusión**: Solo habrá un registro ADOL pendiente por bimestre
2. **Historial Más Limpio**: El historial de cargas será más claro y fácil de entender
3. **Comportamiento Intuitivo**: Coincide con la expectativa del usuario
4. **Mantenimiento de Funcionalidad**: La limpieza de tablas staging se mantiene intacta

### ⚠️ Consideraciones de Seguridad

1. **Solo Afecta Registros Pendientes**: Los registros aprobados NO se eliminan
2. **Específico por Bimestre**: Solo elimina registros del mismo bimestre
3. **Específico por Tipo**: Solo afecta archivos ADOL, no otros tipos
4. **Logging Completo**: Se registra cuántos registros se eliminan

### 🔍 Casos de Uso Afectados

#### Caso 1: Carga Inicial ADOL
- **Antes**: Se crea registro pendiente
- **Después**: Se crea registro pendiente (sin cambios)

#### Caso 2: Segunda Carga ADOL (mismo bimestre)
- **Antes**: Se crea segundo registro pendiente (problema)
- **Después**: Se elimina primer registro pendiente, se crea nuevo registro

#### Caso 3: Carga ADOL con Registro Aprobado Existente
- **Antes**: Se crea registro pendiente adicional
- **Después**: Se crea registro pendiente (registro aprobado se mantiene intacto)

#### Caso 4: Carga ADOL en Diferente Bimestre
- **Antes**: Se crea registro pendiente
- **Después**: Se crea registro pendiente (sin afectar otros bimestres)

### 📊 Impacto en Base de Datos

#### Tabla `upload_logs`
- **Operación Adicional**: `DELETE` antes de `INSERT` para archivos ADOL
- **Condiciones de Eliminación**: 
  - `uploadType = 'ADOL'`
  - `bimestreId = [bimestre actual]`
  - `approvalStatus = 'Pendiente'`

#### Tablas Staging
- **Sin Cambios**: La limpieza de `staging_adol_simple` se mantiene igual

### 🚀 Beneficios del Cambio

1. **Experiencia de Usuario Mejorada**: Elimina confusión en el historial
2. **Consistencia de Datos**: Un solo registro pendiente por tipo/bimestre
3. **Mantenimiento Simplificado**: Menos registros huérfanos en la base de datos
4. **Comportamiento Predecible**: Los usuarios sabrán que solo el último archivo cargado está pendiente

### ⚡ Riesgos Mínimos

1. **Pérdida de Historial Detallado**: Se pierde el registro de cargas intermedias fallidas
   - **Mitigación**: Los logs de aplicación mantienen el historial detallado

2. **Cambio de Comportamiento**: Los usuarios deben adaptarse al nuevo comportamiento
   - **Mitigación**: El comportamiento es más intuitivo que el anterior

## Recomendaciones

### ✅ Implementar el Cambio
- El cambio es seguro y mejora significativamente la experiencia del usuario
- Los riesgos son mínimos y están bien mitigados
- El comportamiento resultante es más intuitivo

### 📝 Documentación
- Actualizar documentación de usuario sobre el nuevo comportamiento
- Informar al equipo sobre el cambio en el flujo de cargas ADOL

### 🧪 Pruebas Recomendadas
1. Cargar archivo ADOL inicial
2. Cargar segundo archivo ADOL (verificar eliminación del primero)
3. Aprobar archivo ADOL y cargar nuevo (verificar que aprobado se mantiene)
4. Cargar ADOL en diferentes bimestres (verificar aislamiento)

## Conclusión

**El cambio es RECOMENDADO** ya que:
- Resuelve el problema reportado
- Mejora la experiencia del usuario
- Mantiene la integridad de datos
- Tiene riesgos mínimos y bien controlados
- Es fácil de implementar y mantener