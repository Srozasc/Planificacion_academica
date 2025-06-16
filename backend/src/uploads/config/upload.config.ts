// =====================================================
// Configuración de Uploads - Sistema Académico
// Configuración centralizada para manejo de archivos
// =====================================================

export const UploadConfig = {
  // Tamaños máximos por tipo de archivo
  maxFileSizes: {
    excel: 10 * 1024 * 1024,      // 10MB para archivos Excel
    image: 5 * 1024 * 1024,       // 5MB para imágenes
    document: 20 * 1024 * 1024,   // 20MB para documentos
    default: 10 * 1024 * 1024     // 10MB por defecto
  },

  // Tipos MIME permitidos
  allowedMimeTypes: {
    excel: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                          // .xls
      'application/octet-stream'                                           // Fallback
    ],
    images: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp'
    ],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },

  // Extensiones permitidas
  allowedExtensions: {
    excel: ['.xlsx', '.xls'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    documents: ['.pdf', '.doc', '.docx']
  },

  // Directorios de upload
  directories: {
    temp: 'src/uploads/temp',
    processed: 'src/uploads/processed', 
    failed: 'src/uploads/failed',
    academic: 'src/uploads/temp/academic-structures',
    teachers: 'src/uploads/temp/teachers',
    paymentCodes: 'src/uploads/temp/payment-codes',
    courseReports: 'src/uploads/temp/course-reports'
  },

  // Límites generales
  limits: {
    maxFiles: 1,                  // Máximo 1 archivo por request
    maxFields: 10,                // Máximo 10 campos adicionales
    maxFieldNameSize: 100,        // 100 chars para nombres de campo
    maxFieldSize: 1024 * 100,     // 100KB para valores de campo
    maxFileNameLength: 255        // Longitud máxima nombre archivo
  },

  // Configuración de nombres de archivo
  filename: {
    sanitizeRegex: /[^a-zA-Z0-9.-]/g,     // Caracteres a reemplazar
    maxOriginalNameLength: 50,             // Longitud máxima nombre original
    timestampFormat: 'YYYY-MM-DD_HH-mm-ss' // Formato timestamp
  },

  // Configuración de limpieza automática
  cleanup: {
    tempFileMaxAge: 24 * 60 * 60 * 1000,    // 24 horas en ms
    processedFileMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    failedFileMaxAge: 3 * 24 * 60 * 60 * 1000,    // 3 días en ms
    cleanupInterval: 60 * 60 * 1000              // Cada 1 hora
  },

  // Mensajes de error
  errorMessages: {
    invalidFileType: 'Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)',
    fileTooLarge: 'El archivo es demasiado grande. Tamaño máximo permitido: 10MB',
    noFileProvided: 'No se proporcionó ningún archivo',
    uploadFailed: 'Error al subir el archivo',
    processingFailed: 'Error al procesar el archivo',
    invalidFormat: 'Formato de archivo no válido o corrupto'
  },

  // Configuración de logging
  logging: {
    logUploads: true,
    logProcessing: true,
    logCleanup: true,
    logLevel: 'info'
  }
};

// Función para obtener configuración por tipo de archivo
export function getUploadConfigForType(fileType: 'excel' | 'images' | 'documents'): any {
  return {
    maxSize: UploadConfig.maxFileSizes[fileType] || UploadConfig.maxFileSizes.default,
    allowedMimes: UploadConfig.allowedMimeTypes[fileType] || [],
    allowedExtensions: UploadConfig.allowedExtensions[fileType] || [],
    errorMessage: UploadConfig.errorMessages.invalidFileType
  };
}

// Función para generar nombre de archivo único
export function generateUniqueFilename(originalName: string, fieldname: string = 'file'): string {
  const sanitized = originalName
    .replace(UploadConfig.filename.sanitizeRegex, '_')
    .substring(0, UploadConfig.filename.maxOriginalNameLength);
  
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  
  return `${fieldname}-${timestamp}-${random}-${sanitized}`;
}

// Función para validar archivo
export function validateFile(file: Express.Multer.File, fileType: 'excel' | 'images' | 'documents'): {
  isValid: boolean;
  error?: string;
} {
  const config = getUploadConfigForType(fileType);
  
  // Validar tamaño
  if (file.size > config.maxSize) {
    return {
      isValid: false,
      error: `Archivo demasiado grande. Máximo permitido: ${Math.round(config.maxSize / 1024 / 1024)}MB`
    };
  }

  // Validar MIME type
  if (!config.allowedMimes.includes(file.mimetype)) {
    return {
      isValid: false,
      error: `Tipo MIME no válido: ${file.mimetype}`
    };
  }

  // Validar extensión
  const ext = require('path').extname(file.originalname).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Extensión no válida: ${ext}`
    };
  }

  return { isValid: true };
}
