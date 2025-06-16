# Script de pruebas para endpoints de Upload - PowerShell
# Asegúrate de que el servidor esté corriendo en http://localhost:3001

$baseUrl = "http://localhost:3001/api/uploads"

Write-Host "🧪 INICIANDO PRUEBAS DE ENDPOINTS DE UPLOAD" -ForegroundColor Green
Write-Host "=============================================="

# Función para realizar pruebas de upload
function Test-Upload {
    param(
        [string]$endpoint,
        [string]$filePath,
        [string]$description
    )
    
    Write-Host "`n📤 Probando: $description" -ForegroundColor Cyan
    Write-Host "Endpoint: $endpoint"
    Write-Host "Archivo: $filePath"
    
    if (Test-Path $filePath) {
        try {
            $uri = "$baseUrl/$endpoint"
            $boundary = [System.Guid]::NewGuid().ToString()
            $contentType = "multipart/form-data; boundary=$boundary"
            
            # Leer el archivo
            $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
            $fileName = [System.IO.Path]::GetFileName($filePath)
            
            # Construir el cuerpo multipart
            $body = @"
--$boundary
Content-Disposition: form-data; name="file"; filename="$fileName"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

"@
            $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            $endBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
            
            # Combinar bytes
            $fullBody = $bodyBytes + $fileBytes + $endBytes
            
            $response = Invoke-WebRequest -Uri $uri -Method POST -Body $fullBody -ContentType $contentType
            
            Write-Host "✅ Éxito - Status: $($response.StatusCode)" -ForegroundColor Green
            $content = $response.Content | ConvertFrom-Json
            Write-Host "Respuesta: $($content | ConvertTo-Json -Depth 3)"
            
        } catch {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.Exception.Response) {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorContent = $reader.ReadToEnd()
                Write-Host "Detalle del error: $errorContent" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "❌ Archivo no encontrado: $filePath" -ForegroundColor Red
    }
}

# Función para probar endpoints GET
function Test-GetEndpoint {
    param(
        [string]$endpoint,
        [string]$description
    )
    
    Write-Host "`n🔍 Probando: $description" -ForegroundColor Cyan
    Write-Host "Endpoint: $endpoint"
    
    try {
        $uri = "$baseUrl/$endpoint"
        $response = Invoke-WebRequest -Uri $uri -Method GET
        
        Write-Host "✅ Éxito - Status: $($response.StatusCode)" -ForegroundColor Green
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Respuesta: $($content | ConvertTo-Json -Depth 2)"
        
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 1. Probar endpoint de health
Test-GetEndpoint -endpoint "admin/health" -description "Health Check"

# 2. Probar endpoint de templates
Test-GetEndpoint -endpoint "templates" -description "Obtener Plantillas"

# 3. Probar endpoint de estadísticas
Test-GetEndpoint -endpoint "admin/stats" -description "Estadísticas del Sistema"

# 4. Probar uploads con archivos válidos
Write-Host "`n🔄 PROBANDO UPLOADS CON ARCHIVOS VÁLIDOS" -ForegroundColor Yellow
Write-Host "========================================"

Test-Upload -endpoint "academic-structures" -filePath "test-files\valid\test_academic_structures.xlsx" -description "Estructuras Académicas"
Test-Upload -endpoint "teachers" -filePath "test-files\valid\test_teachers.xlsx" -description "Profesores"  
Test-Upload -endpoint "payment-codes" -filePath "test-files\valid\test_payment_codes.xlsx" -description "Códigos de Pago"
Test-Upload -endpoint "course-reports" -filePath "test-files\valid\test_course_reports.xlsx" -description "Reportes de Cursos"

# 5. Probar validación solamente
Write-Host "`n✅ PROBANDO VALIDACIÓN SOLAMENTE" -ForegroundColor Yellow
Write-Host "================================="

# Esta funcionalidad requiere un endpoint específico que acepta validateOnly=true
# Por ahora, verificaremos las estadísticas después de las cargas
Test-GetEndpoint -endpoint "admin/stats" -description "Estadísticas Finales"

Write-Host "`n🎉 PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "====================="
