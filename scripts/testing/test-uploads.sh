#!/bin/bash

# ================================================
# Script de Pruebas Automatizadas - Módulo Uploads
# ================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:3001"
TEST_FILES_DIR="test-files/valid"
INVALID_FILES_DIR="test-files/invalid"

echo -e "${BLUE}🧪 INICIANDO PRUEBAS DEL MÓDULO DE UPLOADS${NC}"
echo "=================================================="

# Función para mostrar resultados
check_response() {
    local response_code=$1
    local expected_code=$2
    local test_name="$3"
    
    if [ "$response_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $test_name (HTTP $response_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - $test_name (Expected HTTP $expected_code, got HTTP $response_code)"
        return 1
    fi
}

# Función para hacer petición y mostrar resultado
test_endpoint() {
    local method="$1"
    local url="$2"
    local expected_code="$3"
    local test_name="$4"
    local extra_args="$5"
    
    echo -e "${YELLOW}Testing:${NC} $test_name"
    
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url" $extra_args)
    else
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url" $extra_args)
    fi
    
    check_response "$response_code" "$expected_code" "$test_name"
    echo ""
}

# Función para subir archivo
test_upload() {
    local endpoint="$1"
    local file_path="$2"
    local expected_code="$3"
    local test_name="$4"
    local mode="${5:-UPSERT}"
    
    echo -e "${YELLOW}Testing:${NC} $test_name"
    
    if [ -f "$file_path" ]; then
        response_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$BASE_URL/uploads/$endpoint" \
            -F "file=@$file_path" \
            -F "mode=$mode")
        
        check_response "$response_code" "$expected_code" "$test_name"
    else
        echo -e "${RED}❌ FAIL${NC} - Archivo no encontrado: $file_path"
    fi
    echo ""
}

# ================================================
# VERIFICACIONES PRELIMINARES
# ================================================

echo -e "${BLUE}📋 Verificaciones preliminares${NC}"

# Verificar que el servidor esté corriendo
echo -e "${YELLOW}Verificando:${NC} Servidor en funcionamiento"
response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null || echo "000")
if [ "$response_code" -eq "000" ]; then
    echo -e "${RED}❌ FAIL${NC} - Servidor no responde en $BASE_URL"
    echo -e "${YELLOW}💡 Tip:${NC} Ejecuta 'npm run start:dev' en otra terminal"
    exit 1
else
    echo -e "${GREEN}✅ PASS${NC} - Servidor respondiendo"
fi

# Verificar archivos de prueba
echo -e "${YELLOW}Verificando:${NC} Archivos de prueba disponibles"
if [ -d "$TEST_FILES_DIR" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Directorio de archivos de prueba encontrado"
    echo "   Archivos disponibles:"
    ls -1 "$TEST_FILES_DIR" | sed 's/^/   - /'
else
    echo -e "${RED}❌ FAIL${NC} - Directorio de archivos de prueba no encontrado"
    echo -e "${YELLOW}💡 Tip:${NC} Ejecuta 'node create-test-files.js' primero"
    exit 1
fi

echo ""

# ================================================
# PRUEBAS DE ENDPOINTS DE UTILIDAD
# ================================================

echo -e "${BLUE}🔧 Pruebas de Endpoints de Utilidad${NC}"

# Templates
test_endpoint "GET" "/uploads/templates" 200 "Obtener todas las plantillas"
test_endpoint "GET" "/uploads/templates?type=academic-structures" 200 "Obtener plantilla específica"
test_endpoint "GET" "/uploads/templates?type=invalid-type" 200 "Plantilla con tipo inválido (debería retornar todas)"

# Health check
test_endpoint "GET" "/uploads/admin/health" 200 "Health check del sistema"

# Stats
test_endpoint "GET" "/uploads/admin/stats" 200 "Estadísticas básicas"
test_endpoint "GET" "/uploads/admin/stats?detailed=true" 200 "Estadísticas detalladas"

# ================================================
# PRUEBAS DE CARGA DE ARCHIVOS VÁLIDOS
# ================================================

echo -e "${BLUE}📤 Pruebas de Carga de Archivos Válidos${NC}"

# Academic Structures
test_upload "academic-structures" "$TEST_FILES_DIR/test_academic_structures.xlsx" 200 "Carga de estructura académica (UPSERT)" "UPSERT"
test_upload "academic-structures" "$TEST_FILES_DIR/test_academic_structures.xlsx" 200 "Carga de estructura académica (INSERT_ONLY)" "INSERT_ONLY"

# Teachers
test_upload "teachers" "$TEST_FILES_DIR/test_teachers.xlsx" 200 "Carga de profesores (UPSERT)" "UPSERT"

# Payment Codes
test_upload "payment-codes" "$TEST_FILES_DIR/test_payment_codes.xlsx" 200 "Carga de códigos de pago" "UPSERT"

# Course Reports
test_upload "course-reports" "$TEST_FILES_DIR/test_course_reports.xlsx" 200 "Carga de reportes de cursos" "UPSERT"

# ================================================
# PRUEBAS DE VALIDACIÓN SIN PROCESAMIENTO
# ================================================

echo -e "${BLUE}🔍 Pruebas de Validación Sin Procesamiento${NC}"

# Validaciones
test_upload "validate/academic-structures" "$TEST_FILES_DIR/test_academic_structures.xlsx" 200 "Validación de estructura académica"
test_upload "validate/teachers" "$TEST_FILES_DIR/test_teachers.xlsx" 200 "Validación de profesores"
test_upload "validate/payment-codes" "$TEST_FILES_DIR/test_payment_codes.xlsx" 200 "Validación de códigos de pago"
test_upload "validate/course-reports" "$TEST_FILES_DIR/test_course_reports.xlsx" 200 "Validación de reportes"

# Tipo de validación inválido
echo -e "${YELLOW}Testing:${NC} Validación con tipo inválido"
response_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/uploads/validate/invalid-type" \
    -F "file=@$TEST_FILES_DIR/test_teachers.xlsx" 2>/dev/null || echo "400")
check_response "$response_code" "400" "Validación con tipo inválido"
echo ""

# ================================================
# PRUEBAS DE ARCHIVOS INVÁLIDOS
# ================================================

echo -e "${BLUE}🚫 Pruebas de Archivos Inválidos${NC}"

# Archivo de texto (no Excel)
if [ -f "$INVALID_FILES_DIR/test_invalid.txt" ]; then
    echo -e "${YELLOW}Testing:${NC} Archivo no-Excel (debería ser rechazado)"
    response_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/uploads/teachers" \
        -F "file=@$INVALID_FILES_DIR/test_invalid.txt" \
        -F "mode=UPSERT")
    check_response "$response_code" "422" "Rechazo de archivo no-Excel"
    echo ""
fi

# Sin archivo
echo -e "${YELLOW}Testing:${NC} Petición sin archivo"
response_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/uploads/teachers" \
    -F "mode=UPSERT")
check_response "$response_code" "400" "Petición sin archivo"
echo ""

# ================================================
# PRUEBAS DE ADMINISTRACIÓN
# ================================================

echo -e "${BLUE}🔧 Pruebas de Administración${NC}"

# Limpieza manual
test_endpoint "DELETE" "/uploads/admin/cleanup" 200 "Limpieza manual global"

# Limpieza por tipo
test_endpoint "DELETE" "/uploads/admin/cleanup/temp" 200 "Limpieza de archivos temporales"
test_endpoint "DELETE" "/uploads/admin/cleanup/processed" 200 "Limpieza de archivos procesados"
test_endpoint "DELETE" "/uploads/admin/cleanup/failed" 200 "Limpieza de archivos fallidos"

# Limpieza con tipo inválido
test_endpoint "DELETE" "/uploads/admin/cleanup/invalid-type" 400 "Limpieza con tipo inválido"

# Limpieza forzada
test_endpoint "DELETE" "/uploads/admin/cleanup/temp?force=true" 200 "Limpieza forzada de temporales"

# ================================================
# RESUMEN FINAL
# ================================================

echo -e "${BLUE}📊 PRUEBAS COMPLETADAS${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Todas las pruebas han sido ejecutadas${NC}"
echo ""
echo -e "${YELLOW}🔍 Cosas a verificar manualmente:${NC}"
echo "1. Revisa los logs del servidor para ver el logging automático"
echo "2. Verifica que los archivos se organizan en las carpetas correctas:"
echo "   - src/uploads/temp/"
echo "   - src/uploads/processed/"
echo "   - src/uploads/failed/"
echo "3. Confirma que los datos se insertan/actualizan en la base de datos"
echo ""
echo -e "${YELLOW}💡 Para pruebas detalladas con respuesta:${NC}"
echo "curl -v -X GET \"$BASE_URL/uploads/admin/health\" | jq ."
echo "curl -v -X POST \"$BASE_URL/uploads/teachers\" -F \"file=@$TEST_FILES_DIR/test_teachers.xlsx\" -F \"mode=UPSERT\" | jq ."
