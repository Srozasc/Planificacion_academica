# Script de pruebas simplificado para PowerShell
$baseUrl = "http://localhost:3001/api/uploads"

Write-Host "Testing Upload Endpoints" -ForegroundColor Green
Write-Host "========================"

# Test 1: Health Check
Write-Host "`nTesting Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/admin/health" -Method GET
    Write-Host "Health Check: SUCCESS" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)"
    $health = $response.Content | ConvertFrom-Json
    Write-Host "Server uptime: $($health.uptime) seconds"
} catch {
    Write-Host "Health Check: FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 2: Templates
Write-Host "`nTesting Templates..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/templates" -Method GET
    Write-Host "Templates: SUCCESS" -ForegroundColor Green
    $templates = $response.Content | ConvertFrom-Json
    Write-Host "Available templates: $($templates.availableTemplates -join ', ')"
} catch {
    Write-Host "Templates: FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 3: Stats
Write-Host "`nTesting Stats..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/admin/stats" -Method GET
    Write-Host "Stats: SUCCESS" -ForegroundColor Green
    $stats = $response.Content | ConvertFrom-Json
    Write-Host "Total files: $($stats.totalFiles)"
    Write-Host "Total size: $($stats.totalSizeMB) MB"
} catch {
    Write-Host "Stats: FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Test 4: File Upload usando curl (si está disponible)
Write-Host "`nTesting File Upload (if curl is available)..." -ForegroundColor Cyan
$curlPath = Get-Command curl -ErrorAction SilentlyContinue
if ($curlPath) {
    Write-Host "curl found, testing file upload..."
    $testFile = "test-files\valid\test_academic_structures.xlsx"
    if (Test-Path $testFile) {
        try {
            $result = & curl -X POST -F "file=@$testFile" "$baseUrl/academic-structures" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "File Upload: SUCCESS" -ForegroundColor Green
                Write-Host "Response: $result"
            } else {
                Write-Host "File Upload: FAILED" -ForegroundColor Red
                Write-Host "Error: $result"
            }
        } catch {
            Write-Host "File Upload: FAILED" -ForegroundColor Red
            Write-Host $_.Exception.Message
        }
    } else {
        Write-Host "Test file not found: $testFile" -ForegroundColor Yellow
    }
} else {
    Write-Host "curl not available - skipping file upload test" -ForegroundColor Yellow
    Write-Host "To test file uploads manually, use:" -ForegroundColor Cyan
    Write-Host "curl -X POST -F `"file=@test-files\valid\test_academic_structures.xlsx`" $baseUrl/academic-structures"
}

Write-Host "`nTesting completed!" -ForegroundColor Green
