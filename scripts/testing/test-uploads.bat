@echo off
REM ================================================
REM Script de Pruebas Automatizadas - Módulo Uploads (Windows)
REM ================================================

echo [94m🧪 INICIANDO PRUEBAS DEL MÓDULO DE UPLOADS[0m
echo ==================================================

REM Configuración
set BASE_URL=http://localhost:3001
set TEST_FILES_DIR=test-files\valid
set INVALID_FILES_DIR=test-files\invalid

REM ================================================
REM VERIFICACIONES PRELIMINARES
REM ================================================

echo [94m📋 Verificaciones preliminares[0m

echo [93mVerificando:[0m Servidor en funcionamiento
curl -s -o nul -w "%%{http_code}" "%BASE_URL%" > temp_response.txt
set /p response_code=<temp_response.txt
del temp_response.txt

if "%response_code%"=="200" (
    echo [92m✅ PASS[0m - Servidor respondiendo
) else (
    echo [91m❌ FAIL[0m - Servidor no responde en %BASE_URL%
    echo [93m💡 Tip:[0m Ejecuta 'npm run start:dev' en otra terminal
    pause
    exit /b 1
)

REM Verificar archivos de prueba
echo [93mVerificando:[0m Archivos de prueba disponibles
if exist "%TEST_FILES_DIR%" (
    echo [92m✅ PASS[0m - Directorio de archivos de prueba encontrado
    echo    Archivos disponibles:
    dir /b "%TEST_FILES_DIR%" | findstr /r ".*"
) else (
    echo [91m❌ FAIL[0m - Directorio de archivos de prueba no encontrado
    echo [93m💡 Tip:[0m Ejecuta 'node create-test-files.js' primero
    pause
    exit /b 1
)

echo.

REM ================================================
REM PRUEBAS DE ENDPOINTS DE UTILIDAD
REM ================================================

echo [94m🔧 Pruebas de Endpoints de Utilidad[0m

echo [93mTesting:[0m Obtener todas las plantillas

set /p response_code=<temp_response.txt
del temp_response.txt
if "%response_code%"=="200" (
    echo [92m✅ PASS[0m - Obtener todas las plantillas ^(HTTP %response_code%^)
) else (
    echo [91m❌ FAIL[0m - Obtener todas las plantillas ^(Expected HTTP 200, got HTTP %response_code%^)
)
echo.

echo [93mTesting:[0m Health check del sistema
curl -s -o nul -w "%%{http_code}" -X GET "%BASE_URL%/uploads/admin/health" > temp_response.txt
set /p response_code=<temp_response.txt
del temp_response.txt
if "%response_code%"=="200" (
    echo [92m✅ PASS[0m - Health check del sistema ^(HTTP %response_code%^)
) else (
    echo [91m❌ FAIL[0m - Health check del sistema ^(Expected HTTP 200, got HTTP %response_code%^)
)
echo.

echo [93mTesting:[0m Estadísticas básicas
curl -s -o nul -w "%%{http_code}" -X GET "%BASE_URL%/uploads/admin/stats" > temp_response.txt
set /p response_code=<temp_response.txt
del temp_response.txt
if "%response_code%"=="200" (
    echo [92m✅ PASS[0m - Estadísticas básicas ^(HTTP %response_code%^)
) else (
    echo [91m❌ FAIL[0m - Estadísticas básicas ^(Expected HTTP 200, got HTTP %response_code%^)
)
echo.

REM ================================================
REM PRUEBAS DE CARGA DE ARCHIVOS VÁLIDOS
REM ================================================

echo [94m📤 Pruebas de Carga de Archivos Válidos[0m

if exist "%TEST_FILES_DIR%\test_academic_structures.xlsx" (
    echo [93mTesting:[0m Carga de estructura académica
    curl -s -o nul -w "%%{http_code}" -X POST "%BASE_URL%/uploads/academic-structures" -F "file=@%TEST_FILES_DIR%\test_academic_structures.xlsx" -F "mode=UPSERT" > temp_response.txt
    set /p response_code=<temp_response.txt
    del temp_response.txt
    if "%response_code%"=="200" (
        echo [92m✅ PASS[0m - Carga de estructura académica ^(HTTP %response_code%^)
    ) else (
        echo [91m❌ FAIL[0m - Carga de estructura académica ^(Expected HTTP 200, got HTTP %response_code%^)
    )
    echo.
) else (
    echo [91m❌ FAIL[0m - Archivo no encontrado: %TEST_FILES_DIR%\test_academic_structures.xlsx
    echo.
)

if exist "%TEST_FILES_DIR%\test_teachers.xlsx" (
    echo [93mTesting:[0m Carga de profesores
    curl -s -o nul -w "%%{http_code}" -X POST "%BASE_URL%/uploads/teachers" -F "file=@%TEST_FILES_DIR%\test_teachers.xlsx" -F "mode=UPSERT" > temp_response.txt
    set /p response_code=<temp_response.txt
    del temp_response.txt
    if "%response_code%"=="200" (
        echo [92m✅ PASS[0m - Carga de profesores ^(HTTP %response_code%^)
    ) else (
        echo [91m❌ FAIL[0m - Carga de profesores ^(Expected HTTP 200, got HTTP %response_code%^)
    )
    echo.
) else (
    echo [91m❌ FAIL[0m - Archivo no encontrado: %TEST_FILES_DIR%\test_teachers.xlsx
    echo.
)

REM ================================================
REM PRUEBAS DE VALIDACIÓN
REM ================================================

echo [94m🔍 Pruebas de Validación Sin Procesamiento[0m

if exist "%TEST_FILES_DIR%\test_teachers.xlsx" (
    echo [93mTesting:[0m Validación de profesores
    curl -s -o nul -w "%%{http_code}" -X POST "%BASE_URL%/uploads/validate/teachers" -F "file=@%TEST_FILES_DIR%\test_teachers.xlsx" > temp_response.txt
    set /p response_code=<temp_response.txt
    del temp_response.txt
    if "%response_code%"=="200" (
        echo [92m✅ PASS[0m - Validación de profesores ^(HTTP %response_code%^)
    ) else (
        echo [91m❌ FAIL[0m - Validación de profesores ^(Expected HTTP 200, got HTTP %response_code%^)
    )
    echo.
)

REM ================================================
REM PRUEBAS DE ARCHIVOS INVÁLIDOS
REM ================================================

echo [94m🚫 Pruebas de Archivos Inválidos[0m

if exist "%INVALID_FILES_DIR%\test_invalid.txt" (
    echo [93mTesting:[0m Archivo no-Excel ^(debería ser rechazado^)
    curl -s -o nul -w "%%{http_code}" -X POST "%BASE_URL%/uploads/teachers" -F "file=@%INVALID_FILES_DIR%\test_invalid.txt" -F "mode=UPSERT" > temp_response.txt
    set /p response_code=<temp_response.txt
    del temp_response.txt
    if "%response_code%"=="422" (
        echo [92m✅ PASS[0m - Rechazo de archivo no-Excel ^(HTTP %response_code%^)
    ) else (
        echo [91m❌ FAIL[0m - Rechazo de archivo no-Excel ^(Expected HTTP 422, got HTTP %response_code%^)
    )
    echo.
)

echo [93mTesting:[0m Petición sin archivo
curl -s -o nul -w "%%{http_code}" -X POST "%BASE_URL%/uploads/teachers" -F "mode=UPSERT" > temp_response.txt
set /p response_code=<temp_response.txt
del temp_response.txt
if "%response_code%"=="400" (
    echo [92m✅ PASS[0m - Petición sin archivo ^(HTTP %response_code%^)
) else (
    echo [91m❌ FAIL[0m - Petición sin archivo ^(Expected HTTP 400, got HTTP %response_code%^)
)
echo.

REM ================================================
REM PRUEBAS DE ADMINISTRACIÓN
REM ================================================

echo [94m🔧 Pruebas de Administración[0m



REM ================================================
REM RESUMEN FINAL
REM ================================================

echo [94m📊 PRUEBAS COMPLETADAS[0m
echo ==================================================
echo [92m✅ Todas las pruebas han sido ejecutadas[0m
echo.
echo [93m🔍 Cosas a verificar manualmente:[0m
echo 1. Revisa los logs del servidor para ver el logging automático
echo 2. Verifica que los archivos se organizan en las carpetas correctas:
echo    - src\uploads\temp\
echo    - src\uploads\processed\
echo    - src\uploads\failed\
echo 3. Confirma que los datos se insertan/actualizan en la base de datos
echo.
echo [93m💡 Para pruebas detalladas con respuesta:[0m
echo curl -v -X GET "%BASE_URL%/uploads/admin/health"
echo curl -v -X POST "%BASE_URL%/uploads/teachers" -F "file=@%TEST_FILES_DIR%\test_teachers.xlsx" -F "mode=UPSERT"
echo.
pause
