# Script temporal para probar autenticación
$response = Invoke-WebRequest -Uri 'http://localhost:3001/api/auth/login' -Method POST -ContentType 'application/json' -Body '{"email_institucional":"admin@planificacion.edu","password":"admin123"}'
$json = $response.Content | ConvertFrom-Json
$token = $json.access_token
Write-Host "Token obtenido: $($token.Substring(0,50))..."

# Probar endpoint de estadísticas
$headers = @{Authorization = "Bearer $token"}
$statsResponse = Invoke-WebRequest -Uri 'http://localhost:3001/api/uploads/admin/stats' -Method GET -Headers $headers
Write-Host "Respuesta de estadísticas:"
$statsResponse.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10