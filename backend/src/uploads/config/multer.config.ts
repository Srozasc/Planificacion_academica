import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

// Configuración de Multer para la carga de archivos
export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (req, file, callback) => {
    // Validar que el archivo sea Excel
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          'Formato de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)',
        ),
        false,
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
};