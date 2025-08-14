# Implementación del Reporte de Programación de Pago

## Resumen Ejecutivo

Este documento detalla la implementación del **Reporte de Programación de Pago** en el sistema de Planificación Académica. El reporte permite generar archivos Excel con información detallada sobre la programación de pagos y aspectos financieros, utilizando el procedimiento almacenado `SP_ReporteProgramacionPagos`.

## Arquitectura del Sistema

### Backend (NestJS)
- **Controlador**: `reports.controller.ts` - Maneja las peticiones HTTP
- **Servicio**: `reports.service.ts` - Lógica de negocio y generación de Excel
- **DTO**: `report-query.dto.ts` - Validación de parámetros de entrada
- **Base de Datos**: MySQL con procedimiento almacenado `SP_ReporteProgramacionPagos`

### Frontend (React)
- **Página**: `ReportsPage.tsx` - Interfaz de usuario para reportes
- **Servicio**: `report.service.ts` - Comunicación con el backend

## Implementación Paso a Paso

### 1. Creación del DTO (Data Transfer Object)

**Archivo**: `backend/src/reports/dto/report-query.dto.ts`

```typescript
export class ProgramacionPagoReportDto {
  @IsNotEmpty({ message: 'El ID del bimestre es requerido' })
  @IsNumber({}, { message: 'El ID del bimestre debe ser un número' })
  @Type(() => Number)
  bimestreId: number;
}
```

### 2. Implementación del Controlador

**Archivo**: `backend/src/reports/reports.controller.ts`

```typescript
@Post('programacion-pago')
@ApiOperation({ summary: 'Generar reporte de programación de pago en Excel' })
@ApiResponse({ status: 200, description: 'Archivo Excel generado exitosamente' })
async generateProgramacionPagoReport(
  @Body() dto: ProgramacionPagoReportDto,
  @Res() res: Response,
): Promise<void> {
  const buffer = await this.reportsService.generateProgramacionPagoReport(dto);
  
  const filename = `reporte_programacion_pago_${dto.bimestreId}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': buffer.length,
  });
  
  res.send(buffer);
}
```

### 3. Implementación del Servicio

**Archivo**: `backend/src/reports/reports.service.ts`

#### Método Principal
```typescript
async generateProgramacionPagoReport(dto: ProgramacionPagoReportDto): Promise<Buffer> {
  const data = await this.callStoredProcedurePago(dto.bimestreId);
  return this.generateExcelFilePago(data);
}
```

#### Llamada al Procedimiento Almacenado
```typescript
private async callStoredProcedurePago(bimestreId: number): Promise<any[]> {
  const result = await this.databaseService.executeStoredProcedure(
    'SP_ReporteProgramacionPagos',
    [bimestreId]
  );
  
  return result[0] || [];
}
```

#### Generación del Archivo Excel
```typescript
private generateExcelFilePago(data: any[]): Buffer {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte Programación Pago');
  
  // Definir encabezados
  const headers = [
    'Usuario', 'Nombre Asignatura', 'SIGLA', 'ID Docente', 'Docente',
    'Horas a Pago', 'ID Evento 1', 'Fecha Evento 1', 'Horas Evento 1',
    'ID Evento 2', 'Fecha Evento 2', 'Horas Evento 2', 'Observaciones'
  ];
  
  worksheet.addRow(headers);
  
  // Agregar datos
  data.forEach(row => {
    worksheet.addRow([
      row.usuario,
      row.Nombre_asignatura,
      row.SIGLA,
      row.ID_Docente,
      row.Docente,
      row.Horas_a_pago,
      row.ID_Evento_1,
      row.Fecha_evento_1,
      row.Horas_Evento_1,
      row.ID_Evento2,
      row.Fecha_evento_2,
      row.Horas_Evento2,
      row.Observaciones
    ]);
  });
  
  // Ajustar ancho de columnas
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}
```

### 4. Implementación del Frontend

**Archivo**: `frontend/src/features/reports/services/report.service.ts`

```typescript
async downloadProgramacionPagoReport(): Promise<void> {
  try {
    // Obtener el bimestre ID del navbar (igual que el reporte académico)
    const bimestreElement = document.querySelector('[data-bimestre-id]');
    const bimestreId = bimestreElement?.getAttribute('data-bimestre-id');
    
    if (!bimestreId) {
      alert('No se pudo obtener el ID del bimestre. Por favor, seleccione un bimestre.');
      return;
    }

    // Llamar al endpoint del backend
    const response = await apiClient.post('/reports/programacion-pago', 
      { bimestreId: parseInt(bimestreId) },
      { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      }
    );
    
    // Crear URL para descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const fileName = `reporte_programacion_pago_bimestre_${bimestreId}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error generando reporte de programación de pago:', error);
    alert('Error al generar el reporte de programación de pago');
  }
}
```

## Estructura del Procedimiento Almacenado

### SP_ReporteProgramacionPagos

**Parámetros de Entrada:**
- `p_bimestre_id` (INT): ID del bimestre requerido

**Columnas de Salida:**
- `usuario`: Usuario del sistema
- `Nombre_asignatura`: Nombre de la asignatura
- `SIGLA`: Sigla de la asignatura
- `ID_Docente`: Identificador del docente
- `Docente`: Nombre del docente
- `Horas_a_pago`: Horas a pagar
- `ID_Evento_1`: ID del primer evento
- `Fecha_evento_1`: Fecha del primer evento
- `Horas_Evento_1`: Horas del primer evento
- `ID_Evento2`: ID del segundo evento
- `Fecha_evento_2`: Fecha del segundo evento
- `Horas_Evento2`: Horas del segundo evento
- `Observaciones`: Observaciones adicionales

## Flujo de Funcionamiento

1. **Usuario accede a la página de reportes** (`/reports`)
2. **Usuario selecciona un bimestre** desde el navbar (igual que otros reportes)
3. **Selecciona el reporte de programación de pago** desde la lista
4. **Sistema obtiene automáticamente el bimestreId** del navbar
5. **Frontend envía petición POST** a `/api/reports/programacion-pago`
6. **Backend valida parámetros** usando el DTO
7. **Servicio ejecuta el SP** `SP_ReporteProgramacionPagos`
8. **Sistema genera archivo Excel** con los datos obtenidos
9. **Usuario descarga el archivo** automáticamente

## Características Técnicas

### Validaciones
- **bimestreId**: Requerido, debe ser numérico
- **Formato de respuesta**: Excel (.xlsx)

### Manejo de Errores
- **401**: Sin permisos para generar el reporte
- **500**: Error interno del servidor
- **Validación**: Parámetros inválidos

### Seguridad
- Validación de tipos de datos
- Sanitización de parámetros
- Control de acceso mediante autenticación

## Archivos Modificados

### Backend
1. `backend/src/reports/dto/report-query.dto.ts` - Nuevo DTO
2. `backend/src/reports/reports.controller.ts` - Nuevo endpoint
3. `backend/src/reports/reports.service.ts` - Nueva lógica de negocio

### Frontend
1. `frontend/src/features/reports/services/report.service.ts` - Nueva funcionalidad de descarga

## Pruebas y Validación

### Casos de Prueba
1. **ID de bimestre válido**: Verificar generación correcta del Excel
2. **ID de bimestre inválido**: Verificar mensaje de error
3. **Datos vacíos**: Verificar comportamiento con SP sin resultados
4. **Errores de conexión**: Verificar manejo de errores de base de datos

### Logs de Verificación
```
[Nest] LOG [RouterExplorer] Mapped {/api/reports/programacion-pago, POST} route
```

## Conclusiones

La implementación del **Reporte de Programación de Pago** se completó exitosamente siguiendo los mismos patrones arquitectónicos del reporte de programación académica. El sistema:

- ✅ **Mantiene consistencia** con la arquitectura existente
- ✅ **Implementa validaciones robustas** de parámetros
- ✅ **Genera archivos Excel** con formato profesional
- ✅ **Maneja errores** de forma apropiada
- ✅ **Proporciona interfaz intuitiva** para el usuario

El reporte está listo para uso en producción y puede ser extendido fácilmente para incluir funcionalidades adicionales como filtros avanzados o diferentes formatos de exportación.