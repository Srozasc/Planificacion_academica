# Script de Pruebas Completas - Sistema de Cargas Masivas

## Pasos para probar después del reinicio del servidor:

### 1. Obtener Token de Autenticación
```powershell
$loginBody = @{
    email_institucional = "admin@planificacion.edu"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
$token = $loginResponse.access_token
Write-Host "Token obtenido: $($token.Substring(0,20))..."
```

### 2. Probar Endpoint de Plantillas
```powershell
$headers = @{"Authorization" = "Bearer $token"}
$templates = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/templates" -Headers $headers
Write-Host "Plantillas disponibles: $($templates.availableTemplates -join ', ')"
```

### 3. Probar Health Check
```powershell
$health = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/admin/health" -Headers $headers
Write-Host "Estado del sistema: $($health.status)"
```

### 4. Generar Archivos de Prueba
```powershell
cd backend
node create-test-files.js
Write-Host "Archivos de prueba generados"
```

### 5. Probar Validación de Archivos
```powershell
# Validar academic-structures
$validationResult = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/validate/academic-structures" -Method POST -Headers $headers -Form @{
    file = Get-Item "test_academic_structures.xlsx"
}
Write-Host "Validación academic-structures: $($validationResult.success)"

# Validar teachers
$validationResult = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/validate/teachers" -Method POST -Headers $headers -Form @{
    file = Get-Item "test_teachers.xlsx"
}
Write-Host "Validación teachers: $($validationResult.success)"
```

### 6. Probar Carga Real de Archivos
```powershell
# Cargar academic-structures
$uploadResult = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/academic-structures" -Method POST -Headers $headers -Form @{
    file = Get-Item "test_academic_structures.xlsx"
}
Write-Host "Carga academic-structures: $($uploadResult.success) - $($uploadResult.processedRecords) registros"

# Cargar teachers
$uploadResult = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/teachers" -Method POST -Headers $headers -Form @{
    file = Get-Item "test_teachers.xlsx"
}
Write-Host "Carga teachers: $($uploadResult.success) - $($uploadResult.processedRecords) registros"
```

### 7. Verificar Estadísticas Después de las Cargas
```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:3001/api/uploads/admin/stats" -Headers $headers
Write-Host "Archivos procesados: $($stats | ConvertTo-Json -Depth 3)"
```

## Resultados Esperados:

✅ **Autenticación**: Token JWT válido obtenido
✅ **Plantillas**: Lista completa de 4 tipos de plantillas
✅ **Health Check**: Status "healthy" 
✅ **Validación**: Success = true para archivos válidos
✅ **Carga**: Registros procesados exitosamente
✅ **Estadísticas**: Contadores actualizados

## Debugging:

Si aparecen errores, revisar logs del servidor para:
- `[Multer] Processing URL: ...` - Verificar detección de tipo
- `[Multer] Determined upload type: ...` - Confirmar tipo correcto
- `[Multer] Created directory: ...` - Verificar creación de directorios

## Estructura de Directorios Esperada:

```
backend/src/uploads/temp/
├── academic-structures/
├── teachers/
├── payment-codes/
├── course-reports/
└── general/ (fallback)
```
