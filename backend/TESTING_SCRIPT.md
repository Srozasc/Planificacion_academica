# Script de Pruebas Completas - Sistema de Cargas Masivas

**Fecha**: 16 de junio de 2025  
**Versión**: 2.0 - Con autenticación y guards

## 🧪 PRUEBAS A REALIZAR

### 1. **Autenticación**
```powershell
# Obtener token de autenticación
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email_institucional":"admin@planificacion.edu","password":"admin123"}'
$token = $loginResponse.access_token
$headers = @{"Authorization"="Bearer $token"; "Content-Type"="application/json"}

Write-Host "✅ Token obtenido: $($token.Substring(0,20))..."
```

### 2. **Endpoints Protegidos**
```powershell
# Templates
$templates = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/templates" -Headers $headers
Write-Host "✅ Templates: $($templates.availableTemplates.Count) tipos disponibles"

# Health Check
$health = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/admin/health" -Headers $headers
Write-Host "✅ Health: $($health.status)"

# Stats
$stats = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/admin/stats" -Headers $headers
Write-Host "✅ Stats obtenidas"
```

### 3. **Validación de Archivos**
```powershell
# Validar archivo de estructuras académicas
$validateHeaders = @{"Authorization"="Bearer $token"}
$form = @{
    file = Get-Item "test_academic_structures.xlsx"
}

try {
    $validateResult = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/validate/academic-structures" -Method POST -Headers $validateHeaders -Form $form
    Write-Host "✅ Validación exitosa: $($validateResult.totalRecords) registros"
} catch {
    Write-Host "❌ Error en validación: $($_.Exception.Message)"
}
```

### 4. **Carga de Archivos**
```powershell
# Cargar archivo de estructuras académicas
try {
    $uploadResult = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/academic-structures" -Method POST -Headers $validateHeaders -Form $form
    Write-Host "✅ Carga exitosa: $($uploadResult.processedRecords) registros procesados"
} catch {
    Write-Host "❌ Error en carga: $($_.Exception.Message)"
}
```

## 🔍 VALIDACIONES ESPERADAS

### **Protección de Endpoints**
- ✅ Sin token: HTTP 401 (Unauthorized)
- ✅ Token inválido: HTTP 401 (Unauthorized)  
- ✅ Rol incorrecto: HTTP 403 (Forbidden)
- ✅ Admin válido: HTTP 200 (Success)

### **Funcionalidad de Archivos**
- ✅ Archivo válido: Procesamiento exitoso
- ✅ Archivo inválido: Error descriptivo
- ✅ Sin archivo: HTTP 400 (Bad Request)
- ✅ Tipo incorrecto: HTTP 400 (Bad Request)

### **Stored Procedures**
- ✅ Conexión BD: Verificada antes de ejecutar
- ✅ Parámetros: JSON válido enviado
- ✅ Resultados: Respuesta estructurada
- ✅ Errores: Manejo específico por tipo

### **Logging**
- ✅ Operaciones: Inicio y fin loggeados
- ✅ Errores: Stack trace completo
- ✅ Performance: Tiempo de ejecución
- ✅ Archivos: Cleanup automático

## 🚀 COMANDO COMPLETO DE PRUEBA

```powershell
# Script completo de pruebas
$ErrorActionPreference = "Continue"

Write-Host "🧪 Iniciando pruebas del sistema de cargas masivas..." -ForegroundColor Green

# 1. Autenticación
Write-Host "`n1. 🔐 Probando autenticación..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email_institucional":"admin@planificacion.edu","password":"admin123"}'
    $token = $loginResponse.access_token
    $headers = @{"Authorization"="Bearer $token"}
    Write-Host "   ✅ Login exitoso" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Templates
Write-Host "`n2. 📋 Probando templates..." -ForegroundColor Yellow
try {
    $templates = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/templates" -Headers $headers
    Write-Host "   ✅ Templates obtenidas: $($templates.availableTemplates.Count) tipos" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en templates: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Health Check
Write-Host "`n3. 🏥 Probando health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/admin/health" -Headers $headers
    Write-Host "   ✅ Health check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en health: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Stats
Write-Host "`n4. 📊 Probando estadísticas..." -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/admin/stats" -Headers $headers
    Write-Host "   ✅ Stats obtenidas" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error en stats: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Pruebas básicas completadas!" -ForegroundColor Green
Write-Host "📝 Para pruebas de archivos, ejecuta: node create-test-files.js" -ForegroundColor Cyan
```

## 🎯 RESULTADOS ESPERADOS

Al ejecutar las pruebas, deberías ver:
- ✅ Autenticación funcionando
- ✅ Todos los endpoints protegidos accesibles
- ✅ Templates con información detallada
- ✅ Health check reportando estado saludable
- ✅ Stats mostrando información del sistema

Si alguna prueba falla, revisar:
1. **Servidor corriendo** en puerto 3001
2. **Base de datos** conectada
3. **Usuario admin** existe y activo
4. **Stored procedures** implementados
5. **Permisos** de archivos en directorio temp/
