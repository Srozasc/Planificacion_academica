import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UploadsController } from './uploads.controller';
import { TemplatesController } from './templates.controller';
import { UploadsService } from './uploads.service';
import { FileCleanupService } from './services/file-cleanup.service';
import { FileValidationMiddleware } from './middleware/file-validation.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Para tareas programadas de limpieza
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Crear directorio de uploads si no existe
        const uploadDir = join(process.cwd(), 'src', 'uploads', 'temp');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Configuración según entorno
        const useMemoryStorage = configService.get('NODE_ENV') === 'test';
        
        return {          storage: useMemoryStorage 
            ? memoryStorage() // Para pruebas en memoria
            : diskStorage({                destination: (req, file, callback) => {
                  // Extraer tipo de archivo de la URL
                  let uploadType = 'general';
                  
                  // Obtener la URL completa
                  const url = req.url || req.originalUrl || '';
                  console.log(`[Multer] Processing URL: ${url}`); // Debug log
                  
                  // Buscar tipos conocidos en la URL
                  const knownTypes = ['academic-structures', 'teachers', 'payment-codes', 'course-reports'];
                  
                  // Extraer tipo de la URL (ej: /uploads/academic-structures -> academic-structures)
                  for (const type of knownTypes) {
                    if (url.includes(`/${type}`)) {
                      uploadType = type;
                      break;
                    }
                  }
                  
                  // Para endpoints de validación, extraer después de /validate/
                  if (url.includes('/validate/')) {
                    const validateMatch = url.match(/\/validate\/([^/?]+)/);
                    if (validateMatch && knownTypes.includes(validateMatch[1])) {
                      uploadType = validateMatch[1];
                    }
                  }
                  
                  console.log(`[Multer] Determined upload type: ${uploadType}`); // Debug log
                  
                  const dir = join(uploadDir, uploadType);
                  
                  if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                    console.log(`[Multer] Created directory: ${dir}`); // Debug log
                  }
                  
                  callback(null, dir);
                },
                filename: (req, file, callback) => {
                  // Generar nombre único con timestamp y hash
                  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                  const sanitizedOriginalName = file.originalname
                    .replace(/[^a-zA-Z0-9.-]/g, '_')
                    .substring(0, 50); // Limitar longitud
                  
                  const filename = `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`;
                  callback(null, filename);
                },
              }),
          
          fileFilter: (req, file, callback) => {
            // Validaciones más estrictas
            const allowedMimes = [
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
              'application/vnd.ms-excel', // .xls
              'application/octet-stream' // Fallback para algunos navegadores
            ];
            
            const allowedExtensions = ['.xlsx', '.xls'];
            const fileExtension = extname(file.originalname).toLowerCase();
            
            // Verificar MIME type Y extensión
            if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
              callback(null, true);
            } else {
              const error = new Error(
                `Archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls). ` +
                `Recibido: ${file.mimetype}, extensión: ${fileExtension}`
              );
              error.name = 'INVALID_FILE_TYPE';
              callback(error, false);
            }
          },
          
          limits: {
            fileSize: configService.get('UPLOAD_MAX_SIZE') 
              ? parseInt(configService.get('UPLOAD_MAX_SIZE')) 
              : 10 * 1024 * 1024, // 10MB por defecto
            files: 1, // Solo un archivo por request
            fields: 10, // Máximo 10 campos adicionales
            fieldNameSize: 100, // Máximo 100 chars para nombres de campo
            fieldSize: 1024 * 100, // 100KB para valores de campo
          },
          
          // Configuración adicional para seguridad
          preservePath: false, // No preservar path del cliente
          
          // Headers adicionales
          dest: uploadDir, // Directorio de respaldo
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([]), // Para acceso a base de datos si es necesario
  ],
  controllers: [UploadsController, TemplatesController],
  providers: [
    UploadsService,
    FileCleanupService, // Servicio de limpieza automática
  ],
  exports: [UploadsService, MulterModule, FileCleanupService],
})
export class UploadsModule {
  constructor() {
    // Verificar y crear directorios necesarios al inicializar
    this.ensureUploadDirectories();
  }
  /**
   * Configurar middleware para validación avanzada de archivos
   * TEMPORALMENTE COMENTADO - El middleware interfiere con Multer
   */
  configure(consumer: MiddlewareConsumer): void {
    // consumer
    //   .apply(FileValidationMiddleware)
    //   .forRoutes(
    //     { path: 'uploads/*', method: RequestMethod.POST },
    //     { path: 'uploads/*', method: RequestMethod.PUT }
    //   );
  }

  private ensureUploadDirectories(): void {
    const baseDir = join(process.cwd(), 'src', 'uploads');
    const requiredDirs = [
      'temp',
      'temp/academic-structures',
      'temp/teachers', 
      'temp/payment-codes',
      'temp/course-reports',
      'processed', // Para archivos procesados exitosamente
      'failed'     // Para archivos con errores
    ];

    requiredDirs.forEach(dir => {
      const fullPath = join(baseDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        
        // Crear .gitkeep para mantener directorios en git
        const gitkeepPath = join(fullPath, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
          fs.writeFileSync(gitkeepPath, '# Directorio para archivos de upload\n');
        }
      }
    });
  }
}
