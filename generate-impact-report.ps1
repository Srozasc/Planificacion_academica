# Script para generar reporte consolidado de impacto
# Proyecto: Agendador Campus - Análisis de Archivos Excel
# Fecha: 17 de Julio, 2025

Write-Host "=== GENERADOR DE REPORTE DE IMPACTO CRITICO ===" -ForegroundColor Red
Write-Host "Proyecto: Agendador Campus" -ForegroundColor Yellow
Write-Host "Fecha: $(Get-Date -Format 'dd/MM/yyyy HH:mm')" -ForegroundColor Gray
Write-Host ""

# Verificar archivos de análisis
$analysisFiles = @(
    "ANALISIS_IMPACTO_ARCHIVOS_EXCEL.md",
    "RESUMEN_EJECUTIVO_IMPACTO_CRITICO.md",
    "excel-structure-analysis.json",
    "analyze-excel-impact.js"
)

Write-Host "[INFO] Verificando archivos de analisis..." -ForegroundColor Cyan

foreach ($file in $analysisFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  [OK] $file ($([math]::Round($size/1024, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $file - NO ENCONTRADO" -ForegroundColor Red
    }
}

Write-Host ""

# Verificar archivos Excel de entrada
Write-Host "[INFO] Verificando archivos Excel de entrada..." -ForegroundColor Cyan

$excelPath = "Insumos de entrada"
if (Test-Path $excelPath) {
    $excelFiles = Get-ChildItem -Path $excelPath -Filter "*.xlsx"
    Write-Host "  [DIR] Directorio: $excelPath" -ForegroundColor Yellow
    
    foreach ($file in $excelFiles) {
        $size = [math]::Round($file.Length/1024, 2)
        Write-Host "    [FILE] $($file.Name) ($size KB)" -ForegroundColor White
    }
    
    Write-Host "  [INFO] Total de archivos Excel: $($excelFiles.Count)" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Directorio 'Insumos de entrada' no encontrado" -ForegroundColor Red
}

Write-Host ""

# Leer y mostrar estadísticas del análisis JSON
Write-Host "[INFO] Estadisticas del analisis..." -ForegroundColor Cyan

if (Test-Path "excel-structure-analysis.json") {
    try {
        $analysisData = Get-Content "excel-structure-analysis.json" | ConvertFrom-Json
        
        Write-Host "  [STATS] Resumen del analisis:" -ForegroundColor Yellow
        Write-Host "    • Total de archivos analizados: $($analysisData.summary.totalFiles)" -ForegroundColor White
        Write-Host "    • Archivos con impacto ALTO: $($analysisData.summary.highImpactFiles)" -ForegroundColor Red
        Write-Host "    • Archivos con impacto DESCONOCIDO: $($analysisData.summary.unknownImpactFiles)" -ForegroundColor Orange
        Write-Host "    • Recomendación general: $($analysisData.summary.overallRecommendation)" -ForegroundColor $(if($analysisData.summary.overallRecommendation -eq 'HIGH') {'Red'} else {'Yellow'})
        
        Write-Host "  [DETAILS] Detalles por archivo:" -ForegroundColor Yellow
        foreach ($file in $analysisData.files) {
            $impactColor = switch ($file.impact) {
                'HIGH' { 'Red' }
                'MEDIUM' { 'Yellow' }
                'LOW' { 'Green' }
                default { 'Gray' }
            }
            Write-Host "    • $($file.fileName): $($file.impact) ($($file.totalRows) registros)" -ForegroundColor $impactColor
        }
    } catch {
        Write-Host "  [ERROR] Error al leer el archivo de analisis JSON" -ForegroundColor Red
    }
} else {
    Write-Host "  [ERROR] Archivo de analisis JSON no encontrado" -ForegroundColor Red
}

Write-Host ""

# Generar reporte consolidado
Write-Host "[INFO] Generando reporte consolidado..." -ForegroundColor Cyan

$reportContent = @"
# REPORTE CONSOLIDADO DE IMPACTO CRÍTICO
## Proyecto Agendador Campus - Análisis de Archivos Excel

**Fecha de Generación:** $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')
**Estado del Proyecto:** 🚨 CRÍTICO - REQUIERE DECISIÓN INMEDIATA

---

## 📋 ARCHIVOS DE ANÁLISIS GENERADOS

"@

foreach ($file in $analysisFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $reportContent += "`n- [OK] **$file** ($([math]::Round($size/1024, 2)) KB)"
    } else {
        $reportContent += "`n- [ERROR] **$file** - NO ENCONTRADO"
    }
}

$reportContent += @"


## 🎯 PRÓXIMOS PASOS CRÍTICOS

### Inmediatos (24-48 horas)
- [ ] **Reunión de emergencia** con stakeholders
- [ ] **Revisión del presupuesto** del proyecto
- [ ] **Evaluación de viabilidad** técnica
- [ ] **Decisión sobre continuidad** del proyecto

### Urgentes (Esta semana)
- [ ] **Backup completo** de sistemas actuales
- [ ] **Plan de contingencia** definido
- [ ] **Comunicación a equipos** sobre pausa
- [ ] **Estrategia de mitigación** de riesgos

---

## 📞 CONTACTOS DE EMERGENCIA

- **Líder Técnico:** [Nombre] - [Email] - [Teléfono]
- **Project Manager:** [Nombre] - [Email] - [Teléfono]
- **Stakeholder Principal:** [Nombre] - [Email] - [Teléfono]

---

> ⚠️ **IMPORTANTE:** Este reporte fue generado automáticamente. 
> Para información detallada, revisar los archivos de análisis individuales.

"@

# Guardar reporte consolidado
$reportPath = "REPORTE_CONSOLIDADO_$(Get-Date -Format 'yyyyMMdd_HHmm').md"
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "  [OK] Reporte consolidado generado: $reportPath" -ForegroundColor Green

Write-Host ""
Write-Host "=== REPORTE COMPLETADO ===" -ForegroundColor Green
Write-Host "[INFO] Archivos disponibles para revision:" -ForegroundColor Cyan
Write-Host "  - Analisis detallado: ANALISIS_IMPACTO_ARCHIVOS_EXCEL.md" -ForegroundColor White
Write-Host "  - Resumen ejecutivo: RESUMEN_EJECUTIVO_IMPACTO_CRITICO.md" -ForegroundColor White
Write-Host "  - Datos tecnicos: excel-structure-analysis.json" -ForegroundColor White
Write-Host "  - Reporte consolidado: $reportPath" -ForegroundColor White

Write-Host ""
Write-Host "[CRITICO] ACCION REQUERIDA: Revisar documentos y convocar reunion de emergencia" -ForegroundColor Red -BackgroundColor Yellow
Write-Host ""

# Abrir el resumen ejecutivo automáticamente
if (Test-Path "RESUMEN_EJECUTIVO_IMPACTO_CRITICO.md") {
    Write-Host "[INFO] Abriendo resumen ejecutivo..." -ForegroundColor Cyan
    Start-Process "RESUMEN_EJECUTIVO_IMPACTO_CRITICO.md"
}

Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")