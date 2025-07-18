const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * Script para analizar el impacto de los nuevos archivos Excel
 * en la estructura de la base de datos
 */

const EXCEL_DIR = 'd:/desarrollo/workspace/Planificacion_academica/Insumos de entrada';
const OUTPUT_FILE = 'excel-structure-analysis.json';

// Mapeo de archivos a tablas de BD
const FILE_TABLE_MAPPING = {
    'ADOL.xlsx': 'payment_codes',
    'Cursables a Implementar.xlsx': 'course_reports_data',
    'Docentes.xlsx': 'teachers',
    'DOL.xlsx': 'teacher_assignments', // Nueva tabla
    'Estructura Académica Final.xlsx': 'academic_structures',
    'Usuarios Agendador Campus.xlsx': 'campus_scheduler_users', // Nueva tabla
    'Vacantes Inicio.xlsx': 'program_vacancies' // Nueva tabla
};

// Estructura actual de las tablas de BD
const CURRENT_DB_STRUCTURE = {
    academic_structures: [
        'id', 'code', 'name', 'credits', 'plan_id', 'type', 'semester',
        'prerequisites', 'description', 'hours_per_week', 'is_active',
        'created_at', 'updated_at', 'deleted_at'
    ],
    teachers: [
        'id', 'rut', 'name', 'email', 'phone', 'address', 'academic_degree',
        'specialization', 'university', 'category_id', 'contract_type_id',
        'hire_date', 'contract_hours', 'salary_base', 'is_active',
        'can_coordinate', 'max_hours_per_week', 'created_at', 'updated_at', 'deleted_at'
    ],
    payment_codes: [
        'id', 'code_name', 'description', 'factor', 'base_amount', 'category',
        'type', 'is_active', 'requires_hours', 'is_taxable', 'valid_from',
        'valid_until', 'created_at', 'updated_at', 'deleted_at'
    ],
    course_reports_data: [
        'id', 'academic_structure_id', 'student_count', 'term', 'year', 'section',
        'modality', 'enrolled_count', 'passed_count', 'failed_count',
        'withdrawn_count', 'weekly_hours', 'total_hours', 'is_validated',
        'validated_by', 'validated_at', 'notes', 'created_at', 'updated_at', 'deleted_at'
    ]
};

function analyzeExcelFile(filePath) {
    try {
        console.log(`\n📊 Analizando: ${path.basename(filePath)}`);
        
        const workbook = XLSX.readFile(filePath);
        const analysis = {
            fileName: path.basename(filePath),
            fileSize: fs.statSync(filePath).size,
            sheets: [],
            totalRows: 0,
            estimatedImpact: 'UNKNOWN'
        };

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length > 0) {
                const headers = jsonData[0] || [];
                const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
                
                const sheetAnalysis = {
                    name: sheetName,
                    headers: headers,
                    headerCount: headers.length,
                    dataRowCount: dataRows.length,
                    sampleData: dataRows.slice(0, 3), // Primeras 3 filas como muestra
                    uniqueValues: {}
                };

                // Analizar valores únicos en las primeras columnas
                headers.slice(0, 5).forEach((header, index) => {
                    const values = dataRows.map(row => row[index]).filter(val => val !== undefined && val !== '');
                    sheetAnalysis.uniqueValues[header] = {
                        count: new Set(values).size,
                        samples: [...new Set(values)].slice(0, 5)
                    };
                });

                analysis.sheets.push(sheetAnalysis);
                analysis.totalRows += dataRows.length;
            }
        });

        return analysis;
    } catch (error) {
        console.error(`❌ Error analizando ${filePath}:`, error.message);
        return {
            fileName: path.basename(filePath),
            error: error.message,
            estimatedImpact: 'ERROR'
        };
    }
}

function compareWithDBStructure(excelAnalysis) {
    const fileName = excelAnalysis.fileName;
    const tableName = FILE_TABLE_MAPPING[fileName];
    
    if (!tableName) {
        return {
            impact: 'UNKNOWN',
            reason: 'No hay mapeo definido para este archivo'
        };
    }

    const currentFields = CURRENT_DB_STRUCTURE[tableName] || [];
    const excelHeaders = excelAnalysis.sheets.flatMap(sheet => sheet.headers);
    
    // Normalizar nombres para comparación
    const normalizeField = (field) => field.toString().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const normalizedCurrentFields = currentFields.map(normalizeField);
    const normalizedExcelHeaders = excelHeaders.map(normalizeField);
    
    const newFields = normalizedExcelHeaders.filter(header => 
        !normalizedCurrentFields.includes(header) && header.length > 0
    );
    
    const missingFields = normalizedCurrentFields.filter(field => 
        !normalizedExcelHeaders.includes(field) && 
        !['id', 'created_at', 'updated_at', 'deleted_at'].includes(field)
    );

    let impact = 'LOW';
    let reasons = [];

    if (newFields.length > 5) {
        impact = 'HIGH';
        reasons.push(`${newFields.length} campos nuevos detectados`);
    } else if (newFields.length > 2) {
        impact = 'MEDIUM';
        reasons.push(`${newFields.length} campos nuevos detectados`);
    }

    if (missingFields.length > 3) {
        impact = 'HIGH';
        reasons.push(`${missingFields.length} campos faltantes en Excel`);
    }

    if (!CURRENT_DB_STRUCTURE[tableName]) {
        impact = 'HIGH';
        reasons.push('Tabla nueva requerida');
    }

    return {
        impact,
        tableName,
        newFields,
        missingFields,
        reasons,
        compatibility: newFields.length === 0 && missingFields.length === 0 ? 'FULL' : 'PARTIAL'
    };
}

function generateImpactReport(analyses) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFiles: analyses.length,
            successfulAnalyses: analyses.filter(a => !a.error).length,
            errors: analyses.filter(a => a.error).length,
            impactLevels: {
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0,
                UNKNOWN: 0
            }
        },
        fileAnalyses: [],
        recommendations: []
    };

    analyses.forEach(analysis => {
        if (!analysis.error) {
            const comparison = compareWithDBStructure(analysis);
            analysis.dbComparison = comparison;
            analysis.estimatedImpact = comparison.impact;
            
            report.summary.impactLevels[comparison.impact]++;
        } else {
            report.summary.impactLevels.UNKNOWN++;
        }
        
        report.fileAnalyses.push(analysis);
    });

    // Generar recomendaciones
    const highImpactFiles = analyses.filter(a => a.estimatedImpact === 'HIGH');
    const mediumImpactFiles = analyses.filter(a => a.estimatedImpact === 'MEDIUM');
    
    if (highImpactFiles.length > 0) {
        report.recommendations.push({
            priority: 'HIGH',
            message: `${highImpactFiles.length} archivos requieren cambios significativos en la BD`,
            files: highImpactFiles.map(f => f.fileName)
        });
    }
    
    if (mediumImpactFiles.length > 0) {
        report.recommendations.push({
            priority: 'MEDIUM',
            message: `${mediumImpactFiles.length} archivos requieren modificaciones menores`,
            files: mediumImpactFiles.map(f => f.fileName)
        });
    }

    return report;
}

function main() {
    console.log('🔍 Iniciando análisis de impacto de archivos Excel...');
    console.log(`📁 Directorio: ${EXCEL_DIR}`);
    
    if (!fs.existsSync(EXCEL_DIR)) {
        console.error(`❌ El directorio ${EXCEL_DIR} no existe`);
        return;
    }

    const excelFiles = fs.readdirSync(EXCEL_DIR)
        .filter(file => file.endsWith('.xlsx'))
        .map(file => path.join(EXCEL_DIR, file));

    if (excelFiles.length === 0) {
        console.error('❌ No se encontraron archivos Excel en el directorio');
        return;
    }

    console.log(`📋 Archivos encontrados: ${excelFiles.length}`);
    excelFiles.forEach(file => console.log(`   - ${path.basename(file)}`));

    const analyses = excelFiles.map(analyzeExcelFile);
    const report = generateImpactReport(analyses);

    // Guardar reporte
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    console.log(`\n✅ Análisis completado. Reporte guardado en: ${OUTPUT_FILE}`);

    // Mostrar resumen
    console.log('\n📊 RESUMEN DEL ANÁLISIS:');
    console.log(`   Total de archivos: ${report.summary.totalFiles}`);
    console.log(`   Análisis exitosos: ${report.summary.successfulAnalyses}`);
    console.log(`   Errores: ${report.summary.errors}`);
    console.log('\n🎯 NIVELES DE IMPACTO:');
    Object.entries(report.summary.impactLevels).forEach(([level, count]) => {
        if (count > 0) {
            const emoji = level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟡' : level === 'LOW' ? '🟢' : '⚪';
            console.log(`   ${emoji} ${level}: ${count} archivo(s)`);
        }
    });

    if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMENDACIONES:');
        report.recommendations.forEach(rec => {
            const emoji = rec.priority === 'HIGH' ? '🔴' : '🟡';
            console.log(`   ${emoji} ${rec.message}`);
        });
    }

    console.log(`\n📄 Para más detalles, revisa el archivo: ${OUTPUT_FILE}`);
}

if (require.main === module) {
    main();
}

module.exports = {
    analyzeExcelFile,
    compareWithDBStructure,
    generateImpactReport
};